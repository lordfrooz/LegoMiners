import { NextResponse } from "next/server";
import { AuthNonce } from "../../../lib/mongodb";
import dbConnect from "../../../lib/mongodb";
import {
  createAuthMessage,
  createNonce,
  getNonceExpiry,
  normalizeAddress,
} from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = body?.address;

    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "Missing wallet address." }, { status: 400 });
    }

    await dbConnect();

    const normalizedAddress = normalizeAddress(address);
    const nonce = createNonce();
    const message = createAuthMessage(normalizedAddress, nonce);
    const expiresAt = getNonceExpiry();

    await AuthNonce.findOneAndUpdate(
      { walletAddress: normalizedAddress.toLowerCase() },
      {
        walletAddress: normalizedAddress.toLowerCase(),
        nonce,
        message,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      address: normalizedAddress,
      message,
      nonce,
      expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create auth nonce.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
