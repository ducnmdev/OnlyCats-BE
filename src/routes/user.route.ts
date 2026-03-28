import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getAdminProfile, getUserProfile, updateUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", verifyToken, getUserProfile);
router.patch("/profile", verifyToken, updateUserProfile);
router.get("/admin", getAdminProfile);


export default router;