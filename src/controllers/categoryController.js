const supabase = require('../config/supabase');
const { generateSlug } = require('../utils/helpers');


// 1. OBTENER TODAS LAS CATEGORÍAS (Read)
const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: false }); // Las más nuevas primero

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. OBTENER UNA CATEGORÍA POR ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single(); // Retorna un objeto en vez de un array

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Categoría no encontrada' });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. CREAR UNA CATEGORÍA (Create)
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) return res.status(400).json({ message: 'El nombre es obligatorio' });

        const slug = generateSlug(name); // Creamos el slug automáticamente

        const { data, error } = await supabase
            .from('categories')
            .insert([{ name, slug, description }])
            .select(); // Le pedimos que nos devuelva el dato creado

        if (error) throw error;
        res.status(201).json({ message: 'Categoría creada con éxito', data: data[0] });
    } catch (error) {
        // Código 23505 de Postgres significa "Violación de unicidad" (el slug ya existe)
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe una categoría con este nombre/slug' });
        }
        res.status(500).json({ error: error.message });
    }
};

// 4. ACTUALIZAR UNA CATEGORÍA (Update)
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Si mandan un nuevo nombre, actualizamos el slug también
        let updates = { description };
        if (name) {
            updates.name = name;
            updates.slug = generateSlug(name);
        }

        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.status(200).json({ message: 'Categoría actualizada', data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. ELIMINAR UNA CATEGORÍA (Delete)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};