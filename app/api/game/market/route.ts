import { NextResponse } from "next/server";
import { isHash } from "viem";
import { getAuthenticatedSession } from "../../../lib/auth";
import dbConnect, { Player } from "../../../lib/mongodb";
import {
  getExtraSlotPaymentAmount,
  getMarketAgentPaymentAmount,
  hydratePlayerPackageSnapshot,
  normalizePaymentToken,
  verifyPaymentTransfer,
} from "../../../lib/tempo-server";
import {
  buildMarketAgent,
  type PackageTier,
} from "../../../lib/tempo-game-data";

function isPackageTier(value: unknown): value is PackageTier {
  return value === "builder" || value === "trader" || value === "finance";
}

function serializePlayer(player: any) {
  return {
    packageId: player.packageId,
    packageSnapshot: player.packageSnapshot,
    agents: player.agents,
    agentPositions: player.agentPositions ?? [],
    acquiredAt: player.acquiredAt,
    lastCollectedAt: player.lastCollectedAt,
    lifetimeCollected: player.lifetimeCollected,
    purchaseTxHash: player.purchaseTxHash,
    purchasePaymentToken: player.purchasePaymentToken ?? "pathusd",
    marketPurchases: player.marketPurchases ?? [],
  };
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const txHash = body?.txHash;
    const itemType = body?.itemType;
    const itemId = body?.itemId;
    const paymentToken = normalizePaymentToken(body?.paymentToken);

    if (!txHash || typeof txHash !== "string" || !isHash(txHash)) {
      return NextResponse.json({ error: "txHash is invalid." }, { status: 400 });
    }

    if (itemType !== "agent" && itemType !== "slot") {
      return NextResponse.json({ error: "itemType is required." }, { status: 400 });
    }

    if (itemType === "agent" && !isPackageTier(itemId)) {
      return NextResponse.json({ error: "itemId is invalid." }, { status: 400 });
    }

    await dbConnect();

    const duplicatePurchase = await Player.findOne({
      $or: [
        { purchaseTxHash: txHash },
        { "marketPurchases.txHash": txHash },
      ],
    }).lean();

    if (duplicatePurchase) {
      return NextResponse.json({ error: "This market purchase was already finalized." }, { status: 409 });
    }

    const player = await Player.findOne({ walletAddress: session.walletAddress.toLowerCase() });
    if (!player) {
      return NextResponse.json({ error: "No active package found for this wallet." }, { status: 404 });
    }

    const packageSnapshot = hydratePlayerPackageSnapshot(player);
    const expectedAmount =
      itemType === "agent"
        ? getMarketAgentPaymentAmount(itemId)
        : getExtraSlotPaymentAmount(packageSnapshot.pathUsdPrice);
    const pathUsdPrice = (Number(expectedAmount) / 1_000_000).toFixed(2);
    const normalizedTxHash = txHash as `0x${string}`;

    await verifyPaymentTransfer(normalizedTxHash, session.walletAddress, expectedAmount, paymentToken);

    if (itemType === "agent") {
      const agentLimit = packageSnapshot.agentLimit;
      if (player.agents.length >= agentLimit) {
        return NextResponse.json({ error: "No available agent slots. Buy an extra slot first." }, { status: 409 });
      }

      player.agents.push(buildMarketAgent(itemId));
    } else {
      player.packageSnapshot.agentLimit += 1;
      player.markModified("packageSnapshot");
    }

    if (!player.marketPurchases) {
      player.marketPurchases = [];
    }

    player.marketPurchases.push({
      itemType,
      itemId: itemType === "agent" ? itemId : "extra-slot",
      pathUsdPrice,
      paymentToken,
      txHash,
      purchasedAt: Date.now(),
    });

    await player.save();

    return NextResponse.json({
      success: true,
      serverNow: Date.now(),
      player: serializePlayer(player),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finalize market purchase.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
