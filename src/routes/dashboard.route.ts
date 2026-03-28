import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/", verifyToken, getDashboardData);

export default router;