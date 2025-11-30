import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRouter.js";
import pool from "./config/db.js";
import dashboardRoutes from './routes/dashboardRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT;

console.log("PORT:", PORT) || 3000;

app.use(express.json()); //middleware to parse JSON bodies
app.use(cors()); //middleware to enable CORS
app.use(helmet()); //helmet helps secure Express apps by setting various HTTP headers
app.use(morgan("dev")); //morgan is HTTP request logger middleware for node.js


app.use("/api/users", userRoutes);

app.use("/api/products", productRoutes);

app.use("/api", dashboardRoutes);





app.listen(PORT, () => {
    console.log("Server is running on port " +PORT);

});