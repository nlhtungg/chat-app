import { useState, useEffect } from 'react';
import { PhoneCall, PhoneMissed, PhoneOff, Clock } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';

const CallHistory = () => {
  const { authUser } = useAuthStore();
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        const response = await axiosInstance.get('/videocall/history');
        setCallHistory(response.data.calls);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching call history:", error);
        setError("Failed to load call history");
        setLoading(false);
      }
    };

    fetchCallHistory();
  }, []);

  const formatCallTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const formatCallDuration = (seconds) => {
    if (!seconds) return 'N/A';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (status) => {
    switch (status) {
      case 'accepted':
      case 'ended':
        return <PhoneCall className="text-success" />;
      case 'missed':
        return <PhoneMissed className="text-error" />;
      case 'rejected':
        return <PhoneOff className="text-warning" />;
      default:
        return <PhoneCall />;
    }
  };

  const getCallStatusText = (call, isOutgoing) => {
    switch (call.status) {
      case 'accepted':
      case 'ended':
        return (
          <div className="flex items-center">
            <span className={isOutgoing ? "text-accent" : "text-success"}>
              {isOutgoing ? 'Outgoing' : 'Incoming'} call
            </span>
            {call.duration > 0 && (
              <div className="flex items-center ml-2">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatCallDuration(call.duration)}</span>
              </div>
            )}
          </div>
        );
      case 'missed':
        return <span className="text-error">{isOutgoing ? 'No answer' : 'Missed call'}</span>;
      case 'rejected':
        return <span className="text-warning">{isOutgoing ? 'Call rejected' : 'Call declined'}</span>;
      default:
        return <span>Unknown status</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (callHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-base-content/70">
        <PhoneCall size={48} />
        <p className="mt-4">No call history yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Call History</h2>
      
      <div className="flex flex-col gap-2">
        {callHistory.map((call) => {
          const isOutgoing = call.callerId._id === authUser._id;
          const otherUser = isOutgoing ? call.receiverId : call.callerId;
          
          return (
            <div 
              key={call._id} 
              className="flex items-center p-3 rounded-lg hover:bg-base-200 transition-colors"
            >
              <div className="avatar mr-3">
                <div className="w-12 h-12 rounded-full">
                  <img 
                    src={otherUser.profilePic || "/avatar.png"} 
                    alt={otherUser.fullName} 
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{otherUser.fullName}</div>
                {getCallStatusText(call, isOutgoing)}
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-sm text-base-content/70">
                  {formatCallTime(call.startTime)}
                </div>
                <div className="mt-1">
                  {getCallIcon(call.status)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CallHistory;
