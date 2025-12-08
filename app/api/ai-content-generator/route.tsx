import { inngest } from "@/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userInput } = await req.json();
  const user = await currentUser();
  const result = await inngest.send({
    name: "ai/generateContent",
    data: {
      userInput: userInput,
      userEmail: user?.primaryEmailAddress?.emailAddress
    }
  });
  return NextResponse.json({ runId: result.ids[0] });
}