import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "../../../lib/auth";
import dbConnect, { Player } from "../../../lib/mongodb";
import {
  calculateUnclaimedIncome,
  hydratePlayerPackageSnapshot,
  roundIncome,
} from "../../../lib/tempo-server";

const COLLECT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function POST() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await dbConnect();
    const player = await Player.findOne({ walletAddress: session.walletAddress.toLowerCase() });

    if (!player) {
      return NextResponse.json({ error: "No active package found for this wallet." }, { status: 404 });
    }

    hydratePlayerPackageSnapshot(player);

    const now = Date.now();
    if (now - player.lastCollectedAt < COLLECT_COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Gunde 1 kere cekim yapabilirsiniz. 24 saati bekleyin." },
        { status: 429 },
      );
    }

    const elapsedMs = Math.max(0, now - player.lastCollectedAt);
    const accruedWholeMinutes = Math.floor(elapsedMs / 60000);
    const claimedNow = calculateUnclaimedIncome(player.toObject(), now);

    player.lifetimeCollected = roundIncome(player.lifetimeCollected + claimedNow);
    if (accruedWholeMinutes > 0) {
      player.lastCollectedAt += accruedWholeMinutes * 60000;
    }
    await player.save();

    return NextResponse.json({
      success: true,
      player: {
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
      },
      serverNow: now,
      collectedAmount: roundIncome(claimedNow),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to collect income.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
