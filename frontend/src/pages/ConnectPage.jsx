import { useState, useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { UserPlus, Search, Users, UserCheck, Clock, X } from "lucide-react";

const ConnectPage = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [searchTerm, setSearchTerm] = useState("");
  
  const {
    availableUsers,
    friends,
    friendRequests,
    isLoadingAvailable,
    isLoadingFriends,
    isLoadingRequests,
    isProcessingAction,
    getAvailableUsers,
    getFriends,
    getFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  } = useFriendStore();
  
  // Determine if loading based on active tab
  const isLoading = 
    (activeTab === "available" && isLoadingAvailable) || 
    (activeTab === "friends" && isLoadingFriends) || 
    (activeTab === "requests" && isLoadingRequests);

  // Fetch data on mount and tab change
  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  // Fetch data based on the active tab
  const fetchData = (tab) => {
    if (tab === "available") {
      getAvailableUsers();
    } else if (tab === "friends") {
      getFriends();
    } else if (tab === "requests") {
      getFriendRequests();
    }
  };

  // Filter users by search term
  const filterUsersBySearch = (users) => {
    if (!searchTerm) return users;
    
    return users.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-base-300 rounded-xl p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold">Connect with People</h1>
            <p className="mt-2 text-zinc-400">Find and connect with other users</p>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered w-full pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-5 text-zinc-500" />
          </div>

          {/* Tab navigation */}
          <div className="tabs tabs-boxed mb-6 flex">
            <button
              className={`tab flex-1 flex gap-2 items-center justify-center ${
                activeTab === "available" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("available")}
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Find Users</span>
            </button>
            <button
              className={`tab flex-1 flex gap-2 items-center justify-center ${
                activeTab === "friends" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("friends")}
            >
              <Users size={18} />
              <span className="hidden sm:inline">My Friends</span>
            </button>
            <button
              className={`tab flex-1 flex gap-2 items-center justify-center ${
                activeTab === "requests" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("requests")}
            >
              <Clock size={18} />
              <span className="hidden sm:inline">Requests</span>
              {friendRequests.length > 0 && (
                <span className="badge badge-sm badge-primary">{friendRequests.length}</span>
              )}
            </button>
          </div>

          {/* User list content */}
          <div className="overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <>
                {/* Available users */}
                {activeTab === "available" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterUsersBySearch(availableUsers).map((user) => (
                      <div
                        key={user._id}
                        className="card card-compact bg-base-200 shadow-sm"
                      >
                        <div className="card-body flex flex-row items-center">
                          <div className="avatar">
                            <div className="w-16 h-16 rounded-full">
                              <img
                                src={user.profilePic || "/avatar.png"}
                                alt={user.fullName}
                              />
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-medium">{user.fullName}</h3>
                            <p className="text-sm text-zinc-400">{user.email}</p>
                          </div>
                          <button
                            onClick={() => sendFriendRequest(user._id)}
                            className="btn btn-primary btn-sm"
                          >
                            <UserPlus size={16} />
                            <span className="hidden sm:inline">Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {filterUsersBySearch(availableUsers).length === 0 && (
                      <div className="col-span-2 text-center py-10 text-zinc-500">
                        {searchTerm ? "No matching users found" : "No available users to connect with"}
                      </div>
                    )}
                  </div>
                )}

                {/* Friends list */}
                {activeTab === "friends" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterUsersBySearch(friends).map((user) => (
                      <div
                        key={user._id}
                        className="card card-compact bg-base-200 shadow-sm"
                      >
                        <div className="card-body flex flex-row items-center">
                          <div className="avatar">
                            <div className="w-16 h-16 rounded-full">
                              <img
                                src={user.profilePic || "/avatar.png"}
                                alt={user.fullName}
                              />
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-medium">{user.fullName}</h3>
                            <p className="text-sm text-zinc-400">{user.email}</p>
                          </div>
                          <button
                            onClick={() => removeFriend(user._id)}
                            className="btn btn-error btn-sm"
                          >
                            <X size={16} />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {filterUsersBySearch(friends).length === 0 && (
                      <div className="col-span-2 text-center py-10 text-zinc-500">
                        {searchTerm ? "No matching friends found" : "You don't have any friends yet"}
                      </div>
                    )}
                  </div>
                )}

                {/* Friend requests */}
                {activeTab === "requests" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterUsersBySearch(friendRequests).map((user) => (
                      <div
                        key={user._id}
                        className="card card-compact bg-base-200 shadow-sm"
                      >
                        <div className="card-body flex flex-row items-center">
                          <div className="avatar">
                            <div className="w-16 h-16 rounded-full">
                              <img
                                src={user.profilePic || "/avatar.png"}
                                alt={user.fullName}
                              />
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-medium">{user.fullName}</h3>
                            <p className="text-sm text-zinc-400">{user.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptFriendRequest(user._id)}
                              className="btn btn-success btn-sm"
                            >
                              <UserCheck size={16} />
                              <span className="hidden sm:inline">Accept</span>
                            </button>
                            <button
                              onClick={() => rejectFriendRequest(user._id)}
                              className="btn btn-outline btn-sm"
                            >
                              <X size={16} />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filterUsersBySearch(friendRequests).length === 0 && (
                      <div className="col-span-2 text-center py-10 text-zinc-500">
                        {searchTerm ? "No matching requests found" : "No pending friend requests"}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectPage;
