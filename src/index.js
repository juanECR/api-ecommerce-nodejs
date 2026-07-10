const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const requireAuth = require('./middlewares/authMiddleware');
require('dotenv').config();

//inicializar la aplicacion
const app = express();
const PORT = process.env.PORT || 4000;

// Lista blanca de dominios
const whitelist = [
  'https://wazyperu.cwefy.com', // Producción
  'http://localhost:5173'          // Desarrollo (Ej: Vite/React)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Si el origen está en la lista blanca, o si no hay origen (ej. Postman o llamadas servidor a servidor)
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acceso denegado por la política de CORS'));
    }
  }
};
//Middlewares globales
app.use(cors(corsOptions)); // permite peticiones del frontend
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


module.exports = app;