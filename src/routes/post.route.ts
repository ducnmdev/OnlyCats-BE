import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { commentOnPost, createPost, deletePost, getPosts, getPostStats, likePost } from "../controllers/post.controller.js";

const router = express.Router();

router.post("/create-post", verifyToken, createPost);
router.get("/stats", verifyToken, getPostStats);
router.get("/get-posts", verifyToken, getPosts);

router.post("/:postId/like", verifyToken, likePost);
router.post("/:postId/comment", verifyToken, commentOnPost);
router.delete("/:postId", verifyToken, deletePost);

export default router;