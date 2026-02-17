// Utilidades para respuestas estandarizadas
export const successResponse = (data, message = 'Success') => ({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
});

export const errorResponse = (message, code = 'INTERNAL_ERROR', details = null) => ({
    success: false,
    error: message,
    code,
    details,
    timestamp: new Date().toISOString()
});

export const paginatedResponse = (data, total, limit, offset) => ({
    success: true,
    data,
    pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
    },
    timestamp: new Date().toISOString()
});

// Middleware para manejo de errores
export const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err);

    // Error de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json(errorResponse(err.message, 'VALIDATION_ERROR', err.details));
    }

    // Error de base de datos
    if (err.code?.startsWith('SQLITE_')) {
        return res.status(500).json(errorResponse('Error de base de datos', 'DATABASE_ERROR'));
    }

    // Error genérico
    res.status(500).json(errorResponse('Error interno del servidor', 'INTERNAL_ERROR'));
};