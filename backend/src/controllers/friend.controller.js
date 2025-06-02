import User from '../models/user.model.js';

// Get all users who are not yet friends
export const getAvailableUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const currentUser = await User.findById(loggedInUserId);
        
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Combine friends and friend requests into one exclusion list
        const excludeUsers = [
            loggedInUserId,
            ...(currentUser.friends || []),
            ...(currentUser.friendRequests || [])
        ];
        
        // Get all users except those in the exclusion list
        const availableUsers = await User.find({
            _id: { $nin: excludeUsers }
        }).select('-password');
        
        res.status(200).json(availableUsers);
    } catch (error) {
        console.log("Error in getAvailableUsers:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all friends of the current user
export const getFriends = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const user = await User.findById(loggedInUserId)
            .populate('friends', '-password');
        
        res.status(200).json(user.friends);
    } catch (error) {
        console.log("Error in getFriends:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get pending friend requests for the current user
export const getFriendRequests = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const user = await User.findById(loggedInUserId)
            .populate('friendRequests', '-password');
        
        res.status(200).json(user.friendRequests);
    } catch (error) {
        console.log("Error in getFriendRequests:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Send a friend request to another user
export const sendFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedInUserId = req.user._id;
        
        // Don't allow sending request to yourself
        if (userId === loggedInUserId.toString()) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself" });
        }
        
        const userToAdd = await User.findById(userId);
        if (!userToAdd) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Check if already friends
        if (userToAdd.friends.includes(loggedInUserId)) {
            return res.status(400).json({ message: "You are already friends with this user" });
        }
        
        // Check if request already sent
        if (userToAdd.friendRequests.includes(loggedInUserId)) {
            return res.status(400).json({ message: "Friend request already sent" });
        }
        
        // Add to friend requests
        userToAdd.friendRequests.push(loggedInUserId);
        await userToAdd.save();
        
        res.status(200).json({ message: "Friend request sent successfully" });
    } catch (error) {
        console.log("Error in sendFriendRequest:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedInUserId = req.user._id;
        
        const currentUser = await User.findById(loggedInUserId);
        if (!currentUser.friendRequests.includes(userId)) {
            return res.status(400).json({ message: "No friend request found from this user" });
        }
        
        // Add each other to friends list
        await User.findByIdAndUpdate(loggedInUserId, {
            $pull: { friendRequests: userId },
            $addToSet: { friends: userId }
        });
        
        await User.findByIdAndUpdate(userId, {
            $addToSet: { friends: loggedInUserId }
        });
        
        res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
        console.log("Error in acceptFriendRequest:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedInUserId = req.user._id;
        
        await User.findByIdAndUpdate(loggedInUserId, {
            $pull: { friendRequests: userId }
        });
        
        res.status(200).json({ message: "Friend request rejected" });
    } catch (error) {
        console.log("Error in rejectFriendRequest:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Remove a friend
export const removeFriend = async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedInUserId = req.user._id;
        
        await User.findByIdAndUpdate(loggedInUserId, {
            $pull: { friends: userId }
        });
        
        await User.findByIdAndUpdate(userId, {
            $pull: { friends: loggedInUserId }
        });
        
        res.status(200).json({ message: "Friend removed successfully" });
    } catch (error) {
        console.log("Error in removeFriend:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
