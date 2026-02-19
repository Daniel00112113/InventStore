-- Migración para agregar campos faltantes a la tabla products
-- Ejecutar solo si los campos no existen

-- Agregar campo presentation
ALTER TABLE products ADD COLUMN presentation TEXT DEFAULT 'unidad';

-- Agregar campo unit_type
ALTER TABLE products ADD COLUMN unit_type TEXT;

-- Agregar campo units_per_pack
ALTER TABLE products ADD COLUMN units_per_pack INTEGER;

-- Agregar campo pack_price
ALTER TABLE products ADD COLUMN pack_price REAL;

-- Agregar campo wholesale_quantity
ALTER TABLE products ADD COLUMN wholesale_quantity INTEGER;

-- Agregar campo wholesale_price
ALTER TABLE products ADD COLUMN wholesale_price REAL;