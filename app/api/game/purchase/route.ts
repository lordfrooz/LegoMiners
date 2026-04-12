import { NextResponse } from "next/server";
import { isHash } from "viem";
import { getAuthenticatedSession } from "../../../lib/auth";
import dbConnect, { Player } from "../../../lib/mongodb";
import * as tempoServer from "../../../lib/tempo-server";
import type { PackageTier } from "../../../lib/tempo-game-data";

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
    const packageId = body?.packageId;
    const paymentToken = tempoServer.normalizePaymentToken(body?.paymentToken);

    if (!txHash || typeof txHash !== "string" || !isPackageTier(packageId)) {
      return NextResponse.json({ error: "txHash and packageId are required." }, { status: 400 });
    }

    if (!isHash(txHash)) {
      return NextResponse.json({ error: "txHash is invalid." }, { status: 400 });
    }

    await dbConnect();

    const normalizedTxHash = txHash as `0x${string}`;
    const existingPlayer = await Player.findOne({ walletAddress: session.walletAddress.toLowerCase() });
    if (existingPlayer) {
      if (existingPlayer.purchaseTxHash === normalizedTxHash) {
        return NextResponse.json({
          success: true,
          serverNow: Date.now(),
          player: serializePlayer(existingPlayer),
        });
      }

      return NextResponse.json({ error: "A package is already assigned to this wallet." }, { status: 409 });
    }

    await tempoServer.verifyPurchaseTransaction(normalizedTxHash, session.walletAddress, packageId, paymentToken);

    const playerState = tempoServer.createStarterPlayer(packageId, normalizedTxHash, paymentToken);
    const player = await Player.create({
      walletAddress: session.walletAddress.toLowerCase(),
      ...playerState,
    });

    return NextResponse.json({
      success: true,
      serverNow: Date.now(),
      player: serializePlayer(player),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finalize package purchase.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
