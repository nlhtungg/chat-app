import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    getAvailableUsers,
    getFriends,
    getFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
} from '../controllers/friend.controller.js';

const router = express.Router();

// Get routes
router.get('/available', protectRoute, getAvailableUsers);
router.get('/list', protectRoute, getFriends);
router.get('/requests', protectRoute, getFriendRequests);

// Action routes
router.post('/request/:userId', protectRoute, sendFriendRequest);
router.post('/accept/:userId', protectRoute, acceptFriendRequest);
router.post('/reject/:userId', protectRoute, rejectFriendRequest);
router.post('/remove/:userId', protectRoute, removeFriend);

export default router;
