import { NextResponse } from "next/server";
import dbConnect, { Player } from "../../../lib/mongodb";

function shortenWallet(walletAddress: string) {
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

export async function GET() {
  try {
    await dbConnect();

    const players = await Player.aggregate([
      {
        $project: {
          walletAddress: 1,
          totalIncomePerMinute: { $sum: "$agents.incomePerMinute" },
        },
      },
      { $sort: { totalIncomePerMinute: -1, walletAddress: 1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      entries: players.map((player: { walletAddress: string; totalIncomePerMinute: number }, index: number) => ({
        rank: index + 1,
        walletAddress: player.walletAddress,
        label: shortenWallet(player.walletAddress),
        incomePerMinute: player.totalIncomePerMinute ?? 0,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leaderboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
