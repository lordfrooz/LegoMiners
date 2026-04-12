import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "../../../lib/auth";
import dbConnect, { Player } from "../../../lib/mongodb";
import { hydratePlayerPackageSnapshot } from "../../../lib/tempo-server";

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
    const agentId = typeof body?.agentId === "string" ? body.agentId.trim() : "";
    const x = typeof body?.x === "number" ? body.x : NaN;
    const y = typeof body?.y === "number" ? body.y : NaN;

    if (!agentId || !Number.isFinite(x) || !Number.isFinite(y)) {
      return NextResponse.json({ error: "agentId, x and y are required." }, { status: 400 });
    }

    await dbConnect();

    const player = await Player.findOne({ walletAddress: session.walletAddress.toLowerCase() });
    if (!player) {
      return NextResponse.json({ error: "No active package found for this wallet." }, { status: 404 });
    }

    hydratePlayerPackageSnapshot(player);

    const hasAgent = player.agents.some((agent: { id: string }) => agent.id === agentId);
    if (!hasAgent) {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }

    if (!player.agentPositions) {
      player.agentPositions = [];
    }

    const existingPosition = player.agentPositions.find(
      (position: { agentId: string }) => position.agentId === agentId,
    );

    if (existingPosition) {
      existingPosition.x = x;
      existingPosition.y = y;
    } else {
      player.agentPositions.push({ agentId, x, y });
    }

    player.markModified("agentPositions");
    await player.save();

    return NextResponse.json({
      success: true,
      player: serializePlayer(player),
      serverNow: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move agent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
