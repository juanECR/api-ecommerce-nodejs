// src/utils/emailService.js
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// 1. Configurar el "Cartero" para SMTP Externo
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    // Si el puerto es 465, secure debe ser true. Para 587 o 25, debe ser false.
    secure: process.env.SMTP_PORT == 465, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Dibuja una línea horizontal gris
const generateHr = (doc, y) => {
    doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
};

// Dibuja una fila de la tabla alineando los textos
const generateTableRow = (doc, y, item, qty, unitCost, lineTotal, isHeader = false) => {
    doc.fontSize(10)
       .fillColor(isHeader ? "#6b7280" : "#111827")
       .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
       .text(item, 50, y, { width: 230, align: 'left' })
       .text(qty, 290, y, { width: 50, align: 'center' })
       .text(unitCost, 360, y, { width: 80, align: 'right' })
       .text(lineTotal, 460, y, { width: 90, align: 'right' });
};

// 2. Función para generar el PDF en la memoria (Buffer)
const buildInvoicePDF = (orderData) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const shortOrderId = orderData.order_id.split('-')[0].toUpperCase();
        
        // 1. CABECERA (Logo / Nombre de Tienda)
        doc.fillColor("#000000")
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('WAZY CORP', 50, 57)
           .fontSize(10)
           .font('Helvetica')
           .fillColor("#6b7280")
           .text('Comprobante de Pedido', 50, 85);

        // 2. DATOS DEL PEDIDO Y CLIENTE
        doc.fillColor("#111827").fontSize(10);
        
        // Columna Izquierda (Cliente)
        doc.font('Helvetica-Bold').text('Facturar a:', 50, 130);
        doc.font('Helvetica').text(`${orderData.customer.first_name} ${orderData.customer.last_name}`, 50, 145);
        doc.text(`DNI: ${orderData.customer.dni}`, 50, 160);
        doc.text(`${orderData.customer.address}`, 50, 175);
        doc.text(`${orderData.customer.district}, ${orderData.customer.province}`, 50, 190);

        // Columna Derecha (Pedido)
        doc.font('Helvetica-Bold').text('Pedido #:', 380, 130, { width: 80, align: 'right' });
        doc.font('Helvetica').text(shortOrderId, 470, 130, { align: 'left' });
        
        doc.font('Helvetica-Bold').text('Fecha:', 380, 145, { width: 80, align: 'right' });
        doc.font('Helvetica').text(new Date().toLocaleDateString(), 470, 145, { align: 'left' });
        
        doc.font('Helvetica-Bold').text('Estado:', 380, 160, { width: 80, align: 'right' });
        doc.font('Helvetica').text('Pendiente de Pago', 470, 160, { align: 'left' });

        // 3. LA TABLA DE PRODUCTOS
        let invoiceTableTop = 250;

        // Encabezado de la tabla
        generateHr(doc, invoiceTableTop - 5);
        generateTableRow(doc, invoiceTableTop, 'PRODUCTO', 'CANT.', 'PRECIO UNIT.', 'SUBTOTAL', true);
        generateHr(doc, invoiceTableTop + 15);

        // Filas de productos
        let position = invoiceTableTop + 25;
        
        orderData.items.forEach(item => {
            const productName = item.name || 'Producto';
            const unitPrice = `S/ ${Number(item.unit_price).toFixed(2)}`;
            const subtotal = `S/ ${(item.quantity * item.unit_price).toFixed(2)}`;

            generateTableRow(doc, position, productName, item.quantity.toString(), unitPrice, subtotal);
            generateHr(doc, position + 15); // Línea divisoria entre productos
            
            position += 25; // Bajamos 25px para la siguiente fila
        });

        // 4. TOTALES
        const subtotalPosition = position + 15;
        doc.font('Helvetica-Bold')
           .fillColor("#111827")
           .text('TOTAL A PAGAR:', 290, subtotalPosition, { width: 150, align: 'right' })
           .fontSize(14)
           .text(`S/ ${orderData.total_amount.toFixed(2)}`, 460, subtotalPosition - 2, { width: 90, align: 'right' });

        // 5. PIE DE PÁGINA (Instrucciones)
        const footerPosition = subtotalPosition + 80;
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor("#111827")
           .text('Instrucciones de Pago', 50, footerPosition);
           
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor("#4b5563")
           .text('Por favor realiza el depósito o transferencia a las siguientes cuentas:', 50, footerPosition + 20)
           .moveDown(0.5)
           .text('• BCP Cuenta Corriente: 22091364118088')
           .text('• Yape / Plin: 967083352 (A nombre de Juan E. Cunto)')
           .moveDown()
           .text('Una vez realizado el pago, responde a https://wa.me/+51967083352 adjuntando la captura (voucher) y codigo de pedido para enviar tu pedido lo antes posible.');

        // Cerramos el documento
        doc.end();
    });
};

// 3. Función principal para enviar el correo con el PDF adjunto
const sendOrderConfirmationEmail = async (orderData) => {
    try {
        // 1. Generamos el PDF usando Puppeteer
        const pdfBuffer = await buildInvoicePDF(orderData);

        // 2. Leer el HTML del Correo
        const templatePath = path.join(__dirname, '../templates/email/orderReceived.html');
        let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

        // 3. REEMPLAZAMOS SOLO LO NECESARIO (Ya no hay bucle de items HTML aquí)
        htmlTemplate = htmlTemplate
            .replaceAll('{{FIRST_NAME}}', orderData.customer.first_name)
            .replaceAll('{{ORDER_ID}}', orderData.order_id.split('-')[0].toUpperCase())
            .replaceAll('{{TOTAL}}', orderData.total_amount.toFixed(2));

        // 4. Configurar opciones de envío
        const mailOptions = {
            from: `"WAZY CORP" <${process.env.EMAIL_FROM}>`,
            to: orderData.customer.email,
            subject: `Pedido Recibido #${orderData.order_id.split('-')[0].toUpperCase()}`,
            html: htmlTemplate,
            attachments: [
                {
                    filename: `Comprobante_Pedido_${orderData.order_id.split('-')[0].toUpperCase()}.pdf`,
                    content: pdfBuffer 
                }
            ]
        };

        // 5. Enviar el correo
        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado exitosamente a: ${orderData.customer.email}`);

    } catch (error) {
        console.error("Error enviando el correo:", error);
    }
};

module.exports = { sendOrderConfirmationEmail };