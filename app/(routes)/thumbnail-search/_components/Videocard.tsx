import React from "react";
import Image from "next/image";
import { VideoInfo } from "../page";
import { Eye, ThumbsUp } from "lucide-react";

type props = {
  videoInfo: VideoInfo;
};

function Videocard({ videoInfo }: props) {

  return (
    <div className="p-3 border rounded-2xl cursor-pointer hover:scale-105 transition-all">
      <Image
        src={videoInfo.thumbnail}
        alt={videoInfo.title}
        width={500}
        height={300}
        className="rounded-xl object-cover aspect-video w-full"
      />
      <h2 className="mt-2 font-medium line-clamp-2">{videoInfo.title}</h2>
      <h2 className="text-xs text-gray-400 mt-1">{videoInfo.channelTitle}</h2>
      <div className="flex justify-between items-center mt-2">
        <h2 className="flex gap-2 items-center text-xs text-gray-400">
          <Eye className="h-4 w-4" /> {videoInfo.viewCount}
        </h2>
        <h2 className="flex gap-2 items-center text-xs text-gray-400">
          <ThumbsUp className="h-4 w-4" /> {videoInfo.likeCount}
        </h2>
      </div>
    </div>
  );
}

export default Videocard;