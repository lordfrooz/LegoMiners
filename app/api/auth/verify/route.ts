import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import {
  createSessionToken,
  getSessionExpiry,
  hashSessionToken,
  normalizeAddress,
  setSessionCookie,
} from "../../../lib/auth";
import dbConnect, { AuthNonce, Session } from "../../../lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = body?.address;
    const signature = body?.signature;

    if (!address || typeof address !== "string" || !signature || typeof signature !== "string") {
      return NextResponse.json({ error: "Address and signature are required." }, { status: 400 });
    }

    await dbConnect();

    const normalizedAddress = normalizeAddress(address);
    const nonceRecord = await AuthNonce.findOne({
      walletAddress: normalizedAddress.toLowerCase(),
      expiresAt: { $gt: new Date() },
    });

    if (!nonceRecord) {
      return NextResponse.json({ error: "Authentication nonce expired. Retry sign-in." }, { status: 401 });
    }

    const isValid = await verifyMessage({
      address: normalizedAddress,
      message: nonceRecord.message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid wallet signature." }, { status: 401 });
    }

    await AuthNonce.deleteOne({ _id: nonceRecord._id });

    const token = createSessionToken();
    const expiresAt = getSessionExpiry();

    await Session.create({
      walletAddress: normalizedAddress.toLowerCase(),
      tokenHash: hashSessionToken(token),
      expiresAt,
    });

    await setSessionCookie(token, expiresAt);

    return NextResponse.json({
      success: true,
      walletAddress: normalizedAddress,
      expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify wallet signature.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
