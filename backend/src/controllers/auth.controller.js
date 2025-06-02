import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req, res) => {
    const {fullName, email, password} = req.body;
    try {
        if( !fullName || !email || !password) {
            return res.status(400).json({message: 'Please fill all the fields'});
        }
        if (password.length < 6) {
            return res.status(400).json({message: 'Password must be at least 6 characters long'});
        }
        const user = await User.findOne({ email });
        if (user) return res.status(400).json({message: 'Email already exists'});
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            fullName: fullName,
            email: email,
            password: hashedPassword,
        })
        if (newUser) {
            //generate JWT token
            generateToken(newUser._id, res)
            await newUser.save()
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            })
        } else {
            return res.status(500).json({message: 'User creation failed'});
        }
    } catch (error) {
        console.log("Error in signup controller:", error.message);
        res.status(500).json({message: 'Internal server error'});
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if( !isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        generateToken(user._id, res);
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        })
    } catch (error) {
        console.log("Error in login controller:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const logout = (req, res) => {
    try {
        res.cookie('jwt', '', {maxAge: 0})
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log("Error in logout controller:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, fullName } = req.body;
        const userId = req.user._id;
        
        // Create an update object
        const updateData = {};
        
        // If profilePic is provided, upload it to cloudinary and add to update data
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            updateData.profilePic = uploadResponse.secure_url;
        }
        
        // If fullName is provided, add it to update data
        if (fullName) {
            updateData.fullName = fullName;
        }
        
        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No data provided for update' });
        }
        
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {new: true});
        res.status(200).json(updatedUser); 
    } catch (error) {
        console.log("Error in updateProfile controller:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const googleAuthCallback = (req, res) => {
    try {
        // Passport will set req.user after successful authentication
        generateToken(req.user._id, res);
        
        // Redirect to the frontend with success=true query param
        res.redirect(
            process.env.NODE_ENV === 'production'
                ? '/?success=true'
                : 'http://localhost:5173/?success=true'
        );
    } catch (error) {
        console.log("Error in googleAuthCallback controller:", error.message);
        res.redirect(
            process.env.NODE_ENV === 'production'
                ? '/?error=true'
                : 'http://localhost:5173/?error=true'
        );
    }
};

export const facebookAuthCallback = (req, res) => {
    try {
        // Passport will set req.user after successful authentication
        generateToken(req.user._id, res);
        
        // Redirect to the frontend with success=true query param
        res.redirect(
            process.env.NODE_ENV === 'production'
                ? '/?success=true'
                : 'http://localhost:5173/?success=true'
        );
    } catch (error) {
        console.log("Error in facebookAuthCallback controller:", error.message);
        res.redirect(
            process.env.NODE_ENV === 'production'
                ? '/?error=true'
                : 'http://localhost:5173/?error=true'
        );
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current password and new password are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        // Get user with password
        const user = await User.findById(userId);
        
        // Check if user is using OAuth (Google/Facebook) authentication
        if (user.provider && user.provider !== 'local') {
            return res.status(400).json({ 
                message: `Cannot change password for accounts using ${user.provider} authentication` 
            });
        }
        
        // Verify current password
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        user.password = hashedPassword;
        await user.save();
        
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.log("Error in changePassword controller:", error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};