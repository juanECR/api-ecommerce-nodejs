const express = require('express');
const router = express.Router();
const { 
    getCategories, 
    getCategoryById, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} = require('../controllers/categoryController');

// Definimos las rutas y las unimos a sus controladores
router.get('/', getCategories);           // GET http://localhost:4000/api/categories
router.get('/:id', getCategoryById);      // GET http://localhost:4000/api/categories/ID
router.post('/', createCategory);         // POST http://localhost:4000/api/categories
router.put('/:id', updateCategory);       // PUT http://localhost:4000/api/categories/ID
router.delete('/:id', deleteCategory);    // DELETE http://localhost:4000/api/categories/ID

module.exports = router;