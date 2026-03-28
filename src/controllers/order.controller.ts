import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const checkProductPaidStatus = async (req: Request<{ orderId: string }>, res: Response) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "orderId is required",
            });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                product: true,
                isPaid: true,
                size: true,
                shippingAddress: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            order,
        });

    } catch (error) {
        console.error("checkProductPaidStatus error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};