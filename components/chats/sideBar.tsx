"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabasetype";
import { useRouter } from "next/navigation";

interface SideBarProps {
  setSelectedChannel: (
    channel: Database["public"]["Tables"]["channels"]["Row"]
  ) => void;
  userID: string;
  selectedChannel: Database["public"]["Tables"]["channels"]["Row"] | null;
}

export default function SideBar({
  setSelectedChannel,
  userID,
  selectedChannel,
}: SideBarProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [channels, setChannels] = useState<
    Database["public"]["Tables"]["channels"]["Row"][]
  >([]);
  const [filterValue, setFilterValue] = useState<string>("");
  const [joinedChannels, setJoinedChannels] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{
    [channelId: string]: number;
  }>({});
  const [joinModalChannel, setJoinModalChannel] = useState<
    Database["public"]["Tables"]["channels"]["Row"] | null
  >(null);

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

  const fetchJoinedChannels = async () => {
    if (!userID) return;
    const { data, error } = await supabase
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", userID);

    if (error) {
      console.error("Error fetching joined channels:", error.message);
    } else if (data) {
      const joinedIds = data.map((item) => item.channel_id);
      setJoinedChannels(joinedIds);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    fetchJoinedChannels();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;
    const subscription = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          const channelId = newMessage.channel_id;
          if (
            joinedChannels.includes(channelId) &&
            (!selectedChannel || selectedChannel.id !== channelId)
          ) {
            setNotifications((prev) => ({
              ...prev,
              [channelId]: (prev[channelId] || 0) + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userID, joinedChannels, selectedChannel]);

  useEffect(() => {
    if (selectedChannel) {
      setNotifications((prev) => ({ ...prev, [selectedChannel.id]: 0 }));
    }
  }, [selectedChannel]);

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleJoin = (
    channel: Database["public"]["Tables"]["channels"]["Row"]
  ) => {
    setJoinModalChannel(channel);
  };

  const confirmJoin = async () => {
    if (!joinModalChannel) return;
    const { error } = await supabase.from("channel_members").insert({
      channel_id: joinModalChannel.id,
      user_id: userID,
    });
    if (error) {
      console.error("Error joining channel:", error.message);
      alert("Error joining channel: " + error.message);
    } else {
      setJoinedChannels((prev) => [...prev, joinModalChannel.id]);
      setJoinModalChannel(null);
    }
  };

  const cancelJoin = () => {
    setJoinModalChannel(null);
  };

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(filterValue.toLowerCase())
  );

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
                onClick={() => {
                  if (joinedChannels.includes(channel.id)) {
                    setSelectedChannel(channel);
                  }
                }}
                className={`px-4 py-4 border-b hover:bg-gray-100 cursor-pointer text-[17px] font-semibold flex justify-between items-center ${
                  joinedChannels.includes(channel.id)
                    ? "text-[#4399FF]"
                    : "text-gray-500"
                }`}
              >
                <div>{channel.name}</div>
                <div>
                  {joinedChannels.includes(channel.id) ? (
                    notifications[channel.id] > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white bg-[#4399FF] rounded-full">
                        {notifications[channel.id]}
                      </span>
                    )
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoin(channel);
                      }}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                    >
                      Join
                    </button>
                  )}
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

      {joinModalChannel && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow">
            <p className="mb-4">
              Do you want to join channel "{joinModalChannel.name}"?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={confirmJoin}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Yes
              </button>
              <button
                onClick={cancelJoin}
                className="px-4 py-2 bg-gray-300 text-black rounded"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
