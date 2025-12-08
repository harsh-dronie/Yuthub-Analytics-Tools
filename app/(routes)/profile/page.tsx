"use client";

import { UserProfile } from "@clerk/nextjs";
import React from "react";

function Profile() {
  return (
    <div className="min-h-screen pb-10">
      <div className="px-10 md:px-20 lg:px-40">
        <div className="flex items-center justify-center mt-20 flex-col gap-2">
          <h2 className="font-bold text-4xl text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Profile Settings
          </h2>
          <p className="text-gray-400 text-center max-w-2xl">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <UserProfile />
        </div>
      </div>
    </div>
  );
}

export default Profile;
