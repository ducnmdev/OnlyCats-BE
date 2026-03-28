import express from "express";
import { checkProductPaidStatus } from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/:orderId", verifyToken, checkProductPaidStatus);

export default router;