import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant, authenticateExport } from '../middleware/auth.js';

const router = express.Router();

// Exportar reporte simple (sin dependencias externas por ahora)
router.get('/sales-csv', authenticate, validateTenant, (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Fechas requeridas' });
  }

  try {
    const sales = db.prepare(`
      SELECT 
        s.id,
        DATE(s.created_at) as date,
        TIME(s.created_at) as time,
        u.full_name as user_name,
        c.name as customer_name,
        s.total,
        s.payment_type
      FROM sales s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.store_id = ? AND DATE(s.created_at) BETWEEN ? AND ?
      ORDER BY s.created_at DESC
    `).all(req.storeId, startDate, endDate);

    // Generar CSV simple
    let csv = 'ID,Fecha,Hora,Usuario,Cliente,Total,Tipo Pago\n';
    sales.forEach(sale => {
      csv += `${sale.id},${sale.date},${sale.time},${sale.user_name},${sale.customer_name || 'N/A'},${sale.total},${sale.payment_type}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ventas-${startDate}-${endDate}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar Excel (CSV con formato Excel)
router.get('/excel/sales', authenticateExport, (req, res) => {
  const { startDate, endDate } = req.query;
  const storeId = req.user.storeId;

  if (!startDate || !endDate) {
    return res.status(400).send('<h1>Fechas requeridas</h1>');
  }

  try {
    const sales = db.prepare(`
      SELECT 
        s.id,
        DATE(s.created_at) as date,
        TIME(s.created_at) as time,
        u.full_name as user_name,
        c.name as customer_name,
        s.subtotal,
        s.discount,
        s.total,
        s.payment_type
      FROM sales s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.store_id = ? AND DATE(s.created_at) BETWEEN ? AND ?
      ORDER BY s.created_at DESC
    `).all(storeId, startDate, endDate);

    // Generar CSV compatible con Excel
    let csv = '\uFEFF'; // BOM para UTF-8
    csv += 'ID;Fecha;Hora;Usuario;Cliente;Subtotal;Descuento;Total;Tipo Pago\n';
    sales.forEach(sale => {
      csv += `${sale.id};${sale.date};${sale.time};${sale.user_name};${sale.customer_name || 'N/A'};${sale.subtotal};${sale.discount};${sale.total};${sale.payment_type}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=ventas-${startDate}-${endDate}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).send(`<h1>Error al generar Excel</h1><p>${error.message}</p>`);
  }
});

// Exportar PDF (HTML para imprimir como PDF)
router.get('/pdf/sales', authenticateExport, (req, res) => {
  const { startDate, endDate } = req.query;
  const storeId = req.user.storeId;

  if (!startDate || !endDate) {
    return res.status(400).send('<h1>Fechas requeridas</h1>');
  }

  try {
    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);

    const sales = db.prepare(`
      SELECT 
        s.id,
        s.created_at,
        u.full_name as user_name,
        c.name as customer_name,
        s.subtotal,
        s.discount,
        s.total,
        s.payment_type
      FROM sales s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.store_id = ? AND DATE(s.created_at) BETWEEN ? AND ?
      ORDER BY s.created_at DESC
    `).all(storeId, startDate, endDate);

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte de Ventas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .header p { color: #666; }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
    .summary-card p { font-size: 24px; font-weight: bold; color: #333; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #333;
      color: white;
      font-weight: bold;
    }
    tr:hover { background: #f5f5f5; }
    .text-right { text-align: right; }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #333;
      text-align: center;
      color: #666;
    }
    button {
      padding: 12px 24px;
      margin: 20px auto;
      display: block;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }
    button:hover { background: #45a049; }
    @media print {
      button { display: none; }
      body { padding: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${store.name}</h1>
    <p>Reporte de Ventas</p>
    <p>${startDate} al ${endDate}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Ventas</h3>
      <p>${sales.length}</p>
    </div>
    <div class="summary-card">
      <h3>Total Descuentos</h3>
      <p>$${totalDiscount.toLocaleString('es-CO')}</p>
    </div>
    <div class="summary-card">
      <h3>Total Ingresos</h3>
      <p>$${totalSales.toLocaleString('es-CO')}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Fecha</th>
        <th>Usuario</th>
        <th>Cliente</th>
        <th class="text-right">Subtotal</th>
        <th class="text-right">Descuento</th>
        <th class="text-right">Total</th>
        <th>Pago</th>
      </tr>
    </thead>
    <tbody>
      ${sales.map(sale => `
        <tr>
          <td>${sale.id}</td>
          <td>${new Date(sale.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
          <td>${sale.user_name}</td>
          <td>${sale.customer_name || 'N/A'}</td>
          <td class="text-right">$${sale.subtotal.toLocaleString('es-CO')}</td>
          <td class="text-right">$${sale.discount.toLocaleString('es-CO')}</td>
          <td class="text-right">$${sale.total.toLocaleString('es-CO')}</td>
          <td>${sale.payment_type}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generado el ${new Date().toLocaleString('es-CO')}</p>
  </div>

  <button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).send(`<h1>Error al generar reporte</h1><p>${error.message}</p>`);
  }
});

// Ticket simple (HTML para imprimir) - Sin autenticación para permitir impresión en nueva ventana
router.get('/ticket/:saleId', (req, res) => {
  try {
    const sale = db.prepare(`
      SELECT s.*, u.full_name as user_name, c.name as customer_name,
             st.name as store_name, st.address as store_address, st.phone as store_phone
      FROM sales s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN stores st ON s.store_id = st.id
      WHERE s.id = ?
    `).get(req.params.saleId);

    if (!sale) {
      return res.status(404).send('<h1>Venta no encontrada</h1>');
    }

    const items = db.prepare(`
      SELECT si.*, p.name as product_name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(req.params.saleId);

    // Generar HTML mejorado para imprimir
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket #${sale.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace; 
      width: 80mm; 
      margin: 0 auto; 
      padding: 10px;
      font-size: 12px;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { 
      border-top: 1px dashed #000; 
      margin: 8px 0; 
    }
    .header {
      margin-bottom: 10px;
    }
    .header h2 {
      font-size: 16px;
      margin-bottom: 5px;
    }
    .header p {
      font-size: 11px;
      line-height: 1.4;
    }
    .info {
      margin: 8px 0;
      font-size: 11px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }
    .item-name {
      flex: 1;
      padding-right: 10px;
    }
    .item-qty {
      text-align: right;
      min-width: 80px;
    }
    .item-price {
      text-align: right;
      min-width: 60px;
    }
    .totals {
      margin-top: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .total-final {
      font-size: 14px;
      font-weight: bold;
      margin-top: 8px;
    }
    .payment-info {
      margin: 10px 0;
      padding: 8px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 15px;
      font-size: 11px;
    }
    button {
      width: 100%;
      padding: 12px;
      margin-top: 15px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }
    button:hover {
      background: #45a049;
    }
    @media print {
      body { 
        margin: 0; 
        padding: 5mm;
      }
      button { display: none; }
      .payment-info { background: none; }
    }
  </style>
</head>
<body>
  <div class="header center">
    <h2>${sale.store_name}</h2>
    ${sale.store_address ? `<p>${sale.store_address}</p>` : ''}
    ${sale.store_phone ? `<p>Tel: ${sale.store_phone}</p>` : ''}
  </div>
  
  <div class="line"></div>
  
  <div class="info center">
    <p class="bold">TICKET DE VENTA #${sale.id}</p>
    <p>${new Date(sale.created_at).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short'
    })}</p>
  </div>
  
  <div class="line"></div>
  
  <div class="info">
    <p>Atendió: ${sale.user_name}</p>
    ${sale.customer_name ? `<p>Cliente: ${sale.customer_name}</p>` : ''}
  </div>
  
  <div class="line"></div>
  
  <div class="items">
    ${items.map(item => `
      <div class="item-row">
        <div class="item-name">${item.product_name}</div>
      </div>
      <div class="item-row">
        <div class="item-qty">${item.quantity} x $${item.unit_price.toLocaleString('es-CO')}</div>
        <div class="item-price">$${item.subtotal.toLocaleString('es-CO')}</div>
      </div>
    `).join('')}
  </div>
  
  <div class="line"></div>
  
  <div class="totals">
    ${sale.subtotal !== sale.total ? `
      <div class="total-row">
        <span>Subtotal:</span>
        <span>$${sale.subtotal.toLocaleString('es-CO')}</span>
      </div>
      <div class="total-row">
        <span>Descuento:</span>
        <span>-$${sale.discount.toLocaleString('es-CO')}</span>
      </div>
    ` : ''}
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>$${sale.total.toLocaleString('es-CO')}</span>
    </div>
  </div>
  
  <div class="line"></div>
  
  <div class="payment-info center">
    <p class="bold">FORMA DE PAGO</p>
    <p>${sale.payment_type === 'efectivo' ? '💵 EFECTIVO' :
        sale.payment_type === 'fiado' ? '📝 FIADO' :
          '💵📝 MIXTO'}</p>
    ${sale.payment_type === 'mixto' ? `
      <p style="margin-top: 5px;">
        Efectivo: $${(sale.cash_amount || 0).toLocaleString('es-CO')}<br>
        Fiado: $${(sale.credit_amount || 0).toLocaleString('es-CO')}
      </p>
    ` : ''}
    ${sale.payment_type === 'fiado' || sale.credit_amount > 0 ? `
      <p style="margin-top: 5px; color: #d32f2f;">
        ⚠️ Saldo pendiente registrado
      </p>
    ` : ''}
  </div>
  
  <div class="line"></div>
  
  <div class="footer center">
    <p class="bold">¡Gracias por su compra!</p>
    <p style="margin-top: 5px;">Vuelva pronto</p>
  </div>
  
  <button onclick="window.print()">🖨️ Imprimir Ticket</button>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).send(`<h1>Error al generar ticket</h1><p>${error.message}</p>`);
  }
});

export default router;
