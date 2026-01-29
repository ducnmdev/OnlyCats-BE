import express from "express";
import { signature } from "../controllers/cloudinary.controller.js";

const router = express.Router();

router.post("/signature", signature);

export default router;