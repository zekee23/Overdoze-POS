import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";

import userRoutes from "./routes/userRouter.js";
import OrdersRoutes from "./routes/OrdersRoutes.js";

import dashboardRoutes from './routes/dashboardRoutes.js';

import posroutes from './routes/posRoutes.js';
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

console.log("PORT:", PORT);

app.use(express.json()); //middleware to parse JSON bodies
app.use(cors()); //middleware to enable CORS
app.use(helmet()); //helmet helps secure Express apps by setting various HTTP headers
app.use(morgan("dev")); //morgan is HTTP request logger middleware for node.js

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Caching headers for static assets
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});

// Arcjet protection is now applied only to specific registration endpoints in userRouter.js

app.use("/api/users", userRoutes);

app.use("/api/dashboard", dashboardRoutes);
app.use('/api', posroutes)
app.use('/api', OrdersRoutes);





app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});