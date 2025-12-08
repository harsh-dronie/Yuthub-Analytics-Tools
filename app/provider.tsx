"use client";

import { useUser } from "@clerk/nextjs";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useUser();
  const createNewUser = async () => {
    try {
      const result = await axios.post("/api");
      // You can use result.data here if needed
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  useEffect(() => {
    user && createNewUser();
  }, [user]);

  return <div>{children}</div>;
}

export default Provider;
