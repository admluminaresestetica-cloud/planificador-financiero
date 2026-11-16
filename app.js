const STORAGE_KEY = "planificador_modular_v4";

const DEFAULT_STATE = {
  dailyIncome: 50000,
  daysWorked: 20,
  extraIncomes: [], // Lista para guardar ingresos inesperados
  categories: []
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(JSON.stringify(DEFAULT_STATE));
// Asegurar compatibilidad si se actualiza desde una versión anterior
if (!state.extraIncomes) state.extraIncomes = [];

let activeCategoryIndexForModal = null;
let advancedChartInstance = null;

function formatARS(num) {
  const sign = num < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(num)).toLocaleString("es-AR");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetAll() {
  if (confirm("¿Querés borrar todas las categorías, ingresos extras y empezar de cero?")) {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    syncInputsFromState();
    saveState();
    renderExtraIncomes();
    renderCategories();
    updateCalculations();
    checkDueDatesAlerts();
  }
}

function syncInputsFromState() {
  document.getElementById("dailyIncomeInput").value = state.dailyIncome;
  document.getElementById("daysWorkedInput").value = state.daysWorked;
}

// Cálculo total del ingreso mensual (Base diaria + Ingresos extras inesperados)
function getMonthlyIncome() {
  const baseIncome = state.dailyIncome * state.daysWorked;
  const extrasTotal = state.extraIncomes.reduce((acc, item) => acc + item.value, 0);
  return baseIncome + extrasTotal;
}

function onDailyChange(val) {
  state.dailyIncome = Math.max(0, Number(val) || 0);
  saveState();
  updateCalculations();
}

function onDaysChange(val) {
  state.daysWorked = Math.max(0, Number(val) || 0);
  saveState();
  updateCalculations();
}

function setDays(days) {
  state.daysWorked = days;
  document.getElementById("daysWorkedInput").value = days;
  saveState();
  updateCalculations();
}

// --- Gestión de Ingresos Extras / Inesperados ---
function openExtraIncomeModal() {
  document.getElementById("newExtraName").value = "";
  document.getElementById("newExtraAmount").value = 10000;
  document.getElementById("extraIncomeModal").classList.add("active");
  document.getElementById("newExtraName").focus();
}

function closeExtraIncomeModal() {
  document.getElementById("extraIncomeModal").classList.remove("active");
}

function createExtraIncome() {
  const name = document.getElementById("newExtraName").value.trim();
  const amount = Math.max(0, Number(document.getElementById("newExtraAmount").value) || 0);

  if (!name) {
    alert("Ingresá un concepto para el ingreso extra.");
    return;
  }

  state.extraIncomes.push({
    id: "ext_" + Date.now(),
    label: name,
    value: amount
  });

  saveState();
  closeExtraIncomeModal();
  renderExtraIncomes();
  updateCalculations();
}

function deleteExtraIncome(index) {
  state.extraIncomes.splice(index, 1);
  saveState();
  renderExtraIncomes();
  updateCalculations();
}

function renderExtraIncomes() {
  const container = document.getElementById("extraIncomesContainer");
  container.innerHTML = "";

  if (state.extraIncomes.length === 0) {
    container.innerHTML = `<div style="font-size: 0.82rem; color: #15803d; font-style: italic;">No hay ingresos extras cargados este mes.</div>`;
    return;
  }

  state.extraIncomes.forEach((item, idx) => {
    const row = document.createElement("div");
    row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; border: 1px solid #dcfce7;";
    row.innerHTML = `
      <div style="font-size: 0.88rem; font-weight: 500; color: #166534;">${item.label}</div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-weight: 700; color: #15803d; font-size: 0.92rem;">+ ${formatARS(item.value)}</span>
        <button class="btn-icon-del" onclick="deleteExtraIncome(${idx})" title="Eliminar ingreso">✕</button>
      </div>
    `;
    container.appendChild(row);
  });
}

// --- Gestión de Categorías ---
function openCategoryModal() {
  document.getElementById("newCatName").value = "";
  document.getElementById("newCatAmount").value = 50000;
  document.getElementById("newCatDueDay").value = "";
  document.getElementById("categoryModal").classList.add("active");
  document.getElementById("newCatName").focus();
}

function closeCategoryModal() {
  document.getElementById("categoryModal").classList.remove("active");
}

function createCategory() {
  const name = document.getElementById("newCatName").value.trim();
  const amount = Math.max(0, Number(document.getElementById("newCatAmount").value) || 0);
  const dueDay = Number(document.getElementById("newCatDueDay").value) || 0;
  const color = document.getElementById("newCatColor").value;

  if (!name) {
    alert("Ingresá un nombre para la categoría.");
    return;
  }

  state.categories.push({
    id: "cat_" + Date.now(),
    label: name,
    color: color,
    open: true,
    fields: [
      {
        id: "item_" + Date.now(),
        label: name,
        value: amount,
        dueDay: dueDay > 0 ? dueDay : null,
        min: 0,
        max: Math.max(amount * 2, 100000),
        step: 500
      }
    ]
  });

  saveState();
  closeCategoryModal();
  renderCategories();
  updateCalculations();
  checkDueDatesAlerts();
}

function deleteCategory(catIdx, event) {
  event.stopPropagation();
  if (confirm(`¿Eliminar la categoría "${state.categories[catIdx].label}" y todos sus gastos?`)) {
    state.categories.splice(catIdx, 1);
    saveState();
    renderCategories();
    updateCalculations();
    checkDueDatesAlerts();
  }
}

function toggleCategory(catIdx) {
  state.categories[catIdx].open = !state.categories[catIdx].open;
  saveState();
  const card = document.getElementById(`cat-card-${catIdx}`);
  if (card) {
    card.classList.toggle("collapsed", !state.categories[catIdx].open);
  }
}

// --- Gestión de Ítems ---
function openItemModal(catIdx) {
  activeCategoryIndexForModal = catIdx;
  const catName = state.categories[catIdx].label;
  document.getElementById("itemModalTitle").textContent = `Agregar gasto en "${catName}"`;
  document.getElementById("newItemName").value = "";
  document.getElementById("newItemAmount").value = 0;
  document.getElementById("newItemDueDay").value = "";
  document.getElementById("newItemMax").value = 200000;
  document.getElementById("itemModal").classList.add("active");
  document.getElementById("newItemName").focus();
}

function closeItemModal() {
  document.getElementById("itemModal").classList.remove("active");
  activeCategoryIndexForModal = null;
}

function createItem() {
  if (activeCategoryIndexForModal === null) return;

  const name = document.getElementById("newItemName").value.trim();
  const amount = Math.max(0, Number(document.getElementById("newItemAmount").value) || 0);
  const dueDay = Number(document.getElementById("newItemDueDay").value) || 0;
  const maxVal = Math.max(amount, Number(document.getElementById("newItemMax").value) || 100000);

  if (!name) {
    alert("Ingresá un nombre para el gasto.");
    return;
  }

  state.categories[activeCategoryIndexForModal].fields.push({
    id: "item_" + Date.now(),
    label: name,
    value: amount,
    dueDay: dueDay > 0 ? dueDay : null,
    min: 0,
    max: maxVal,
    step: 500
  });

  state.categories[activeCategoryIndexForModal].open = true;
  saveState();
  closeItemModal();
  renderCategories();
  updateCalculations();
  checkDueDatesAlerts();
}

function deleteItem(catIdx, fieldIdx) {
  state.categories[catIdx].fields.splice(fieldIdx, 1);
  saveState();
  renderCategories();
  updateCalculations();
  checkDueDatesAlerts();
}

function onFieldChange(catIdx, fieldIdx, newVal, source) {
  const val = Math.max(0, Number(newVal) || 0);
  state.categories[catIdx].fields[fieldIdx].value = val;
  saveState();

  if (source === "slider") {
    document.getElementById(`num-${catIdx}-${fieldIdx}`).value = val;
  } else {
    const slider = document.getElementById(`slider-${catIdx}-${fieldIdx}`);
    if (slider) {
      if (val > Number(slider.max)) slider.max = val;
      slider.value = val;
    }
  }
  updateCalculations();
}

// --- Alertas de Vencimiento ---
function checkDueDatesAlerts() {
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.innerHTML = "";

  const today = new Date().getDate();
  let warnings = [];

  state.categories.forEach(cat => {
    cat.fields.forEach(f => {
      if (f.dueDay) {
        const diff = f.dueDay - today;
        if (diff === 0) {
          warnings.push(`⚠️ <strong>¡Hoy vence!</strong> "${f.label}" por <strong>${formatARS(f.value)}</strong> (Día ${f.dueDay}).`);
        } else if (diff > 0 && diff <= 2) {
          warnings.push(`🔔 <strong>Vence en ${diff} ${diff === 1 ? 'día' : 'días'}</strong>: "${f.label}" (Día ${f.dueDay}) - ${formatARS(f.value)}.`);
        }
      }
    });
  });

  if (warnings.length > 0) {
    const alertBox = document.createElement("div");
    alertBox.className = "alert-box";
    alertBox.innerHTML = `
      <div class="alert-title">📢 Alertas de Vencimiento</div>
      <ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul>
    `;
    alertContainer.appendChild(alertBox);
  }
}

// --- Renderizado y Gráficos Avanzados con Chart.js ---
function renderCategories() {
  const container = document.getElementById("categoriesContainer");
  const emptyState = document.getElementById("emptyState");
  container.innerHTML = "";

  if (state.categories.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  state.categories.forEach((cat, cIdx) => {
    const card = document.createElement("div");
    card.className = "category-card" + (cat.open ? "" : " collapsed");
    card.id = `cat-card-${cIdx}`;

    let fieldsHTML = "";
    cat.fields.forEach((f, fIdx) => {
      const maxVal = Math.max(f.max, f.value, 1000);
      const dueBadge = f.dueDay ? `<span class="badge-due" title="Fecha de vencimiento">📅 Vence el ${f.dueDay}</span>` : "";
      fieldsHTML += `
        <div class="field-row">
          <div class="field-top">
            <div class="field-info-left">
              <span class="field-label">${f.label}</span>
              ${dueBadge}
            </div>
            <div class="field-controls">
              <div class="field-num-wrap">
                <span>$</span>
                <input
                  type="number"
                  class="field-num-input"
                  id="num-${cIdx}-${fIdx}"
                  value="${f.value}"
                  step="${f.step}"
                  min="0"
                  oninput="onFieldChange(${cIdx}, ${fIdx}, this.value, 'number')"
                />
              </div>
              <button class="btn-icon-del" onclick="deleteItem(${cIdx}, ${fIdx})" title="Eliminar gasto">✕</button>
            </div>
          </div>
          <input
            type="range"
            id="slider-${cIdx}-${fIdx}"
            min="${f.min}"
            max="${maxVal}"
            step="${f.step}"
            value="${f.value}"
            style="accent-color: ${cat.color};"
            oninput="onFieldChange(${cIdx}, ${fIdx}, this.value, 'slider')"
          />
        </div>
      `;
    });

    card.innerHTML = `
      <div class="category-header" onclick="toggleCategory(${cIdx})">
        <div class="cat-left">
          <span class="dot" style="background: ${cat.color};"></span>
          <span>${cat.label}</span>
        </div>
        <div class="cat-right">
          <span id="cat-total-${cIdx}">$0</span>
          <button class="btn-icon-del" onclick="deleteCategory(${cIdx}, event)" title="Eliminar categoría">✕</button>
          <span class="chevron">▼</span>
        </div>
      </div>
      <div class="category-body">
        <div class="category-actions-bar">
          <button class="btn btn-sm" onclick="openItemModal(${cIdx})">+ Agregar Gasto Adicional</button>
        </div>
        ${fieldsHTML}
      </div>
    `;
    container.appendChild(card);
  });
}

function updateCalculations() {
  const monthlyIncome = getMonthlyIncome();

  let totalExpenses = 0;
  const catTotals = state.categories.map((cat, cIdx) => {
    const sum = cat.fields.reduce((acc, f) => acc + f.value, 0);
    totalExpenses += sum;
    const el = document.getElementById(`cat-total-${cIdx}`);
    if (el) el.textContent = formatARS(sum);
    return { label: cat.label, color: cat.color, total: sum };
  });

  const margin = monthlyIncome - totalExpenses;
  const ratio = monthlyIncome > 0 ? ((margin / monthlyIncome) * 100).toFixed(1) : 0;
  const daysNeeded = state.dailyIncome > 0 ? (totalExpenses / state.dailyIncome).toFixed(1) : 0;

  // Actualizar tarjetas superiores
  const boxMargen = document.getElementById("boxMargen");
  boxMargen.className = "metric-box " + (margin >= 0 ? "highlight" : "negative");
  document.getElementById("valMargen").textContent = formatARS(margin);
  document.getElementById("valRatio").textContent = margin >= 0
    ? `Margen libre: ${ratio}%`
    : `Faltante mensual: ${formatARS(Math.abs(margin))}`;

  document.getElementById("valTotalGastos").textContent = formatARS(totalExpenses);
  document.getElementById("valDiasNecesarios").textContent = `Equivale a ${daysNeeded} días de trabajo`;

  document.getElementById("valIngresoHero").textContent = formatARS(monthlyIncome);
  document.getElementById("valSubIngreso").textContent = `Base laboral + Extras`;

  document.getElementById("labelPctUsado").textContent = monthlyIncome > 0
    ? `${((totalExpenses / monthlyIncome) * 100).toFixed(0)}% del ingreso`
    : "Sin ingreso cargado";

  // Actualizar Gráfico Avanzado de Chart.js
  updateAdvancedChart(catTotals, margin);
}

function updateAdvancedChart(catTotals, margin) {
  const ctx = document.getElementById("advancedPieChart").getContext("2d");

  let labels = catTotals.map(c => c.label);
  let data = catTotals.map(c => c.total);
  let backgroundColors = catTotals.map(c => c.color);

  if (margin > 0) {
    labels.push("Margen Libre / Ahorro");
    data.push(margin);
    backgroundColors.push("#10b981");
  }

  if (advancedChartInstance) {
    advancedChartInstance.destroy();
  }

  advancedChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: 11,
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// Inicialización
syncInputsFromState();
renderExtraIncomes();
renderCategories();
updateCalculations();
checkDueDatesAlerts();