"use client";
import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import axios from "axios";
import VideoOutlierCard from "../thumbnail-search/_components/VideoOutlierCard";
import VideoListSkeleton from "@/app/_components/VideoListSkeleton";

export type VideoInfoOutlier = {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  smartScore: number;
  viewsPerDay: number;
  isOutlier: boolean;
  engagementRate: number;
  outlierScore: number;
};

function Outlier() {
  const [userInput, setUserInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [videoList, setVideoList] = useState<VideoInfoOutlier[]>([]);

  const onSearch = async () => {
    try {
      setLoading(true);
      const result = await axios.get("/api/outlier?query=" + userInput);
      console.log(result.data);
      setVideoList(result.data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

    
  return (
    <div className="min-h-screen pb-10">
      <div className="px-10 md:px-20 lg:px-40">
        <div className="flex items-center justify-center mt-20 flex-col gap-2">
          <h2 className="font-bold text-4xl text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            YouTube Outlier Finder
          </h2>
          <p className="text-gray-400 text-center max-w-2xl">
            Discover viral videos that are performing exceptionally well! Outliers
            are videos with significantly higher views, engagement, or growth
            compared to others in the same search.
          </p>
        </div>

        <div className="p-3 border rounded-xl flex gap-2 items-center bg-secondary mt-8 shadow-lg">
          <input
            type="text"
            placeholder="Search for videos (e.g., 'next js ai', 'react tutorial')"
            className="w-full p-2 outline-none bg-transparent"
            onChange={(event) => setUserInput(event.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button
            onClick={onSearch}
            disabled={loading || !userInput?.trim()}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-medium ${
              loading || !userInput?.trim()
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
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="px-10 md:px-20 lg:px-40">
            <VideoListSkeleton />
          </div>
        ) : videoList.length > 0 ? (
          <>
            <div className="mb-6 px-10 md:px-20 lg:px-40">
              <h3 className="text-xl font-semibold">
                Found {videoList.length} videos
              </h3>
              <p className="text-sm text-gray-400">
                Videos marked as outliers are performing exceptionally well
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {videoList.map((video) => (
                <VideoOutlierCard key={video.id} videoInfo={video} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 mt-20 px-10 md:px-20 lg:px-40">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Search for videos to find outliers</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Outlier;