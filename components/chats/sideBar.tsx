"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabasetype";
import { useRouter } from "next/navigation";

interface SideBarProps {
  setSelectedChannel: (
    channel: Database["public"]["Tables"]["channels"]["Row"]
  ) => void;
}

export default function SideBar({ setSelectedChannel }: SideBarProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [channels, setChannels] = useState<
    Database["public"]["Tables"]["channels"]["Row"][]
  >([]);
  const [filterValue, setFilterValue] = useState<string>("");

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching channels:", error.message);
    } else if (data) {
      setChannels(data);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const createChannel = async () => {
    const channelName = prompt("Enter channel name:");
    if (!channelName || channelName.trim() === "") {
      alert("Channel name cannot be empty.");
      return;
    }
    const { data, error } = await supabase
      .from("channels")
      .insert({ name: channelName })
      .select();
    if (error) {
      console.error("Error creating channel:", error.message);
      alert("Error creating channel: " + error.message);
    } else {
      fetchChannels();
    }
  };

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(filterValue.toLowerCase())
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col w-1/4 border-r-2 overflow-y-auto justify-between bg-[#F0F0F0] font-inter p-5">
      <div>
        <button
          onClick={createChannel}
          className="px-4 py-2 m-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Channel
        </button>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Here..."
            className="px-4 py-3 m-2 ml-0 pl-10 border-gray-300 border rounded-full w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
          <div className="absolute inset-y-0 start-1 flex items-center ps-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
        </div>
        <div className="border border-[#CDCDCD] mt-2 mb-2"></div>
        <div className="flex flex-col">
          {filteredChannels.length === 0 ? (
            <p className="p-2 text-gray-500">No channels available.</p>
          ) : (
            filteredChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className="px-4 py-4 border-b hover:bg-gray-100 cursor-pointer text-[#4399FF] text-[17px] font-semibold flex justify-between items-center"
              >
                <div>{channel.name}</div>
                <div>
                  <span className="inline-flex items-center justify-center w-4 h-4 ms-2 text-xs font-semibold text-white bg-[#4399FF] rounded-full">
                    2
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 m-2 bg-red-600 text-white hover:bg-red-700 rounded-3xl"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
