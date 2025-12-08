import React from "react";

export function Logo({ className = "w-32" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center gap-2`}>
      {/* YouTube Play Button Icon */}
      <svg
        viewBox="0 0 48 48"
        className="w-10 h-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="12" fill="url(#gradient)" />
        <path
          d="M19 16L32 24L19 32V16Z"
          fill="white"
        />
        <defs>
          <linearGradient
            id="gradient"
            x1="0"
            y1="0"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#EF4444" />
            <stop offset="1" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Text Logo */}
      <div className="flex flex-col leading-tight">
        <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          YouTube AI
        </span>
        <span className="text-xs text-gray-500 font-medium">Tools</span>
      </div>
    </div>
  );
}
