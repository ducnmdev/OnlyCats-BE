import type { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma.js";
import { stripe } from "../lib/stripe.js";

// const webhookSecret =
//     process.env.NODE_ENV === "development"
//         ? process.env.STRIPE_WEBHOOK_SECRET_DEV_KEY!
//         : process.env.STRIPE_WEBHOOK_SECRET_LIVE_KEY!;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_LIVE_KEY!;

export const stripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
        return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
        );
    } catch (err: any) {
        console.error("Webhook signature failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data;
    const eventType = event.type;

    try {
        switch (eventType) {
            // CHECKOUT SUCCESS
            case "checkout.session.completed": {
                const session = await stripe.checkout.sessions.retrieve(
                    (data.object as Stripe.Checkout.Session).id,
                    {
                        expand: ["line_items", "customer_details"],
                    }
                );

                const customerId = session.customer as string;
                const customerDetails = session.customer_details;
                const lineItems = session.line_items?.data || [];

                if (!customerDetails?.email) break;

                const user = await prisma.user.findUnique({
                    where: { email: customerDetails.email },
                });

                if (!user) throw new Error("User not found");

                // save customerId
                if (!user.customerId) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { customerId },
                    });
                }

                for (const item of lineItems) {
                    const priceId = item.price?.id;
                    const isSubscription = item.price?.type === "recurring";

                    // SUBSCRIPTION
                    if (isSubscription) {
                        let endDate = new Date();

                        if (priceId === process.env.STRIPE_YEARLY_PLAN_PRICE_ID) {
                            endDate.setFullYear(endDate.getFullYear() + 1);
                        } else if (priceId === process.env.STRIPE_MONTHLY_PLAN_PRICE_ID) {
                            endDate.setMonth(endDate.getMonth() + 1);
                        }

                        await prisma.subscription.upsert({
                            where: { userId: user.id },
                            update: {
                                planId: priceId!,
                                startDate: new Date(),
                                endDate,
                                price: item.amount_total || 0,
                            },
                            create: {
                                userId: user.id,
                                planId: priceId!,
                                price: item.amount_total || 0,
                                startDate: new Date(),
                                endDate,
                            },
                        });

                        await prisma.user.update({
                            where: { id: user.id },
                            data: { isSubscribed: true },
                        });
                    }

                    // ONE TIME ORDER
                    else {
                        const { orderId, size } = session.metadata as {
                            orderId: string;
                            size: string;
                        };

                        const shipping = session.shipping_details?.address;

                        await prisma.order.update({
                            where: { id: orderId },
                            data: {
                                isPaid: true,
                                size,
                                shippingAddress: {
                                    create: {
                                        address: shipping?.line1 ?? "",
                                        city: shipping?.city ?? "",
                                        state: shipping?.state ?? "",
                                        postalCode: shipping?.postal_code ?? "",
                                        country: shipping?.country ?? "",
                                    },
                                },
                            },
                        });
                    }
                }

                break;
            }

            // CANCEL SUBSCRIPTION
            case "customer.subscription.deleted": {
                const subscription = await stripe.subscriptions.retrieve(
                    (data.object as Stripe.Subscription).id
                );

                const user = await prisma.user.findUnique({
                    where: { customerId: subscription.customer as string },
                });

                if (user) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { isSubscribed: false },
                    });
                }

                break;
            }

            // SESSION EXPIRED
            case "checkout.session.expired": {
                const session = await stripe.checkout.sessions.retrieve(
                    (data.object as Stripe.Checkout.Session).id
                );

                await prisma.order.delete({
                    where: { id: session.metadata!.orderId! },
                });

                break;
            }

            default:
                console.log("Unhandled event:", eventType);
        }

        res.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ message: "Webhook handler failed" });
    }
};