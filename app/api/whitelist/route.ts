import { NextResponse } from "next/server";
import dbConnect, { Whitelist } from "../../lib/mongodb";
import {
  countAllWhitelistTasks,
  countSubmittedWhitelistTasks,
  normalizeTwitterHandle,
  normalizeWalletAddress,
} from "../../lib/whitelist";
import type { WhitelistProgressRecord } from "../../lib/whitelist";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX = 5; // Pencere başına max istek
const REFERRAL_XP_REWARD = 100;
const SUBMITTED_WHITELIST_STATS_QUERY = {
  walletAddress: /^0x[a-f0-9]{40}$/i,
};

// Stats query - all entries with valid wallet
const ALL_WHITELIST_STATS_QUERY = {
  walletAddress: /^0x[a-f0-9]{40}$/i,
};

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
  if (!TURNSTILE_SECRET) {
    console.log("[verifyTurnstile] TURNSTILE_SECRET not configured");
    return false;
  }

  const formData = new FormData();
  formData.append("secret", TURNSTILE_SECRET);
  formData.append("response", token);
  if (ip && ip !== "unknown") {
    formData.append("remoteip", ip);
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  console.log("[verifyTurnstile] result:", data);
  return data.success === true;
}

function normalizeReferralCode(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
}

function buildReferralCodeSeed(twitterHandle: string) {
  const cleanHandle = twitterHandle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${cleanHandle || "MINER"}${suffix}`;
}

function isPendingHandle(handle: string) {
  return handle.startsWith("pending_");
}

async function createUniqueReferralCode(twitterHandle: string) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = buildReferralCodeSeed(twitterHandle);
    const existing = await Whitelist.findOne({ referralCode: code }).select("_id").lean();

    if (!existing) {
      return code;
    }
  }

  return `MINER${Date.now().toString(36).toUpperCase()}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const twitterHandle = normalizeTwitterHandle(searchParams.get("twitterHandle")).toLowerCase();
    const walletAddress = normalizeWalletAddress(searchParams.get("walletAddress"));

    await dbConnect();

    if (twitterHandle) {
      const whitelist = await Whitelist.findOne({ twitterHandle }).lean();
      if (!whitelist) {
        return NextResponse.json({ found: false }, { status: 404 });
      }
      return NextResponse.json({ found: true, data: whitelist });
    }

    if (walletAddress) {
      const whitelist = await Whitelist.findOne({ walletAddress }).lean();
      if (!whitelist) {
        return NextResponse.json({ found: false }, { status: 404 });
      }
      return NextResponse.json({ found: true, data: whitelist });
    }

    // Stats endpoint - no params
    const totalEntries = await Whitelist.countDocuments(ALL_WHITELIST_STATS_QUERY);
    const allEntries = await Whitelist.find(ALL_WHITELIST_STATS_QUERY)
      .select("completedTasks isWhitelistSubmitted twitterHandle walletAddress")
      .lean();
    const totalTasksCompleted = countAllWhitelistTasks(allEntries as WhitelistProgressRecord[]);

    // Fake boost: feels natural, not all-at-once
    const boostedEntries = totalEntries + Math.floor(totalEntries * 0.05) + 5;
    const boostedTasks = totalTasksCompleted + Math.floor(totalTasksCompleted * 0.05) + 5;

    return NextResponse.json({
      stats: {
        totalEntries: boostedEntries,
        totalTasksCompleted: boostedTasks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // IP al
    const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    console.log("[POST] headers forwarded:", forwarded, "ip:", ip);

    // Rate limit kontrolü
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      twitterHandle,
      walletAddress,
      completedTasks,
      whitelistStep,
      isWhitelistSubmitted,
      turnstileToken,
      referralCodeInput,
      referralCode,
    } = body;

    if (!twitterHandle && isWhitelistSubmitted) {
      return NextResponse.json({ error: "Missing twitterHandle" }, { status: 400 });
    }

    // Turnstile doğrulaması sadece son submit'te zorunlu
    if (isWhitelistSubmitted) {
      if (!turnstileToken) {
        return NextResponse.json({ error: "Missing CAPTCHA token" }, { status: 400 });
      }

      console.log("[CAPTCHA] verifying with token:", turnstileToken?.slice(0, 20) + "...");
      const isHuman = await verifyTurnstile(turnstileToken, ip);
      console.log("[CAPTCHA] result:", isHuman);
      if (!isHuman) {
        return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 403 });
      }
    }

    await dbConnect();

    console.log("[whitelist POST] body:", { twitterHandle, walletAddress, completedTasks, whitelistStep, isWhitelistSubmitted });

    const normalizedHandle = normalizeTwitterHandle(twitterHandle).toLowerCase();
    const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
    const normalizedReferralCodeInput = normalizeReferralCode(referralCodeInput);

    // Find existing document - prefer walletAddress, then twitterHandle
    let existingWhitelist = null;
    if (normalizedWalletAddress) {
      existingWhitelist = await Whitelist.findOne({ walletAddress: normalizedWalletAddress });
    }
    if (!existingWhitelist && normalizedHandle) {
      existingWhitelist = await Whitelist.findOne({ twitterHandle: normalizedHandle });
    }

    // Determine query for upsert
    let query: any = {};
    if (existingWhitelist) {
      query = { _id: existingWhitelist._id };
    } else if (normalizedWalletAddress) {
      query = { walletAddress: normalizedWalletAddress };
    } else if (normalizedHandle) {
      query = { twitterHandle: normalizedHandle };
    }

    const safeHandle = normalizedHandle?.startsWith("pending_") ? "WALLET" : (normalizedHandle || "WALLET");
    // Client-provided referral code takes priority (generated from twitter handle)
    const clientCode = (typeof referralCode === "string" && referralCode) || "";
    const existingCode = existingWhitelist?.referralCode || "";
    const finalReferralCode = clientCode || existingCode;
    let referredByCode = existingWhitelist?.referredByCode || "";
    let referralAwarded = false;
    let referralOwner = null;

    if (isWhitelistSubmitted && normalizedReferralCodeInput && !referredByCode && normalizedReferralCodeInput !== finalReferralCode) {
      referralOwner = await Whitelist.findOne({ referralCode: normalizedReferralCodeInput });

      if (referralOwner && referralOwner.twitterHandle !== normalizedHandle) {
        referredByCode = normalizedReferralCodeInput;
        referralAwarded = true;
      }
    }

    // Build update - start with existing or empty, then overwrite
    const updateData: any = existingWhitelist ? { ...existingWhitelist.toObject() } : {};

    if (normalizedWalletAddress) updateData.walletAddress = normalizedWalletAddress;
    if (completedTasks) updateData.completedTasks = completedTasks;
    if (whitelistStep) updateData.whitelistStep = whitelistStep;
    if (isWhitelistSubmitted !== undefined) updateData.isWhitelistSubmitted = isWhitelistSubmitted;
    if (finalReferralCode) updateData.referralCode = finalReferralCode;
    if (referredByCode) updateData.referredByCode = referredByCode;
    if (normalizedHandle) updateData.twitterHandle = normalizedHandle;

    // Remove _id from updateData
    delete updateData._id;

    console.log("[whitelist POST] query:", query, "updateData:", updateData);

    const whitelist = await Whitelist.findOneAndUpdate(
      query,
      updateData,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    if (referralAwarded) {
      await Whitelist.updateOne(
        { referralCode: referredByCode },
        {
          $inc: {
            referralXp: REFERRAL_XP_REWARD,
            referralCount: 1,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: whitelist,
      referralAwarded,
      referralXpReward: referralAwarded ? REFERRAL_XP_REWARD : 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
