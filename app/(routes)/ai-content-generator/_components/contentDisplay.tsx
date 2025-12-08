import { Skeleton } from "@/components/ui/skeleton";
import { Content } from "../page";
import React from "react";

type Props = {
  content: Content | undefined;
  loading: boolean;
};

function ContentDisplay({ content, loading }: Props) {
  return (
    <div className="mt-10">
      {loading && (
        <div>
          <div className="grid grid-cols-2 gap-5">
            <Skeleton className="w-full h-[200px] rounded-lg" />
            <Skeleton className="w-full h-[200px] rounded-lg" />
            <Skeleton className="w-full h-[200px] rounded-lg" />
            <Skeleton className="w-full h-[200px] rounded-lg" />
          </div>
        </div>
      )}

      {!loading && content && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title */}
          <div className="border rounded-xl bg-secondary p-6">
            <h2 className="py-2 text-lg font-bold">
              Youtube Video Title Suggestion
            </h2>
            <div className="space-y-3 mt-4">
              {(content as any)?.titles?.map((title: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-background rounded-lg"
                >
                  <h2 className="font-medium flex-1">{title?.title}</h2>
                  <span className="ml-3 px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-sm font-medium">
                    {title?.seo_score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="border rounded-xl bg-secondary p-6">
            <h2 className="py-2 text-lg font-bold">Video Description</h2>
            <p className="text-gray-500 mt-4 whitespace-pre-wrap">
              {(content as any)?.description}
            </p>
          </div>

          {/* Tags */}
          <div className="border rounded-xl bg-secondary p-6">
            <h2 className="py-2 text-lg font-bold">Tags</h2>
            <div className="flex flex-wrap gap-2 mt-4">
              {(content as any)?.tags?.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-background rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Thumbnail */}
          {(content as any)?.thumbnailUrl && (
            <div className="border rounded-xl bg-secondary p-6">
              <h2 className="py-2 text-lg font-bold">Generated Thumbnail</h2>
              <a
                href={(content as any)?.thumbnailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4"
              >
                <img
                  src={(content as any)?.thumbnailUrl}
                  alt="Generated thumbnail"
                  className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContentDisplay;
