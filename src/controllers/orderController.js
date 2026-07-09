const supabase = require('../config/supabase');
const { sendOrderConfirmationEmail } = require('../utils/emailService')

// 1. CREAR UNA NUEVA ORDEN (Checkout del Frontend)
const createOrder = async (req, res) => {
    try {
        const { customer, items, total_amount } = req.body;

        // Validaciones básicas
        if (!customer || !items || items.length === 0 || !total_amount) {
            return res.status(400).json({ message: 'Faltan datos para procesar la orden' });
        }

        // --- PASO 1: GESTIONAR EL CLIENTE ---
        // Supabase "upsert": Si el DNI no existe lo crea. Si ya existe, actualiza sus datos y nos devuelve el ID. ¡Sin validar manualmente!
        const { data: savedCustomer, error: customerError } = await supabase
            .from('customers')
            .upsert([customer], { onConflict: 'dni' }) 
            .select();

        if (customerError) throw customerError;
        const customer_id = savedCustomer[0].id;

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

        // --- NUEVO PASO 4: ENVIAR EL CORREO ---
        // Creamos un objeto con toda la info para pasársela al generador de PDF
        const fullOrderData = {
            order_id,
            customer,
            items,
            total_amount
        };
        // Ejecutamos el envío de correo PERO NO le ponemos "await".
        // Así el servidor le responde rápido al cliente (¡Pedido Confirmado!)
        sendOrderConfirmationEmail(fullOrderData);

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