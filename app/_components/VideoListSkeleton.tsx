import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function VideoListSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div key={item} className="flex flex-col space-y-3">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default VideoListSkeleton;
