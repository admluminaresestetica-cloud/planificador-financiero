// smart-summary.js: Lógica para los resúmenes inteligentes en tiempo real

function actualizarResumenInteligente() {
    // Buscamos los valores actuales de los inputs o sliders en la interfaz
    const inputFamiliar = document.querySelector('input[data-key="pago_familiar"]') || document.querySelector('#pago_familiar');
    const montoFamiliar = inputFamiliar ? parseFloat(inputFamiliar.value) || 300000 : 300000;
    
    const contenedorResumen = document.getElementById('smart-summary-container');
    if (!contenedorResumen) return;

    // Lógica dinámica basada en los montos actuales
    let textoDinamico = "";
    
    if (montoFamiliar === 300000) {
        textoDinamico = `Destinando <strong>$300.000 mensuales</strong> a tu familiar, terminás de saldar los <strong>$600.000</strong> al finalizar enero. A partir de febrero liberarás ese monto y en marzo también liberarás la cuota de $84.100.`;
    } else if (montoFamiliar > 0) {
        let mesesRestantes = Math.ceil(600000 / montoFamiliar);
        textoDinamico = `Destinando <strong>$${montoFamiliar.toLocaleString('es-AR')} mensuales</strong> a tu familiar, terminarás de saldar el préstamo en aproximadamente ${mesesRestantes} meses.`;
    } else {
        textoDinamico = `No tenés cuotas de préstamos familiares asignadas por el momento. ¡Todo ese margen queda libre para ahorro!`;
    }

    // Inyectamos el resultado en el contenedor visual
    contenedorResumen.innerHTML = `
        <div style="border-left: 4px solid #3b82f6; background-color: #f8fafc; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.5;">
                ${textoDinamico}
            </p>
        </div>
    `;
}

// Ejecutar al cargar y cada vez que cambien los valores
document.addEventListener('DOMContentLoaded', () => {
    actualizarResumenInteligente();
    
    // Escuchar cambios en los inputs para actualizar en tiempo real
    document.addEventListener('input', (e) => {
        if (e.target.matches('input[type="range"], input[type="number"]')) {
            actualizarResumenInteligente();
        }
    });
});