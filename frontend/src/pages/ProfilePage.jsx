import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Key, Lock } from "lucide-react";

const ProfilePage = () => {  
  const { authUser, isUpdatingProfile, updateProfile, changePassword, isChangingPassword } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleNameEdit = () => {
    setFullName(authUser?.fullName || '');
    setIsEditingName(true);
  };
  const handleNameSave = async () => {
    if (!fullName.trim()) return;
    
    await updateProfile({ fullName: fullName.trim() });
    setIsEditingName(false);
  };
  
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setPasswordError('');
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    const { currentPassword, newPassword, confirmNewPassword } = passwordData;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    const success = await changePassword({
      currentPassword,
      newPassword
    });
    
    if (success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setShowPasswordForm(false);
    }
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
                {!isEditingName && (
                  <button 
                    onClick={handleNameEdit}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isUpdatingProfile}
                  />
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleNameSave}
                    disabled={isUpdatingProfile || !fullName.trim()}
                  >
                    Save
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsEditingName(false)}
                    disabled={isUpdatingProfile}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>
          </div>          {/* Password Change Section */}
          {!authUser?.provider || authUser?.provider === 'local' ? (
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Password
                </div>
                <button 
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="text-xs text-primary hover:underline"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              
              {showPasswordForm && (
                <form onSubmit={handlePasswordSubmit} className="mt-3 space-y-3 bg-base-200 p-4 rounded-lg border">
                  {passwordError && (
                    <div className="text-error text-sm">{passwordError}</div>
                  )}
                  <div className="space-y-1">
                    <label className="text-sm">Current Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="input input-bordered w-full"
                        placeholder="Enter current password"
                        disabled={isChangingPassword}
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm">New Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="input input-bordered w-full"
                        placeholder="Enter new password"
                        disabled={isChangingPassword}
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        name="confirmNewPassword"
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordChange}
                        className="input input-bordered w-full"
                        placeholder="Confirm new password"
                        disabled={isChangingPassword}
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button 
                      type="submit"
                      className={`btn btn-primary w-full ${isChangingPassword ? 'loading' : ''}`}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
              {!showPasswordForm && (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">••••••••</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Authentication
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                Using {authUser?.provider} authentication
              </p>
            </div>
          )}

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser?.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;