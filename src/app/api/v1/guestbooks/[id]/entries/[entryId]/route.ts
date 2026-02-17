import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deleteEntryByToken } from "@/lib/repositories/entry.repo";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id: guestbookId, entryId } = await params;

  let body: { deletion_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (!body.deletion_token || typeof body.deletion_token !== "string") {
    return NextResponse.json(
      { error: "Missing deletion_token" },
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    const deleted = await deleteEntryByToken(
      supabaseAdmin,
      guestbookId,
      entryId,
      body.deletion_token
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "Entry not found or invalid token" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders() }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
