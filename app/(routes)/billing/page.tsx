"use client";

import { PricingTable } from "@clerk/nextjs";
import React from "react";
import { useUser } from "@clerk/nextjs";

function Billing() {
  const { user } = useUser();
  
  // Check if user has premium plan from metadata
  //@ts-ignore
  const hasPremium = user?.publicMetadata?.plan === "premium_plan" || 
                     //@ts-ignore
                     user?.unsafeMetadata?.plan === "premium_plan";

  return (
    <div className="min-h-screen pb-10">
      <div className="px-10 md:px-20 lg:px-40">
        <div className="flex items-center justify-center mt-20 flex-col gap-2">
          <h2 className="font-bold text-4xl text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Billing & Subscription
          </h2>
          <p className="text-gray-400 text-center max-w-2xl">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan Status */}
        <div className="mt-6 p-4 border rounded-xl bg-secondary text-center">
          <p className="text-sm text-gray-500">Current Plan</p>
          <p className="text-2xl font-bold mt-1">
            {hasPremium ? (
              <span className="text-orange-500">Premium Plan</span>
            ) : (
              <span className="text-gray-700">Free Plan</span>
            )}
          </p>
          {hasPremium && (
            <p className="text-xs text-gray-500 mt-2">
              To cancel or manage your subscription, please contact support or visit Clerk Dashboard
            </p>
          )}
        </div>

        <div className="mt-10">
          <PricingTable />
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 border rounded-xl bg-secondary">
          <h3 className="font-bold mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600">
            To cancel your subscription or change plans:
          </p>
          <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://dashboard.clerk.com" target="_blank" className="text-orange-500 underline">Clerk Dashboard</a></li>
            <li>Navigate to Users → Find your account</li>
            <li>Remove the premium_plan metadata</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Billing; 
