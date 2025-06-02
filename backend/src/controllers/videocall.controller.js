// Video call controller functions
import { v4 as uuidv4 } from 'uuid';
import { getReceiverSocketId, io } from '../lib/socket.js';
import User from '../models/user.model.js';
import Call from '../models/call.model.js';

// Store active calls in memory
// In a production app, you might want to store this in Redis or another database
const activeCalls = new Map();

export const initiateCall = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const callerId = req.user._id;

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: "Receiver not found" });
        }
        
        // Check if caller or receiver is already in a call
        const isCallerInCall = Array.from(activeCalls.values()).some(call => 
            (call.callerId === callerId.toString() || call.receiverId === callerId.toString()) && 
            (call.status === "active" || call.status === "pending")
        );
        
        if (isCallerInCall) {
            return res.status(400).json({ error: "You are already in an active call" });
        }
          // Check if receiver is already in a call
        const isReceiverInCall = Array.from(activeCalls.values()).some(call => 
            (call.callerId === receiverId || call.receiverId === receiverId) && 
            (call.status === "active" || call.status === "pending")
        );
        
        if (isReceiverInCall) {
            // Notify caller that receiver is already in a call
            const receiverSocketId = getReceiverSocketId(receiverId);
            
            // Create a minimal missed call record for history
            await Call.create({
                callId: uuidv4(), // Different ID as we're not storing in activeCalls
                callerId,
                receiverId,
                status: 'missed',
                startTime: new Date(),
                endTime: new Date()
            });
            
            return res.status(400).json({ error: "User is already in another call" });
        }

        // Generate a unique call ID
        const callId = uuidv4();
        
        // Create call metadata
        const call = {
            id: callId,
            callerId: callerId.toString(),
            callerName: req.user.fullName,
            callerProfilePic: req.user.profilePic,
            receiverId: receiverId,
            receiverName: receiver.fullName,
            receiverProfilePic: receiver.profilePic,
            status: "pending",
            startTime: new Date(),
            endTime: null
        };
        
        // Store call in memory
        activeCalls.set(callId, call);
        
        // Create call history entry
        await Call.create({
            callId,
            callerId,
            receiverId,
            status: 'missed', // Default status, will be updated if receiver responds
            startTime: new Date()
        });
        
        // Get receiver's socket ID
        const receiverSocketId = getReceiverSocketId(receiverId);
        
        // If receiver is online, send them a call notification
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("incomingCall", {
                callId,
                callerId: callerId.toString(),
                callerName: req.user.fullName,
                callerProfilePic: req.user.profilePic
            });
        }
        
        return res.status(200).json({ 
            callId, 
            message: "Call initiated successfully",
            receiverOnline: !!receiverSocketId
        });
    } catch (error) {
        console.error("Error initiating call:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getCallStatus = async (req, res) => {
    try {
        const { callId } = req.params;
        
        // Get call from memory
        const call = activeCalls.get(callId);
        
        if (!call) {
            return res.status(404).json({ error: "Call not found" });
        }
        
        // Check if user is allowed to access this call
        const userId = req.user._id.toString();
        if (call.callerId !== userId && call.receiverId !== userId) {
            return res.status(403).json({ error: "Not authorized to access this call" });
        }
        
        return res.status(200).json({ call });
    } catch (error) {
        console.error("Error getting call status:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Helper functions for socket events
export const handleCallAccepted = async (callId, userId) => {
    const call = activeCalls.get(callId);
    if (!call) return null;
    
    call.status = "active";
    activeCalls.set(callId, call);
    
    try {
        // Update call history
        await Call.findOneAndUpdate(
            { callId },
            { status: 'accepted' }
        );
    } catch (error) {
        console.error("Error updating call history:", error);
    }
    
    return call;
};

export const handleCallRejected = async (callId, userId) => {
    const call = activeCalls.get(callId);
    if (!call) return null;
    
    call.status = "rejected";
    call.endTime = new Date();
    activeCalls.set(callId, call);
    
    try {
        // Update call history
        await Call.findOneAndUpdate(
            { callId },
            { 
                status: 'rejected',
                endTime: new Date()
            }
        );
    } catch (error) {
        console.error("Error updating call history:", error);
    }
    
    // Clean up call from memory immediately to prevent blocking new calls
    activeCalls.delete(callId);
    
    return call;
};

export const handleCallEnded = async (callId, userId) => {
    const call = activeCalls.get(callId);
    if (!call) return null;
    
    call.status = "ended";
    call.endTime = new Date();
    activeCalls.set(callId, call);
    
    try {
        // Calculate call duration in seconds
        const startTime = new Date(call.startTime);
        const endTime = new Date();
        const durationSeconds = Math.round((endTime - startTime) / 1000);
        
        // Update call history
        await Call.findOneAndUpdate(
            { callId },
            { 
                status: 'ended',
                endTime: endTime,
                duration: durationSeconds
            }
        );
    } catch (error) {
        console.error("Error updating call history:", error);
    }
      // Clean up call from memory immediately to prevent blocking new calls
    activeCalls.delete(callId);
    
    return call;
};

// Get call history for a user
export const getCallHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get calls where the user was either caller or receiver
        const calls = await Call.find({
            $or: [
                { callerId: userId },
                { receiverId: userId }
            ]
        })
        .sort({ createdAt: -1 })  // Sort by newest first
        .limit(30)  // Limit to 30 recent calls
        .populate('callerId', 'fullName profilePic')  // Get caller details
        .populate('receiverId', 'fullName profilePic');  // Get receiver details
        
        return res.status(200).json({ calls });
    } catch (error) {
        console.error("Error getting call history:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
