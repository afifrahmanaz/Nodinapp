# 🔧 Panduan Setup Google Sheets API + Service Account

## Langkah 1: Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **"Select a project"** di bagian atas → **"New Project"**
3. Isi nama project, misalnya: `NodinApp`
4. Klik **"Create"**

## Langkah 2: Aktifkan Google Sheets API

1. Di sidebar kiri, klik **"APIs & Services"** → **"Library"**
2. Cari **"Google Sheets API"**
3. Klik hasilnya → Klik **"Enable"**

## Langkah 3: Buat Service Account

1. Di sidebar kiri, klik **"APIs & Services"** → **"Credentials"**
2. Klik **"+ CREATE CREDENTIALS"** → **"Service account"**
3. Isi:
   - **Service account name**: `nodin-app` (atau nama lain)
   - **Service account ID**: otomatis terisi
4. Klik **"Create and Continue"**
5. Untuk **Role**, pilih: **"Editor"** → Klik **"Continue"**
6. Klik **"Done"**

## Langkah 4: Download Key JSON

1. Setelah service account dibuat, klik **nama service account** yang baru dibuat
2. Buka tab **"Keys"**
3. Klik **"Add Key"** → **"Create new key"**
4. Pilih **JSON** → Klik **"Create"**
5. File JSON akan ter-download otomatis
6. **Pindahkan file JSON** ke folder:
   ```
   c:\Users\afifr\Nodinapp\credentials\service-account.json
   ```

## Langkah 5: Share Google Sheet ke Service Account

> [!IMPORTANT]
> Langkah ini WAJIB agar aplikasi bisa mengakses spreadsheet Anda!

1. Buka file JSON yang tadi di-download
2. Cari field **"client_email"** — copy email-nya (contoh: `nodin-app@nodinapp-xxxxx.iam.gserviceaccount.com`)
3. Buka Google Sheet Anda: [NODIN LANTASKIM TAHUN 2026](https://docs.google.com/spreadsheets/d/1FZiIyewRin7UHsOb_WkdovSyZSveYMZP9XYwHKq2Jwc/edit)
4. Klik tombol **"Bagikan"** (Share) di kanan atas
5. Paste email service account tadi
6. Set permission ke **"Editor"**
7. Klik **"Kirim"** (Send)

## Langkah 6: Jalankan Aplikasi

Setelah semua selesai, jalankan:
```bash
npm start
```

---

## ⚠️ Penting

- **JANGAN** commit file `credentials/service-account.json` ke Git!
- File ini sudah termasuk di `.gitignore`
- Simpan file ini dengan aman
