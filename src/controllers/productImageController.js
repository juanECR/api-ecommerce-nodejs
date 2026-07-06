// src/controllers/productImageController.js
const cloudinary = require('../config/cloudinary');
const supabase = require('../config/supabase');

// SUBIR UNA IMAGEN
const uploadProductImage = async (req, res) => {
    try {
        const { product_id, is_primary } = req.body; // Recibimos datos de texto
        const file = req.file; // Recibimos el archivo (gracias a multer)

        if (!product_id) return res.status(400).json({ message: 'El product_id es obligatorio' });
        if (!file) return res.status(400).json({ message: 'Debes enviar una imagen' });

        // 1. Convertimos la imagen de la memoria a un formato que Cloudinary entienda (Base64)
        const b64 = Buffer.from(file.buffer).toString("base64");
        let dataURI = "data:" + file.mimetype + ";base64," + b64;

        // 2. Subimos a Cloudinary (la guardará en una carpeta llamada "ecommerce")
        const cloudinaryRes = await cloudinary.uploader.upload(dataURI, {
            folder: "ecommerce_products"
        });

        // 3. Guardamos la URL en Supabase
        const { data, error } = await supabase
            .from('product_images')
            .insert([{
                product_id,
                image_url: cloudinaryRes.secure_url, // URL segura de Cloudinary
                is_primary: is_primary === 'true' // Convertimos a booleano
            }])
            .select();

        if (error) throw error;

        res.status(201).json({ 
            message: 'Imagen subida correctamente', 
            data: data[0] 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    uploadProductImage
};