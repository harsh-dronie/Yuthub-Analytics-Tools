import { db } from "@/configs/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Testing database connection...");
    
    // Simple query to test connection
    const result = await db.execute(sql`SELECT 1 as test`);
    
    console.log("Database connection successful!");
    return NextResponse.json({ 
      success: true, 
      message: "Database connected successfully",
      result 
    });
  } catch (error) {
    console.error("Database connection failed - Full error:", error);
    console.error("Error type:", typeof error);
    console.error("Error keys:", error ? Object.keys(error) : "null");
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorString: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
