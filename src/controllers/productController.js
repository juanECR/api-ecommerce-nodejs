const supabase = require('../config/supabase');
const {generateSlug} = require('../utils/helpers');

// 1. OBTENER TODOS LOS PRODUCTOS
const getProducts = async (req , res) => {
    try {
        const {data, error} = await supabase.from('products').select('*, categories(name),product_images(id, image_url, is_primary)').order('created_at', {ascending: false});

        if(error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// 2. OBTENER UN PRODUCTO POR ID
const getProductById = async (req, res) => {
    try {
        const {id} = req.params;
        const {data, error} = await supabase.from('products').select('*, categories(name),product_images(id, image_url, is_primary)').eq('id', id).single();

        if(error) throw error;
        if(!data) return res.status(404).json({message: 'producto no encontrado'});

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// 3. CREAR UN PRODUCTO
const createProduct = async (req, res) => {
    try {
        const { category_id, name, description, price, stock, properties, status } = req.body;
        
        if (!name || !price || !category_id) {
            return res.status(400).json({ message: 'Nombre, precio y categoría son obligatorios' });
        }

        const slug = generateSlug(name);

        const { data, error } = await supabase
            .from('products')
            .insert([{ 
                category_id, 
                name, 
                slug, 
                description, 
                price, 
                stock, 
                properties, // Guardamos nuestro objeto JSON mágico
                status 
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Producto creado', data: data[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe un producto con este nombre/slug' });
        }
        res.status(500).json({ error: error.message });
    }
};

// 4. ACTUALIZAR UN PRODUCTO
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.name) {
            updates.slug = generateSlug(updates.name);
        }

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.status(200).json({ message: 'Producto actualizado', data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. ELIMINAR UN PRODUCTO
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};