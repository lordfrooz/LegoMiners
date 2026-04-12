import { createHash, createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getAddress } from "viem";
import dbConnect, { Session } from "./mongodb";

type SessionRecord = {
  walletAddress: string;
  expiresAt: Date;
};

const SESSION_COOKIE_NAME = "tempo_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const NONCE_TTL_MS = 1000 * 60 * 10;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing.");
  }

  return secret;
}

export function normalizeAddress(address: string) {
  return getAddress(address.trim());
}

export function createNonce() {
  return randomBytes(16).toString("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAuthMessage(address: string, nonce: string) {
  return [
    "Tempo Topia authentication",
    "",
    `Wallet: ${normalizeAddress(address)}`,
    `Nonce: ${nonce}`,
    `Chain ID: 4217`,
    `Issued At: ${new Date().toISOString()}`,
    "",
    "Sign this message to authenticate and unlock your Tempo Topia session.",
  ].join("\n");
}

export function getNonceExpiry() {
  return new Date(Date.now() + NONCE_TTL_MS);
}

export function getSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  const secret = getSessionSecret();
  const signature = createHmac("sha256", secret).update(token).digest("hex");

  cookieStore.set(SESSION_COOKIE_NAME, `${token}.${signature}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getAuthenticatedSession() {
  await dbConnect();

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return null;
  }

  const [token, signature] = cookieValue.split(".");
  if (!token || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret()).update(token).digest("hex");
  if (signature !== expectedSignature) {
    return null;
  }

  const session = (await Session.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  }).lean()) as SessionRecord | null;

  if (!session) {
    return null;
  }

  return {
    walletAddress: normalizeAddress(session.walletAddress),
    expiresAt: session.expiresAt as Date,
  };
}
