import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { productId, size } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // create order
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                productId: product.id,
                price: product.price,
                size,
            },
        });

        // create stripe customer
        const customer = await stripe.customers.create({
            email: user.email!,
        });

        // create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: product.name,
                            images: [product.image],
                        },
                        unit_amount: product.price,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                orderId: order.id,
                size,
            },
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?orderId=${order.id}`,
            cancel_url: `${process.env.CLIENT_URL}/merch/${product.id}`,
            shipping_address_collection: {
                allowed_countries: ["US"],
            },
            customer: customer.id,
            expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
        });

        res.status(200).json({
            url: session.url,
        });

    } catch (error) {
        console.error("createCheckoutSession error:", error);
        res.status(500).json({ message: "Server error" });
    }
};