"use client";
import { useState, useEffect, useRef, FormEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabasetype";
import SideBar from "@/components/chats/sideBar";
import ChatUI from "@/components/chats/chatUI";

export default function Chats() {
  const supabase = createClientComponentClient<Database>();
  const [userID, setUserID] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<
    Database["public"]["Tables"]["channels"]["Row"] | null
  >(null);
  const [messages, setMessages] = useState<
    Database["public"]["Tables"]["messages"]["Row"][]
  >([]);
  const [inputText, setInputText] = useState<string>("");
  const scrollElement = useRef<HTMLDivElement>(null);

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

  const fetchMessages = async (
    channelId: Database["public"]["Tables"]["channels"]["Row"]["id"]
  ) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at");
    if (error) {
      console.error("Error fetching messages:", error);
    } else if (data) {
      setMessages(data);
    }
  };

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  const sendMessage = async (
    channelId: Database["public"]["Tables"]["channels"]["Row"]["id"],
    senderId: string,
    message: string
  ): Promise<Database["public"]["Tables"]["messages"]["Row"] | null> => {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        sender_id: senderId,
        message,
      })
      .select();
    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  };

  const deleteMessage = async (id: number): Promise<void> => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      console.error("Error deleting message:", error);
      return;
    }

    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const onSubmitNewMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputText || !selectedChannel) return;
    const newMsg = await sendMessage(selectedChannel.id, userID, inputText);
    if (newMsg) {
      setMessages((prev) => [...prev, newMsg]);
      setInputText("");

      if (scrollElement.current) {
        scrollElement.current.scrollTop = scrollElement.current.scrollHeight;
      }
    }
  };

  const updateMessage = async (
    id: number,
    newMessage: string
  ): Promise<void> => {
    const { data, error } = await supabase
      .from("messages")
      .update({ message: newMessage })
      .eq("id", id)
      .select();
    if (error) {
      console.error("Error updating message:", error);
      return;
    }

    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, message: newMessage } : msg))
    );
  };

  return (
    <div className="min-h-screen container mx-auto shadow-lg rounded-lg flex flex-col">
      <div className="flex flex-row flex-1 bg-white">
        <SideBar setSelectedChannel={setSelectedChannel} />
        <div className="w-full flex flex-col pt-10">
          <div
            ref={scrollElement}
            id="scrollElement"
            className="flex-1 overflow-y-scroll p-4 px-14"
          >
            {messages.map((msg) => (
              <ChatUI
                key={msg.id}
                message={msg}
                currentUser={userID}
                updateMessage={updateMessage}
                deleteMessage={deleteMessage}
              />
            ))}
          </div>

          <div className="py-8 bg-[#DCE8FF] px-24">
            <form className="w-full flex" onSubmit={onSubmitNewMessage}>
              <input
                className="w-full py-2 px-3 rounded-full border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="submit"
                disabled={!inputText}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm w-20 ml-2 px-5 py-2.5 text-center disabled:opacity-25"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
