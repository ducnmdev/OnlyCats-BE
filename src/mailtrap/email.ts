import {
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

import { transporter } from "./mail.config.js";

const sender = '"OnlyCat 😺" <ductiny2003@gmail.com>';

export const sendVerificationEmail = async (email: string, verificationToken: string) => {
    try {
        const response = await transporter.sendMail({
            from: sender,
            to: email,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
        });

        console.log("Email sent successfully", response);
    } catch (error) {
        console.error("Error sending verification", error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    try {
        const response = await transporter.sendMail({
            from: sender,
            to: email,
            subject: "Welcome to OnlyCats 😺",
            html: `<h1>Hello ${name}</h1><p>Welcome to OnlyCats 😺</p>`,
        });

        console.log("Welcome email sent successfully", response);
    } catch (error) {
        console.error("Error sending welcome email", error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (email: string, resetURL: string) => {
    try {
        const response = await transporter.sendMail({
            from: sender,
            to: email,
            subject: "Reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
        });

    } catch (error) {
        console.error("Error sending password reset email", error);
        throw error;
    }
};

export const sendResetSuccessEmail = async (email: string) => {
    try {
        const response = await transporter.sendMail({
            from: sender,
            to: email,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
        });

        console.log("Password reset email sent successfully", response);
    } catch (error) {
        console.error("Error sending password reset success email", error);
        throw error;
    }
};