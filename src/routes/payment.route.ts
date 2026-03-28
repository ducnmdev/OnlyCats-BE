import express from "express";
import { createCheckoutSession } from "../controllers/payment.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/checkout", verifyToken, createCheckoutSession);

export default router;