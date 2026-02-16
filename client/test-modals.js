// Script de prueba para verificar que todos los modales y elementos existan
console.log('=== VERIFICACIÓN DE MODALES ===');

const modals = [
    'product-modal',
    'category-modal',
    'customer-modal',
    'return-modal',
    'closing-modal',
    'invoice-detail-modal',
    'user-modal'
];

const buttons = [
    'add-product-btn',
    'cancel-product-btn',
    'add-category-btn',
    'cancel-category-btn',
    'add-customer-btn',
    'cancel-customer-btn',
    'add-return-btn',
    'cancel-return-btn',
    'open-closing-modal-btn',
    'cancel-closing-btn'
];

const forms = [
    'product-form',
    'category-form',
    'customer-form',
    'return-form',
    'closing-form'
];

console.log('\n--- MODALES ---');
modals.forEach(id => {
    const el = document.getElementById(id);
    console.log(`${id}: ${el ? '✅' : '❌'}`);
});

console.log('\n--- BOTONES ---');
buttons.forEach(id => {
    const el = document.getElementById(id);
    console.log(`${id}: ${el ? '✅' : '❌'}`);
});

console.log('\n--- FORMULARIOS ---');
forms.forEach(id => {
    const el = document.getElementById(id);
    console.log(`${id}: ${el ? '✅' : '❌'}`);
});

console.log('\n=== FIN VERIFICACIÓN ===');
