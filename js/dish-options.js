/* ==========================================================
   MODAL "PERSONALIZA TU PLATO" — opciones de un plato
========================================================== */
/* ==========================================================
   MODAL "PERSONALIZA TU PLATO" — opciones obligatorias/opcionales
   Se abre al tocar "Agregar" en un plato que tiene `options`
   (ej: menú con entrada/plato/bebida a elegir, hamburguesa con
   gaseosa incluida, sabor de las alitas, etc). No deja agregar al
   carrito hasta que todos los grupos obligatorios tengan su
   selección mínima.
========================================================== */
const optionsBackdrop = document.getElementById('options-backdrop');
const optionsBody = document.getElementById('options-body');
const optionsFoot = document.getElementById('options-foot');
const optionsDishName = document.getElementById('options-dish-name');
let optionsCtx = null;

function openOptionsModal(rid, did){
  const restaurant = findRestaurant(rid);
  const dish = restaurant?.dishes.find(d => d.id === did);
  if(!dish) return;
  optionsCtx = {
    rid, did, dish, qty: 1,
    groupState: (dish.options || []).map(g => ({ groupId: g.id, choiceIds: new Set() }))
  };
  optionsDishName.textContent = dish.name;
  renderOptionsModal();
  optionsBackdrop.classList.add('open');
}
function closeOptionsModal(){
  optionsBackdrop.classList.remove('open');
  optionsCtx = null;
}
document.getElementById('options-close').addEventListener('click', closeOptionsModal);
optionsBackdrop.addEventListener('click', (e) => { if(e.target === optionsBackdrop) closeOptionsModal(); });

function renderOptionsModal(){
  if(!optionsCtx) return;
  const { dish, groupState } = optionsCtx;

  optionsBody.innerHTML = `
    <div class="opt-dish-head">
      <img src="${dish.image}" alt="${dish.name}" onerror="this.style.display='none'">
      <div>
        <h4>${dish.name}</h4>
        <p class="opt-dish-desc">${dish.desc}</p>
        <span class="dish-price">${fmtMoney(dish.price)}</span>
      </div>
    </div>
    ${(dish.options || []).map(group => {
      const state = groupState.find(s => s.groupId === group.id);
      const isMulti = (group.max || 1) > 1;
      const countLabel = group.required
        ? (isMulti ? `Elige ${group.min || 1}${group.max && group.max !== (group.min || 1) ? ` a ${group.max}` : ''}` : 'Elige 1')
        : (isMulti ? `Opcional · hasta ${group.max || group.choices.length}` : 'Opcional');
      return `
      <div class="opt-group" data-group="${group.id}">
        <div class="opt-group-head">
          <h5>${group.title}${group.required ? ' <span class="opt-required">· obligatorio</span>' : ''}</h5>
          <span class="opt-count">${countLabel}</span>
        </div>
        <div class="opt-choices">
          ${group.choices.map(choice => {
            const checked = state.choiceIds.has(choice.id);
            return `
            <label class="opt-choice ${checked ? 'checked' : ''}">
              <input type="${isMulti ? 'checkbox' : 'radio'}" name="opt-${group.id}" value="${choice.id}" ${checked ? 'checked' : ''}>
              <span class="opt-choice-label">${choice.label}</span>
              ${choice.priceDelta ? `<span class="opt-choice-price">+${fmtMoney(choice.priceDelta)}</span>` : ''}
            </label>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  `;

  optionsBody.querySelectorAll('.opt-group').forEach(groupEl => {
    const groupId = groupEl.dataset.group;
    const group = dish.options.find(g => g.id === groupId);
    const state = groupState.find(s => s.groupId === groupId);
    const isMulti = (group.max || 1) > 1;
    groupEl.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        if(isMulti){
          if(input.checked){
            if(group.max && state.choiceIds.size >= group.max){
              input.checked = false;
              return;
            }
            state.choiceIds.add(input.value);
          } else {
            state.choiceIds.delete(input.value);
          }
        } else {
          state.choiceIds = new Set([input.value]);
        }
        renderOptionsModal();
      });
    });
  });

  renderOptionsFoot();
}

function optionsAreValid(){
  if(!optionsCtx) return false;
  return (optionsCtx.dish.options || []).every(group => {
    if(!group.required) return true;
    const state = optionsCtx.groupState.find(s => s.groupId === group.id);
    return state.choiceIds.size >= (group.min || 1);
  });
}
function optionsUnitPrice(){
  const { dish, groupState } = optionsCtx;
  let total = dish.price;
  (dish.options || []).forEach(group => {
    const state = groupState.find(s => s.groupId === group.id);
    state.choiceIds.forEach(cid => {
      const choice = group.choices.find(c => c.id === cid);
      if(choice) total += choice.priceDelta || 0;
    });
  });
  return total;
}
function renderOptionsFoot(){
  const valid = optionsAreValid();
  const unitPrice = optionsUnitPrice();
  const { qty } = optionsCtx;
  optionsFoot.innerHTML = `
    <div class="opt-foot-row">
      <div class="stepper opt-qty-stepper">
        <button type="button" id="opt-qty-dec">−</button>
        <span class="qty">${qty}</span>
        <button type="button" id="opt-qty-inc">+</button>
      </div>
      <button class="btn btn-primary" id="opt-add-btn" type="button" ${valid ? '' : 'disabled'}>
        Agregar · ${fmtMoney(unitPrice * qty)}
      </button>
    </div>
    ${!valid ? `<p class="opt-warning">⚠️ Falta elegir una opción obligatoria</p>` : ''}
  `;
  document.getElementById('opt-qty-dec').addEventListener('click', () => {
    optionsCtx.qty = Math.max(1, optionsCtx.qty - 1);
    renderOptionsFoot();
  });
  document.getElementById('opt-qty-inc').addEventListener('click', () => {
    optionsCtx.qty += 1;
    renderOptionsFoot();
  });
  document.getElementById('opt-add-btn').addEventListener('click', () => {
    if(!optionsAreValid()) return;
    const selections = (optionsCtx.dish.options || []).map(group => {
      const state = optionsCtx.groupState.find(s => s.groupId === group.id);
      return {
        groupId: group.id,
        groupTitle: group.title,
        choices: [...state.choiceIds].map(cid => group.choices.find(c => c.id === cid))
      };
    }).filter(s => s.choices.length > 0);
    changeQty(optionsCtx.rid, optionsCtx.did, optionsCtx.qty, selections);
    closeOptionsModal();
  });
}

