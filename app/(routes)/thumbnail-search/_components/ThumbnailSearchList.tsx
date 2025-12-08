import React from "react";
import { VideoInfo } from "../page";
import Videocard from "./Videocard";

type PROPS = {
  videoList: VideoInfo[] | undefined;
  SearchSimilerThumbnail:any
};

function ThumbnailSearchList({ videoList, SearchSimilerThumbnail }: PROPS) {
  return (
    <div className="mt-7"> 
      <div className="grid grid-col-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {videoList &&
          videoList.map((video: VideoInfo, index: number) => (
            <div key={video.id} onClick={() => SearchSimilerThumbnail(video.thumbnail)}>
              <Videocard videoInfo={video} />
            </div>
          ))}
      </div>
    </div>
  );
}

export default ThumbnailSearchList;