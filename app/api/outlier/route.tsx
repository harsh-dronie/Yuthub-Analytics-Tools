import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  // Get youtube video list API
  const result = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoDuration=medium&maxResults=20&key=${process.env.YOUTUBE_API_KEY}`
  );

  const searchData = result.data;
  const videoIds = searchData.items
    .map((item: any) => item.id.videoId)
    .join(",");
  console.log("Found video IDs:", videoIds);

  // Get youtube video details by ID API - include contentDetails for duration
  const videoResult = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
  );
  const videoResultData = videoResult.data;

  // Process videos with engagement metrics
  const videos = videoResultData.items.map((item: any) => {
    const today = new Date();
    const viewCount = parseInt(item.statistics.viewCount || "0");
    const likeCount = parseInt(item.statistics.likeCount || "0");
    const commentCount = parseInt(item.statistics.commentCount || "0");
    const publishDate = new Date(item.snippet.publishedAt);
    const daysSincePublished = Math.max(
      (today.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24),
      1
    );
    const viewsPerDay = viewCount / daysSincePublished;
    const engagementRate = ((likeCount + commentCount) / viewCount) * 100;

    return {
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishAt: item.snippet.publishedAt,
      viewCount,
      likeCount,
      commentCount,
      duration: item.contentDetails.duration,
      viewsPerDay,
      engagementRate,
    };
  });

  // Calculate outliers using IQR method on viewsPerDay (better for viral detection)
  const viewsPerDayArray = videos.map((v: any) => v.viewsPerDay);
  const { iqr, lowerBound, upperBound } = calculateIQR(viewsPerDayArray);

  console.log("IQR Stats:", { iqr, lowerBound, upperBound });

  const avgViews =
    videos.reduce((sum: number, v: any) => sum + v.viewCount, 0) /
    videos.length;
  const maxViewsPerDay = Math.max(...videos.map((v: any) => v.viewsPerDay));
  const maxEngagementRate = Math.max(
    ...videos.map((v: any) => v.engagementRate)
  );

  // Calculate smart scores and identify outliers
  const finalResult = videos.map((v: any) => {
    // Use viewsPerDay for outlier detection (more accurate for viral videos)
    const isOutlier = v.viewsPerDay < lowerBound || v.viewsPerDay > upperBound;
    let outlierScore = 0;

    console.log(`Video: ${v.title.substring(0, 30)}... | viewsPerDay: ${v.viewsPerDay} | isOutlier: ${isOutlier}`);

    if (isOutlier && iqr > 0) {
      if (v.viewsPerDay > upperBound) {
        outlierScore = (v.viewsPerDay - upperBound) / iqr;
      } else if (v.viewsPerDay < lowerBound) {
        outlierScore = (lowerBound - v.viewsPerDay) / iqr;
      }
    }

    const smartScore =
      (v.viewCount / avgViews) * 0.5 +
      (v.viewsPerDay / maxViewsPerDay) * 0.3 +
      (v.engagementRate / maxEngagementRate) * 0.2;

    return {
      ...v,
      engagementRate: Number(v?.engagementRate?.toFixed(2)),
      viewsPerDay: Math.round(v?.viewsPerDay),
      smartScore: Number(smartScore?.toFixed(3)),
      isOutlier,
      outlierScore: Number(outlierScore?.toFixed(2)),
    };
  });

  console.log(finalResult);
  return NextResponse.json(finalResult);
}

// Helper function to calculate IQR (Interquartile Range) for outlier detection
function calculateIQR(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  // Calculate proper quartiles
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  // Use 0.5 * IQR for stricter outlier detection (more sensitive)
  const lowerBound = q1 - 0.5 * iqr;
  const upperBound = q3 + 0.5 * iqr;
  
  console.log("Sorted values:", sorted);
  console.log("Q1:", q1, "Q3:", q3, "IQR:", iqr);
  console.log("Bounds:", { lowerBound, upperBound });
  
  return { q1, q3, iqr, lowerBound, upperBound };
}
