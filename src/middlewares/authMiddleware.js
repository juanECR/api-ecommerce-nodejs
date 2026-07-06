// src/middlewares/authMiddleware.js
const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
    try {
        // 1. Buscamos el token en las cabeceras de la petición (Headers)
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Acceso denegado. Debes iniciar sesión.' });
        }

        // 2. Extraemos el token limpio (quitamos la palabra "Bearer ")
        const token = authHeader.split(' ')[1];

        // 3. Le pedimos a Supabase que verifique si el token es válido y real
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ message: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
        }

        // 4. Si todo está bien, guardamos los datos del usuario y lo dejamos pasar
        req.user = data.user;
        next(); // <- Esta función le dice a Express "Todo en orden, continúa a la ruta"

    } catch (error) {
        res.status(500).json({ error: 'Error interno en la autenticación' });
    }
};

module.exports = requireAuth;