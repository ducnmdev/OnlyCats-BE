import type { Request, Response } from "express";
import cloudinary from "../lib/cloudinary.js"

export const signature = (req: Request, res: Response) => {
  const signature = cloudinary.utils.api_sign_request(
    req.body.paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  res.json({ signature });
}

