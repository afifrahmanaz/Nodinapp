const { google } = require('googleapis');

let sheets;
let spreadsheetId;
let sheetName;

/**
 * Initialize Google Sheets API with Service Account
 */
async function init(credentialsPath, sheetId, name) {
    const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    spreadsheetId = sheetId;
    sheetName = name;
}

/**
 * Read all data from the sheet (rows 5 onwards, skipping headers in rows 1-4)
 * Columns: A(NO) B(Tanggal) C(Klasifikasi) D(LK/Klasifikasi) E(Bulan Romawi)
 *          F(Tahun) G(Jenis Surat) H(Nomor Nodin) I(Nomor LK)
 *          J(Isi Ringkasan) K(Nomor Surat) L(Pengelola) M(Status)
 */
async function readAllData() {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A5:M5556`,
        valueRenderOption: 'FORMATTED_VALUE',
    });

    const rows = response.data.values || [];
    const entries = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // Only include rows that have actual data (Tanggal Nodin filled)
        if (row[1] && row[1].trim() !== '') {
            entries.push({
                rowIndex: i + 5, // Actual row number in sheet (1-indexed, starting from row 5)
                no: row[0] || '',
                tanggal: row[1] || '',
                klasifikasi: row[2] || '',
                lkKlasifikasi: row[3] || '',
                bulanRomawi: row[4] || '',
                tahun: row[5] || '',
                jenisSurat: row[6] || '',
                nomorNodin: row[7] || '',
                nomorLK: row[8] || '',
                isiRingkasan: row[9] || '',
                nomorSurat: row[10] || '',
                pengelola: row[11] || '',
                status: row[12] || '',
            });
        }
    }

    return entries;
}

/**
 * Get the next available number for Nodin or LK
 */
async function getNextNumber(jenisSurat) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: jenisSurat === 'Nodin'
            ? `'${sheetName}'!H5:H5556`
            : `'${sheetName}'!I5:I5556`,
        valueRenderOption: 'FORMATTED_VALUE',
    });

    const values = response.data.values || [];
    let maxNumber = 0;

    for (const row of values) {
        const val = parseInt(row[0], 10);
        if (!isNaN(val) && val > maxNumber) {
            maxNumber = val;
        }
    }

    return maxNumber + 1;
}

/**
 * Find the first empty row (where column B is empty) starting from row 5
 */
async function findFirstEmptyRow() {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!B5:B5556`,
        valueRenderOption: 'FORMATTED_VALUE',
    });

    const values = response.data.values || [];

    for (let i = 0; i < values.length; i++) {
        if (!values[i] || !values[i][0] || values[i][0].trim() === '') {
            return i + 5; // Row number (1-indexed)
        }
    }

    // If all rows are filled, return next row
    return values.length + 5;
}

/**
 * Convert month number to Roman numeral
 */
function toRoman(num) {
    const romanNumerals = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, numeral] of romanNumerals) {
        while (num >= value) {
            result += numeral;
            num -= value;
        }
    }
    return result;
}

/**
 * Format date string to DD/MM/YYYY or sheet-compatible format
 */
function formatDateForSheet(dateStr) {
    // Input: YYYY-MM-DD, Output: keep as-is for Google Sheets
    return dateStr;
}

/**
 * Append a new entry to the sheet
 * @param {Object} entry - { tanggal, jenisSurat, isiRingkasan, pengelola, status }
 * @returns {Object} - { nomorSurat, rowIndex }
 */
async function appendEntry(entry) {
    const { tanggal, jenisSurat, isiRingkasan, pengelola, status } = entry;

    // Find the first empty row
    const targetRow = await findFirstEmptyRow();

    // Calculate derived values
    const date = new Date(tanggal);
    const bulanRomawi = toRoman(date.getMonth() + 1);
    const tahun = date.getFullYear().toString();

    // Get next number
    const nextNumber = await getNextNumber(jenisSurat);
    const paddedNumber = String(nextNumber).padStart(3, '0');

    // Determine Nomor Nodin / Nomor LK
    let nomorNodin = '';
    let nomorLK = '';
    let nomorSurat = '';

    if (jenisSurat === 'Nodin') {
        nomorNodin = nextNumber;
        nomorSurat = `LANTASKIM/${paddedNumber}/${bulanRomawi}/${tahun}`;
    } else {
        nomorLK = nextNumber;
        nomorSurat = `${paddedNumber}/LK/LANTASKIM/${bulanRomawi}/${tahun}`;
    }

    // Prepare row data: A(NO) B(Tanggal) C D E F G H I J K L M
    // Note: Column A has formula, we write from B onwards
    const rowData = [
        tanggal,           // B - Tanggal Nodin
        'LANTASKIM',       // C - Klasifikasi
        'LK/LANTASKIM',    // D - LK/Klasifikasi
        bulanRomawi,        // E - Bulan Romawi
        tahun,             // F - Tahun
        jenisSurat,        // G - Jenis Surat
        nomorNodin.toString() || '',  // H - Nomor Nodin
        nomorLK.toString() || '',     // I - Nomor LK
        isiRingkasan,      // J - Isi Ringkasan
        nomorSurat,        // K - Nomor Surat
        pengelola,         // L - Pengelola
        status || 'Draft', // M - Status
    ];

    // Write to the target row (columns B through M)
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!B${targetRow}:M${targetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [rowData],
        },
    });

    return {
        nomorSurat,
        nomorNodin: nomorNodin || null,
        nomorLK: nomorLK || null,
        rowIndex: targetRow,
        bulanRomawi,
        tahun,
    };
}

/**
 * Update the status of an entry (Draft/Final)
 */
async function updateStatus(rowIndex, status) {
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!M${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[status]],
        },
    });
}

module.exports = {
    init,
    readAllData,
    getNextNumber,
    findFirstEmptyRow,
    appendEntry,
    updateStatus,
};
