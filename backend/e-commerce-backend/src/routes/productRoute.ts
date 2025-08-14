import { Router } from 'express';
import productController from '../controllers/ProductController';
import upload from '../middleware/upload';

const router = Router();

// GET /api/products
router.get('/', productController.getAllProducts);


// GET /api/products/category/:category
router.get('/category/:category', productController.getProductsByCategory);


// GET /api/products/:id
router.get('/:id', productController.getProductById);



// POST /api/products
router.post('/', productController.createProduct);
router.post('/:id/image', upload.single('image'), productController.uploadProductImage);

// PACTCH /api/products/:id
router.patch('/:id', productController.patchProduct);

// DELETE /api/products/:id
router.delete('/:id', productController.deleteProduct);


export default router;