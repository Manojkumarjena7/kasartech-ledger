/* =========================================================
   LEDGER — Personal Finance Tracker
   Vanilla JS. Everything persists to localStorage.
   Organized into clearly commented modules below.
   ========================================================= */

/* ============================================================
   1. CONSTANTS
   ============================================================ */
const STORAGE_KEY = 'ledger_app_data_v1';

const CATEGORIES = [
  'Food','Transport','Fuel','Shopping','Rent','Electricity','Internet',
  'Recharge','Medical','Entertainment','Investment','Loan Given',
  'Loan Taken','Loan Returned','Salary','Freelance','Gift','Misc'
];

const CATEGORY_PALETTE = [
  '#4A5CF5','#15A566','#F0791E','#E5484D','#9B5DE5','#00B4D8','#F4A100',
  '#2EC4B6','#EF476F','#118AB2','#8D6E63','#5C6BC0','#26A69A','#D4A017',
  '#06A77D','#C2185B','#7E57C2','#546E7A'
];
const CATEGORY_COLORS = new Map(CATEGORIES.map((c,i)=>[c, CATEGORY_PALETTE[i]]));

const METHODS = ['Cash','Paytm','Slice Card','Credit Card','UPI','Bank','Other'];

const TXN_TYPES = ['expense','income','transfer','receive'];

const QUICK_ADD_PRESETS = [
  { category:'Food', method:'Cash', label:'Food · Cash' },
  { category:'Transport', method:'Cash', label:'Transport · Cash' },
  { category:'Fuel', method:'Credit Card', label:'Fuel · Card' },
  { category:'Recharge', method:'UPI', label:'Recharge · UPI' },
  { category:'Shopping', method:'UPI', label:'Shopping · UPI' },
];

const ICONS = {
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>',
  wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10.5h19"/><circle cx="16.5" cy="14.5" r="1.4"/></svg>',
  tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12.5 3H5a2 2 0 0 0-2 2v7.5a2 2 0 0 0 .6 1.4l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8l-9-9A2 2 0 0 0 12.5 3Z"/><circle cx="8" cy="8" r="1.4"/></svg>',
  trend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>',
  piggy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1h1.5L20 15v3a1 1 0 0 1-1 1h-2v-2H8v2H6a1 1 0 0 1-1-1v-2a5 5 0 0 1-1-3Z"/><circle cx="9" cy="10" r="1"/></svg>',
  flame:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2s-6 5.5-6 11a6 6 0 0 0 12 0c0-1.5-.5-2.5-1-3.5.3 2-1 3-1 3 .5-3-2-5-2-7.5-1 1.5-2 2-2 4Z"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
};

/* ============================================================
   2. STATE
   ============================================================ */
function defaultState(){
  return {
    transactions: [],   // {id,date,amount,type,category,method,notes,createdAt,recurringId?}
    loans: [],          // {id,type,person,amount,paid,interest,dueDate,notes,createdAt}
    recurring: [],       // {id,name,amount,category,method,dayOfMonth,active,lastGeneratedMonth}
    settings: { theme:'light', currency:'₹', monthlyBudget:0 }
  };
}

let state = loadState();
let lastDeleted = null;       // { item, list, index } for undo
let lastDeletedTimer = null;

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : base.transactions,
      loans: Array.isArray(parsed.loans) ? parsed.loans : base.loans,
      recurring: Array.isArray(parsed.recurring) ? parsed.recurring : base.recurring,
      settings: Object.assign(base.settings, parsed.settings || {})
    };
  }catch(err){
    console.error('Failed to load saved data, starting fresh.', err);
    return defaultState();
  }
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(err){
    console.error(err);
    toast('Could not save — your browser storage may be full.');
  }
}

/* ============================================================
   3. UTILITIES
   ============================================================ */
function uid(){
  return (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
}
function pad(n){ return String(n).padStart(2,'0'); }

function todayStr(){ return formatDateLocal(new Date()); }
function formatDateLocal(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function parseLocalDate(str){ const [y,m,d] = str.split('-').map(Number); return new Date(y, m-1, d); }
function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }

function formatCurrency(amount){
  const symbol = state.settings.currency || '₹';
  const locale = symbol === '₹' ? 'en-IN' : 'en-US';
  const sign = amount < 0 ? '−' : '';
  const abs = Math.abs(amount || 0);
  return `${sign}${symbol}${abs.toLocaleString(locale, { maximumFractionDigits: abs % 1 === 0 ? 0 : 2 })}`;
}

function formatDatePretty(str){
  const d = parseLocalDate(str);
  return d.toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' });
}

function escapeHtml(str){
  if(str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function categoryColor(cat){ return CATEGORY_COLORS.get(cat) || '#9BA1AC'; }

function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function startOfWeek(date){
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0,0,0,0);
  return d;
}

/* Returns {from,to} inclusive date strings for a named filter, or null for 'all' */
function getRangeForFilter(filterKey, customFrom, customTo){
  const today = new Date();
  const t = formatDateLocal(today);
  switch(filterKey){
    case 'all': return null;
    case 'today': return { from:t, to:t };
    case 'yesterday': {
      const y = new Date(today); y.setDate(y.getDate()-1);
      const s = formatDateLocal(y); return { from:s, to:s };
    }
    case 'thisWeek': {
      const s = startOfWeek(today);
      const e = new Date(s); e.setDate(e.getDate()+6);
      return { from: formatDateLocal(s), to: formatDateLocal(e) };
    }
    case 'lastWeek': {
      const s = startOfWeek(today); s.setDate(s.getDate()-7);
      const e = new Date(s); e.setDate(e.getDate()+6);
      return { from: formatDateLocal(s), to: formatDateLocal(e) };
    }
    case 'thisMonth': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth()+1, 0);
      return { from: formatDateLocal(s), to: formatDateLocal(e) };
    }
    case 'lastMonth': {
      const s = new Date(today.getFullYear(), today.getMonth()-1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: formatDateLocal(s), to: formatDateLocal(e) };
    }
    case 'thisYear': {
      const s = new Date(today.getFullYear(), 0, 1);
      const e = new Date(today.getFullYear(), 11, 31);
      return { from: formatDateLocal(s), to: formatDateLocal(e) };
    }
    case 'custom':
      if(customFrom && customTo) return { from:customFrom, to:customTo };
      return null;
    default: return null;
  }
}

/* ============================================================
   4. TOASTS
   ============================================================ */
function toast(message, opts = {}){
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  const msg = document.createElement('span');
  msg.textContent = message;
  el.appendChild(msg);
  if(opts.actionLabel && opts.onAction){
    const btn = document.createElement('button');
    btn.textContent = opts.actionLabel;
    btn.onclick = () => { opts.onAction(); dismiss(); };
    el.appendChild(btn);
  }
  container.appendChild(el);
  const duration = opts.duration || 4500;
  const timer = setTimeout(dismiss, duration);
  function dismiss(){
    clearTimeout(timer);
    el.classList.add('leaving');
    setTimeout(()=> el.remove(), 200);
  }
}

/* ============================================================
   5. NAVIGATION
   ============================================================ */
function goToSection(section){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('section-' + section)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === section));
  document.querySelectorAll('.bn-item[data-section]').forEach(n => n.classList.toggle('active', n.dataset.section === section));
  document.getElementById('content').scrollTop = 0;
  closeSidebar();
  if(section === 'analytics'){
    // canvases need a layout pass before Chart.js can size correctly
    requestAnimationFrame(()=> Object.values(charts).forEach(c => c && c.resize()));
  }
}
function openSidebar(){ document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarScrim').classList.add('open'); }
function closeSidebar(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarScrim').classList.remove('open'); }

/* ============================================================
   6. THEME
   ============================================================ */
function applyTheme(){
  document.documentElement.setAttribute('data-theme', state.settings.theme);
  const label = state.settings.theme === 'dark' ? 'Light mode' : 'Dark mode';
  document.getElementById('themeLabel').textContent = label;
}
function toggleTheme(){
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  saveState();
  applyTheme();
  renderCharts(); // re-theme chart colors
}

/* ============================================================
   7. TRANSACTION CRUD
   ============================================================ */
function addOrUpdateTransaction(data){
  const idx = state.transactions.findIndex(t => t.id === data.id);
  if(idx > -1){
    state.transactions[idx] = { ...state.transactions[idx], ...data };
    toast('Transaction updated.');
  }else{
    data.id = uid();
    data.createdAt = Date.now();
    state.transactions.push(data);
    toast('Transaction added.');
  }
  saveState();
  renderAll();
}

function deleteTransaction(id){
  const idx = state.transactions.findIndex(t => t.id === id);
  if(idx === -1) return;
  const [removed] = state.transactions.splice(idx, 1);
  saveState();
  renderAll();
  clearTimeout(lastDeletedTimer);
  lastDeleted = { item: removed, index: idx };
  toast('Transaction deleted.', {
    actionLabel: 'Undo',
    onAction: () => {
      if(!lastDeleted) return;
      state.transactions.splice(Math.min(lastDeleted.index, state.transactions.length), 0, lastDeleted.item);
      saveState(); renderAll();
      lastDeleted = null;
    }
  });
  lastDeletedTimer = setTimeout(()=> lastDeleted = null, 6000);
}

function duplicateTransaction(id){
  const original = state.transactions.find(t => t.id === id);
  if(!original) return;
  const copy = { ...original, id: uid(), createdAt: Date.now() };
  delete copy.recurringId;
  state.transactions.push(copy);
  saveState();
  renderAll();
  toast('Transaction duplicated.');
}

/* ============================================================
   8. RECURRING EXPENSES — auto-generation
   ============================================================ */
function processRecurring(){
  const today = new Date();
  const monthKey = `${today.getFullYear()}-${pad(today.getMonth()+1)}`;
  let created = 0;
  state.recurring.forEach(r => {
    if(!r.active) return;
    if(r.lastGeneratedMonth === monthKey) return;
    if(today.getDate() < r.dayOfMonth) return;
    const day = Math.min(r.dayOfMonth, daysInMonth(today.getFullYear(), today.getMonth()));
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(day)}`;
    state.transactions.push({
      id: uid(), date: dateStr, amount: Number(r.amount), type: 'expense',
      category: r.category, method: r.method, notes: `Recurring — ${r.name}`,
      recurringId: r.id, createdAt: Date.now()
    });
    r.lastGeneratedMonth = monthKey;
    created++;
  });
  if(created > 0){
    saveState();
    toast(`${created} recurring expense${created > 1 ? 's' : ''} added for this month.`);
  }
}

function addOrUpdateRecurring(data){
  const idx = state.recurring.findIndex(r => r.id === data.id);
  if(idx > -1){ state.recurring[idx] = { ...state.recurring[idx], ...data }; toast('Recurring expense updated.'); }
  else{ data.id = uid(); data.active = true; data.lastGeneratedMonth = null; state.recurring.push(data); toast('Recurring expense added.'); }
  saveState(); renderRecurringList();
}
function deleteRecurring(id){
  state.recurring = state.recurring.filter(r => r.id !== id);
  saveState(); renderRecurringList();
  toast('Recurring expense removed.');
}
function toggleRecurringActive(id){
  const r = state.recurring.find(r => r.id === id);
  if(r){ r.active = !r.active; saveState(); renderRecurringList(); }
}

/* ============================================================
   9. LOAN CRUD
   ============================================================ */
function addOrUpdateLoan(data){
  const idx = state.loans.findIndex(l => l.id === data.id);
  if(idx > -1){ state.loans[idx] = { ...state.loans[idx], ...data }; toast('Loan updated.'); }
  else{ data.id = uid(); data.createdAt = Date.now(); state.loans.push(data); toast('Loan added.'); }
  saveState(); renderLoansPage();
}
function deleteLoan(id){
  state.loans = state.loans.filter(l => l.id !== id);
  saveState(); renderLoansPage();
  toast('Loan removed.');
}
function loanStatus(loan){
  const balance = Number(loan.amount) - Number(loan.paid || 0);
  if(balance <= 0) return 'paid';
  if(loan.dueDate && loan.dueDate < todayStr()) return 'overdue';
  return 'pending';
}

/* ============================================================
   10. CALCULATIONS
   ============================================================ */
function txnsInRange(from, to){
  return state.transactions.filter(t => t.date >= from && t.date <= to);
}
function sumByType(list, types){
  return list.filter(t => types.includes(t.type)).reduce((s,t)=> s + Number(t.amount), 0);
}

function methodBalance(method){
  return state.transactions.reduce((bal, t) => {
    if(t.method !== method) return bal;
    if(t.type === 'income' || t.type === 'receive') return bal + Number(t.amount);
    return bal - Number(t.amount);
  }, 0);
}

function loanNetBalance(){
  const given = state.loans.filter(l => l.type === 'given').reduce((s,l)=> s + (Number(l.amount)-Number(l.paid||0)), 0);
  const taken = state.loans.filter(l => l.type === 'taken').reduce((s,l)=> s + (Number(l.amount)-Number(l.paid||0)), 0);
  return { given, taken, net: given - taken };
}

function computeDashboardStats(){
  const today = todayStr();
  const now = new Date();
  const monthFrom = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthTo = formatDateLocal(new Date(now.getFullYear(), now.getMonth()+1, 0));

  const todayTxns = state.transactions.filter(t => t.date === today);
  const monthTxns = txnsInRange(monthFrom, monthTo);

  const todaySpend = sumByType(todayTxns, ['expense']);
  const monthSpend = sumByType(monthTxns, ['expense']);
  const monthIncome = sumByType(monthTxns, ['income']);
  const savings = monthIncome - monthSpend;
  const cashBalance = methodBalance('Cash');
  const loans = loanNetBalance();
  const budget = Number(state.settings.monthlyBudget) || 0;
  const remaining = budget - monthSpend;

  return {
    todaySpend, monthSpend, monthIncome, savings, cashBalance, loans, budget, remaining,
    todayCount: todayTxns.filter(t=>t.type==='expense').length,
    monthCount: monthTxns.filter(t=>t.type==='expense').length
  };
}

/* ============================================================
   11. RENDER — DASHBOARD
   ============================================================ */
function renderDashboard(){
  const s = computeDashboardStats();
  document.getElementById('todayLabel').textContent = parseLocalDate(todayStr()).toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const cards = [
    { label:"Today's spending", value: formatCurrency(s.todaySpend), sub: `${s.todayCount} transaction${s.todayCount===1?'':'s'} today`, cls:'negative' },
    { label:'This month spending', value: formatCurrency(s.monthSpend), sub: `${s.monthCount} transaction${s.monthCount===1?'':'s'} this month`, cls:'negative' },
    { label:'Income (this month)', value: formatCurrency(s.monthIncome), sub:'Credited so far', cls:'positive' },
    { label:'Savings (this month)', value: formatCurrency(s.savings), sub:'Income − expense', cls: s.savings>=0?'positive':'negative' },
    { label:'Loan balance', value: formatCurrency(Math.abs(s.loans.net)), sub: s.loans.net>=0? "You're owed net" : 'You owe net', cls: s.loans.net>=0?'positive':'negative' },
    { label:'Cash balance', value: formatCurrency(s.cashBalance), sub:'Cash on hand', cls: s.cashBalance>=0?'positive':'negative' },
    { label:'Remaining budget', value: formatCurrency(s.remaining), sub: s.budget ? `${Math.min(100, Math.round(s.monthSpend/s.budget*100))}% of budget used` : 'No budget set', cls: s.remaining>=0?'positive':'negative' },
  ];
  document.getElementById('statGrid').innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-label">${c.label}</div>
      <div class="stat-value ${c.cls}">${c.value}</div>
      <div class="stat-sub">${c.sub}</div>
    </div>`).join('');

  renderBudgetBars(s);

  // Quick add chips
  document.getElementById('quickAddRow').innerHTML = QUICK_ADD_PRESETS.map(p =>
    `<button class="quick-chip" data-cat="${escapeHtml(p.category)}" data-method="${escapeHtml(p.method)}">${escapeHtml(p.label)}</button>`
  ).join('');
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.onclick = () => openTransactionModal(null, { category: chip.dataset.cat, method: chip.dataset.method, type:'expense', date: todayStr() });
  });

  // Recent transactions
  const recent = [...state.transactions].sort((a,b)=> b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 6);
  const recentList = document.getElementById('recentTxnList');
  if(recent.length === 0){
    recentList.innerHTML = '<p class="empty-state">No transactions yet — add your first one above.</p>';
  }else{
    recentList.innerHTML = recent.map(t => renderTxnRow(t, true)).join('');
    wireTxnRowActions(recentList);
  }
}

function renderBudgetBars(stats){
  const s = stats || computeDashboardStats();
  const budget = s.budget;
  const pct = budget ? Math.min(999, Math.round((s.monthSpend / budget) * 100)) : 0;
  const fillPct = Math.min(100, pct);

  [['budgetFill','budgetPercentPill','budgetUsedText','budgetRemainingText','budgetWarning'],
   ['budgetFill2', null, 'budgetUsedText2', 'budgetRemainingText2', null]].forEach(ids => {
    const [fillId, pillId, usedId, remId, warnId] = ids;
    const fill = document.getElementById(fillId);
    if(!fill) return;
    fill.style.width = fillPct + '%';
    fill.classList.toggle('warn', pct >= 80 && pct < 100);
    fill.classList.toggle('danger', pct >= 100);
    if(pillId) document.getElementById(pillId).textContent = pct + '%';
    document.getElementById(usedId).textContent = `Used ${formatCurrency(s.monthSpend)}`;
    document.getElementById(remId).textContent = `Remaining ${formatCurrency(Math.max(0, s.remaining))}`;
    if(warnId){
      const warnEl = document.getElementById(warnId);
      if(!budget){ warnEl.hidden = true; }
      else if(pct >= 100){ warnEl.hidden = false; warnEl.classList.add('danger'); warnEl.textContent = `Budget exceeded by ${formatCurrency(Math.abs(s.remaining))}.`; }
      else if(pct >= 80){ warnEl.hidden = false; warnEl.classList.remove('danger'); warnEl.textContent = `Heads up — you've used ${pct}% of this month's budget.`; }
      else{ warnEl.hidden = true; }
    }
  });

  document.getElementById('monthlyBudgetInput').value = state.settings.monthlyBudget || '';
}

/* ============================================================
   12. TRANSACTION ROW RENDERING
   ============================================================ */
function renderTxnRow(t, compact){
  const amountClass = t.type;
  const sign = (t.type === 'expense' || t.type === 'transfer') ? '−' : '+';
  if(compact){
    return `
      <div class="txn-row" data-id="${t.id}">
        <span class="txn-date">${formatDatePretty(t.date).replace(/, \d{4}/, '')}</span>
        <span class="txn-cat"><i class="cat-dot" style="background:${categoryColor(t.category)}"></i>${escapeHtml(t.category)}</span>
        <span class="txn-method">${escapeHtml(t.method)}</span>
        <span class="txn-amount ${amountClass}">${sign}${formatCurrency(t.amount)}</span>
      </div>`;
  }
  return `
    <div class="txn-row" data-id="${t.id}">
      <span class="txn-date">${formatDatePretty(t.date).replace(/, \d{4}/, '')}</span>
      <span class="txn-cat"><i class="cat-dot" style="background:${categoryColor(t.category)}"></i>${escapeHtml(t.category)}</span>
      <span class="txn-method">${escapeHtml(t.method)}</span>
      <span class="txn-notes">${escapeHtml(t.notes) || '—'}</span>
      <span class="txn-amount ${amountClass}">${sign}${formatCurrency(t.amount)}</span>
      <span class="txn-actions">
        <button class="icon-btn act-edit" title="Edit">${ICONS.edit}</button>
        <button class="icon-btn act-dup" title="Duplicate">${ICONS.copy}</button>
        <button class="icon-btn act-del" title="Delete">${ICONS.trash}</button>
      </span>
    </div>`;
}

function wireTxnRowActions(container){
  container.querySelectorAll('.txn-row').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('.act-edit')?.addEventListener('click', () => {
      const t = state.transactions.find(x => x.id === id);
      if(t) openTransactionModal(t);
    });
    row.querySelector('.act-dup')?.addEventListener('click', () => duplicateTransaction(id));
    row.querySelector('.act-del')?.addEventListener('click', () => deleteTransaction(id));
  });
}

/* ============================================================
   13. TRANSACTIONS PAGE (search / filter / list)
   ============================================================ */
let txnFilterRange = 'all';
let txnFilterType = 'all';
let customFrom = null, customTo = null;
let searchQuery = '';

function matchesSearch(t, q){
  if(!q) return true;
  q = q.toLowerCase();
  return [t.category, t.method, t.notes, t.date, String(t.amount)].some(f => (f || '').toLowerCase().includes(q));
}

function getFilteredTransactions(){
  let list = [...state.transactions];
  const range = getRangeForFilter(txnFilterRange, customFrom, customTo);
  if(range) list = list.filter(t => t.date >= range.from && t.date <= range.to);
  if(txnFilterType !== 'all') list = list.filter(t => t.type === txnFilterType);
  if(searchQuery) list = list.filter(t => matchesSearch(t, searchQuery));
  list.sort((a,b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  return list;
}

function renderTransactionsList(){
  const list = getFilteredTransactions();
  const container = document.getElementById('allTxnList');
  const empty = document.getElementById('txnEmptyState');
  document.getElementById('txnCount').textContent = `(${list.length})`;
  if(list.length === 0){
    container.innerHTML = '';
    empty.hidden = false;
  }else{
    empty.hidden = true;
    container.innerHTML = list.map(t => renderTxnRow(t, false)).join('');
    wireTxnRowActions(container);
  }
}

/* ============================================================
   14. CALENDAR
   ============================================================ */
let calViewYear, calViewMonth;
(function initCalDate(){
  const n = new Date();
  calViewYear = n.getFullYear();
  calViewMonth = n.getMonth();
})();

function getMonthDayStats(year, month){
  const from = formatDateLocal(new Date(year, month, 1));
  const to = formatDateLocal(new Date(year, month+1, 0));
  const txns = txnsInRange(from, to);
  const byDay = {};
  txns.forEach(t => {
    const d = parseLocalDate(t.date).getDate();
    if(!byDay[d]) byDay[d] = { expense:0, income:0, count:0 };
    if(t.type === 'expense') byDay[d].expense += Number(t.amount);
    else if(t.type === 'income') byDay[d].income += Number(t.amount);
    byDay[d].count += 1;
  });
  const maxExpense = Math.max(0, ...Object.values(byDay).map(d => d.expense));
  return { byDay, maxExpense };
}

function renderCalendar(){
  document.getElementById('calMonthLabel').textContent = new Date(calViewYear, calViewMonth, 1)
    .toLocaleDateString('en-US', { month:'long', year:'numeric' });

  const { byDay, maxExpense } = getMonthDayStats(calViewYear, calViewMonth);
  const firstWeekday = new Date(calViewYear, calViewMonth, 1).getDay();
  const totalDays = daysInMonth(calViewYear, calViewMonth);
  const today = todayStr();

  let html = '';
  for(let i=0;i<firstWeekday;i++) html += `<div class="cal-cell empty"></div>`;

  for(let day=1; day<=totalDays; day++){
    const dateStr = `${calViewYear}-${pad(calViewMonth+1)}-${pad(day)}`;
    const stat = byDay[day] || { expense:0, income:0, count:0 };
    let level = 'none';
    if(stat.expense > 0){
      if(stat.expense === maxExpense) level = 'high';
      else if(stat.expense >= maxExpense * 0.5) level = 'med';
      else level = 'low';
    }else if(stat.income > 0){
      level = 'income';
    }
    const isToday = dateStr === today;
    html += `
      <div class="cal-cell level-${level} ${isToday ? 'is-today' : ''}" data-date="${dateStr}" style="animation-delay:${Math.min(day*8,240)}ms">
        <span class="day-num">${day}</span>
        <div>
          ${stat.expense > 0 ? `<div class="day-cell-amount exp">−${formatCurrency(stat.expense)}</div>` : ''}
          ${stat.income > 0 ? `<div class="day-cell-amount inc">+${formatCurrency(stat.income)}</div>` : ''}
          ${stat.count > 0 ? `<div class="day-cell-count">${stat.count} txn${stat.count>1?'s':''}</div>` : ''}
        </div>
      </div>`;
  }
  document.getElementById('calGrid').innerHTML = html;
  document.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => openDayModal(cell.dataset.date));
  });
}

function openDayModal(dateStr){
  const txns = state.transactions.filter(t => t.date === dateStr).sort((a,b)=> b.createdAt - a.createdAt);
  document.getElementById('dayModalTitle').textContent = formatDatePretty(dateStr);
  const income = sumByType(txns, ['income']);
  const expense = sumByType(txns, ['expense']);
  document.getElementById('dayModalSummary').innerHTML = `
    <span>Income <b>${formatCurrency(income)}</b></span>
    <span>Expense <b>${formatCurrency(expense)}</b></span>
    <span>Net <b>${formatCurrency(income-expense)}</b></span>`;
  const list = document.getElementById('dayModalList');
  if(txns.length === 0){
    list.innerHTML = '<p class="empty-state">Nothing recorded on this day.</p>';
  }else{
    list.innerHTML = txns.map(t => renderTxnRow(t,false)).join('');
    wireTxnRowActions(list);
  }
  document.getElementById('dayModalAddBtn').onclick = () => {
    closeModal('dayModalOverlay');
    openTransactionModal(null, { date: dateStr });
  };
  openModal('dayModalOverlay');
}

/* ============================================================
   15. INSIGHTS
   ============================================================ */
function renderInsights(){
  const all = state.transactions;
  const now = new Date();
  const monthFrom = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthTo = formatDateLocal(new Date(now.getFullYear(), now.getMonth()+1, 0));
  const monthTxns = txnsInRange(monthFrom, monthTo);

  // most expensive day (all time)
  const expenseByDay = {};
  all.filter(t=>t.type==='expense').forEach(t => expenseByDay[t.date] = (expenseByDay[t.date]||0) + Number(t.amount));
  const topExpenseDay = Object.entries(expenseByDay).sort((a,b)=>b[1]-a[1])[0];

  const incomeByDay = {};
  all.filter(t=>t.type==='income').forEach(t => incomeByDay[t.date] = (incomeByDay[t.date]||0) + Number(t.amount));
  const topIncomeDay = Object.entries(incomeByDay).sort((a,b)=>b[1]-a[1])[0];

  const methodCount = {};
  all.forEach(t => methodCount[t.method] = (methodCount[t.method]||0) + 1);
  const topMethod = Object.entries(methodCount).sort((a,b)=>b[1]-a[1])[0];

  const catExpense = {};
  all.filter(t=>t.type==='expense').forEach(t => catExpense[t.category] = (catExpense[t.category]||0) + Number(t.amount));
  const topCategory = Object.entries(catExpense).sort((a,b)=>b[1]-a[1])[0];

  const totalExpenseAllTime = sumByType(all, ['expense']);
  const distinctExpenseDays = new Set(all.filter(t=>t.type==='expense').map(t=>t.date)).size;
  const avgDaily = distinctExpenseDays ? totalExpenseAllTime / distinctExpenseDays : 0;

  const monthExpense = sumByType(monthTxns, ['expense']);
  const monthIncome = sumByType(monthTxns, ['income']);
  const monthSavings = monthIncome - monthExpense;
  const dayOfMonth = now.getDate();
  const burnRate = monthExpense / dayOfMonth;
  const budget = Number(state.settings.monthlyBudget) || 0;
  const remainingBudget = budget - monthExpense;

  const items = [
    { icon:ICONS.flame, label:'Most expensive day', value: topExpenseDay ? formatDatePretty(topExpenseDay[0]) : '—', sub: topExpenseDay ? formatCurrency(topExpenseDay[1]) + ' spent' : 'No expenses yet' },
    { icon:ICONS.wallet, label:'Most used payment method', value: topMethod ? topMethod[0] : '—', sub: topMethod ? `${topMethod[1]} transactions` : 'No data yet' },
    { icon:ICONS.tag, label:'Most expensive category', value: topCategory ? topCategory[0] : '—', sub: topCategory ? formatCurrency(topCategory[1]) + ' total' : 'No expenses yet' },
    { icon:ICONS.trend, label:'Average daily spending', value: formatCurrency(avgDaily), sub:'Across days with any expense' },
    { icon:ICONS.sun, label:'Highest income day', value: topIncomeDay ? formatDatePretty(topIncomeDay[0]) : '—', sub: topIncomeDay ? formatCurrency(topIncomeDay[1]) + ' received' : 'No income yet' },
    { icon:ICONS.piggy, label:'Current month savings', value: formatCurrency(monthSavings), sub: monthSavings>=0 ? 'Income exceeds expense' : 'Spending more than earning' },
    { icon:ICONS.flame, label:'Monthly burn rate', value: formatCurrency(burnRate) + ' /day', sub:'Average spend per day so far this month' },
    { icon:ICONS.target, label:'Remaining budget', value: budget ? formatCurrency(remainingBudget) : 'No budget set', sub: budget ? `${Math.min(100,Math.round(monthExpense/budget*100))}% used` : 'Set one on the Budget page' },
  ];

  document.getElementById('insightGrid').innerHTML = items.map(i => `
    <div class="insight-card">
      <div class="insight-icon">${i.icon}</div>
      <div>
        <div class="insight-label">${i.label}</div>
        <div class="insight-value">${i.value}</div>
        <div class="insight-sub">${i.sub}</div>
      </div>
    </div>`).join('');
}

/* ============================================================
   16. BUDGET & RECURRING PAGE
   ============================================================ */
function renderRecurringList(){
  const container = document.getElementById('recurringList');
  const empty = document.getElementById('recurringEmptyState');
  if(state.recurring.length === 0){
    container.innerHTML = ''; empty.hidden = false; return;
  }
  empty.hidden = true;
  container.innerHTML = state.recurring.map(r => `
    <div class="recurring-row" data-id="${r.id}">
      <div class="recurring-main">
        <span class="recurring-title">${escapeHtml(r.name)} <span class="badge ${r.active?'badge-paid':'badge-pending'}">${r.active?'Active':'Paused'}</span></span>
        <span class="recurring-meta">${escapeHtml(r.category)} · ${escapeHtml(r.method)} · day ${r.dayOfMonth} of each month</span>
      </div>
      <div class="row-actions">
        <span class="recurring-amount">${formatCurrency(r.amount)}</span>
        <button class="icon-btn act-toggle" title="${r.active?'Pause':'Resume'}">${r.active ? '⏸' : '▶'}</button>
        <button class="icon-btn act-edit" title="Edit">${ICONS.edit}</button>
        <button class="icon-btn act-del" title="Delete">${ICONS.trash}</button>
      </div>
    </div>`).join('');

  container.querySelectorAll('.recurring-row').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('.act-toggle').onclick = () => toggleRecurringActive(id);
    row.querySelector('.act-edit').onclick = () => {
      const r = state.recurring.find(x=>x.id===id);
      openRecurringModal(r);
    };
    row.querySelector('.act-del').onclick = () => deleteRecurring(id);
  });
}

/* ============================================================
   17. LOANS PAGE
   ============================================================ */
function renderLoansPage(){
  const { given, taken, net } = loanNetBalance();
  const overdueCount = state.loans.filter(l => loanStatus(l) === 'overdue').length;
  document.getElementById('loanStatGrid').innerHTML = [
    { label:'Total given', value: formatCurrency(given), cls:'positive' },
    { label:'Total taken', value: formatCurrency(taken), cls:'negative' },
    { label:'Net balance', value: formatCurrency(Math.abs(net)), cls: net>=0?'positive':'negative', sub: net>=0 ? "You're owed" : 'You owe' },
    { label:'Overdue loans', value: overdueCount, cls: overdueCount>0?'negative':'' },
  ].map(c => `
    <div class="stat-card">
      <div class="stat-label">${c.label}</div>
      <div class="stat-value ${c.cls}">${c.value}</div>
      ${c.sub ? `<div class="stat-sub">${c.sub}</div>` : ''}
    </div>`).join('');

  const container = document.getElementById('loanList');
  const empty = document.getElementById('loanEmptyState');
  if(state.loans.length === 0){ container.innerHTML=''; empty.hidden=false; return; }
  empty.hidden = true;

  const sorted = [...state.loans].sort((a,b)=> b.createdAt - a.createdAt);
  container.innerHTML = sorted.map(l => {
    const balance = Number(l.amount) - Number(l.paid||0);
    const status = loanStatus(l);
    const badgeClass = status === 'paid' ? 'badge-paid' : status === 'overdue' ? 'badge-overdue' : 'badge-pending';
    return `
    <div class="loan-row" data-id="${l.id}">
      <div class="loan-main">
        <span class="loan-title">${escapeHtml(l.person)} <span class="badge ${l.type==='given'?'badge-given':'badge-taken'}">${l.type==='given'?'Given':'Taken'}</span> <span class="badge ${badgeClass}">${status}</span></span>
        <span class="loan-meta">Balance ${formatCurrency(balance)} of ${formatCurrency(l.amount)} · ${l.interest||0}% p.a.${l.dueDate ? ' · due ' + formatDatePretty(l.dueDate) : ''}</span>
      </div>
      <div class="row-actions">
        <button class="icon-btn act-edit" title="Edit">${ICONS.edit}</button>
        <button class="icon-btn act-del" title="Delete">${ICONS.trash}</button>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.loan-row').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('.act-edit').onclick = () => openLoanModal(state.loans.find(x=>x.id===id));
    row.querySelector('.act-del').onclick = () => deleteLoan(id);
  });
}

/* ============================================================
   18. MONTHLY REPORT
   ============================================================ */
function generateReport(monthValue){
  const [y, m] = monthValue.split('-').map(Number);
  const from = formatDateLocal(new Date(y, m-1, 1));
  const to = formatDateLocal(new Date(y, m, 0));
  const txns = txnsInRange(from, to);
  const income = sumByType(txns, ['income']);
  const expense = sumByType(txns, ['expense']);
  const savings = income - expense;

  const catTotals = {};
  txns.filter(t=>t.type==='expense').forEach(t => catTotals[t.category] = (catTotals[t.category]||0) + Number(t.amount));
  const catSorted = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  const maxCat = catSorted.length ? catSorted[0][1] : 0;

  const methodTotals = {};
  txns.filter(t=>t.type==='expense').forEach(t => methodTotals[t.method] = (methodTotals[t.method]||0) + Number(t.amount));
  const methodSorted = Object.entries(methodTotals).sort((a,b)=>b[1]-a[1]);
  const maxMethod = methodSorted.length ? methodSorted[0][1] : 0;

  const byDayExpense = {};
  txns.filter(t=>t.type==='expense').forEach(t => byDayExpense[t.date] = (byDayExpense[t.date]||0) + Number(t.amount));
  const highestSpendDay = Object.entries(byDayExpense).sort((a,b)=>b[1]-a[1])[0];

  const byDayIncome = {};
  txns.filter(t=>t.type==='income').forEach(t => byDayIncome[t.date] = (byDayIncome[t.date]||0) + Number(t.amount));
  const highestIncomeDay = Object.entries(byDayIncome).sort((a,b)=>b[1]-a[1])[0];

  const expenseTxns = txns.filter(t=>t.type==='expense');
  const avgExpense = expenseTxns.length ? expense / expenseTxns.length : 0;
  const top5 = [...expenseTxns].sort((a,b)=>b.amount-a.amount).slice(0,5);

  const monthLabel = new Date(y, m-1, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' });

  const html = `
    <div class="card">
      <div class="card-head"><h3>${monthLabel} summary</h3></div>
      <div class="report-grid">
        <div class="report-figure-card"><div class="report-figure-label">Total income</div><div class="report-figure">${formatCurrency(income)}</div></div>
        <div class="report-figure-card"><div class="report-figure-label">Total expense</div><div class="report-figure">${formatCurrency(expense)}</div></div>
        <div class="report-figure-card"><div class="report-figure-label">Savings</div><div class="report-figure">${formatCurrency(savings)}</div></div>
        <div class="report-figure-card"><div class="report-figure-label">Average expense</div><div class="report-figure">${formatCurrency(avgExpense)}</div></div>
        <div class="report-figure-card"><div class="report-figure-label">Highest spending day</div><div class="report-figure">${highestSpendDay ? formatDatePretty(highestSpendDay[0]) : '—'}</div></div>
        <div class="report-figure-card"><div class="report-figure-label">Highest income day</div><div class="report-figure">${highestIncomeDay ? formatDatePretty(highestIncomeDay[0]) : '—'}</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Category breakdown</h3></div>
      ${catSorted.length ? catSorted.map(([cat,val]) => `
        <div class="breakdown-row">
          <span class="breakdown-name">${escapeHtml(cat)}</span>
          <span class="breakdown-bar-track"><span class="breakdown-bar-fill" style="width:${maxCat?Math.round(val/maxCat*100):0}%;background:${categoryColor(cat)}"></span></span>
          <span class="breakdown-value">${formatCurrency(val)}</span>
        </div>`).join('') : '<p class="empty-state">No expenses this month.</p>'}
    </div>
    <div class="card">
      <div class="card-head"><h3>Payment method breakdown</h3></div>
      ${methodSorted.length ? methodSorted.map(([method,val]) => `
        <div class="breakdown-row">
          <span class="breakdown-name">${escapeHtml(method)}</span>
          <span class="breakdown-bar-track"><span class="breakdown-bar-fill" style="width:${maxMethod?Math.round(val/maxMethod*100):0}%"></span></span>
          <span class="breakdown-value">${formatCurrency(val)}</span>
        </div>`).join('') : '<p class="empty-state">No expenses this month.</p>'}
    </div>
    <div class="card">
      <div class="card-head"><h3>Top 5 expenses</h3></div>
      ${top5.length ? top5.map(t => `
        <div class="report-list-item">
          <span>${formatDatePretty(t.date)} · ${escapeHtml(t.category)} · ${escapeHtml(t.method)}${t.notes ? ' · ' + escapeHtml(t.notes) : ''}</span>
          <span class="mono">${formatCurrency(t.amount)}</span>
        </div>`).join('') : '<p class="empty-state">No expenses this month.</p>'}
    </div>`;

  document.getElementById('reportOutput').innerHTML = html;
}

/* ============================================================
   19. CHARTS (Chart.js)
   ============================================================ */
let charts = {};

function destroyChart(key){ if(charts[key]){ charts[key].destroy(); delete charts[key]; } }

function renderCharts(){
  if(typeof Chart === 'undefined') return;
  const textColor = cssVar('--text-secondary') || '#6B7280';
  const gridColor = cssVar('--border') || '#E8EAEE';
  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.borderColor = gridColor;

  const now = new Date();
  const monthFrom = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthTo = formatDateLocal(new Date(now.getFullYear(), now.getMonth()+1, 0));
  const monthTxns = txnsInRange(monthFrom, monthTo);

  // --- Expense by category (this month) ---
  const catTotals = {};
  monthTxns.filter(t=>t.type==='expense').forEach(t => catTotals[t.category] = (catTotals[t.category]||0) + Number(t.amount));
  const catEntries = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  destroyChart('categoryPie');
  charts.categoryPie = new Chart(document.getElementById('chartCategoryPie'), {
    type:'pie',
    data:{ labels: catEntries.map(e=>e[0]), datasets:[{ data: catEntries.map(e=>e[1]), backgroundColor: catEntries.map(e=>categoryColor(e[0])), borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:9, boxHeight:9, padding:10, font:{size:11} } } } }
  });

  // --- Payment method usage (this month, absolute amount across all types) ---
  const methodTotals = {};
  monthTxns.forEach(t => methodTotals[t.method] = (methodTotals[t.method]||0) + Number(t.amount));
  const methodEntries = Object.entries(methodTotals).sort((a,b)=>b[1]-a[1]);
  destroyChart('methodPie');
  charts.methodPie = new Chart(document.getElementById('chartMethodPie'), {
    type:'pie',
    data:{ labels: methodEntries.map(e=>e[0]), datasets:[{ data: methodEntries.map(e=>e[1]), backgroundColor: CATEGORY_PALETTE, borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:9, boxHeight:9, padding:10, font:{size:11} } } } }
  });

  // --- Income vs expense (this month) ---
  const incomeTotal = sumByType(monthTxns, ['income']);
  const expenseTotal = sumByType(monthTxns, ['expense']);
  destroyChart('incomeExpense');
  charts.incomeExpense = new Chart(document.getElementById('chartIncomeExpense'), {
    type:'doughnut',
    data:{ labels:['Income','Expense'], datasets:[{ data:[incomeTotal, expenseTotal], backgroundColor:[cssVar('--income')||'#15A566', cssVar('--high')||'#E5484D'], borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ position:'bottom' } } }
  });

  // --- Monthly expenses (last 6 months) ---
  const monthLabels = [], monthValues = [];
  for(let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const f = formatDateLocal(d), t = formatDateLocal(new Date(d.getFullYear(), d.getMonth()+1, 0));
    monthLabels.push(d.toLocaleDateString('en-US',{month:'short'}));
    monthValues.push(sumByType(txnsInRange(f,t), ['expense']));
  }
  destroyChart('monthlyBar');
  charts.monthlyBar = new Chart(document.getElementById('chartMonthlyBar'), {
    type:'bar',
    data:{ labels: monthLabels, datasets:[{ label:'Expense', data: monthValues, backgroundColor: cssVar('--accent')||'#4A5CF5', borderRadius:6, maxBarThickness:44 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ y:{ grid:{ color: gridColor }, ticks:{ callback:(v)=>formatCurrency(v) } }, x:{ grid:{ display:false } } } }
  });

  // --- Daily spending trend (current month) ---
  document.getElementById('trendMonthLabel').textContent = '· ' + now.toLocaleDateString('en-US',{month:'long', year:'numeric'});
  const daysThisMonth = daysInMonth(now.getFullYear(), now.getMonth());
  const dailyValues = new Array(daysThisMonth).fill(0);
  monthTxns.filter(t=>t.type==='expense').forEach(t => { dailyValues[parseLocalDate(t.date).getDate()-1] += Number(t.amount); });
  destroyChart('dailyTrend');
  charts.dailyTrend = new Chart(document.getElementById('chartDailyTrend'), {
    type:'line',
    data:{ labels: Array.from({length:daysThisMonth},(_,i)=>i+1), datasets:[{ label:'Daily expense', data: dailyValues, borderColor: cssVar('--accent')||'#4A5CF5', backgroundColor: (cssVar('--accent-soft')||'rgba(74,92,245,.15)'), fill:true, tension:.35, pointRadius:2 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ y:{ grid:{ color: gridColor }, ticks:{ callback:(v)=>formatCurrency(v) } }, x:{ grid:{ display:false } } } }
  });

  // --- Top spending categories (all time, horizontal bar) ---
  const allCatTotals = {};
  state.transactions.filter(t=>t.type==='expense').forEach(t => allCatTotals[t.category] = (allCatTotals[t.category]||0) + Number(t.amount));
  const topCats = Object.entries(allCatTotals).sort((a,b)=>b[1]-a[1]).slice(0,6);
  destroyChart('topCategories');
  charts.topCategories = new Chart(document.getElementById('chartTopCategories'), {
    type:'bar',
    data:{ labels: topCats.map(e=>e[0]), datasets:[{ data: topCats.map(e=>e[1]), backgroundColor: topCats.map(e=>categoryColor(e[0])), borderRadius:6 }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ x:{ grid:{ color: gridColor }, ticks:{ callback:(v)=>formatCurrency(v) } }, y:{ grid:{ display:false } } } }
  });
}

/* ============================================================
   20. MODALS — Transaction
   ============================================================ */
function openModal(overlayId){
  document.getElementById(overlayId).classList.add('open');
}
function closeModal(overlayId){
  document.getElementById(overlayId).classList.remove('open');
}
function closeAllModals(){
  document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open'));
}

function populateSelect(selectEl, options){
  selectEl.innerHTML = options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
}

function openTransactionModal(existing, prefill){
  const form = document.getElementById('transactionForm');
  form.reset();
  document.getElementById('txnId').value = existing ? existing.id : '';
  document.getElementById('transactionModalTitle').textContent = existing ? 'Edit transaction' : 'Add transaction';

  const type = existing ? existing.type : (prefill && prefill.type) || 'expense';
  setActiveTypeButton('txnTypeRow', type);

  document.getElementById('txnDate').value = existing ? existing.date : (prefill && prefill.date) || todayStr();
  document.getElementById('txnAmount').value = existing ? existing.amount : '';
  document.getElementById('txnCategory').value = existing ? existing.category : (prefill && prefill.category) || CATEGORIES[0];
  document.getElementById('txnMethod').value = existing ? existing.method : (prefill && prefill.method) || METHODS[0];
  document.getElementById('txnNotes').value = existing ? (existing.notes || '') : '';

  openModal('transactionModalOverlay');
  setTimeout(()=> document.getElementById('txnAmount').focus(), 80);
}

function setActiveTypeButton(rowId, value){
  document.querySelectorAll(`#${rowId} .type-btn`).forEach(b => b.classList.toggle('active', b.dataset.value === value));
}
function getActiveTypeButton(rowId){
  return document.querySelector(`#${rowId} .type-btn.active`)?.dataset.value;
}

/* ============================================================
   21. MODALS — Loan
   ============================================================ */
function openLoanModal(existing){
  const form = document.getElementById('loanForm');
  form.reset();
  document.getElementById('loanId').value = existing ? existing.id : '';
  document.getElementById('loanModalTitle').textContent = existing ? 'Edit loan' : 'New loan';
  setActiveTypeButton('loanTypeRow', existing ? existing.type : 'given');
  document.getElementById('loanPerson').value = existing ? existing.person : '';
  document.getElementById('loanAmount').value = existing ? existing.amount : '';
  document.getElementById('loanPaid').value = existing ? (existing.paid||0) : 0;
  document.getElementById('loanInterest').value = existing ? (existing.interest||0) : 0;
  document.getElementById('loanDueDate').value = existing ? (existing.dueDate||'') : '';
  document.getElementById('loanNotes').value = existing ? (existing.notes||'') : '';
  openModal('loanModalOverlay');
}

/* ============================================================
   22. MODALS — Recurring
   ============================================================ */
function openRecurringModal(existing){
  const form = document.getElementById('recurringForm');
  form.reset();
  document.getElementById('recurringId').value = existing ? existing.id : '';
  document.getElementById('recurringModalTitle').textContent = existing ? 'Edit recurring expense' : 'New recurring expense';
  document.getElementById('recurringName').value = existing ? existing.name : '';
  document.getElementById('recurringAmount').value = existing ? existing.amount : '';
  document.getElementById('recurringDay').value = existing ? existing.dayOfMonth : 1;
  document.getElementById('recurringCategory').value = existing ? existing.category : 'Rent';
  document.getElementById('recurringMethod').value = existing ? existing.method : METHODS[0];
  openModal('recurringModalOverlay');
}

/* ============================================================
   23. EXPORT / IMPORT / BACKUP
   ============================================================ */
function downloadFile(filename, content, mime){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function exportJson(){
  downloadFile(`ledger-export-${todayStr()}.json`, JSON.stringify(state, null, 2), 'application/json');
  toast('Exported full data as JSON.');
}
function exportCsv(){
  const header = ['Date','Type','Category','Method','Amount','Notes'];
  const rows = state.transactions.map(t => [t.date, t.type, t.category, t.method, t.amount, t.notes||'']);
  const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
  downloadFile(`ledger-transactions-${todayStr()}.csv`, csv, 'text/csv');
  toast('Exported transactions as CSV.');
}
function csvEscape(val){
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}
function importJsonFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      state = {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        loans: Array.isArray(parsed.loans) ? parsed.loans : [],
        recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
        settings: Object.assign(defaultState().settings, parsed.settings || {})
      };
      saveState(); applyTheme(); renderAll();
      toast('Data imported successfully.');
    }catch(err){
      console.error(err);
      toast('That file could not be read as valid JSON.');
    }
  };
  reader.readAsText(file);
}
function backupData(){
  downloadFile(`ledger-backup-${todayStr()}.json`, JSON.stringify(state, null, 2), 'application/json');
  toast('Backup downloaded.');
}

/* ============================================================
   24. RENDER ALL
   ============================================================ */
function renderAll(){
  renderDashboard();
  renderCalendar();
  renderTransactionsList();
  renderInsights();
  renderRecurringList();
  renderLoansPage();
  renderCharts();
}

/* ============================================================
   25. INIT / EVENT WIRING
   ============================================================ */
function init(){
  applyTheme();
  processRecurring();

  // Populate selects
  populateSelect(document.getElementById('txnCategory'), CATEGORIES);
  populateSelect(document.getElementById('txnMethod'), METHODS);
  populateSelect(document.getElementById('recurringCategory'), CATEGORIES);
  populateSelect(document.getElementById('recurringMethod'), METHODS);
  document.getElementById('currencySelect').value = state.settings.currency;

  // Navigation
  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => goToSection(item.dataset.section));
  });
  document.querySelectorAll('.bn-item[data-section]').forEach(item => {
    item.addEventListener('click', () => goToSection(item.dataset.section));
  });
  document.querySelectorAll('.link-btn[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => goToSection(btn.dataset.goto));
  });
  document.getElementById('mobileMenuBtn').addEventListener('click', openSidebar);
  document.getElementById('sidebarScrim').addEventListener('click', closeSidebar);

  // Theme
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('settingsThemeToggle').addEventListener('click', toggleTheme);

  // Global search
  document.getElementById('globalSearch').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    if(searchQuery) goToSection('transactions');
    renderTransactionsList();
  });

  // Add transaction entry points
  document.getElementById('openAddModalBtn').addEventListener('click', () => openTransactionModal());
  document.getElementById('bottomAddBtn').addEventListener('click', () => openTransactionModal());

  // Transaction modal
  document.getElementById('closeTransactionModal').addEventListener('click', () => closeModal('transactionModalOverlay'));
  document.getElementById('cancelTransactionBtn').addEventListener('click', () => closeModal('transactionModalOverlay'));
  document.getElementById('transactionModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'transactionModalOverlay') closeModal('transactionModalOverlay'); });
  document.querySelectorAll('#txnTypeRow .type-btn').forEach(btn => {
    btn.addEventListener('click', () => setActiveTypeButton('txnTypeRow', btn.dataset.value));
  });
  document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      id: document.getElementById('txnId').value || undefined,
      date: document.getElementById('txnDate').value,
      amount: Number(document.getElementById('txnAmount').value),
      type: getActiveTypeButton('txnTypeRow'),
      category: document.getElementById('txnCategory').value,
      method: document.getElementById('txnMethod').value,
      notes: document.getElementById('txnNotes').value.trim(),
    };
    addOrUpdateTransaction(data);
    closeModal('transactionModalOverlay');
  });

  // Day modal
  document.getElementById('closeDayModal').addEventListener('click', () => closeModal('dayModalOverlay'));
  document.getElementById('dayModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'dayModalOverlay') closeModal('dayModalOverlay'); });

  // Calendar nav
  document.getElementById('calPrevBtn').addEventListener('click', () => { calViewMonth--; if(calViewMonth<0){calViewMonth=11; calViewYear--;} renderCalendar(); });
  document.getElementById('calNextBtn').addEventListener('click', () => { calViewMonth++; if(calViewMonth>11){calViewMonth=0; calViewYear++;} renderCalendar(); });
  document.getElementById('calTodayBtn').addEventListener('click', () => { const n = new Date(); calViewYear=n.getFullYear(); calViewMonth=n.getMonth(); renderCalendar(); });

  // Transactions page filters
  document.querySelectorAll('#filterChipRow .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#filterChipRow .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      txnFilterRange = chip.dataset.filter;
      document.getElementById('customRangeRow').hidden = txnFilterRange !== 'custom';
      renderTransactionsList();
    });
  });
  document.getElementById('applyCustomRange').addEventListener('click', () => {
    customFrom = document.getElementById('customFrom').value;
    customTo = document.getElementById('customTo').value;
    renderTransactionsList();
  });
  document.querySelectorAll('.type-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      txnFilterType = chip.dataset.type;
      renderTransactionsList();
    });
  });

  // Export / import (transactions page)
  document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
  document.getElementById('importJsonInput').addEventListener('change', (e) => { if(e.target.files[0]) importJsonFile(e.target.files[0]); e.target.value=''; });

  // Budget page
  document.getElementById('saveBudgetBtn').addEventListener('click', () => {
    state.settings.monthlyBudget = Number(document.getElementById('monthlyBudgetInput').value) || 0;
    saveState(); renderDashboard(); renderInsights();
    toast('Monthly budget saved.');
  });

  // Recurring modal
  document.getElementById('openRecurringModalBtn').addEventListener('click', () => openRecurringModal());
  document.getElementById('closeRecurringModal').addEventListener('click', () => closeModal('recurringModalOverlay'));
  document.getElementById('cancelRecurringBtn').addEventListener('click', () => closeModal('recurringModalOverlay'));
  document.getElementById('recurringModalOverlay').addEventListener('click', (e) => { if(e.target.id==='recurringModalOverlay') closeModal('recurringModalOverlay'); });
  document.getElementById('recurringForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addOrUpdateRecurring({
      id: document.getElementById('recurringId').value || undefined,
      name: document.getElementById('recurringName').value.trim(),
      amount: Number(document.getElementById('recurringAmount').value),
      dayOfMonth: Math.min(28, Math.max(1, Number(document.getElementById('recurringDay').value))),
      category: document.getElementById('recurringCategory').value,
      method: document.getElementById('recurringMethod').value,
    });
    closeModal('recurringModalOverlay');
  });

  // Loan modal
  document.getElementById('openLoanModalBtn').addEventListener('click', () => openLoanModal());
  document.getElementById('closeLoanModal').addEventListener('click', () => closeModal('loanModalOverlay'));
  document.getElementById('cancelLoanBtn').addEventListener('click', () => closeModal('loanModalOverlay'));
  document.getElementById('loanModalOverlay').addEventListener('click', (e) => { if(e.target.id==='loanModalOverlay') closeModal('loanModalOverlay'); });
  document.querySelectorAll('#loanTypeRow .type-btn').forEach(btn => {
    btn.addEventListener('click', () => setActiveTypeButton('loanTypeRow', btn.dataset.value));
  });
  document.getElementById('loanForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addOrUpdateLoan({
      id: document.getElementById('loanId').value || undefined,
      type: getActiveTypeButton('loanTypeRow'),
      person: document.getElementById('loanPerson').value.trim(),
      amount: Number(document.getElementById('loanAmount').value),
      paid: Number(document.getElementById('loanPaid').value) || 0,
      interest: Number(document.getElementById('loanInterest').value) || 0,
      dueDate: document.getElementById('loanDueDate').value,
      notes: document.getElementById('loanNotes').value.trim(),
    });
    closeModal('loanModalOverlay');
  });

  // Reports
  document.getElementById('reportMonthInput').value = todayStr().slice(0,7);
  document.getElementById('generateReportBtn').addEventListener('click', () => {
    const val = document.getElementById('reportMonthInput').value;
    if(val) generateReport(val);
  });
  document.getElementById('printReportBtn').addEventListener('click', () => window.print());

  // Settings page
  document.getElementById('currencySelect').addEventListener('change', (e) => {
    state.settings.currency = e.target.value; saveState(); renderAll();
  });
  document.getElementById('settingsExportJson').addEventListener('click', exportJson);
  document.getElementById('settingsExportCsv').addEventListener('click', exportCsv);
  document.getElementById('settingsImportInput').addEventListener('change', (e) => { if(e.target.files[0]) importJsonFile(e.target.files[0]); e.target.value=''; });
  document.getElementById('backupBtn').addEventListener('click', backupData);
  document.getElementById('restoreInput').addEventListener('change', (e) => { if(e.target.files[0]) importJsonFile(e.target.files[0]); e.target.value=''; });
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    toast('Tap again within 5 seconds to permanently erase all data.', {
      actionLabel: 'Erase everything',
      onAction: () => { state = defaultState(); saveState(); applyTheme(); renderAll(); toast('All data cleared.'); },
      duration: 5000
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if(e.key === 'Escape'){ closeAllModals(); closeSidebar(); return; }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n'){
      e.preventDefault(); openTransactionModal(); return;
    }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
      e.preventDefault();
      const openForm = document.querySelector('.modal-overlay.open form');
      if(openForm) openForm.requestSubmit();
      else toast('Everything here saves automatically.');
      return;
    }
    if(e.key === '/' && !typing){
      e.preventDefault(); document.getElementById('globalSearch').focus();
    }
  });

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
