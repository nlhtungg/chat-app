import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, X, RefreshCw } from 'lucide-react';
import { socket } from '../lib/socket';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { checkMediaPermissions, stopMediaTracks, checkDeviceCapabilities } from '../lib/mediaUtils';

const VideoCall = () => {
  const { callId } = useParams();
  const { authUser } = useAuthStore();
  const [callDetails, setCallDetails] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, active, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const screenShareTrackRef = useRef(null);
  const callTimerRef = useRef(null);
  
  // Initialize WebRTC
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Check device capabilities first
        const capabilities = await checkDeviceCapabilities();
        
        if (!capabilities.supported) {
          throw new Error('Your browser does not support video calls');
        }
        
        if (!capabilities.hasCamera && !capabilities.hasMicrophone) {
          throw new Error('No camera or microphone detected on your device');
        }
        
        // Get call status from API
        const response = await axiosInstance.get(`/videocall/status/${callId}`);
        setCallDetails(response.data.call);
        
        // Request media permissions
        const mediaResult = await checkMediaPermissions({
          video: capabilities.hasCamera,
          audio: capabilities.hasMicrophone
        });
        
        if (!mediaResult.success) {
          throw new Error(mediaResult.message);
        }
        
        const stream = mediaResult.stream;
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Setup WebRTC peer connection
        const configuration = { 
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ] 
        };
        
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;
        
        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            const receiverId = response.data.call.callerId === authUser._id 
              ? response.data.call.receiverId 
              : response.data.call.callerId;
              
            socket.emit('iceCandidate', {
              callId,
              candidate: event.candidate,
              to: receiverId
            });
          }
        };
        
        // Log ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', peerConnection.iceConnectionState);
          
          if (peerConnection.iceConnectionState === 'failed') {
            // Try to restart ICE if it fails
            if (retryCount < 2) {
              console.log('Attempting to restart ICE connection');
              peerConnection.restartIce();
              setRetryCount(prev => prev + 1);
            }
          }
        };
        
        // Handle receiving remote streams
        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setRemoteStream(event.streams[0]);
            setCallStatus('active');
            
            // Start call timer when connection is established
            callTimerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000);
          }
        };
        
        // If we are the caller, create and send offer
        if (response.data.call.callerId === authUser._id) {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          socket.emit('offerSignal', {
            callId,
            signal: offer,
            to: response.data.call.receiverId
          });
        }
        
        socket.emit('callAccepted', { callId });
      } catch (error) {
        console.error('Error initializing call:', error);
        setError(`${error.message || 'Failed to initialize call'}. Please ensure camera and microphone permissions are granted.`);
      }
    };
    
    initializeCall();
    
    return () => {
      // Clean up
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      
      if (localStream) {
        stopMediaTracks(localStream);
      }
      
      if (screenShareStream) {
        stopMediaTracks(screenShareStream);
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [callId, retryCount]);
  
  // Set up socket event listeners
  useEffect(() => {
    // Handle incoming offer
    socket.on('offerSignal', async ({ callId: incomingCallId, signal, from }) => {
      if (callId === incomingCallId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        socket.emit('answerSignal', {
          callId,
          signal: answer,
          to: from
        });
      }
    });
    
    // Handle incoming answer
    socket.on('answerSignal', async ({ callId: incomingCallId, signal }) => {
      if (callId === incomingCallId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      }
    });
    
    // Handle ICE candidates
    socket.on('iceCandidate', async ({ callId: incomingCallId, candidate }) => {
      if (callId === incomingCallId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });
    
    // Handle call ended
    socket.on('callEnded', ({ callId: endedCallId }) => {
      if (callId === endedCallId) {
        setCallStatus('ended');
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current);
        }
      }
    });
    
    return () => {
      socket.off('offerSignal');
      socket.off('answerSignal');
      socket.off('iceCandidate');
      socket.off('callEnded');
    };
  }, [callId]);
  
  const handleEndCall = () => {
    socket.emit('endCall', { callId });
    setCallStatus('ended');
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Close the window after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  };
  
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };
  
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };
  
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenShareTrackRef.current) {
          screenShareTrackRef.current.stop();
          screenShareTrackRef.current = null;
        }
        
        if (screenShareStream) {
          screenShareStream.getTracks().forEach(track => track.stop());
          setScreenShareStream(null);
        }
        
        // Replace screen sharing track with video track
        if (localStream && peerConnectionRef.current) {
          const videoTrack = localStream.getVideoTracks()[0];
          
          if (videoTrack) {
            const senders = peerConnectionRef.current.getSenders();
            const sender = senders.find(s => s.track && s.track.kind === 'video');
            
            if (sender) {
              await sender.replaceTrack(videoTrack);
            }
          }
        }
        
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        setScreenShareStream(stream);
        
        // Get the video track from screen share
        const screenTrack = stream.getVideoTracks()[0];
        screenShareTrackRef.current = screenTrack;
        
        // Listen for the user stopping screen sharing via the browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        // Replace video track with screen sharing track
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const sender = senders.find(s => s.track && s.track.kind === 'video');
          
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }
        
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      if (error.name === 'NotAllowedError') {
        // User denied permission
        setError('Screen sharing permission denied');
        setTimeout(() => setError(null), 3000);
      } else {
        setError('Failed to share screen. Please try again.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };
  
  const handleRetry = () => {
    // Reset error state
    setError(null);
    
    // Clean up existing resources
    if (localStream) {
      stopMediaTracks(localStream);
      setLocalStream(null);
    }
    
    if (screenShareStream) {
      stopMediaTracks(screenShareStream);
      setScreenShareStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Increment retry count to trigger useEffect
    setRetryCount(prevCount => prevCount + 1);
  };
  
  // Format call duration
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 p-4">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
        <div className="flex gap-3 mt-6">
          <button 
            className="btn btn-primary"
            onClick={handleRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => window.close()}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  if (callStatus === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 p-4">
        <div className="alert alert-info">
          <span>Call has ended</span>
        </div>
        <p className="mt-2">Call duration: {formatCallDuration(callDuration)}</p>
        <button 
          className="btn btn-primary mt-4"
          onClick={() => window.close()}
        >
          Close
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-base-100">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex justify-between items-center">
        <div className="flex items-center">          
          <h2 className="text-lg font-semibold">
            {callDetails ? (
              <>
                Call with {callDetails.callerId === authUser._id 
                  ? callDetails.receiverName 
                  : callDetails.callerName}
              </>
            ) : (
              'Video Call'
            )}
          </h2>
          {callStatus === 'active' && (
            <span className="ml-4 text-sm text-success">
              {formatCallDuration(callDuration)}
            </span>
          )}
        </div>
        {error && (
          <div className="toast toast-top toast-center">
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Video Container */}
      <div className="flex-1 flex flex-col md:flex-row p-2 relative overflow-hidden bg-base-300">
        {/* Remote Video (Full Screen) */}
        <div className="flex-1 relative">
          {callStatus === 'connecting' && !remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-2">Connecting...</p>
              </div>
            </div>
          )}
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover rounded-lg"
            autoPlay
            playsInline
          />
        </div>
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 w-1/4 max-w-64 rounded-lg overflow-hidden shadow-lg border-2 border-primary">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {isScreenSharing && (
            <div className="absolute top-1 left-1 bg-primary text-white px-2 py-0.5 rounded-md text-xs">
              Screen sharing
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-4 bg-base-200 flex justify-center gap-4">
        <button 
          className={`btn btn-circle ${isAudioEnabled ? 'btn-primary' : 'btn-outline'}`}
          onClick={toggleAudio}
          title={isAudioEnabled ? "Mute" : "Unmute"}
        >
          {isAudioEnabled ? <Mic /> : <MicOff />}
        </button>
        
        <button 
          className={`btn btn-circle ${isVideoEnabled ? 'btn-primary' : 'btn-outline'}`}
          onClick={toggleVideo}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoEnabled ? <VideoIcon /> : <VideoOff />}
        </button>
        
        <button 
          className={`btn btn-circle ${isScreenSharing ? 'btn-accent' : 'btn-outline'}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop screen sharing" : "Share screen"}
        >
          {isScreenSharing ? <X /> : <Monitor />}
        </button>
        
        <button 
          className="btn btn-circle btn-error"
          onClick={handleEndCall}
          title="End call"
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
