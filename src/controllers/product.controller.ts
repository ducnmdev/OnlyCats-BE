import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany();

        return res.status(200).json({
            success: true,
            products,
        });

    } catch (error) {
        console.error("Get products error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, image, price } = req.body;

        if (!name || !image || !price) {
            return res.status(400).json({
                success: false,
                message: "Please provide all the required fields",
            });
        }

        const priceInCents = Math.round(parseFloat(price) * 100);

        if (isNaN(priceInCents)) {
            return res.status(400).json({
                success: false,
                message: "Price must be a number",
            });
        }

        const newProduct = await prisma.product.create({
            data: {
                name,
                image,
                price: priceInCents,
            },
        });

        return res.status(201).json({
            success: true,
            product: newProduct,
        });
    } catch (error) {
        console.error("Create product error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const toggleProductArchive = async (req: Request, res: Response) => {
	try {
		const productId = req.params.id;

		const product = await prisma.product.findUnique({
			where: { id: productId as string},
		});

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		const updatedProduct = await prisma.product.update({
			where: { id: productId as string },
			data: {
				isArchived: !product.isArchived,
			},
		});

		return res.status(200).json({
			success: true,
			product: updatedProduct,
		});
	} catch (error) {
		console.log("Toggle product archive error:", error);

		return res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

export const getAllPublicProducts = async (req: Request, res: Response) => {
	try {
		const products = await prisma.product.findMany({
			where: {
				isArchived: false,
			},
		});

		return res.status(200).json({
			success: true,
			products,
		});
	} catch (error) {
		console.error("Get products error:", error);

		return res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

export const getProductById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const currentProduct = await prisma.product.findUnique({
			where: { id: id as string },
		});

		if (!currentProduct || currentProduct.isArchived) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		const relatedProducts = await prisma.product.findMany({
			where: {
				isArchived: false,
				id: { not: id as string },
			},
		});

		return res.status(200).json({
			success: true,
			currentProduct,
			products: relatedProducts,
		});
	} catch (error) {
		console.error("Get product error:", error);

		return res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};