const multer = require('multer');

// Usamos la memoria del servidor para almacenar la imagen temporalmente
const storage = multer.memoryStorage();

// Filtro opcional: Para asegurarnos de que solo suban imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por imagen
});

module.exports = upload;