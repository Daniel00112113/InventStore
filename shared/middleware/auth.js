// Middleware compartido para microservicios
export const extractUserContext = (req, res, next) => {
    // Extraer contexto del usuario desde headers del gateway
    req.user = {
        userId: req.headers['x-user-id'],
        storeId: req.headers['x-store-id'],
        role: req.headers['x-user-role'],
        userType: req.headers['x-user-type']
    };

    next();
};

export const validateTenant = (req, res, next) => {
    const { storeId, userType } = req.user;

    // Super admin puede acceder a todo
    if (userType === 'super_admin') {
        return next();
    }

    // Usuarios normales necesitan storeId
    if (!storeId) {
        return res.status(403).json({
            error: 'Acceso denegado: Store ID requerido',
            timestamp: new Date().toISOString()
        });
    }

    req.storeId = parseInt(storeId);
    next();
};

export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const { role, userType } = req.user;

        // Super admin siempre tiene acceso
        if (userType === 'super_admin') {
            return next();
        }

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                error: 'Acceso denegado: Rol insuficiente',
                required: allowedRoles,
                current: role,
                timestamp: new Date().toISOString()
            });
        }

        next();
    };
};