import { NextRequest, NextResponse } from "next/server";
import { db, documents } from "@/db";
import { generateId } from "@/lib/crypto";
import { eq } from "drizzle-orm";
import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
  addRateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit";

/**
 * POST /api/documents
 * Create a new document with encrypted content
 * Rate limit: 10 documents per hour per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(
      clientIp,
      "create_document",
      RATE_LIMITS.CREATE_DOCUMENT,
    );

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset,
      );
    }

    const body = await request.json();
    const { encryptedContent } = body;

    if (!encryptedContent || typeof encryptedContent !== "string") {
      return NextResponse.json(
        { error: "Invalid encrypted content" },
        { status: 400 },
      );
    }

    // Limit encrypted content size to 1MB
    if (encryptedContent.length > 1024 * 1024 * 10) {
      return NextResponse.json(
        { error: "Document too large (max 1MB)" },
        { status: 413 },
      );
    }

    // Generate unique ID
    const id = generateId();

    // Store in database
    await db.insert(documents).values({
      id,
      encryptedContent,
      createdAt: new Date(),
    });

    const response = NextResponse.json({ id }, { status: 201 });
    return addRateLimitHeaders(
      response,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}
