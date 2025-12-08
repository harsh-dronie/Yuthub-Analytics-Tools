import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_INNGEST_SERVER_URL}/v1/events/${runId}/runs`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
        },
      }
    );

    const json = await response.json();
    return NextResponse.json(json);
  } catch (error) {
    console.error("Error fetching run status:", error);
    return NextResponse.json(
      { error: "Failed to fetch run status" },
      { status: 500 }
    );
  }
}
