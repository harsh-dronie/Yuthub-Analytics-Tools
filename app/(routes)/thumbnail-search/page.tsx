"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import axios from "axios";
import ThumbnailSearchList from "./_components/ThumbnailSearchList";
import { Skeleton } from "@/components/ui/skeleton";
import VideoListSkeleton from "@/app/_components/VideoListSkeleton";

export type VideoInfo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
};

function ThumbnailSearch() {
  const [userInput, setUserInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [videoList, setVideoList] = useState<VideoInfo[]>();

  const onSearch = async () => {
    setLoading(true);
    const result = await axios.get("/api/thumbnail-search?query=" + userInput);
    console.log(result.data);
    setLoading(false);
    setVideoList(result.data);
  };

  const SearchSimilerThumbnail = async (url: string) => {
    setLoading(true);
    console.log("Searching for similar thumbnails with URL:", url);
    try {
      const result = await axios.get(
        "/api/thumbnail-search?thumbnailUrl=" + encodeURIComponent(url)
      );
      console.log("Search result:", result.data);
      setVideoList(result.data);
    } catch (error: any) {
      console.error("Error searching similar thumbnails:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.status === 402) {
        alert(
          "⚠️ OpenRouter API credits finished!\n\n" +
          "The AI image analysis feature requires OpenRouter credits.\n" +
          "Please use the text search instead or add credits to your OpenRouter account."
        );
      } else {
        alert(
          "Failed to search similar thumbnails: " +
            (error.response?.data?.error || error.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="px-10 md:px-20 lg:px-40">
        <div className="flex items-center justify-center mt-20 flex-col gap-2">
          <h2 className="font-bold text-4xl text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            AI Thumbnail Search
          </h2>
          <p className="text-gray-400 text-center max-w-2xl">
            Just enter a title or keyword and get visually similar youtube
            thumbnails
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
            disabled={loading || !userInput.trim()}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-medium ${
              loading || !userInput.trim()
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
      <ThumbnailSearchList videoList={videoList} 
      SearchSimilerThumbnail={(url:string)=>SearchSimilerThumbnail(url)}/>

      <div>
{loading ?
<VideoListSkeleton />

:
<ThumbnailSearchList videoList={videoList} 
      SearchSimilerThumbnail={(url:string)=>SearchSimilerThumbnail(url)}/>
}
</div>
    </div>
  );
}

export default ThumbnailSearch;
