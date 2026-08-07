// ===== DOM =====
const tabInput = document.getElementById('tabInput');
const tabHistory = document.getElementById('tabHistory');
const contentInput = document.getElementById('contentInput');
const contentHistory = document.getElementById('contentHistory');

const tanggalNodin = document.getElementById('tanggalNodin');
const jenisSurat = document.getElementById('jenisSurat');
const isiRingkasan = document.getElementById('isiRingkasan');
const pengelola = document.getElementById('pengelola');
const btnSubmit = document.getElementById('btnSubmit');

const formView = document.getElementById('formView');
const resultView = document.getElementById('resultView');
const resultNumber = document.getElementById('resultNumber');
const resultTypeText = document.getElementById('resultTypeText');
const resultMeta = document.getElementById('resultMeta');
const btnCopy = document.getElementById('btnCopy');
const copyText = document.getElementById('copyText');
const btnNewEntry = document.getElementById('btnNewEntry');

const searchHistory = document.getElementById('searchHistory');
const historyList = document.getElementById('historyList');
const statNodin = document.getElementById('statNodin');
const statLK = document.getElementById('statLK');
const statTotal = document.getElementById('statTotal');

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const btnMinimize = document.getElementById('btnMinimize');
const btnClose = document.getElementById('btnClose');
const btnSettings = document.getElementById('btnSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const settingsModal = document.getElementById('settingsModal');
const settingSpreadsheetId = document.getElementById('settingSpreadsheetId');
const settingYear = document.getElementById('settingYear');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const btnToggleAdvanced = document.getElementById('btnToggleAdvanced');
const advancedSettings = document.getElementById('advancedSettings');
const iconToggleAdv = document.getElementById('iconToggleAdv');
const activeYearDisplay = document.getElementById('activeYearDisplay');

// ===== State =====
let isConnected = false;
let historyData = [];
let currentSettingsData = null;

// Populate dropdown years
for (let y = 2026; y <= 2040; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    settingYear.appendChild(opt);
}

// ===== Init =====
async function init() {
    setStatus('connecting', 'Menghubungkan...');
    
    // Reset stats to prevent "nyangkut" bug
    historyData = [];
    statNodin.textContent = '0';
    statLK.textContent = '0';
    statTotal.textContent = '0';
    historyList.innerHTML = '<div class="empty-state"><span>Belum ada data</span></div>';
    
    try {
        const settings = await window.api.getSettings();
        if (settings && settings.activeYear) {
            activeYearDisplay.textContent = 'Tahun ' + settings.activeYear;
        }

        const result = await window.api.initSheets();
        if (result.success) {
            isConnected = true;
            setStatus('connected', 'Terhubung');
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            tanggalNodin.value = `${year}-${month}-${day}`;
            validateForm();
            if (tabHistory.classList.contains('active')) {
                loadHistory();
            }
        } else {
            // Gracefully handle empty or invalid spreadsheet ID
            isConnected = false;
            setStatus('error', result.error || 'Gagal terhubung');
            validateForm();
        }
    } catch (err) {
        isConnected = false;
        setStatus('error', 'Gagal terhubung');
        validateForm();
    }
}

function setStatus(type, text) {
    statusDot.className = 'status-dot';
    if (type === 'connected') statusDot.classList.add('connected');
    else if (type === 'error') statusDot.classList.add('error');
    statusText.textContent = text;
}

// ===== Tabs =====
tabInput.addEventListener('click', () => switchTab('input'));
tabHistory.addEventListener('click', () => switchTab('history'));

function switchTab(tab) {
    tabInput.classList.toggle('active', tab === 'input');
    tabHistory.classList.toggle('active', tab === 'history');
    contentInput.classList.toggle('active', tab === 'input');
    contentHistory.classList.toggle('active', tab === 'history');
    if (tab === 'history') loadHistory();
}

// ===== Validation =====
function validateForm() {
    btnSubmit.disabled = !(tanggalNodin.value && jenisSurat.value && isiRingkasan.value.trim() && pengelola.value.trim() && isConnected);
}

tanggalNodin.addEventListener('change', validateForm);
jenisSurat.addEventListener('change', validateForm);
isiRingkasan.addEventListener('input', validateForm);
pengelola.addEventListener('input', validateForm);

// ===== Roman =====
function toRoman(num) {
    const r = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = '';
    for (const [v, n] of r) { while (num >= v) { s += n; num -= v; } }
    return s;
}

// ===== Generate & Save — always Final =====
btnSubmit.addEventListener('click', async () => {
    if (!tanggalNodin.value || !jenisSurat.value || !isiRingkasan.value.trim() || !isConnected) return;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px;border-top-color:#fff;"></div> Menyimpan...';

    try {
        const entry = {
            tanggal: tanggalNodin.value,
            jenisSurat: jenisSurat.value,
            isiRingkasan: isiRingkasan.value.trim(),
            pengelola: pengelola.value.trim(),
            status: 'Final',
        };

        const result = await window.api.appendEntry(entry);
        if (!result.success) throw new Error(result.error);

        const nomorSurat = result.result.nomorSurat;
        const label = entry.jenisSurat.includes('Nodin') ? 'Nodin/BA' : 'Laporan Kejadian';

        resultNumber.textContent = nomorSurat;
        resultTypeText.textContent = `${label} berhasil disimpan`;
        resultMeta.textContent = `${entry.tanggal} · ${entry.pengelola || '-'} · Final`;

        formView.style.display = 'none';
        resultView.style.display = 'flex';

        setStatus('connected', 'Tersimpan');
    } catch (err) {
        setStatus('error', err.message);
    } finally {
        btnSubmit.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke-linecap="round" stroke-linejoin="round"/></svg> Generate & Simpan';
        validateForm();
    }
});

// ===== Copy =====
btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(resultNumber.textContent).then(() => {
        btnCopy.classList.add('copied');
        copyText.textContent = 'OK!';
        setTimeout(() => { btnCopy.classList.remove('copied'); copyText.textContent = 'Salin'; }, 1500);
    });
});

// ===== New Entry =====
btnNewEntry.addEventListener('click', () => {
    jenisSurat.value = '';
    isiRingkasan.value = '';
    pengelola.value = '';
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    tanggalNodin.value = `${year}-${month}-${day}`;
    resultView.style.display = 'none';
    formView.style.display = '';
    btnSubmit.disabled = true;
    validateForm();
});

// ===== History =====
async function loadHistory() {
    historyList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Memuat...</span></div>';
    try {
        const result = await window.api.getData();
        if (!result.success) throw new Error(result.error);
        historyData = result.data;
        statNodin.textContent = historyData.filter(e => e.jenisSurat && e.jenisSurat.includes('Nodin')).length;
        statLK.textContent = historyData.filter(e => e.jenisSurat === 'LK').length;
        statTotal.textContent = historyData.length;
        renderHistory(historyData);
    } catch (err) {
        historyList.innerHTML = `<div class="empty-state"><span>${err.message}</span></div>`;
    }
}

function renderHistory(data) {
    if (!data.length) {
        historyList.innerHTML = '<div class="empty-state"><span>Belum ada data</span></div>';
        return;
    }
    const sorted = [...data].sort((a, b) => b.rowIndex - a.rowIndex);
    historyList.innerHTML = sorted.map(e => {
        const t = (e.jenisSurat && e.jenisSurat.includes('Nodin')) ? 'nodin' : 'lk';
        const n = e.nomorSurat || '-';
        return `<div class="history-item">
          <div class="hi-top">
            <span class="hi-num ${t}">${n}</span>
            <button class="hi-copy" onclick="copyHi('${n.replace(/'/g, "\\'")}',this)">Salin</button>
            <span class="hi-type ${t}">${e.jenisSurat || '-'}</span>
          </div>
          <div class="hi-body">${e.isiRingkasan || '-'}</div>
          <div class="hi-foot"><span>${e.tanggal || '-'} · ${e.pengelola || '-'}</span><span>${e.status || 'Final'}</span></div>
        </div>`;
    }).join('');
}

function copyHi(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'OK!';
        btn.style.background = '#059669';
        btn.style.borderColor = '#059669';
        btn.style.color = '#fff';
        setTimeout(() => { btn.textContent = 'Salin'; btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = ''; }, 1200);
    });
}

// ===== Search & Filter =====
const filterNodin = document.getElementById('filterNodin');
const filterLK = document.getElementById('filterLK');
const filterAll = document.getElementById('filterAll');

filterNodin.addEventListener('click', () => {
    renderHistory(historyData.filter(e => e.jenisSurat && e.jenisSurat.includes('Nodin')));
});

filterLK.addEventListener('click', () => {
    renderHistory(historyData.filter(e => e.jenisSurat === 'LK'));
});

filterAll.addEventListener('click', () => {
    renderHistory(historyData);
});

searchHistory.addEventListener('input', () => {
    const q = searchHistory.value.toLowerCase().trim();
    if (!q) { renderHistory(historyData); return; }
    renderHistory(historyData.filter(e =>
        (e.nomorSurat && e.nomorSurat.toLowerCase().includes(q)) ||
        (e.isiRingkasan && e.isiRingkasan.toLowerCase().includes(q)) ||
        (e.pengelola && e.pengelola.toLowerCase().includes(q)) ||
        (e.tanggal && e.tanggal.includes(q))
    ));
});

// ===== Settings Modal =====
btnSettings.addEventListener('click', async () => {
    currentSettingsData = await window.api.getSettings();
    settingYear.value = currentSettingsData.activeYear || new Date().getFullYear().toString();
    updateSettingsInputs();
    
    // Reset toggle state
    advancedSettings.style.display = 'none';
    iconToggleAdv.style.transform = 'rotate(0deg)';
    
    settingsModal.style.display = 'flex';
});

btnToggleAdvanced.addEventListener('click', () => {
    const isHidden = advancedSettings.style.display === 'none';
    advancedSettings.style.display = isHidden ? 'block' : 'none';
    iconToggleAdv.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
});

settingYear.addEventListener('change', updateSettingsInputs);

function updateSettingsInputs() {
    if (!currentSettingsData || !currentSettingsData.years) return;
    const y = settingYear.value;
    const c = currentSettingsData.years[y] || { spreadsheetId: '' };
    settingSpreadsheetId.value = c.spreadsheetId || '';
}

btnCloseSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

btnSaveSettings.addEventListener('click', async () => {
    const year = settingYear.value;
    let spreadsheetId = settingSpreadsheetId.value.trim();
    
    // Extract ID if user pastes full URL
    if (spreadsheetId.includes('/d/')) {
        const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
            spreadsheetId = match[1];
        }
    }
    
    if (!year) return; // Allow empty spreadsheetId

    btnSaveSettings.disabled = true;
    btnSaveSettings.textContent = 'Menyimpan...';

    const result = await window.api.saveSettings({ year, spreadsheetId });
    
    btnSaveSettings.disabled = false;
    btnSaveSettings.textContent = 'Simpan Pengaturan';

    if (result.success) {
        settingsModal.style.display = 'none';
        init(); // Reconnect to verify
    } else {
        alert('Gagal menyimpan pengaturan: ' + result.error);
    }
});

// ===== Window =====
btnMinimize.addEventListener('click', () => window.api.minimizeWindow());
btnClose.addEventListener('click', () => window.api.closeWindow());

// ===== Edit Manual =====
const btnEditManual = document.getElementById('btnEditManual');
btnEditManual.addEventListener('click', async () => {
    const settings = await window.api.getSettings();
    const activeYear = settings.activeYear;
    const activeConfig = settings.years ? settings.years[activeYear] : null;
    
    if (activeConfig && activeConfig.spreadsheetId) {
        window.api.openExternal(`https://docs.google.com/spreadsheets/d/${activeConfig.spreadsheetId}`);
    } else {
        alert("Spreadsheet ID belum diatur untuk tahun " + activeYear);
    }
});

init();
