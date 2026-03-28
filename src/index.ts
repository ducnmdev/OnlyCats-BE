import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from "cors";
import routes from './routes/index.js';
import stripeRoutes from "./routes/stripe.route.js";

const app = express()

app.use("/api/v1/webhooks", stripeRoutes);
app.use(express.urlencoded({ extended: true })) // form - parse data từ form -> obj
app.use(express.json())                         // fetch - parse json -> obj
app.use(cookieParser())
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

routes(app)


app.listen(5001, () => {
  console.log('server is running on port 5001')
})