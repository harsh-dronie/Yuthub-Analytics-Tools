import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { openai } from "@/inngest/functions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let query = searchParams.get("query");
    const thumbnailUrl = searchParams.get("thumbnailUrl");

    console.log("Received request - query:", query, "thumbnailUrl:", thumbnailUrl);

    if (thumbnailUrl) {
      try {
        console.log("Calling AI model with thumbnail URL...");
        //AI model call
        const completion = await openai.chat.completions.create({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Describe this thumbnail in short keywords suitable for searching similar YouTube videos, 
Give me tags with comma separated. Do not give any comment text, Maximum 5 tags.
Make sure after searching that tags will get similar youtube thumbnails`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: thumbnailUrl,
                  },
                },
              ],
            },
          ],
        });

        const result = completion.choices[0].message.content;
        console.log("AI generated query:", result);
        query = result;
      } catch (error: any) {
        console.error("AI model error:", error);
        
        // If payment error (402), return a helpful message
        if (error.status === 402) {
          return NextResponse.json(
            { 
              error: "OpenRouter API credits exhausted. Please add credits to your OpenRouter account or use text search instead.",
              code: "PAYMENT_REQUIRED"
            },
            { status: 402 }
          );
        }
        
        return NextResponse.json(
          { error: "Failed to analyze thumbnail", details: error.message },
          { status: 500 }
        );
      }
    }

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    console.log("Searching YouTube with query:", query);

    // Get youtube video list API - exclude shorts with videoDuration=medium/long
    const result = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoDuration=medium&maxResults=20&key=${process.env.YOUTUBE_API_KEY}`
    );

    const searchData = result.data;
    const videoIds = searchData.items
      .map((item: any) => item.id.videoId)
      .join(",");
    console.log("Found video IDs:", videoIds);

    //Get youtube video details by ID API - include contentDetails for duration
    const videoResult = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const videoResultData = videoResult.data;
    
    // Filter out shorts (videos less than 60 seconds)
    const filteredVideos = videoResultData.items.filter((item: any) => {
      const duration = item.contentDetails.duration;
      // Parse ISO 8601 duration (e.g., PT1M30S = 1 min 30 sec)
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return true;
      
      const hours = parseInt(match[1] || "0");
      const minutes = parseInt(match[2] || "0");
      const seconds = parseInt(match[3] || "0");
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      // Exclude videos shorter than 60 seconds (shorts)
      return totalSeconds >= 60;
    });
    
    const FinalResult = filteredVideos.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishAt: item.snippet.publishTime,
      viewCount: item.statistics.viewCount,
      likeCount: item.statistics.likeCount,
      commentCount: item.statistics.commentCount,
      duration: item.contentDetails.duration,
    }));

    console.log("Returning", FinalResult.length, "results (shorts filtered out)");
    return NextResponse.json(FinalResult);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
