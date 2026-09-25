// ============================================================
//  SILATAPP — MAKLUM BALAS IBU BAPA
//  Fail BARU dalam Apps Script (butang + → Skrip → namakan "MaklumBalas")
//
//  Fail ini menyimpan maklum balas ibu bapa ke sheet MAKLUM_BALAS.
//  Ia hanya aktif selepas disambung kepada doGet (langkah seterusnya).
// ============================================================

const SHEET_MAKLUM_BALAS = 'MAKLUM_BALAS';
const HEADER_MAKLUM_BALAS = [
  'ID_MAKLUM_BALAS', 'TARIKH', 'NO_KP', 'NAMA_PESILAT',
  'ID_LAPORAN', 'MAKLUM_BALAS', 'STATUS', 'CATATAN_JURULATIH'
];

// Dapatkan sheet MAKLUM_BALAS — cipta jika belum ada (data sedia ada TIDAK dipadam)
function dapatkanSheetMaklumBalas_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_MAKLUM_BALAS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MAKLUM_BALAS);
    sheet.getRange(1, 1, 1, HEADER_MAKLUM_BALAS.length)
      .setValues([HEADER_MAKLUM_BALAS])
      .setBackground('#085041').setFontColor('#FFFFFF')
      .setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 140);
    sheet.setColumnWidth(3, 130);
    sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(5, 140);
    sheet.setColumnWidth(6, 380);
    sheet.setColumnWidth(7, 100);
    sheet.setColumnWidth(8, 250);
    sheet.getRange(2, 7, 500, 1).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(['BARU', 'DIBACA', 'SELESAI'], true).build()
    );
    sheet.setTabColor('#085041');
  }
  return sheet;
}

// Simpan satu maklum balas daripada Portal Ibu Bapa
//   data = { no_kp, nama, id_laporan, teks }
function simpanMaklumBalas_(data) {
  const teks = String(data.teks || '').trim();
  const noKp = String(data.no_kp || '').trim();
  if (!teks) throw new Error('Maklum balas kosong');
  if (!/^\d{12}$/.test(noKp)) throw new Error('No. KP tidak sah');
  if (teks.length > 2000) throw new Error('Maklum balas terlalu panjang (maksimum 2000 aksara)');

  // Pastikan No. KP memang ahli berdaftar (elak spam)
  const ahli = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AHLI');
  if (ahli && ahli.getLastRow() > 1) {
    // No. KP bermula dengan 0 mungkin tersimpan sebagai nombor — tambah semula sifar di depan
    const senaraiKp = ahli.getRange(2, 2, ahli.getLastRow() - 1, 1).getDisplayValues().flat()
      .map(v => String(v).replace(/\D/g, '').padStart(12, '0'));
    if (senaraiKp.indexOf(noKp) === -1) throw new Error('No. KP tidak dijumpai');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = dapatkanSheetMaklumBalas_();
    const id = 'MB-' + new Date().getTime().toString(36).toUpperCase();
    const tarikh = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm');
    sheet.appendRow([
      id, tarikh, "'" + noKp, String(data.nama || ''),
      String(data.id_laporan || ''), teks, 'BARU', ''
    ]);
    return { id: id, tarikh: tarikh };
  } finally {
    lock.releaseLock();
  }
}

// Senarai maklum balas (untuk paparan admin kelak). no_kp kosong = semua.
function senaraiMaklumBalas_(noKp) {
  const sheet = dapatkanSheetMaklumBalas_();
  if (sheet.getLastRow() < 2) return [];
  const nilai = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADER_MAKLUM_BALAS.length).getDisplayValues();
  return nilai
    .filter(r => r[0] && (!noKp || r[2] === String(noKp)))
    .map(r => {
      const o = {};
      HEADER_MAKLUM_BALAS.forEach((h, i) => { o[h] = r[i]; });
      return o;
    })
    .reverse(); // terkini dahulu
}

// Pintu masuk — akan dipanggil daripada doGet.
// Pulangkan null jika tindakan bukan berkaitan maklum balas.
function tindakanMaklumBalas_(tindakan, data) {
  if (tindakan === 'simpan_maklum_balas') return simpanMaklumBalas_(data);
  if (tindakan === 'senarai_maklum_balas') return senaraiMaklumBalas_(data.no_kp);
  return null;
}

// Uji sendiri: pilih fungsi ini di atas → tekan ▶ Jalankan.
// Ia hanya mencipta sheet MAKLUM_BALAS (jika belum ada) tanpa menyentuh data lain.
function ujiMaklumBalas() {
  dapatkanSheetMaklumBalas_();
  SpreadsheetApp.getUi().alert('✅ Sheet MAKLUM_BALAS sedia.');
}
