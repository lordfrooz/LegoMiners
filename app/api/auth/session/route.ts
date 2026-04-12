import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "../../../lib/auth";

export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      walletAddress: session.walletAddress,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
