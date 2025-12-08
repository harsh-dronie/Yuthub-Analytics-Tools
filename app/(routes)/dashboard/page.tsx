import React from "react";
import WelcomeBanner from "./_components/WelcomeBanner";
import FeatureList from "./_components/FeatureList";
function Dashboard() {
  return (
    <div>
      {/* Welcome Banner */}
      <WelcomeBanner />
      {/* Feature List */}
      <FeatureList />
    </div>
  );
}

export default Dashboard;
