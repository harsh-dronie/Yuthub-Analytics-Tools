import { inngest } from "./client";
import ImageKit from "imagekit";
import OpenAI from "openai";
import axios from "axios";
import { AiThumbnailTable, AiContentTable, TrendingKeywordsTable } from "@/configs/schema";
import { db } from "@/configs/db";
import moment from "moment";

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Groq - Free alternative with generous rate limits (30 req/min, 14,400/day)
export const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

export const GenerateAiThumbnail = inngest.createFunction(
  { id: "ai/generate-thumbnail" },
  { event: "ai/generate-thumbnail" },
  async ({ event, step }) => {
    const { userEmail, refImage, faceImage, userInput } = await event.data;

    //upload image to cloud / ImageKit

    const uploadImageUrls = await step.run("UploadImage", async () => {
      if (refImage != null) {
        //@ts-ignore
        const imageKit = new ImageKit({
          //@ts-ignore
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
          //@ts-ignore
          privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
          //@ts-ignore
          urlEndpoint: process.env.IMAGEKIT_URLENDPOINT,
        });

        const refImageUrl = await imageKit.upload({
          file: refImage?.buffer ?? "",
          fileName: refImage.name,
          isPublished: true,
          useUniqueFileName: false,
        });

        return {
          refImageUrl: refImageUrl.url,
        };
      } else return null;
    });

    //Generate AI prompt from AI model
    // Generate AI prompt from AI Model
    const generateThumbnailPrompt = await step.run(
      "generateThumbnailPrompt",
      async () => {
        const completion = await openai.chat.completions.create({
          model: "google/gemini-2.5-flash",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: uploadImageUrls
                    ? `Refering to this thumbnail url write a text prompt to generate youtube thumbnail similar to the attached reference image with following user input: ${userInput}. Only give me text prompt no other comment text`
                    : `Depends on user input write a text prompt to generate high quality professional youtube thumbnail add relevant icons, illustration or images as per title. UserInput: ${userInput}. Only give me text prompt no other comment text`,
                },
                //@ts-ignore
                ...(uploadImageUrls
                  ? [
                      {
                        type: "image_url",
                        image_url: {
                          url: uploadImageUrls?.refImageUrl || "",
                        },
                      },
                    ]
                  : []),
              ],
            },
          ],
        });
        console.log(completion.choices[0].message.content);
        return completion.choices[0].message.content;
      }
    );

    //Generate AI Image using Pollinations.ai (100% FREE, No API Key!)
    const generateThumbnailImage = await step.run(
      "generateAiImage",
      async () => {
        const encodedPrompt = encodeURIComponent(
          generateThumbnailPrompt || "YouTube thumbnail"
        );
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&enhance=true`;
        console.log("Generated Image URL:", imageUrl);
        return imageUrl;
      }
    );

    //Save Image to Cloud
    const uploadThumbnail = await step.run("Upload Thumbnail", async () => {
      try {
        const imageKit = new ImageKit({
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
          privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
          urlEndpoint: process.env.IMAGEKIT_URLENDPOINT || "",
        });

        // Wait for Pollinations to generate the image
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Fetch the image from Pollinations URL with retry logic
        let response;
        let retries = 3;
        while (retries > 0) {
          try {
            response = await fetch(generateThumbnailImage, {
              headers: {
                "User-Agent": "Mozilla/5.0",
              },
            });
            if (response.ok) break;
            retries--;
            if (retries > 0) await new Promise((r) => setTimeout(r, 2000));
          } catch (err) {
            retries--;
            if (retries === 0) throw err;
            await new Promise((r) => setTimeout(r, 2000));
          }
        }

        if (!response || !response.ok) {
          throw new Error("Failed to fetch image from Pollinations");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        const imageRef = await imageKit.upload({
          file: base64Image,
          fileName: `thumbnail_${Date.now()}.png`,
          folder: "/thumbnails",
        });

        console.log("Uploaded to ImageKit:", imageRef.url);
        return imageRef.url;
      } catch (error) {
        console.error("Upload error:", error);
        // Return the Pollinations URL as fallback
        console.log("Using Pollinations URL as fallback");
        return generateThumbnailImage;
      }
    });

    //Save record to dataBase (optional - won't block if fails)
    const SaveToDB = await step.run("SaveToDb", async () => {
      try {
        console.log("Attempting to save thumbnail to database...");
        const result = await db
          .insert(AiThumbnailTable)
          .values({
            userInput: userInput,
            thumbnailUrl: uploadThumbnail,
            createdOn: moment().format("YYYY-MM-DD"),
            refImage: uploadImageUrls?.refImageUrl || null,
            userEmail: userEmail,
          })
          .returning();
        console.log("✅ Thumbnail saved to DB successfully");
        return result;
      } catch (error) {
        console.error("❌ DB save failed (non-blocking):", error);
        // Return null instead of throwing - thumbnail still works
        return null;
      }
    });

    return uploadThumbnail;
  }
);

const AIContentGeneratorSystemPrompt=` You are an expert YouTube SEO strategist and AI creative assistant. Based on the user input below, generate a JSON response only (no explanation, no markdown, no commentary), containing:

1. **Three YouTube video titles** optimized for SEO.
2. **SEO Score** for each title (1 to 100).
3. **A compelling YouTube video description** based on the topic.
4. **10 relevant YouTube video tags.**
5. **Two YouTube thumbnail image prompts**, each including:
    - Professional illustration style based on the video title
    - A short 3-5 word heading that will appear on the thumbnail image
    - Visually compelling layout concept to grab attention

User Input: {{user_input}}

Return format (JSON only):

{
"titles": [
  {
    "title": "Title 1",
    "seo_score": 87
  },
  {
    "title": "Title 2",
    "seo_score": 82
  },
  {
    "title": "Title 3",
    "seo_score": 78
  }
],
"description": "Write a professional and engaging YouTube video description here based on the input.",
"tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
"image_prompts": [
  {
    "heading": "Heading Text 1",
    "prompt": "Professional illustration for thumbnail image based on Title 1. Include elements such as..."
  },
  {
    "heading": "Heading Text 2",
    "prompt": "Professional illustration for thumbnail image based on Title 2. Include elements such as..."
  }
]
}

Make sure the thumbnail image prompt reflects the **respective title context**, includes visual style (3D/flat/vector), character/action/objects (if needed), background design, and text position ideas.
`;

export const GenerateAIContent = inngest.createFunction(
  { id: "ai/generateContent" },
  { event: "ai/generateContent" },
  async ({ event, step }) => {
    const { userInput, userEmail } = await event.data;


    //TO Generate Title, Description, Tags and Thumbnail Prompt

    const generateAiContent = await step.run("GenerateAiContent", async () => {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: AIContentGeneratorSystemPrompt.replace(
              "{{user_input}}",
              userInput
            ),
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      const RawJson = completion.choices[0].message.content;
      const formattedJsonString = RawJson?.replace("```json", "")
        .trim()
        .replace("```", "")
        .trim();
      const formattedJson =
        formattedJsonString && JSON.parse(formattedJsonString);
      return formattedJson;
    });

    // Generate thumbnail image using Pollinations.ai (100% FREE, No API Key!)
    const generateThumbnailImage = await step.run(
      "generateAiImage",
      async () => {
        const encodedPrompt = encodeURIComponent(
          generateAiContent?.image_prompts[0].prompt || "YouTube thumbnail"
        );
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&enhance=true`;
        console.log("Generated Image URL:", imageUrl);
        return imageUrl;
      }
    );

    // Upload thumbnail to ImageKit
    const uploadThumbnail = await step.run("Upload Thumbnail", async () => {
      try {
        const imageKit = new ImageKit({
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
          privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
          urlEndpoint: process.env.IMAGEKIT_URLENDPOINT || "",
        });

        // Wait for Pollinations to generate the image
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Fetch the image from Pollinations URL with retry logic
        let response;
        let retries = 3;
        while (retries > 0) {
          try {
            response = await fetch(generateThumbnailImage, {
              headers: {
                "User-Agent": "Mozilla/5.0",
              },
            });
            if (response.ok) break;
            retries--;
            if (retries > 0) await new Promise((r) => setTimeout(r, 2000));
          } catch (err) {
            retries--;
            if (retries === 0) throw err;
            await new Promise((r) => setTimeout(r, 2000));
          }
        }

        if (!response || !response.ok) {
          throw new Error("Failed to fetch image from Pollinations");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        const imageRef = await imageKit.upload({
          file: base64Image,
          fileName: `ai_content_thumbnail_${Date.now()}.png`,
          folder: "/ai-content-thumbnails",
        });

        console.log("Uploaded to ImageKit:", imageRef.url);
        return imageRef.url;
      } catch (error) {
        console.error("Upload error:", error);
        // Return the Pollinations URL as fallback
        console.log("Using Pollinations URL as fallback");
        return generateThumbnailImage;
      }
    });

    // Save everything to database with retry logic
    const SaveContentDB = await step.run("SaveToDb", async () => {
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          console.log(`Attempting DB save (${4 - retries}/3)...`);
          const result = await db
            .insert(AiContentTable)
            .values({
              content: JSON.stringify(generateAiContent),
              createdOn: moment().format("YYYY-MM-DD"),
              thumbnailUrl: uploadThumbnail,
              userEmail: userEmail,
              userInput: userInput,
            })
            .returning();
          console.log("✅ Saved to DB successfully:", result);
          return result;
        } catch (error) {
          lastError = error;
          console.error(`DB save attempt failed (${4 - retries}/3):`, error);
          retries--;
          if (retries > 0) {
            console.log("Retrying in 2 seconds...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      console.error("❌ DB save failed after 3 attempts:", lastError);
      // Return null instead of throwing to allow function to complete
      return null;
    });

    // Return both AI content and thumbnail URL immediately
    return {
      ...generateAiContent,
      thumbnailUrl: uploadThumbnail,
    };
  }
);


export const GetTrendingKeywords = inngest.createFunction(
  { id: "ai/getTrendingKeywords" },
  { event: "ai/getTrendingKeywords" },
  async ({ event, step }) => {
    const { keyword, userEmail } = await event.data;

    // Step 1: Get Google Search Results using Bright Data
    const googleResults = await step.run("GetGoogleResults", async () => {
      try {
        console.log("Fetching Google search results for:", keyword);
        
        // Bright Data Web Scraper API - Scrape Google Videos tab
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=vid`;
        
        const response = await axios.post(
          "https://api.brightdata.com/request",
          {
            zone: "tubepulse_dev",
            url: googleSearchUrl,
            format: "json",
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Google results fetched:", response.data);
        return response.data || { videos: [] };
      } catch (error) {
        console.error("Error fetching Google results:", error);
        return { error: "Failed to fetch Google results", videos: [] };
      }
    });

    // Step 2: Get YouTube Search Results using YouTube API
    const youtubeResults = await step.run("GetYouTubeResults", async () => {
      try {
        console.log("Fetching YouTube search results for:", keyword);
        
        const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=10&key=${process.env.YOUTUBE_API_KEY}`;
        
        const response = await fetch(youtubeApiUrl);
        
        if (!response.ok) {
          console.error("YouTube API error:", response.statusText);
          return { error: "Failed to fetch YouTube results", items: [] };
        }

        const data = await response.json();
        console.log("YouTube results fetched:", data.items?.length || 0, "videos");
        
        // Extract relevant info
        const videos = data.items?.map((item: any) => ({
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          videoId: item.id.videoId,
        })) || [];

        return { items: videos };
      } catch (error) {
        console.error("Error fetching YouTube results:", error);
        return { error: "Failed to fetch YouTube results", items: [] };
      }
    });

    // Step 2.5: Extract Titles from Both Sources
    const extractedTitles = await step.run("ExtractTitles", async () => {
      // Extract Google video titles
      let googleTitles: string[] = [];
      if (googleResults?.body) {
        try {
          const nestedJson = JSON.parse(googleResults.body);
          googleTitles = nestedJson?.organic?.map((element: any) => element?.title).filter(Boolean) || [];
        } catch (e) {
          console.log("Could not parse Google nested JSON");
        }
      }
      
      // Extract YouTube video titles
      const youtubeTitles = youtubeResults.items?.map((item: any) => item?.snippet?.title).filter(Boolean) || [];
      
      console.log("Google Titles:", googleTitles.length);
      console.log("YouTube Titles:", youtubeTitles.length);
      
      return {
        googleTitles,
        youtubeTitles,
        allTitles: [...googleTitles, ...youtubeTitles]
      };
    });

    // Step 3: AI Model to Generate Keywords with SEO Scores
    const aiKeywords = await step.run("GenerateAIKeywords", async () => {
      try {
        console.log("Generating AI keywords with SEO scores...");
        
        const allTitlesText = extractedTitles.allTitles.join("\n");
        
        const prompt = `You are a YouTube SEO expert analyzing trending content. Based on the video titles below, extract trending keywords and topics.

**Search Keyword:** "${keyword}"

**Video Titles from Google Videos Tab (Top ranking across the web):**
${extractedTitles.googleTitles.slice(0, 20).join("\n")}

**Video Titles from YouTube Search (Platform-specific trends):**
${extractedTitles.youtubeTitles.slice(0, 20).join("\n")}

**Analysis Required:**
Analyze the video titles, patterns, and trends to generate:

1. **trending_keywords**: Array of 20 objects with keyword and SEO score (1-100). Extract keywords from actual video titles and add related high-value terms. SEO score should reflect search volume potential and competition. Format: [{"keyword": "keyword text", "seo_score": 85}, ...]

2. **trending_topics**: Array of 8 specific sub-topics or angles that are trending within this keyword based on the video titles

Return ONLY valid JSON, no markdown, no explanation:

{
  "trending_keywords": [
    {"keyword": "keyword1", "seo_score": 92},
    {"keyword": "keyword2", "seo_score": 88}
  ],
  "trending_topics": ["topic1", "topic2", "topic3", ...]
}`;

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2500,
        });

        const rawJson = completion.choices[0].message.content;
        const cleanedJson = rawJson?.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedData = cleanedJson ? JSON.parse(cleanedJson) : {};
        
        console.log("AI keywords generated:", parsedData);
        return parsedData;
      } catch (error) {
        console.error("Error generating AI keywords:", error);
        return {
          trending_keywords: [],
          trending_topics: [],
        };
      }
    });

    // Step 4: Save Data to Database
    const saveToDb = await step.run("SaveToDatabase", async () => {
      try {
        console.log("Saving trending keywords to database...");
        
        const result = await db
          .insert(TrendingKeywordsTable)
          .values({
            keyword: keyword,
            googleResults: JSON.stringify(googleResults),
            youtubeResults: JSON.stringify(youtubeResults),
            aiKeywords: JSON.stringify(aiKeywords),
            userEmail: userEmail,
            createdOn: moment().format("YYYY-MM-DD"),
          })
          .returning();
        
        console.log("✅ Trending keywords saved to DB");
        return result;
      } catch (error) {
        console.error("❌ DB save failed (non-blocking):", error);
        return null;
      }
    });

    // Return combined results
    return {
      keyword,
      googleResults,
      youtubeResults,
      aiKeywords,
      savedToDb: saveToDb !== null,
    };
  }
);
