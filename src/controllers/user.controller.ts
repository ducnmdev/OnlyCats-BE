import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { sanitizeUser } from "../lib/sanitizeUser.js";

export const getUserProfile = async (req: Request, res: Response) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		return res.status(200).json({
			success: true,
			user: sanitizeUser(user),
		});
	} catch (error) {
		console.error("Get user profile error:", error);

		return res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

export const updateUserProfile = async (req: Request, res: Response) => {
	try {
		const userId = req.userId;
		const { name, image } = req.body;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		const updatedFields: any = {};

		if (name) updatedFields.name = name;
		if (image) updatedFields.image = image;

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: updatedFields,
		});

		return res.status(200).json({
			success: true,
			user: sanitizeUser(updatedUser),
		});
	} catch (error) {
		console.error("Update profile error:", error);

		return res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

export const getAdminProfile = async (req: Request, res: Response) => {
	try {
		const admin = await prisma.user.findUnique({
			where: {
				email: process.env.ADMIN_EMAIL!,
			},
		});

		if (!admin) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		return res.status(200).json({
			success: true,
			admin: sanitizeUser(admin),
		});
	} catch (error) {
		console.error("Get admin profile error:", error);

		res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};