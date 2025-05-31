import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');
        
        // Get the latest message for each user
        const usersWithLastMessage = await Promise.all(
            filteredUsers.map(async (user) => {
                // Find the latest message between the logged-in user and this user
                const latestMessage = await Message.findOne({
                    $or: [
                        { senderId: loggedInUserId, receiverId: user._id },
                        { senderId: user._id, receiverId: loggedInUserId }
                    ]
                }).sort({ createdAt: -1 }); // Sort by createdAt in descending order
                
                // Convert user to plain object and add lastMessageAt property
                const userObj = user.toObject();
                userObj.lastMessageAt = latestMessage ? latestMessage.createdAt : null;
                
                return userObj;
            })
        );
        
        res.status(200).json(usersWithLastMessage);
    } catch (error) {
        console.log("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id:userToChatId } = req.params; 
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        })
        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }
        
        // Also emit to the sender to update their UI
        const senderSocketId = getReceiverSocketId(senderId);
        if(senderSocketId && senderSocketId !== receiverSocketId) {
            io.to(senderSocketId).emit('newMessage', newMessage);
        }
        
        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}