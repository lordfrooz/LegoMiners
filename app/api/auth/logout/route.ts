import { NextResponse } from "next/server";
import { clearSessionCookie, getAuthenticatedSession } from "../../../lib/auth";
import dbConnect, { Session } from "../../../lib/mongodb";

export async function POST() {
  try {
    const session = await getAuthenticatedSession();

    if (session) {
      await dbConnect();
      await Session.deleteMany({ walletAddress: session.walletAddress.toLowerCase() });
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to logout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
