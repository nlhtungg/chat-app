import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useFriendStore = create((set, get) => ({
  availableUsers: [],
  friends: [],
  friendRequests: [],
  isLoadingAvailable: false,
  isLoadingFriends: false,
  isLoadingRequests: false,
  isProcessingAction: false,

  // Get all available users who are not friends
  getAvailableUsers: async () => {
    set({ isLoadingAvailable: true });
    try {
      const res = await axiosInstance.get("/friends/available");
      set({ availableUsers: res.data });
    } catch (error) {
      console.error("Error fetching available users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch available users");
    } finally {
      set({ isLoadingAvailable: false });
    }
  },

  // Get current friends
  getFriends: async () => {
    set({ isLoadingFriends: true });
    try {
      const res = await axiosInstance.get("/friends/list");
      set({ friends: res.data });
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error(error.response?.data?.message || "Failed to fetch friends");
    } finally {
      set({ isLoadingFriends: false });
    }
  },

  // Get pending friend requests
  getFriendRequests: async () => {
    set({ isLoadingRequests: true });
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ friendRequests: res.data });
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      toast.error(error.response?.data?.message || "Failed to fetch friend requests");
    } finally {
      set({ isLoadingRequests: false });
    }
  },

  // Send a friend request
  sendFriendRequest: async (userId) => {
    set({ isProcessingAction: true });
    try {
      await axiosInstance.post(`/friends/request/${userId}`);
      toast.success("Friend request sent successfully!");
      
      // Update available users list by removing the user who was sent a request
      set(state => ({
        availableUsers: state.availableUsers.filter(user => user._id !== userId)
      }));
      
      return true;
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error(error.response?.data?.message || "Failed to send friend request");
      return false;
    } finally {
      set({ isProcessingAction: false });
    }
  },

  // Accept a friend request
  acceptFriendRequest: async (userId) => {
    set({ isProcessingAction: true });
    try {
      await axiosInstance.post(`/friends/accept/${userId}`);
      toast.success("Friend request accepted!");
      
      // Remove from friend requests
      set(state => ({
        friendRequests: state.friendRequests.filter(user => user._id !== userId)
      }));
      
      // Refresh friends list
      await get().getFriends();
      
      return true;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error(error.response?.data?.message || "Failed to accept friend request");
      return false;
    } finally {
      set({ isProcessingAction: false });
    }
  },

  // Reject a friend request
  rejectFriendRequest: async (userId) => {
    set({ isProcessingAction: true });
    try {
      await axiosInstance.post(`/friends/reject/${userId}`);
      toast.success("Friend request rejected");
      
      // Remove from friend requests
      set(state => ({
        friendRequests: state.friendRequests.filter(user => user._id !== userId)
      }));
      
      return true;
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error(error.response?.data?.message || "Failed to reject friend request");
      return false;
    } finally {
      set({ isProcessingAction: false });
    }
  },

  // Remove a friend
  removeFriend: async (userId) => {
    set({ isProcessingAction: true });
    try {
      await axiosInstance.post(`/friends/remove/${userId}`);
      toast.success("Friend removed successfully");
      
      // Update friends list
      set(state => ({
        friends: state.friends.filter(user => user._id !== userId)
      }));
      
      // Refresh available users since this user should now be available
      await get().getAvailableUsers();
      
      return true;
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error(error.response?.data?.message || "Failed to remove friend");
      return false;
    } finally {
      set({ isProcessingAction: false });
    }
  }
}));