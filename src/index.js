const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const requireAuth = require('./middlewares/authMiddleware');
require('dotenv').config();

//inicializar la aplicacion
const app = express();
const PORT = process.env.PORT || 4000;


//Middlewares globales
app.use(cors()); // permite peticiones del frontend
app.use(morgan('dev')); //mostrar log en consola
app.use(express.json()); // Permite que el servidor entienda datos en formato JSON

//ruta de prueba basica
/* app.get('/api/health',(req, res) => {
    res.json({message: 'El servidor esta funcionanndo correctamente'});
}); */

// ---IMPORTAR RUTAS----
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));


//inicializar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});