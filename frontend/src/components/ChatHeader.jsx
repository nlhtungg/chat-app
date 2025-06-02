import { Video, X, PhoneOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";
import { useState, useEffect } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);  const handleVideoCall = async () => {
    try {
      // Call the API to initiate a call
      const response = await axiosInstance.post('/videocall/initiate', {
        receiverId: selectedUser._id
      });
      
      const data = response.data;
        if (response.status !== 200) {
        throw new Error(data.error || 'Failed to initiate call');
      }
      
      // If successful, open a new window for the video call
      const videoCallWindow = window.open(
        `/video-call/${data.callId}`,
        'VideoCall',
        'width=800,height=600'
      );
      
      // Set local UI state to show call is in progress
      setIsCallActive(true);
      setCallDuration(0);
      
      // When video call window is closed
      const checkWindow = setInterval(() => {
        if (videoCallWindow && videoCallWindow.closed) {
          clearInterval(checkWindow);
          endCall();
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error initiating video call:", error);
      alert("Failed to start video call. Please try again.");
    }
  };
  
  const endCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
    console.log("Ending call with:", selectedUser.fullName);
  };
  // Format call duration as mm:ss
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      {isCallActive ? (
        // Call active UI
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="avatar">
              <div className="size-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 pulse">
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              </div>
            </div>
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-success">Call in progress - {formatCallDuration(callDuration)}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <button 
              className="btn btn-error btn-circle"
              onClick={endCall}
              title="End call"
            >
              <PhoneOff className="size-5" />
            </button>
          </div>
        </div>
      ) : (
        // Normal header UI
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              </div>
            </div>

            {/* User info */}
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>          {/* Action buttons */}          <div className="flex items-center gap-2">
            {/* Video Call button */}
            <button 
              className={`btn btn-sm btn-circle ${onlineUsers.includes(selectedUser._id) ? 'btn-primary' : 'btn-disabled'} transition-all hover:scale-105 active:scale-95`}
              onClick={handleVideoCall}
              disabled={!onlineUsers.includes(selectedUser._id)}
              title={onlineUsers.includes(selectedUser._id) ? "Start video call" : "User is offline"}
            >
              <Video className="size-4" />
            </button>
            
            {/* Close button */}
            <button 
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => setSelectedUser(null)}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatHeader;