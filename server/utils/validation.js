// Utilidades de validación y sanitización

export function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone);
}

export function validateNumber(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

export function validateInteger(value, min = 0, max = Infinity) {
    const num = parseInt(value);
    return Number.isInteger(num) && num >= min && num <= max;
}

export function validateRequired(value) {
    return value !== null && value !== undefined && value !== '';
}

export function validateLength(str, min = 0, max = Infinity) {
    if (typeof str !== 'string') return false;
    return str.length >= min && str.length <= max;
}

export function validateDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
}

export function validatePaymentType(type) {
    return ['efectivo', 'fiado', 'mixto', 'multiple'].includes(type);
}

export function sanitizeProduct(data) {
    return {
        name: sanitizeString(data.name),
        barcode: data.barcode ? sanitizeString(data.barcode) : null,
        categoryId: data.categoryId || null,
        costPrice: parseFloat(data.costPrice) || 0,
        salePrice: parseFloat(data.salePrice) || 0,
        stock: parseInt(data.stock) || 0,
        minStock: parseInt(data.minStock) || 5,
        unitType: data.unitType ? sanitizeString(data.unitType) : null,
        unitsPerPack: data.unitsPerPack ? parseInt(data.unitsPerPack) : null,
        packPrice: data.packPrice ? parseFloat(data.packPrice) : null,
        wholesaleQuantity: data.wholesaleQuantity ? parseInt(data.wholesaleQuantity) : null,
        wholesalePrice: data.wholesalePrice ? parseFloat(data.wholesalePrice) : null
    };
}

export function validateProduct(data) {
    const errors = [];

    if (!validateRequired(data.name)) {
        errors.push('El nombre es requerido');
    }
    if (!validateLength(data.name, 1, 200)) {
        errors.push('El nombre debe tener entre 1 y 200 caracteres');
    }
    if (!validateNumber(data.costPrice, 0)) {
        errors.push('El precio de costo debe ser un número positivo');
    }
    if (!validateNumber(data.salePrice, 0)) {
        errors.push('El precio de venta debe ser un número positivo');
    }
    if (data.salePrice < data.costPrice) {
        errors.push('El precio de venta no puede ser menor al costo');
    }
    if (!validateInteger(data.stock, 0)) {
        errors.push('El stock debe ser un número entero positivo');
    }
    if (!validateInteger(data.minStock, 0)) {
        errors.push('El stock mínimo debe ser un número entero positivo');
    }

    return errors;
}

export function sanitizeCustomer(data) {
    return {
        name: sanitizeString(data.name),
        phone: data.phone ? sanitizeString(data.phone) : null,
        address: data.address ? sanitizeString(data.address) : null
    };
}

export function validateCustomer(data) {
    const errors = [];

    if (!validateRequired(data.name)) {
        errors.push('El nombre es requerido');
    }
    if (!validateLength(data.name, 1, 200)) {
        errors.push('El nombre debe tener entre 1 y 200 caracteres');
    }
    if (data.phone && !validatePhone(data.phone)) {
        errors.push('El teléfono tiene un formato inválido');
    }

    return errors;
}

export function validateSale(data) {
    const errors = [];

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push('Debe incluir al menos un producto');
    }

    if (!validatePaymentType(data.paymentType)) {
        errors.push('Tipo de pago inválido');
    }

    if ((data.paymentType === 'fiado' || data.paymentType === 'mixto') && !data.customerId) {
        errors.push('Cliente requerido para venta fiada o mixta');
    }

    if (data.paymentType === 'mixto') {
        if (!validateNumber(data.cashAmount, 0)) {
            errors.push('Monto en efectivo inválido');
        }
        if (!validateNumber(data.creditAmount, 0)) {
            errors.push('Monto a crédito inválido');
        }
    }

    return errors;
}
