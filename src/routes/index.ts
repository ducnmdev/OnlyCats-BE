import type { Express } from "express";
import cloudinaryRoutes from "./cloudinary.route.js";

const routes = (app: Express) => {
  app.use("/api/v1/cloudinary", cloudinaryRoutes);

};

export default routes;