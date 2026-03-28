import express from "express";
import { stripeWebhook } from "../controllers/stripe.controller.js";

const router = express.Router();

router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhook
);

export default router;