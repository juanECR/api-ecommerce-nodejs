const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/authMiddleware');

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');


router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', requireAuth, createProduct);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);

module.exports = router;
