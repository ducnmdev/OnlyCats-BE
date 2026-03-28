import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createPost = async (req: Request, res: Response) => {
    try {
        const { text, mediaUrl, mediaType, isPublic } = req.body;

        const newPost = await prisma.post.create({
            data: {
                text,
                mediaUrl,
                mediaType,
                isPublic,
                userId: req.userId,
            },
        });

        res.status(201).json({
            success: true,
            post: newPost,
        });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

export const getPostStats = async (req: Request, res: Response) => {
    try {
        const imageCount = await prisma.post.count({
            where: {
                mediaType: "image",
            },
        });

        const videoCount = await prisma.post.count({
            where: {
                mediaType: "video",
            },
        });

        const totalLikes = await prisma.post.aggregate({
            _sum: {
                likes: true,
            },
        });

        return res.status(200).json({
            success: true,
            stats: {
                imageCount,
                videoCount,
                totalLikes: totalLikes._sum.likes || 0,
            },
        });
    } catch (error) {
        console.error("Get post stats error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const getPosts = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const posts = await prisma.post.findMany({
            include: {
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                isSubscribed: true,
                                customerId: true,
                                isVerified: true,
                                createdAt: true,
                                lastLogin: true,
                            },
                        },
                    },
                },
                likesList: {
                    where: { userId },
                },
            },
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error("Get posts error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;

        await prisma.post.delete({
            where: { id: postId as string },
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const likePost = async (req: Request, res: Response) => {
    try {
        const postId = req.params.postId as string;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userProfile?.isSubscribed) {
            return res.status(403).json({
                message: "Subscription required",
            });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                likes: true,
                likesList: { where: { userId } },
            },
        });

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        let newLikes: number;

        if (post.likesList.length > 0) {
            newLikes = Math.max(post.likes - 1, 0);

            await prisma.like.deleteMany({
                where: {
                    postId,
                    userId,
                },
            });
        } else {
            newLikes = post.likes + 1;

            await prisma.like.create({
                data: {
                    postId,
                    userId,
                },
            });
        }

        await prisma.post.update({
            where: { id: postId },
            data: { likes: newLikes },
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Like post error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const commentOnPost = async (req: Request, res: Response) => {
    try {
        const postId = req.params.postId as string;
        const { text } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userProfile?.isSubscribed) {
            return res.status(403).json({
                message: "Subscription required",
            });
        }

        await prisma.comment.create({
            data: {
                text,
                postId,
                userId,
            },
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Comment error:", error);
        res.status(500).json({ message: "Server error" });
    }
};