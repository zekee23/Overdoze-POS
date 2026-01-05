import express from 'express';
import { getDashboard, getPOS } from '../controllers/dashboardcontroller.js';
import { authenticateToken, requireAdmin, requireCashier } from '../middleware/auth.js';
import { productsRefreshProtection } from '../middleware/arcjet.js';
import { getHomeData, getStock, setStockStatus,setStockStatusActive, getOrderHistory, getPeakHours,getUser,editUser, deleteUser} from '../controllers/dashboardController/dashboard.queries.js';
import { getProductsWithVariants, createProduct,createProductVariant,deleteProduct,updateProduct, refreshProducts } from '../controllers/productController.js';
const router = express.Router();

// Admin dashboard
router.get('/', authenticateToken, requireAdmin, getDashboard);

// POS system for cashiers and admins
router.get('/pos', authenticateToken, requireCashier, getPOS);
router.get('/home-data',authenticateToken,requireAdmin,getHomeData);
router.get('/out-of-stock', authenticateToken,requireAdmin,getStock);
router.put('/product/:id', authenticateToken,requireAdmin, setStockStatus);
router.get('/order-history',authenticateToken,requireAdmin, getOrderHistory);
router.get('/peak-hours',authenticateToken, requireAdmin, getPeakHours);
router.get('/products', authenticateToken, requireAdmin, getProductsWithVariants);
router.post('/products/refresh', authenticateToken, requireAdmin, productsRefreshProtection, refreshProducts);
router.post('/create-product', authenticateToken, requireAdmin, createProduct);
// DELETE product (admin only)
router.delete('/products/:productId', authenticateToken, requireAdmin, deleteProduct);
router.post('/products/:productId/variants', authenticateToken, requireAdmin, createProductVariant);
router.put('/update-product/:productId', authenticateToken, requireAdmin, updateProduct)
router.get('/users', authenticateToken, requireAdmin, getUser);
router.put('/users/:uid', authenticateToken, requireAdmin, editUser);
router.delete('/users/:uid', authenticateToken, requireAdmin, deleteUser);
router.put('/restock/:id', authenticateToken, requireAdmin, setStockStatusActive);
export default router;