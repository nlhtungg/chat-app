import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { connectDB } from '../lib/db.js';

dotenv.config();

// Run this script to add friends to users for testing
const addFriends = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Fetching all users...');
    const users = await User.find({});
    
    if (users.length < 2) {
      console.log('Not enough users to create friendships. At least 2 users are required.');
      process.exit(1);
    }
    
    console.log(`Found ${users.length} users. Creating friendships...`);
    
    // Make user[0] friends with half of the remaining users
    const mainUser = users[0];
    const halfLength = Math.floor((users.length - 1) / 2);
    
    // Add the first half of users as friends to main user
    const friendList = [];
    for (let i = 1; i <= halfLength; i++) {
      const friend = users[i];
      friendList.push(friend._id);
      
      // Also add main user to their friends list
      friend.friends = [...(friend.friends || []), mainUser._id];
      await friend.save();
      console.log(`Added ${mainUser.fullName} and ${friend.fullName} as friends`);
    }
    
    // Add friend requests from the second half of users to main user
    for (let i = halfLength + 1; i < users.length; i++) {
      const requestingUser = users[i];
      
      // Add friend request
      mainUser.friendRequests = [...(mainUser.friendRequests || []), requestingUser._id];
      console.log(`Added friend request from ${requestingUser.fullName} to ${mainUser.fullName}`);
    }
    
    // Save main user
    mainUser.friends = [...(mainUser.friends || []), ...friendList];
    await mainUser.save();
    
    console.log('Friendship setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding friends data:', error);
    process.exit(1);
  }
};

addFriends();
