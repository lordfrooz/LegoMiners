import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "../../../lib/auth";
import dbConnect, { Player } from "../../../lib/mongodb";

export async function POST() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await dbConnect();
    await Player.deleteOne({ walletAddress: session.walletAddress.toLowerCase() });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset progress.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
