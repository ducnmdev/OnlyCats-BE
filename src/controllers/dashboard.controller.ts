import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

const centsToDollars = (cents: number) => {
    return (cents / 100).toFixed(2);
};

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        const totalRevenuePromise = Promise.all([
            prisma.order.aggregate({
                _sum: { price: true },
            }),
            prisma.subscription.aggregate({
                _sum: { price: true },
            }),
        ]);

        const totalSalesPromise = prisma.order.count();
        const totalSubscriptionsPromise = prisma.subscription.count();

        const recentSalesPromise = prisma.order.findMany({
            take: 4,
            orderBy: { orderDate: "desc" },
            select: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                price: true,
                orderDate: true,
            },
        });

        const recentSubscriptionsPromise = prisma.subscription.findMany({
            take: 4,
            orderBy: { startDate: "desc" },
            select: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                price: true,
                startDate: true,
            },
        });

        const [
            totalRevenueResult,
            totalSales,
            totalSubscriptions,
            recentSales,
            recentSubscriptions,
        ] = await Promise.all([
            totalRevenuePromise,
            totalSalesPromise,
            totalSubscriptionsPromise,
            recentSalesPromise,
            recentSubscriptionsPromise,
        ]);

        const totalRevenue =
            (totalRevenueResult[0]._sum.price || 0) +
            (totalRevenueResult[1]._sum.price || 0);

        return res.json({
            success: true,
            data: {
                totalRevenue: centsToDollars(totalRevenue),
                totalSales,
                totalSubscriptions,
                recentSales,
                recentSubscriptions,
            },
        });
    } catch (error) {
        console.log("Error getDashboardData:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};