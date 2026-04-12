import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "../../../lib/auth";
import dbConnect, { Player } from "../../../lib/mongodb";
import type { StoredPlayerState } from "../../../lib/tempo-game-data";
import {
  calculateUnclaimedIncome,
  hydratePlayerPackageSnapshot,
  roundIncome,
} from "../../../lib/tempo-server";

export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await dbConnect();
    const player = (await Player.findOne({
      walletAddress: session.walletAddress.toLowerCase(),
    }).lean()) as (StoredPlayerState & { purchaseTxHash: string }) | null;

    if (!player) {
      return NextResponse.json({
        walletAddress: session.walletAddress,
        serverNow: Date.now(),
        player: null,
      });
    }

    const serverNow = Date.now();
    const packageSnapshot = hydratePlayerPackageSnapshot(player);
    const unclaimedIncome = roundIncome(calculateUnclaimedIncome(player, serverNow));

    return NextResponse.json({
      walletAddress: session.walletAddress,
      serverNow,
      player: {
        packageId: player.packageId,
        packageSnapshot,
        agents: player.agents,
        agentPositions: player.agentPositions ?? [],
        acquiredAt: player.acquiredAt,
        lastCollectedAt: player.lastCollectedAt,
        lifetimeCollected: player.lifetimeCollected,
        purchaseTxHash: player.purchaseTxHash,
        purchasePaymentToken: player.purchasePaymentToken ?? "pathusd",
        marketPurchases: player.marketPurchases ?? [],
      },
      unclaimedIncome,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load game state.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
