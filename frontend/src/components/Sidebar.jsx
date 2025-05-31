import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

// Helper function to format the last message time in a user-friendly way
const formatLastMessageTime = (timestamp) => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const timeDiff = now - messageDate;
  const dayInMs = 24 * 60 * 60 * 1000;
  
  // Less than 24 hours - show time
  if (timeDiff < dayInMs) {
    return formatMessageTime(timestamp);
  }
  // Less than a week - show day name
  else if (timeDiff < 7 * dayInMs) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
  }
  // More than a week - show date
  else {
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Sort users by the latest message timestamp
  const sortedUsers = [...users].sort((a, b) => {
    // If a user doesn't have lastMessageAt, put them at the bottom
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    
    // Sort by most recent message (descending order)
    return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
  });

  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter((user) => onlineUsers.includes(user._id))
    : sortedUsers;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* TODO: Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <span>{onlineUsers.includes(user._id) ? "Online" : "Offline"}</span>                {user.lastMessageAt && (
                  <span className="text-xs opacity-70">
                    • {formatLastMessageTime(user.lastMessageAt)}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;