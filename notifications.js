// notifications.js: Sistema de alertas y avisos de vencimientos

// Definimos los vencimientos clave según tus categorías
const vencimientosApp = [
    { label: "Cuota mensual", dia: 10, monto: 84100 },
    { label: "Seguro del auto", dia: 22, monto: 50000 }
];

function verificarAlertasVencimiento() {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    
    // Buscamos o creamos un contenedor para las alertas en la interfaz
    let contenedorAlertas = document.getElementById('notifications-container');
    if (!contenedorAlertas) {
        contenedorAlertas = document.createElement('div');
        contenedorAlertas.id = 'notifications-container';
        // Lo insertamos al inicio de la app para que se vea bien arriba
        const mainElement = document.querySelector('main') || document.body;
        mainElement.insertBefore(contenedorAlertas, mainElement.firstChild);
    }

    let alertasHTML = "";

    vencimientosApp.forEach(item => {
        const diasRestantes = item.dia - diaActual;

        // Si vence hoy, mañana (1 día) o pasado mañana (2 días)
        if (diasRestantes === 0) {
            alertasHTML += `<div style="background-color: #fee2e2; border-left: 4px solid #ef4444; color: #b91c1c; padding: 12px; margin-bottom: 10px; border-radius: 4px; font-size: 14px;">
                🚨 <strong>¡Vence HOY!</strong> ${item.label} por $${item.monto.toLocaleString('es-AR')} (Día ${item.dia}).
            </div>`;
        } else if (diasRestantes > 0 && diasRestantes <= 2) {
            alertasHTML += `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; color: #b45309; padding: 12px; margin-bottom: 10px; border-radius: 4px; font-size: 14px;">
                ⚠️ <strong>¡Atención!</strong> ${item.label} vence en ${diasRestantes} días (Día ${item.dia}).
            </div>`;
        }
    });

    contenedorAlertas.innerHTML = alertasHTML;
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    verificarAlertasVencimiento();
});