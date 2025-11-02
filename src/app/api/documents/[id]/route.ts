import { NextRequest, NextResponse } from "next/server";
import { db, documents } from "@/db";
import { eq } from "drizzle-orm";
import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
  addRateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit";

/**
 * GET /api/documents/[id]
 * Retrieve a document by ID
 * Rate limit: 100 views per hour per IP
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(
      clientIp,
      "get_document",
      RATE_LIMITS.GET_DOCUMENT,
    );

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset,
      );
    }

    // Fetch from database
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const document = result[0];

    const response = NextResponse.json({
      id: document.id,
      encryptedContent: document.encryptedContent,
      createdAt: document.createdAt,
    });

    return addRateLimitHeaders(
      response,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/documents/[id]
 * Update an existing document's encrypted content
 * Rate limit: 30 updates per hour per document ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    // Rate limiting per document ID (prevents spam updates to same doc)
    const rateLimitResult = checkRateLimit(
      id,
      "update_document",
      RATE_LIMITS.UPDATE_DOCUMENT,
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

    // Check if document exists
    const existing = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Update the document
    await db
      .update(documents)
      .set({ encryptedContent })
      .where(eq(documents.id, id));

    const response = NextResponse.json({ id, updated: true });
    return addRateLimitHeaders(
      response,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}
