"use client";

import { Loader2, Sparkles } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import ContentDisplay from "./_components/contentDisplay";

export type Content = {
  id: number;
  userInput: string;
  content: subContent;
  thumbnailUrl: string;
  createdOn: string;
};

export type subContent = {
  description: string;
  image_prompts: any;
  tags: [];
  titles: [{
    seo_score: number;
    title: string;
  }];
};

function AiContentGenerator() {
  const [userInput, setUserInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<Content>();

  const onGenerate = async () => {
    try {
      setLoading(true);
      setContent(undefined); // Clear old content before generating new
      const result = await axios.post("/api/ai-content-generator", {
        userInput: userInput,
      });
      console.log(result.data);

      // Poll for completion
      while (true) {
        const runStatus = await fetch(
          `/api/run-status?runId=${result.data.runId}`
        );
        const json = await runStatus.json();
        console.log("Run Status:", json);

        if (json?.data && json.data.length > 0) {
          const latestRun = json.data[0];
          console.log("Latest Run:", latestRun);

          if (latestRun.status === "Completed") {
            console.log("✅ Job Completed!");
            console.log("Output:", latestRun.output);
            setContent(latestRun.output);
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

        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (e) {
      setLoading(false);
      console.log(e);
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="px-10 md:px-20 lg:px-40">
        <div className="flex items-center justify-center mt-20 flex-col gap-2">
          <h2 className="font-bold text-4xl text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            AI Content Generator
          </h2>
          <p className="text-gray-400 text-center max-w-2xl">
            Generate engaging YouTube content ideas, titles, descriptions, and
            scripts powered by AI
          </p>
        </div>

        <div className="p-3 border rounded-xl flex gap-2 items-center bg-secondary mt-8 shadow-lg">
          <input
            type="text"
            placeholder="Enter topic to generate content (e.g., 'Next.js tutorial', 'cooking tips')"
            className="w-full p-2 outline-none bg-transparent"
            onChange={(event) => setUserInput(event.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onGenerate()}
          />
          <button
            onClick={onGenerate}
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
              <Sparkles className="w-5 h-5" />
            )}
            Generate
          </button>
        </div>

        {/* Content output area */}
        <div className="mt-10">
          {loading ? (
            <div className="text-center text-gray-400">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
              <p>Generating amazing content...</p>
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-20">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Enter a topic to generate content</p>
            </div>
          )}
        </div>
      </div>
      
      <ContentDisplay content = {content} loading={loading}/>
    </div>
  );
}

export default AiContentGenerator;
