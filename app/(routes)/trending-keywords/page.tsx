"use client";

import { Loader2, Search, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

type TrendingData = {
  keyword: string;
  aiKeywords: {
    trending_keywords: Array<{
      keyword: string;
      seo_score: number;
    }>;
    content_ideas: string[];
    seo_tips: string[];
    competition_level: string;
    best_posting_time: string;
    trending_topics: string[];
    video_length_recommendation: string;
    thumbnail_tips: string[];
  };
  youtubeResults: {
    items: Array<{
      title: string;
      channelTitle: string;
      publishedAt: string;
      videoId: string;
    }>;
  };
  googleResults: {
    videos: Array<{
      title: string;
      url: string;
    }>;
  };
};

function TrendingKeywords() {
  const [keyword, setKeyword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrendingData | null>(null);
  const { has } = useAuth();

  const onSearch = async () => {
    if (!keyword.trim()) return;

    // Check premium access first
    //@ts-ignore
    const hasPremiumAccess = has({ plan: "premium_plan" });
    if (!hasPremiumAccess) {
      toast.error("Please subscribe to Premium Plan to use this feature", {
        action: {
          label: "Upgrade",
          onClick: () => (window.location.href = "/billing"),
        },
      });
      return;
    }
    
    try {
      setLoading(true);
      setResults(null);
      
      const result = await axios.post("/api/trending-keywords", {
        keyword: keyword,
      });
      
      console.log("API Response:", result.data);

      // Poll for completion
      while (true) {
        const runStatus = await fetch(
          `/api/run-status?runId=${result.data.runId}`
        );
        const json = await runStatus.json();
        console.log("Run Status:", json);

        if (json?.data && json.data.length > 0) {
          const latestRun = json.data[0];

          if (latestRun.status === "Completed") {
            console.log("✅ Search Completed!");
            console.log("Output:", latestRun.output);
            setResults(latestRun.output);
            setLoading(false);
            break;
          }
          if (
            latestRun.status === "Failed" ||
            latestRun.status === "Cancelled"
          ) {
            console.error("Search failed or cancelled:", latestRun);
            setLoading(false);
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="px-10 md:px-20 lg:px-40">
        <div className="flex items-center justify-center mt-20 flex-col gap-2">
          <h2 className="font-bold text-4xl text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Trending Keywords
          </h2>
          <p className="text-gray-400 text-center max-w-2xl">
            Discover trending keywords and topics to boost your YouTube content
            visibility and reach
          </p>
        </div>

        <div className="p-3 border rounded-xl flex gap-2 items-center bg-secondary mt-8 shadow-lg">
          <input
            type="text"
            placeholder="Enter keyword or topic to find trends..."
            className="w-full p-2 outline-none bg-transparent"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button
            onClick={onSearch}
            disabled={loading || !keyword?.trim()}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-medium ${
              loading || !keyword?.trim()
                ? "bg-gray-400 cursor-not-allowed opacity-50"
                : "bg-gradient-to-t from-red-500 to-orange-500 hover:scale-105 hover:shadow-lg"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Search
          </button>
        </div>

        {/* Results area */}
        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Trending Keywords Skeleton */}
              <div className="border rounded-xl bg-secondary p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  <h2 className="text-lg font-bold">Analyzing Keywords...</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 bg-background rounded-lg"
                    >
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Topics Skeleton */}
              <div className="border rounded-xl bg-secondary p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  <h2 className="text-lg font-bold">Finding Topics...</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ) : results ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Trending Keywords with SEO Scores */}
              <div className="border rounded-xl bg-secondary p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold">Trending Keywords with SEO Scores</h2>
                  <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    {results.aiKeywords?.trending_keywords?.length || 0} keywords
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {results.aiKeywords?.trending_keywords?.map((kw: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-background rounded-lg hover:shadow-sm transition"
                    >
                      <span className="font-medium text-sm">{kw.keyword || kw}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        (kw.seo_score || 0) >= 80 
                          ? 'bg-green-100 text-green-700' 
                          : (kw.seo_score || 0) >= 60 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {kw.seo_score || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Topics */}
              <div className="border rounded-xl bg-secondary p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold">Trending Topics</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.aiKeywords?.trending_topics?.map((topic: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-20">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Enter a keyword to discover trends</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrendingKeywords;
