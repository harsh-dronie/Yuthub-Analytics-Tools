import { inngest } from "@/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    const user = await currentUser();

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword is required" },
        { status: 400 }
      );
    }

    const result = await inngest.send({
      name: "ai/getTrendingKeywords",
      data: {
        keyword,
        userEmail: user?.primaryEmailAddress?.emailAddress ?? null,
      },
    });

    return NextResponse.json({ runId: result.ids[0] });
  } catch (error) {
    console.error("Error triggering trending keywords:", error);
    return NextResponse.json(
      { error: "Failed to start trending keywords search" },
      { status: 500 }
    );
  }
}
