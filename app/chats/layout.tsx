"use client";
import React, { useState, useEffect } from "react";
import SideBar from "@/components/chats/sideBar";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabasetype";

interface ChatsLayoutProps {
  children: React.ReactNode;
}

export default function ChatsLayout({ children }: ChatsLayoutProps) {
  const supabase = createClientComponentClient<Database>();
  const [userID, setUserID] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<
    Database["public"]["Tables"]["channels"]["Row"] | null
  >(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserID(user.id);
      }
    }
    getUser();
  }, [supabase]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar (left column) */}
      <div className="w-1/4 border-r">
        <SideBar
          setSelectedChannel={setSelectedChannel}
          userID={userID}
          selectedChannel={selectedChannel}
        />
      </div>

      {/* Main Content (right column) */}
      <div className="w-3/4">
        {children ? (
          children
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl">
              Please join a channel and contact with your friend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
