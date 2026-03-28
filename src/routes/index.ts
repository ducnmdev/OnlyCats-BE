import type { Express } from "express";
import cloudinaryRoutes from "./cloudinary.route.js";
import authRoutes from "./auth.route.js";
import postRoutes from "./post.route.js";
import productRoutes from "./product.route.js";
import userRoutes from "./user.route.js";
import dashboardRoutes from "./dashboard.route.js";
import orderRoutes from "./order.route.js";
import paymentRoutes from "./payment.route.js";

const routes = (app: Express) => {
  app.use("/api/v1/cloudinary", cloudinaryRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/posts", postRoutes);
  app.use("/api/v1/products", productRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);
  app.use("/api/v1/order", orderRoutes);
  app.use("/api/v1/payment", paymentRoutes);


};

export default routes;