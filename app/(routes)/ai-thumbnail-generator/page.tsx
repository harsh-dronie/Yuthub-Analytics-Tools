"use client";

import React, { useState } from "react";
import axios from "axios";
import Image from "next/image";
import { ArrowUp, ImagePlus, Loader2, User, X } from "lucide-react";
import { RunStatus } from "@/services/GlobalApi";
import ThumbnailList from "./_components/ThumbnailList";

function AiThumbnailGenerator() {
  const [userInput, setUserInput] = useState<string>();
  const [referanceImage, setReferanceImage] = useState<any>();
  const [faceImage, setFaceImage] = useState<any>();
  const [referanceImagePreview, setReferanceImagePreview] = useState<string>();
  const [faceImagePreview, setFaceImagePreview] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [outputThumbnailImage, setOutputThumbnailImage] = useState<string>("");

  const onHandleFileChange = (field: string, e: any) => {
    const selectedFile = e.target.files[0];
    if (field == "referanceImage") {
      setReferanceImage(selectedFile);
      setReferanceImagePreview(URL.createObjectURL(selectedFile));
    } else {
      setFaceImage(selectedFile);
      setFaceImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const onSubmit = async (): Promise<void> => {
    setLoading(true);
    const formData = new FormData();
    userInput && formData.append("userInput", userInput);
    referanceImage && formData.append("refImage", referanceImage);
    faceImage && formData.append("faceImage", faceImage);

    // post API call
    try {
      const result = await axios.post("/api/generate-thumbnail", formData);
      console.log(result.data);

      //polling to check inngest function run status
      while (true) {
        const runStatus = await RunStatus(result.data.runId);
        console.log("Run Status:", runStatus);

        if (runStatus?.data && runStatus.data.length > 0) {
          const latestRun = runStatus.data[0];
          console.log("Latest Run:", latestRun);

          if (latestRun.status === "Completed") {
            console.log("Output:", latestRun.output);
            setOutputThumbnailImage(latestRun.output);
            setLoading(false);
            break;
          }
          if (
            latestRun.status === "Failed" ||
            latestRun.status === "Cancelled"
          ) {
            console.error("Run failed or cancelled:", latestRun);
            setLoading(false);
            break;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="px-10 md:px-20 lg:px-40">
        <div className="flex items-center justify-center mt-20 flex-col gap-2">
          <h2 className="font-bold text-4xl text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            AI Thumbnail Generator
          </h2>
          <p className="text-gray-400 text-center max-w-2xl">
            Turn any video into a click magnet with thumbnails that grab
            attention and drive views. Our AI Youtube Thumbnail maker creates
            professional designs instantly no design skill needed
          </p>
        </div>

        <div>
          {loading ? (
            <div className="w-full bg-secondary border rounded-2xl p-10 h-[400px] flex item-center justify-center mt-6">
              <Loader2 className="animate-spin" />
              <h2>Please Wait... Thumbnail is generating</h2>
            </div>
          ) : (
            <div>
              {outputThumbnailImage && (
                <Image
                  src={outputThumbnailImage}
                  alt="Thumbnail"
                  width={500}
                  height={400}
                  className="aspect-video w-full"
                />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 items-center p-3 border rounded-xl mt-10 bg-secondary shadow-lg">
          <input
            type="text"
            placeholder="Enter your youtube video title or description"
            className="w-full outline-0 bg-transparent p-2"
            onChange={(event) => setUserInput(event.target.value)}
          />
          <div
            className="p-3 bg-gradient-to-t from-red-500 to-orange-500 rounded-full cursor-pointer hover:scale-105 transition-all hover:shadow-lg"
            onClick={onSubmit}
          >
            <ArrowUp />
          </div>
        </div>

        <div className="mt-3 flex gap-3">
          <label htmlFor="referanceImageUpload" className="w-full">
            {!referanceImagePreview ? (
              <div className="p-4 w-full border rounded-xl bg-secondary flex gap-2 items-center justify-center hover:scale-105 transition-all cursor-pointer">
                <ImagePlus />
                <h2>Referance Image</h2>
              </div>
            ) : (
              <div className="reative">
                <X
                  className="absolute"
                  onClick={() => setFaceImagePreview(undefined)}
                />
                <Image
                  src={referanceImagePreview}
                  alt="Referance Image"
                  width={100}
                  height={100}
                  className="w-[70px] h-[70px] object-cover rounded-sm "
                />
              </div>
            )}
          </label>

          <input
            type="file"
            id="referanceImageUpload"
            className="hidden"
            onChange={(e) => onHandleFileChange("referanceImage", e)}
          />

          <label htmlFor="includeFace" className="w-full">
            {!faceImagePreview ? (
              <div className="p-4 w-full border rounded-xl bg-secondary flex gap-2 items-center justify-center hover:scale-105 transition-all cursor-pointer">
                <User />
                <h2>Include Face</h2>
              </div>
            ) : (
              <div className="reative">
                <X
                  className="absolute"
                  onClick={() => setFaceImagePreview(undefined)}
                />
                <Image
                  src={faceImagePreview}
                  alt="Face Image"
                  width={100}
                  height={100}
                  className="w-[70px] h-[70px] object-cover rounded-sm "
                />
              </div>
            )}
          </label>
          <input
            type="file"
            id="includeFace"
            className="hidden"
            onChange={(e) => onHandleFileChange("faeImage", e)}
          />
        </div>
      </div>
      <ThumbnailList />
    </div>
  );
}

export default AiThumbnailGenerator;
