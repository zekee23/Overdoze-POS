import express from "express";
import { getAllProducts, createProduct } from "../controllers/productController.js";
import {authenticateToken, requireAdmin,requireCashier} from "../middleware/auth.js"


const router = express.Router();


router.post('/', authenticateToken, requireAdmin, createProduct)


router.get("/", authenticateToken, requireCashier, getAllProducts);



router.post("/", createProduct);


export default router;
