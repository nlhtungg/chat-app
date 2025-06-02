import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import passport from './lib/passport.js';

import authRoutes from "./routes/auth.route.js";
import oauthRoutes from "./routes/oauth.route.js";
import messageRoutes from "./routes/message.route.js";
import videoCallRoutes from "./routes/videocall.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? true  // Allow requests from the same origin in production
      : "http://localhost:5173",
    credentials: true,
  })
);

// Initialize passport without session
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes); // Add OAuth routes
app.use("/api/messages", messageRoutes);
app.use("/api/videocall", videoCallRoutes); // Add video call routes

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});