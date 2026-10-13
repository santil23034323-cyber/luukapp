/* =========================================================
   LukApp · exportService.js
   ========================================================= */

export function exportToCSV(rows, filename = 'lukapp-export.csv') {
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('No hay datos para exportar.');
    }

    const headers = Object.keys(rows[0]);
    const lines = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => headers.map(header => escapeCSV(row[header])).join(','))
    ];

    downloadBlob(
        '\uFEFF' + lines.join('\r\n'),
        filename,
        'text/csv;charset=utf-8;'
    );
}

export function exportMovementsToCSV(movements, filename = 'lukapp-movimientos.csv') {
    const rows = movements.map(item => ({
        Descripcion: item.description ?? '',
        Tipo: item.type ?? '',
        Categoria: item.category ?? '',
        Fecha: item.date ?? '',
        Monto: item.amount ?? 0,
        Estado: item.status ?? ''
    }));

    exportToCSV(rows, filename);
}

export function printTableAsPDF({
    title = 'Reporte financiero · LukApp',
    tableSelector = '.data-table',
    subtitle = '',
    filename = 'lukapp-reporte'
} = {}) {
    const table = document.querySelector(tableSelector);
    if (!table) throw new Error('No se encontró la tabla para exportar.');

    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) throw new Error('El navegador bloqueó la ventana de impresión.');

    const clone = table.cloneNode(true);
    clone.querySelectorAll('.th-checkbox, .th-actions').forEach(el => el.remove());
    clone.querySelectorAll('tbody tr').forEach(row => {
        row.querySelectorAll('td:first-child, td:last-child').forEach(cell => cell.remove());
    });

    win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHTML(filename)}</title><style>
        *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:32px}h1{margin:0 0 5px;font-size:24px}.subtitle{margin-bottom:22px;color:#666;font-size:13px}table{width:100%;border-collapse:collapse}th,td{padding:9px;border-bottom:1px solid #ddd;text-align:left;font-size:11px}th{background:#f2f2f2}.footer{margin-top:20px;color:#777;font-size:10px}@media print{body{padding:0}@page{margin:15mm}}
    </style></head><body><h1>${escapeHTML(title)}</h1>${subtitle ? `<div class="subtitle">${escapeHTML(subtitle)}</div>` : ''}${clone.outerHTML}<div class="footer">Generado por LukApp</div></body></html>`);

    win.document.close();
    win.document.title = filename;
    win.focus();
    win.setTimeout(() => {
        win.print();
        win.close();
    }, 300);
}

export function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function escapeCSV(value) {
    return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}