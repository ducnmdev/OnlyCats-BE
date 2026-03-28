import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sanitizeUser } from "../lib/sanitizeUser.js";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/email.js";

export const signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        if (!email || !password || !name) {
            throw new Error("All fields are required");
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists!",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isVerified: false,
                verificationToken,
                verificationTokenExpiresAt: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ),
            },
        });

        await sendVerificationEmail(user.email, verificationToken);

        return res.status(201).json({
            success: true,
            message: "Account created. Please verify your email.",
        });

    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    const { code } = req.body;

    try {
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: code,
                verificationTokenExpiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiresAt: null,
            },
        });

        generateTokenAndSetCookie(res, updatedUser.id);

        await sendWelcomeEmail(updatedUser.email, updatedUser.name);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: sanitizeUser(updatedUser),
        });

    } catch (error) {
        console.log("error in verifyEmail", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
            });
        }

        generateTokenAndSetCookie(res, user.id);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: sanitizeUser(updatedUser),
        });

    } catch (error) {
        console.log("Error in login ", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const logout = async (req: Request, res: Response) => {
    res.clearCookie("jwt")
    res.status(200).json({ success: true, message: "Logged out successfully" })
}

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account exists, a reset link has been sent"
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpiresAt: resetTokenExpiresAt,
            },
        });

        // send email
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

        res.status(200).json({ success: true, message: "Password reset link sent to your email" });
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error in forgotPassword ", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || Array.isArray(token)) {
            return res.status(400).json({
                success: false,
                message: "Invalid token",
            });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        const isSamePassword = await bcrypt.compare(password, user.password);

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from old password",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiresAt: null,
            },
        });

        await sendResetSuccessEmail(user.email);

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
        });

    } catch (error) {
        console.log("Error in resetPassword ", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const checkAuth = async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        })

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user: sanitizeUser(user) });
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error in checkAuth ", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const resendVerification = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "User already verified",
            });
        }

        const newToken = Math.floor(100000 + Math.random() * 900000).toString();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: newToken,
                verificationTokenExpiresAt: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ),
            },
        });

        await sendVerificationEmail(user.email, newToken);

        return res.status(200).json({
            success: true,
            message: "Verification email resent",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const getMe = async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
    });

    if (!user) {
        return res.status(401).json({ success: false });
    }

    res.status(200).json({
        success: true,
        user: sanitizeUser(user),
    });
};