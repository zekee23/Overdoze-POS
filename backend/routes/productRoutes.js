import express from "express";
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductVariants, 
  createProductWithVariants,
  getProductsWithVariants,
  createProductVariant

} from "../controllers/productController.js";
import { authenticateToken, requireAdmin, requireCashier } from "../middleware/auth.js";

const router = express.Router();

// GET all products (for admin panel)
router.get('/', authenticateToken, requireCashier, getAllProducts);

// GET all products with their variants (for POS)
router.get('/with-variants', authenticateToken, requireCashier, getProductsWithVariants);


// GET single product by ID
router.get('/:productId', authenticateToken, getProductById);

// GET variants for a specific product
router.get('/:productId/variants', authenticateToken, getProductVariants);

// POST create variant for a specific product (admin only)
router.post('/:productId/variants', authenticateToken, requireAdmin, createProductVariant);


router.post('/:productId/variants', authenticateToken, requireAdmin, createProductVariant);

// POST create product (admin only)
router.post('/create-product', authenticateToken, requireAdmin, createProduct);

// POST create product with variants (admin only)
router.post('/with-variants', authenticateToken, requireAdmin, createProductWithVariants);

// PUT update product (admin only)
router.put('/:productId', authenticateToken, requireAdmin, updateProduct);

// DELETE product (admin only)
router.delete('/:productId', authenticateToken, requireAdmin, deleteProduct);


export default router;
