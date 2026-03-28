import express from "express";
import { createProduct, getAllProducts, getAllPublicProducts, getProductById, toggleProductArchive } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/get-all-public-product", getAllPublicProducts);
router.post("/add-product", createProduct);


router.get("/:id", getProductById);
router.patch("/:id/toggle-archive", toggleProductArchive);


export default router;