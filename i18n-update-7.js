const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'src', 'assets', 'i18n');
const esPath = path.join(localesDir, 'es.json');
const enPath = path.join(localesDir, 'en.json');

const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!esData.USER_MGMT) esData.USER_MGMT = {};
esData.USER_MGMT.EDITING = "Editando a";
esData.USER_MGMT.GO_BACK = "Volver";
esData.USER_MGMT.NEW_USER_PH = "Nuevo Usuario (ej: camarero1)";
esData.USER_MGMT.CREATE_USER = "Crear Usuario";
esData.USER_MGMT.PRINTER_ASSIGNED = "🖨️ Impresora Asignada";
esData.USER_MGMT.EDIT = "Editar";
esData.USER_MGMT.SYSTEM = "Sistema";

if (!enData.USER_MGMT) enData.USER_MGMT = {};
enData.USER_MGMT.EDITING = "Editing";
enData.USER_MGMT.GO_BACK = "Go back";
enData.USER_MGMT.NEW_USER_PH = "New user (e.g. waiter1)";
enData.USER_MGMT.CREATE_USER = "Create User";
enData.USER_MGMT.PRINTER_ASSIGNED = "🖨️ Printer Assigned";
enData.USER_MGMT.EDIT = "Edit";
enData.USER_MGMT.SYSTEM = "System";

if (!esData.POS) esData.POS = {};
esData.POS.PRINT_TITLE = "Imprimir";
esData.POS.DELETE_TITLE = "Eliminar";
esData.POS.ITEMS = "items";
esData.POS.CHARGE_ONLY_THIS = "Cobrar solo a este comensal";

if (!enData.POS) enData.POS = {};
enData.POS.PRINT_TITLE = "Print";
enData.POS.DELETE_TITLE = "Delete";
enData.POS.ITEMS = "items";
enData.POS.CHARGE_ONLY_THIS = "Charge only this diner";

fs.writeFileSync(esPath, JSON.stringify(esData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

console.log('Frontend translation files updated with remaining user-management and pos translations.');
