import React from "react";
import Image from "next/image";
import { Eye, ThumbsUp } from "lucide-react";
import { VideoInfoOutlier } from "../../outlier/page";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type props = {
  videoInfo: VideoInfoOutlier;
};

function VideoOutlierCard({ videoInfo }: props) {
  return (
    <div className="p-3 border rounded-2xl cursor-pointer relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-md z-10">
            {videoInfo.smartScore}x
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Outlier and Smartscore</p>
        </TooltipContent>
      </Tooltip>
      <div className="relative">
        <Image
          src={videoInfo.thumbnail}
          alt={videoInfo.title}
          width={500}
          height={300}
          className="rounded-xl object-cover aspect-video w-full"
        />
      </div>
      <h2 className="mt-2 font-medium line-clamp-2">{videoInfo.title}</h2>
      <h2 className="text-xs text-gray-400 mt-1">{videoInfo.channelTitle}</h2>
      <div className="flex justify-between items-center mt-2">
        <h2 className="flex gap-2 items-center text-xs text-gray-400">
          <Eye className="h-4 w-4" /> {videoInfo.viewCount}
        </h2>

        <Tooltip>
          <TooltipTrigger asChild>
            <h2 className="flex gap-2 items-center text-xs text-white bg-red-500 p-1 rounded-sm">
              <ThumbsUp className="h-4 w-4" /> {videoInfo.engagementRate}
            </h2>
          </TooltipTrigger>
          <TooltipContent>
            <p>Engagement Rate</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export default VideoOutlierCard;
