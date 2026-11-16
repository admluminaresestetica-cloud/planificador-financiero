// notifications.js: Sistema de alertas y avisos de vencimientos

const vencimientosApp = [
    { label: "Cuota mensual (vence el 10)", dia: 10, monto: 84100 },
    { label: "Seguro (vence el 22)", dia: 22, monto: 50000 }
];

function verificarAlertasVencimiento() {
    // Usamos el id="alertContainer" que ya tenés en tu index.html
    const contenedorAlertas = document.getElementById('alertContainer');
    if (!contenedorAlertas) return;

    const hoy = new Date();
    const diaActual = hoy.getDate();
    let alertasHTML = "";

    vencimientosApp.forEach(item => {
        const diasRestantes = item.dia - diaActual;

        if (diasRestantes === 0) {
            alertasHTML += `
                <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; color: #b91c1c; padding: 12px; margin-bottom: 10px; border-radius: 6px; font-size: 14px;">
                    🚨 <strong>¡Vence HOY!</strong> ${item.label} por $${item.monto.toLocaleString('es-AR')}.
                </div>`;
        } else if (diasRestantes > 0 && diasRestantes <= 3) {
            alertasHTML += `
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; color: #b45309; padding: 12px; margin-bottom: 10px; border-radius: 6px; font-size: 14px;">
                    ⚠️ <strong>¡Atención!</strong> ${item.label} vence en ${diasRestantes} días.
                </div>`;
        }
    });

    contenedorAlertas.innerHTML = alertasHTML;
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    verificarAlertasVencimiento();
});