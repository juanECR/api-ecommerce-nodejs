// src/controllers/authController.js
const supabase = require('../config/supabase');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        }

        // Le pedimos a Supabase que inicie sesión con esas credenciales
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Si es correcto, devolvemos el token (la llave digital)
        res.status(200).json({
            message: 'Login exitoso',
            token: data.session.access_token, // ¡Este es el pase VIP!
            user: {
                id: data.user.id,
                email: data.user.email
            }
        });
    } catch (error) {
        res.status(401).json({ error: 'Credenciales incorrectas o usuario no encontrado' });
    }
};

module.exports = { login };