import { NextResponse } from "next/server";
import dbConnect, { Whitelist } from "../../lib/mongodb";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX = 5; // Pencere başına max istek

// Basit in-memory rate limiter (sunucu restart'ta sıfırlanır ama yeterli)
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return false;

  const formData = new FormData();
  formData.append("secret", TURNSTILE_SECRET);
  formData.append("response", token);
  formData.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return data.success === true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const twitterHandle = searchParams.get("twitterHandle");

    if (!twitterHandle) {
      return NextResponse.json({ error: "Missing twitterHandle parameter" }, { status: 400 });
    }

    await dbConnect();

    const whitelist = await Whitelist.findOne({ twitterHandle: twitterHandle.toLowerCase() });

    if (!whitelist) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    return NextResponse.json({ found: true, data: whitelist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // IP al
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Rate limit kontrolü
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { twitterHandle, walletAddress, completedTasks, whitelistStep, isWhitelistSubmitted, turnstileToken } = body;

    if (!twitterHandle) {
      return NextResponse.json({ error: "Missing twitterHandle" }, { status: 400 });
    }

    // Turnstile doğrulaması sadece son submit'te zorunlu
    if (isWhitelistSubmitted) {
      if (!turnstileToken) {
        return NextResponse.json({ error: "Missing CAPTCHA token" }, { status: 400 });
      }

      const isHuman = await verifyTurnstile(turnstileToken, ip);
      if (!isHuman) {
        return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 403 });
      }
    }

    await dbConnect();

    const normalizedHandle = twitterHandle.toLowerCase();

    const whitelist = await Whitelist.findOneAndUpdate(
      { twitterHandle: normalizedHandle },
      {
        twitterHandle: normalizedHandle,
        walletAddress,
        completedTasks,
        whitelistStep,
        isWhitelistSubmitted,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: whitelist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

