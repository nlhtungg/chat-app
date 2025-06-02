import { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';
import { socket } from '../lib/socket';
import { getRingtone, cleanup } from '../lib/ringtone';
import { useChatStore } from '../store/useChatStore';

const IncomingCallNotification = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const { inCall } = useChatStore();
  useEffect(() => {
    // Listen for incoming calls
    socket.on('incomingCall', (callData) => {
      // Check if user is already in a call using global state
      if (inCall) {
        // User is already in a call, automatically reject the incoming call
        socket.emit('callRejected', { callId: callData.callId });
        return;
      }
      
      setIncomingCall(callData);
      
      // Play ringtone
      try {
        const ringtone = getRingtone();
        ringtone.start();
      } catch (err) {
        console.error('Failed to play ringtone:', err);
      }
    });
    
    return () => {
      socket.off('incomingCall');
      // Clean up audio on unmount
      cleanup();
    };
  }, []);
    const handleAcceptCall = () => {
    if (!incomingCall) return;
    
    // Stop ringtone
    cleanup();
    
    // Mark user as in call
    useChatStore.setState({ inCall: true });
    
    // Open a new window for the video call
    const videoCallWindow = window.open(
      `/video-call/${incomingCall.callId}`,
      'VideoCall',
      'width=800,height=600'
    );
    
    // Close the notification
    setIncomingCall(null);
  };
    const handleRejectCall = () => {
    if (!incomingCall) return;
    
    // Stop ringtone
    cleanup();
    
    // Send reject signal
    socket.emit('callRejected', { callId: incomingCall.callId });
    
    // Close the notification
    setIncomingCall(null);
  };
  
  if (!incomingCall) return null;
  
  return (
    <div className="fixed bottom-5 right-5 w-72 bg-base-100 shadow-xl rounded-lg z-50 border border-base-300 animate-slideIn">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="size-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 pulse">
              <img 
                src={incomingCall.callerProfilePic || "/avatar.png"} 
                alt={incomingCall.callerName} 
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium">{incomingCall.callerName}</h3>
            <p className="text-sm text-accent">Incoming video call</p>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mt-2">
          <button 
            className="btn btn-sm btn-success btn-circle"
            onClick={handleAcceptCall}
            title="Accept call"
          >
            <Phone className="size-4" />
          </button>
          <button 
            className="btn btn-sm btn-error btn-circle"
            onClick={handleRejectCall}
            title="Reject call"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;
