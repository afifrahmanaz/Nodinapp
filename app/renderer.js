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

// ===== State =====
let isConnected = false;
let historyData = [];

// ===== Init =====
async function init() {
    setStatus('connecting', 'Menghubungkan...');
    try {
        const result = await window.api.initSheets();
        if (result.success) {
            isConnected = true;
            setStatus('connected', 'Terhubung');
            tanggalNodin.value = new Date().toISOString().split('T')[0];
            validateForm();
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        isConnected = false;
        setStatus('error', 'Gagal terhubung');
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
        const label = entry.jenisSurat === 'Nodin' ? 'Nota Dinas' : 'Laporan Kejadian';

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
    tanggalNodin.value = new Date().toISOString().split('T')[0];
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
        statNodin.textContent = historyData.filter(e => e.jenisSurat === 'Nodin').length;
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
        const t = e.jenisSurat === 'Nodin' ? 'nodin' : 'lk';
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
    renderHistory(historyData.filter(e => e.jenisSurat === 'Nodin'));
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

// ===== Window =====
btnMinimize.addEventListener('click', () => window.api.minimizeWindow());
btnClose.addEventListener('click', () => window.api.closeWindow());

init();
