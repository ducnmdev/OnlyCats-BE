import 'dotenv/config'
import express from 'express'
import cors from "cors";
import routes from './routes/index.js';

const app = express()

app.use(express.urlencoded({ extended: true })) // form - parse data từ form -> obj
app.use(express.json())                         // fetch - parse json -> obj
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

routes(app)


app.listen(5001, () => {
  console.log('server is running on port 5001')
})