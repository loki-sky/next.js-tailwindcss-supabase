"use client";
import { useState, useEffect, useRef, FormEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabasetype";
import ChatUI from "@/components/chats/chatUI";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const supabase = createClientComponentClient<Database>();
  const params = useParams();

  const [userID, setUserID] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<
    Database["public"]["Tables"]["channels"]["Row"] | null
  >(null);
  const [messages, setMessages] = useState<
    Database["public"]["Tables"]["messages"]["Row"][]
  >([]);
  const [inputText, setInputText] = useState<string>("");
  const scrollElement = useRef<HTMLDivElement>(null);

  // Fetch the current user ID
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

  // Fetch channel details based on the dynamic route parameter
  useEffect(() => {
    if (
      params?.channelId &&
      (!selectedChannel || selectedChannel.id !== params.channelId)
    ) {
      const fetchChannel = async () => {
        const { data, error } = await supabase
          .from("channels")
          .select("*")
          .eq(
            "id",
            typeof params.channelId === "string" ? params.channelId : ""
          )
          .single();
        if (error) {
          console.error("Error fetching channel:", error.message);
        } else if (data) {
          setSelectedChannel(data);
        }
      };
      fetchChannel();
    }
  }, [params?.channelId, selectedChannel, supabase]);

  // Fetch messages for the selected channel
  const fetchMessages = async (channelId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at");
    if (error) {
      console.error("Error fetching messages:", error.message);
    } else if (data) {
      setMessages(data);
    }
  };

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  // Subscribe to realtime message changes for the selected channel
  useEffect(() => {
    if (!selectedChannel) return;

    const messageSubscription = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${selectedChannel.id}`,
        },
        (payload) => {
          setMessages((prev) => [
            ...prev,
            payload.new as Database["public"]["Tables"]["messages"]["Row"],
          ]);
          if (scrollElement.current) {
            scrollElement.current.scrollTop =
              scrollElement.current.scrollHeight;
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${selectedChannel.id}`,
        },
        (payload) => {
          const updatedMessage =
            payload.new as Database["public"]["Tables"]["messages"]["Row"];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const deletedMessage =
            payload.old as Database["public"]["Tables"]["messages"]["Row"];
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== deletedMessage.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [selectedChannel, supabase]);

  // Function to send a message
  const sendMessage = async (
    channelId: string,
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

  // Handle new message submission
  const onSubmitNewMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputText || !selectedChannel) return;
    const newMsg = await sendMessage(selectedChannel.id, userID, inputText);
    if (newMsg) {
      setInputText("");
      if (scrollElement.current) {
        scrollElement.current.scrollTop = scrollElement.current.scrollHeight;
      }
    }
  };

  // Update an existing message
  const updateMessage = async (
    id: number,
    newMessage: string
  ): Promise<void> => {
    const { error } = await supabase
      .from("messages")
      .update({ message: newMessage })
      .eq("id", id);
    if (error) {
      console.error("Error updating message:", error);
      return;
    }
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, message: newMessage } : msg))
    );
  };

  // Delete a message
  const deleteMessage = async (id: number): Promise<void> => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      console.error("Error deleting message:", error);
      return;
    }
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  return (
    <div className="min-h-screen shadow-lg rounded-lg flex flex-col">
      <div className="w-full flex flex-col pt-10 overflow-y-auto h-[100vh]">
        <div
          ref={scrollElement}
          id="scrollElement"
          className="flex-1 overflow-y-scroll p-4 px-14"
        >
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatUI
                message={msg}
                currentUser={userID}
                updateMessage={updateMessage}
                deleteMessage={deleteMessage}
              />
            </div>
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
  );
}
