import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { initiateCall, getCallStatus, getCallHistory } from '../controllers/videocall.controller.js';

const router = express.Router();

// Routes for video call functionality
router.post('/initiate', protectRoute, initiateCall);
router.get('/status/:callId', protectRoute, getCallStatus);
router.get('/history', protectRoute, getCallHistory);

export default router;
