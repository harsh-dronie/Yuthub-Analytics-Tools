import React from "react";
import Link from "next/link";
import Image from "next/image";

const Features = [
  {
    id: 1,
    title: "AI Thumbnail Generator",
    image: "/feature1.png",
    path: "/ai-thumbnail-generator",
  },
  {
    id: 2,
    title: "AI Thumbnail Generator",
    image: "/feature2.png",
    path: "/thumbnail-search",
  },
  {
    id: 3,
    title: "Content Generator",
    image: "/feature4.png",
    path: "/ai-content-generator",
  },
  {
    id: 4,
    title: "Outlier",
    image: "/feature3.png",
    path: "/outlier",
  },
  {
    id: 5,
    title: "Trending Keywords ",
    image: "/feature5.png",
    path: "#",
  },
  {
    id: 6,
    title: "Optimize Video",
    image: "/feature6.png",
    path: "#",
  },
];
function FeatureList() {
  return (
    <div className="mt-7">
      <h2 className="font-bold text-2xl">AI Tools</h2>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Features.map((feature) => (
          <Link href={feature.path} key={feature.id} className="block group">
            <div className="border overflow-hidden rounded-xl bg-white/80 backdrop-blur hover:shadow-lg transition">
              <Image
                src={feature.image}
                alt={feature.title}
                width={400}
                height={200}
                className="w-full h-[150px] object-cover group-hover:scale-105 transition"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default FeatureList;
