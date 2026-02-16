-- Agregar campo de presentación a productos
ALTER TABLE products ADD COLUMN presentation TEXT DEFAULT 'unidad';

-- Índice para búsquedas por presentación
CREATE INDEX IF NOT EXISTS idx_products_presentation ON products(store_id, presentation);
