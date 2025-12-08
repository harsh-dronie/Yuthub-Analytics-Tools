import { inngest } from "./client";
import ImageKit from "imagekit";
import OpenAI from "openai";
import { AiThumbnailTable, AiContentTable } from "@/configs/schema";
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
