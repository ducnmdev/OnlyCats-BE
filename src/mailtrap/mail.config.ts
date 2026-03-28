import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ductiny2003@gmail.com",
    pass: "dyikjpwqvtgchqwe",
  },
});