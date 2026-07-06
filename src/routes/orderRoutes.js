const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/authMiddleware');
const { createOrder, getOrders, updateOrderStatus } = require('../controllers/orderController');

router.post('/', createOrder);                // POST /api/orders (El cliente compra)
router.get('/', requireAuth, getOrders);                   // GET /api/orders (El Admin ve los pedidos)
router.patch('/:id/status', requireAuth, updateOrderStatus); // PATCH /api/orders/ID/status (El Admin cambia estado a "enviado")

module.exports = router;