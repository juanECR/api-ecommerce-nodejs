const supabase = require('../config/supabase');

// 1. CREAR UNA NUEVA ORDEN (Checkout del Frontend)
const createOrder = async (req, res) => {
    try {
        const { customer, items, total_amount } = req.body;

        // Validaciones básicas
        if (!customer || !items || items.length === 0 || !total_amount) {
            return res.status(400).json({ message: 'Faltan datos para procesar la orden' });
        }

        // --- PASO 1: GESTIONAR EL CLIENTE ---
        let customer_id;
        
        // Buscamos si el cliente ya existe por su DNI
        const { data: existingCustomer, error: searchError } = await supabase
            .from('customers')
            .select('id')
            .eq('dni', customer.dni)
            .single();

        if (existingCustomer) {
            customer_id = existingCustomer.id;
            // Opcional: Podrías hacer un update aquí si quieres actualizar su dirección
        } else {
            // Si no existe, lo creamos
            const { data: newCustomer, error: createError } = await supabase
                .from('customers')
                .insert([customer])
                .select();
                
            if (createError) throw createError;
            customer_id = newCustomer[0].id;
        }

        // --- PASO 2: CREAR LA ORDEN ---
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert([{ customer_id, total_amount, status: 'pending' }])
            .select();

        if (orderError) throw orderError;
        const order_id = newOrder[0].id;

        // --- PASO 3: CREAR LOS DETALLES DE LA ORDEN (Order Items) ---
        // Preparamos el array de productos para insertarlos de golpe
        const orderItemsToInsert = items.map(item => ({
            order_id: order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;

        // ¡Éxito!
        res.status(201).json({ 
            message: 'Orden creada exitosamente', 
            order_id: order_id 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. OBTENER TODAS LAS ÓRDENES (Para el panel de Administrador)
const getOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customers(first_name, last_name, dni, email),
                order_items(quantity, unit_price, products(name))
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. ACTUALIZAR EL ESTADO DE UNA ORDEN (Ej: 'pending' -> 'shipped')
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.status(200).json({ message: 'Estado actualizado', data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    updateOrderStatus
};