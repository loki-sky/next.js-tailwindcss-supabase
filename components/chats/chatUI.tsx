import { useState } from "react";
import DateFormatter from "@/components/date";
import { Database } from "@/types/supabasetype";
import userAvatar from "@/public/user.png";

interface ChatUIProps {
  message: Database["public"]["Tables"]["messages"]["Row"] & {
    sender_email?: string;
  };
  currentUser: string;
  updateMessage: (id: number, newMessage: string) => void;
  deleteMessage: (id: number) => void;
}

export default function ChatUI({
  message,
  currentUser,
  updateMessage,
  deleteMessage,
}: ChatUIProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedMessage, setEditedMessage] = useState<string>(message.message);

  const displayName =
    message.sender_id === currentUser
      ? "You"
      : message.sender_email
      ? message.sender_email.split("@")[0]
      : "User";

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMessage(message.id, editedMessage);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMessage(message.message);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMessage(message.id);
  };

  return (
    <div
      className={`flex items-start gap-5 mb-4 ${
        message.sender_id === currentUser ? "flex-row-reverse" : ""
      }`}
    >
      <div className="flex flex-col items-center">
        <img
          className="w-8 h-8 rounded-full"
          src={userAvatar.src}
          alt="User profile"
        />
        <span className="text-sm font-semibold text-gray-400">
          {displayName}
        </span>
      </div>

      <div className="group flex items-center gap-2">
        {message.sender_id === currentUser && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center">
            <button
              onClick={handleDelete}
              className="p-1 text-red-600"
              title="Delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H8V5a2 2 0 012-2z"
                />
              </svg>
            </button>
            <button
              onClick={handleEdit}
              className="p-1 text-blue-600"
              title="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-2-4l-7 7m0 0H4m7 0v-7"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="flex flex-col gap-1 w-full max-w-[320px] hover:cursor-pointer">
          <div
            className={`flex flex-col leading-1.5 items-center p-3 border-gray-200 ${
              message.sender_id === currentUser
                ? "bg-[#4399FF] text-white rounded-s-2xl rounded-br-2xl"
                : "bg-[#DCE8FF] text-gray-900 rounded-e-2xl rounded-es-2xl"
            }  dark:border-gray-700`}
          >
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={handleSave} className="text-blue-600">
                    Save
                  </button>
                  <button onClick={handleCancel} className="text-red-600">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-normal">{message.message}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
            <span className="text-[11px] font-normal">
              <DateFormatter timestamp={message.created_at} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
