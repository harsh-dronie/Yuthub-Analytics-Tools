import { db } from "@/configs/db";
import { AiThumbnailTable } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const refImage = formData.get("refImage") as File | null;
  const faceImage = formData.get("faceImage") as File | null;
  const userInput = formData.get("userInput") as string | null;
  const user = await currentUser();

  const inputData = {
    userInput,
    refImage: refImage ? await getFileBufferData(refImage) : null,
    faceImage: faceImage ? await getFileBufferData(faceImage) : null,
    userEmail: user?.primaryEmailAddress?.emailAddress ?? null,
  };

  const result = await inngest.send({
    name: "ai/generate-thumbnail",
    data: inputData,
  });
  return NextResponse.json({ runId: result.ids[0] });
}

const getFileBufferData = async (file: File) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    buffer: buffer.toString("base64"),
  };
};

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const result = await db
      .select()
      .from(AiThumbnailTable)
      //@ts-ignore
      .where(
        eq(AiThumbnailTable.userEmail, user.primaryEmailAddress.emailAddress)
      )
      .orderBy(desc(AiThumbnailTable.id));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Database error in GET /api/generate-thumbnail:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch thumbnails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
