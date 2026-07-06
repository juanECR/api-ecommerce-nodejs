const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrderStatus } = require('../controllers/orderController');

router.post('/', createOrder);                // POST /api/orders (El cliente compra)
router.get('/', getOrders);                   // GET /api/orders (El Admin ve los pedidos)
router.patch('/:id/status', updateOrderStatus); // PATCH /api/orders/ID/status (El Admin cambia estado a "enviado")

module.exports = router;