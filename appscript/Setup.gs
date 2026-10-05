// ============================================================
//  SILATAPP — SETUP SCRIPT (VERSI SELAMAT)
//  Gelanggang Sri Gayong Panglima Ulung
//  Jalankan fungsi: setupSilatApp()
//
//  PENTING: Versi ini TIDAK memadam sheet yang sudah ada.
//  Ia hanya mencipta sheet yang belum wujud, dan membina semula
//  sheet DASHBOARD (DASHBOARD hanya mengandungi formula, tiada data).
// ============================================================

// ── Tetapan Warna & Gaya ────────────────────────────────────
const WARNA = {
  HEADER_BG   : '#1D9E75',  // Hijau teal (header utama)
  HEADER_TEKS : '#FFFFFF',
  BARIS_GANJIL: '#F0FAF6',  // Hijau cerah (baris selang-seli)
  BARIS_GENAP : '#FFFFFF',
  JUDUL_BG    : '#085041',  // Hijau gelap (tajuk sheet)
  BARU        : '#E1F5EE',  // Latar baharu (sheet baru)
};

// ── Senarai Bengkung ────────────────────────────────────────
const SENARAI_BENGKUNG = [
  'BENGKUNG HITAM KOSONG (AHLI BAHARU)',
  'BENGKUNG HITAM CULA 1',
  'BENGKUNG HITAM CULA 2',
  'BENGKUNG HITAM CULA 3',
  'BENGKUNG PUTIH',
  'BENGKUNG PUTIH CULA BIRU',
  'BENGKUNG BIRU',
  'BENGKUNG BIRU CULA HIJAU',
  'BENGKUNG HIJAU',
  'BENGKUNG HIJAU CULA KUNING',
  'BENGKUNG KUNING',
  'BENGKUNG KUNING CULA HITAM (GURULATIH)',
  'BENGKUNG MERAH',
  'BENGKUNG MERAH CULA KUNING (JURULATIH)',
];

// ── Senarai Bulan ───────────────────────────────────────────
const SENARAI_BULAN = [
  'JANUARI','FEBRUARI','MAC','APRIL','MEI','JUN',
  'JULAI','OGOS','SEPTEMBER','OKTOBER','NOVEMBER','DISEMBER'
];

// Rekod sheet yang dicipta / dilangkau semasa setup
let _dicipta = [];
let _dilangkau = [];


// ============================================================
//  FUNGSI UTAMA — Jalankan fungsi ini
// ============================================================
function setupSilatApp() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const ui  = SpreadsheetApp.getUi();
  const res = ui.alert(
    'Setup SilatApp',
    'Script ini akan mencipta sheet yang BELUM ADA sahaja.\n' +
    'Sheet sedia ada (AHLI, KEHADIRAN, YURAN, dll.) TIDAK akan dipadam.\n' +
    'Sheet DASHBOARD akan dibina semula.\n\nTeruskan?',
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;

  _dicipta = [];
  _dilangkau = [];

  try {
    buatSheet_Ahli(ss);
    buatSheet_Kehadiran(ss);
    buatSheet_Yuran(ss);
    buatSheet_SejarahGred(ss);
    buatSheet_Silibus(ss);
    buatSheet_Rujukan(ss);
    buatSheet_BekasAhli(ss);
    buatSheet_Dashboard(ss);
    padamSheetDefault(ss);
    ss.setActiveSheet(ss.getSheetByName('AHLI'));
    ui.alert('✅ Berjaya!',
      'Dicipta / dibina semula:\n' + (_dicipta.length ? '• ' + _dicipta.join('\n• ') : '(tiada)') +
      '\n\nSudah ada (tidak disentuh):\n' + (_dilangkau.length ? '• ' + _dilangkau.join('\n• ') : '(tiada)') +
      '\n\nSistem SilatApp sedia digunakan!',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('❌ Ralat', 'Ralat berlaku: ' + e.message, ui.ButtonSet.OK);
    Logger.log(e);
  }
}

// Pulangkan sheet baharu, atau null jika sheet sudah wujud (data dilindungi)
function sheetBaharu_(ss, nama, kedudukan) {
  if (ss.getSheetByName(nama)) {
    _dilangkau.push(nama);
    return null;
  }
  _dicipta.push(nama);
  return ss.insertSheet(nama, Math.min(kedudukan, ss.getSheets().length));
}


// ============================================================
//  SHEET 1: AHLI
// ============================================================
function buatSheet_Ahli(ss) {
  const sheet = sheetBaharu_(ss, 'AHLI', 0);
  if (!sheet) return;

  // ── Header ──
  const headers = [
    'ID_AHLI','NO_KP','NAMA_PENUH','JANTINA','TARIKH_LAHIR',
    'ALAMAT','NAMA_WARIS','NO_TEL_WARIS','NO_TEL_AHLI',
    'KATEGORI','BENGKUNG_SEMASA','TARIKH_DAFTAR','STATUS','CATATAN'
  ];
  formatHeader(sheet, headers, WARNA.HEADER_BG);

  // ── Lebar Lajur ──
  sheet.setColumnWidth(1, 90);   // ID_AHLI
  sheet.setColumnWidth(2, 130);  // NO_KP
  sheet.setColumnWidth(3, 220);  // NAMA_PENUH
  sheet.setColumnWidth(4, 80);   // JANTINA
  sheet.setColumnWidth(5, 110);  // TARIKH_LAHIR
  sheet.setColumnWidth(6, 280);  // ALAMAT
  sheet.setColumnWidth(7, 220);  // NAMA_WARIS
  sheet.setColumnWidth(8, 120);  // NO_TEL_WARIS
  sheet.setColumnWidth(9, 120);  // NO_TEL_AHLI
  sheet.setColumnWidth(10, 130); // KATEGORI
  sheet.setColumnWidth(11, 280); // BENGKUNG_SEMASA
  sheet.setColumnWidth(12, 120); // TARIKH_DAFTAR
  sheet.setColumnWidth(13, 80);  // STATUS
  sheet.setColumnWidth(14, 200); // CATATAN

  // ── Validasi Data ──
  const BARIS_DATA = 2;
  const MAX_BARIS  = 200;

  // No. KP & telefon sebagai teks (elak sifar di depan hilang, cth: 050512...)
  sheet.getRange(BARIS_DATA, 2, MAX_BARIS, 1).setNumberFormat('@');
  sheet.getRange(BARIS_DATA, 8, MAX_BARIS, 2).setNumberFormat('@');

  // Jantina
  buatValidasi(sheet, BARIS_DATA, 4, MAX_BARIS, ['LELAKI','PEREMPUAN']);
  // Kategori
  buatValidasi(sheet, BARIS_DATA, 10, MAX_BARIS,
    ['SEKOLAH RENDAH (12 TAHUN KE BAWAH)',
     'SEKOLAH MENENGAH (17 TAHUN KE BAWAH)',
     'DEWASA (18 TAHUN KE ATAS)']);
  // Bengkung
  buatValidasi(sheet, BARIS_DATA, 11, MAX_BARIS, SENARAI_BENGKUNG);
  // Status
  buatValidasi(sheet, BARIS_DATA, 13, MAX_BARIS, ['AKTIF','BERHENTI']);

  sheet.getRange('A1').setNote(
    'Format ID: SGM-001, SGM-002, ...\n' +
    'Guna fungsi janID_Ahli() untuk jana automatik.'
  );

  sheet.setFrozenRows(1);
  warnaSelang(sheet, MAX_BARIS, headers.length);
  sheet.setTabColor('#1D9E75');
  SpreadsheetApp.flush();
}


// ============================================================
//  SHEET 2: KEHADIRAN
// ============================================================
function buatSheet_Kehadiran(ss) {
  const sheet = sheetBaharu_(ss, 'KEHADIRAN', 1);
  if (!sheet) return;

  const headers = [
    'ID_KEHADIRAN','NO_KP','NAMA_PESILAT','TARIKH','MASA','STATUS_KEHADIRAN'
  ];
  formatHeader(sheet, headers, '#0F6E56');

  sheet.setColumnWidth(1, 130);  // ID_KEHADIRAN
  sheet.setColumnWidth(2, 130);  // NO_KP
  sheet.setColumnWidth(3, 220);  // NAMA_PESILAT
  sheet.setColumnWidth(4, 110);  // TARIKH
  sheet.setColumnWidth(5, 90);   // MASA
  sheet.setColumnWidth(6, 130);  // STATUS

  sheet.getRange(2, 2, 500, 1).setNumberFormat('@');
  buatValidasi(sheet, 2, 6, 500, ['HADIR','TIDAK HADIR']);

  sheet.setFrozenRows(1);
  warnaSelang(sheet, 500, headers.length);
  sheet.setTabColor('#0F6E56');
  SpreadsheetApp.flush();
}


// ============================================================
//  SHEET 3: YURAN
// ============================================================
function buatSheet_Yuran(ss) {
  const sheet = sheetBaharu_(ss, 'YURAN', 2);
  if (!sheet) return;

  const headers = [
    'ID_BAYARAN','NO_KP','NAMA_PESILAT','JENIS_YURAN',
    'BULAN','TAHUN','JUMLAH_BAYARAN','TARIKH_BAYAR',
    'KAEDAH_BAYAR','BUKTI_RESIT','STATUS_PENGESAHAN','CATATAN'
  ];
  formatHeader(sheet, headers, '#534AB7');

  sheet.setColumnWidth(1, 130);  // ID_BAYARAN
  sheet.setColumnWidth(2, 130);  // NO_KP
  sheet.setColumnWidth(3, 220);  // NAMA_PESILAT
  sheet.setColumnWidth(4, 130);  // JENIS_YURAN
  sheet.setColumnWidth(5, 110);  // BULAN
  sheet.setColumnWidth(6, 70);   // TAHUN
  sheet.setColumnWidth(7, 110);  // JUMLAH_BAYARAN
  sheet.setColumnWidth(8, 120);  // TARIKH_BAYAR
  sheet.setColumnWidth(9, 120);  // KAEDAH_BAYAR
  sheet.setColumnWidth(10, 130); // BUKTI_RESIT
  sheet.setColumnWidth(11, 140); // STATUS_PENGESAHAN
  sheet.setColumnWidth(12, 200); // CATATAN

  sheet.getRange(2, 2, 500, 1).setNumberFormat('@');

  // Senarai termasuk nilai yang digunakan oleh aplikasi (DIKECUALIKAN, TRANSFER, SISTEM, dll.)
  buatValidasi(sheet, 2, 4, 500,
    ['PENDAFTARAN','BULANAN','LAIN-LAIN','DIKECUALIKAN','TIADA_BAYARAN','SEDEKAH']);
  buatValidasi(sheet, 2, 5, 500, SENARAI_BULAN);
  buatValidasi(sheet, 2, 9, 500,
    ['TUNAI','TRANSFER','PINDAHAN BANK','QR PAY','SISTEM','LAIN-LAIN']);
  buatValidasi(sheet, 2, 11, 500,
    ['SELESAI','BELUM DISAHKAN','DIKEMBALIKAN']);

  // Format lajur jumlah sebagai RM
  sheet.getRange(2, 7, 500, 1).setNumberFormat('"RM"#,##0.00');

  sheet.setFrozenRows(1);
  warnaSelang(sheet, 500, headers.length);
  sheet.setTabColor('#534AB7');
  SpreadsheetApp.flush();
}


// ============================================================
//  SHEET 4: SEJARAH_GRED
// ============================================================
function buatSheet_SejarahGred(ss) {
  const sheet = sheetBaharu_(ss, 'SEJARAH_GRED', 3);
  if (!sheet) return;

  const headers = [
    'ID_SEJARAH','NO_KP','NAMA_PESILAT',
    'BENGKUNG_LAMA','BENGKUNG_BARU','TARIKH_NAIK_GRED','CATATAN'
  ];
  formatHeader(sheet, headers, '#BA7517');

  sheet.setColumnWidth(1, 120);  // ID_SEJARAH
  sheet.setColumnWidth(2, 130);  // NO_KP
  sheet.setColumnWidth(3, 220);  // NAMA_PESILAT
  sheet.setColumnWidth(4, 280);  // BENGKUNG_LAMA
  sheet.setColumnWidth(5, 280);  // BENGKUNG_BARU
  sheet.setColumnWidth(6, 130);  // TARIKH_NAIK_GRED
  sheet.setColumnWidth(7, 200);  // CATATAN

  sheet.getRange(2, 2, 300, 1).setNumberFormat('@');
  buatValidasi(sheet, 2, 4, 300, SENARAI_BENGKUNG);
  buatValidasi(sheet, 2, 5, 300, SENARAI_BENGKUNG);

  sheet.setFrozenRows(1);
  warnaSelang(sheet, 300, headers.length);
  sheet.setTabColor('#BA7517');
  SpreadsheetApp.flush();
}


// ============================================================
//  SHEET 5: SILIBUS
// ============================================================
function buatSheet_Silibus(ss) {
  const sheet = sheetBaharu_(ss, 'SILIBUS', 4);
  if (!sheet) return;

  const headers = ['ID','LINK','TAJUK','GAMBAR','KATEGORI'];
  formatHeader(sheet, headers, '#3B6D11');

  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidth(2, 350);
  sheet.setColumnWidth(3, 200);
  sheet.setColumnWidth(4, 250);
  sheet.setColumnWidth(5, 180);

  // Data silibus asal
  const dataSilibus = [
    [1,'https://drive.google.com/file/d/1By2KlwsLGIofFgsKx9sw0Xr8XyqqiMz8/view','WIRID 700','','WIRID 700'],
    [2,'https://drive.google.com/file/d/1RcBkBmkvS6VPPmGZNHNOm1er2fDyItnB/view','BENGKUNG HITAM','','BENGKUNG HITAM'],
    [3,'https://drive.google.com/file/d/1NZgj2AJReqLhVo6HV85kZj1OaZEge2on/view','BENGKUNG PUTIH','','BENGKUNG PUTIH'],
    [4,'https://drive.google.com/file/d/1fGYbZljvzRJXoki8O9018Uxs-r__W3Tw/view','BENGKUNG BIRU','','BENGKUNG BIRU'],
    [5,'https://drive.google.com/file/d/1aRqbo9Mxi37YkGmfQLzYfCfJdltv6Q22/view','BENGKUNG HIJAU','','BENGKUNG HIJAU'],
    [6,'','BENGKUNG MERAH','','BENGKUNG MERAH'],
    [7,'https://drive.google.com/file/d/10u1xei_ExUz7tHzWN8tWl1ZqWG17wlPP/view','TARI TERATAI 1-10','','TARI TERATAI'],
    [8,'https://drive.google.com/file/d/1trVaBZkbH2Vi1lYvpk5SYPfo1EA2-_oS/view','TARI TERATAI 11-20','','TARI TERATAI'],
    [9,'https://drive.google.com/file/d/1BiZIf-T6IQoQkd56073wtZypIFGtnTiW/view','TARI TERATAI 21-30','','TARI TERATAI'],
    [10,'https://drive.google.com/file/d/1pA6rj1k8_tIHqOy-IuX5OAeyGkVa623g/view','TARI TERATAI 31-40','','TARI TERATAI'],
    [11,'https://drive.google.com/file/d/1zEkuaxtfDBVb7aBoagw8Q2TOL3UF8SGI/view','TARI TERATAI 41-50','','TARI TERATAI'],
    [12,'https://drive.google.com/file/d/1zm95wdSvKVBVlBh4d3iV16U0bR6Vjej7/view','TARI TERATAI 51-60','','TARI TERATAI'],
    [13,'https://drive.google.com/file/d/1bw41Vd08fH_PKnuoaIfacgbu6BL7xj2V/view','TARI TERATAI 61-70','','TARI TERATAI'],
    [14,'https://drive.google.com/file/d/1q5HyNk23pvPxN7ljafS6aAqTA-gYjWXq/view','TARI TERATAI 71-80','','TARI TERATAI'],
    [15,'https://drive.google.com/file/d/1rcW5im0fDbiVpIqmXnzVyaWclRkoZzNi/view','TARI TERATAI 81-90','','TARI TERATAI'],
    [16,'https://drive.google.com/file/d/1bAtUM7zZKWSQL5mBceycrWvijXazpLBL/view','PECAHAN 1','','PECAHAN IBU GAYONG'],
    [17,'https://drive.google.com/file/d/1rl1-1NmNRdsR_8IfF9cJbxzhyRfjLKQy/view','PECAHAN 2','','PECAHAN IBU GAYONG'],
    [18,'https://drive.google.com/file/d/1J3ma4MGgjff4p1aJPviNHdlTZW5dmKZf/view','PECAHAN 3','','PECAHAN IBU GAYONG'],
    [19,'','PECAHAN 4','','PECAHAN IBU GAYONG'],
    [20,'','PECAHAN 5','','PECAHAN IBU GAYONG'],
    [21,'','PECAHAN 6','','PECAHAN IBU GAYONG'],
    [22,'','PECAHAN 7','','PECAHAN IBU GAYONG'],
    [23,'https://drive.google.com/file/d/1KGqua8do3jdcD0-OQ-xOjHuOMz8I6Dho/view','SENAMAN KEKUDA','','SENAMAN KEKUDA'],
    [24,'https://drive.google.com/file/d/11cTt1qkvKDgR_Bdnc2iXKy-JJem5IJ35/view','IBU GAYONG','','IBU GAYONG'],
  ];
  sheet.getRange(2, 1, dataSilibus.length, 5).setValues(dataSilibus);

  sheet.setFrozenRows(1);
  sheet.setTabColor('#3B6D11');
  SpreadsheetApp.flush();
}


// ============================================================
//  SHEET 6: RUJUKAN (Kategori Berat Pertandingan)
// ============================================================
function buatSheet_Rujukan(ss) {
  const sheet = sheetBaharu_(ss, 'RUJUKAN', 5);
  if (!sheet) return;

  const headers = ['KATEGORI_USIA','KELAS','BERAT_MIN_(KG)','BERAT_MAX_(KG)'];
  formatHeader(sheet, headers, '#888780');

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 110);

  const dataRujukan = [
    ['PRA TUNAS (5-6 TAHUN)','A',15,18],['PRA TUNAS (5-6 TAHUN)','B',18,21],['PRA TUNAS (5-6 TAHUN)','C',21,24],
    ['TUNAS (7-8 TAHUN)','A',16,19],['TUNAS (7-8 TAHUN)','B',19,22],['TUNAS (7-8 TAHUN)','C',22,25],
    ['TUNAS (7-8 TAHUN)','D',25,28],['TUNAS (7-8 TAHUN)','E',28,31],['TUNAS (7-8 TAHUN)','BEBAS',31,999],
    ['PRA DINI (9-10 TAHUN)','A',18,21],['PRA DINI (9-10 TAHUN)','B',21,24],['PRA DINI (9-10 TAHUN)','C',24,27],
    ['PRA DINI (9-10 TAHUN)','E',27,30],['PRA DINI (9-10 TAHUN)','F',30,33],['PRA DINI (9-10 TAHUN)','BEBAS',33,999],
    ['DINI (11-12 TAHUN)','A',24,28],['DINI (11-12 TAHUN)','B',28,32],['DINI (11-12 TAHUN)','C',32,36],
    ['DINI (11-12 TAHUN)','D',36,40],['DINI (11-12 TAHUN)','E',40,44],['DINI (11-12 TAHUN)','F',44,48],
    ['DINI (11-12 TAHUN)','G',48,52],['DINI (11-12 TAHUN)','H',52,56],['DINI (11-12 TAHUN)','I',56,60],
    ['PRA REMAJA (13-14 TAHUN)','A',33,37],['PRA REMAJA (13-14 TAHUN)','B',37,41],
    ['PRA REMAJA (13-14 TAHUN)','C',41,45],['PRA REMAJA (13-14 TAHUN)','D',45,49],
    ['PRA REMAJA (13-14 TAHUN)','E',49,53],['PRA REMAJA (13-14 TAHUN)','F',53,57],
    ['PRA REMAJA (13-14 TAHUN)','G',57,61],['PRA REMAJA (13-14 TAHUN)','H',61,65],
    ['REMAJA (15-16 TAHUN)','A',39,43],['REMAJA (15-16 TAHUN)','B',43,47],
    ['REMAJA (15-16 TAHUN)','C',47,51],['REMAJA (15-16 TAHUN)','D',51,55],
    ['REMAJA (15-16 TAHUN)','E',55,59],['REMAJA (15-16 TAHUN)','F',59,63],
    ['REMAJA (15-16 TAHUN)','G',63,67],['REMAJA (15-16 TAHUN)','H',67,71],['REMAJA (15-16 TAHUN)','I',71,75],
    ['SUKMA (16-20 TAHUN)','A',45,50],['SUKMA (16-20 TAHUN)','B',50,55],['SUKMA (16-20 TAHUN)','C',55,60],
    ['SUKMA (16-20 TAHUN)','D',60,65],['SUKMA (16-20 TAHUN)','E',65,70],['SUKMA (16-20 TAHUN)','F',70,75],
    ['SUKMA (16-20 TAHUN)','G',75,80],['SUKMA (16-20 TAHUN)','H',80,85],
    ['TERBUKA (21-35 TAHUN)','A',45,50],['TERBUKA (21-35 TAHUN)','B',50,55],['TERBUKA (21-35 TAHUN)','C',55,60],
    ['TERBUKA (21-35 TAHUN)','D',60,65],['TERBUKA (21-35 TAHUN)','E',65,70],['TERBUKA (21-35 TAHUN)','F',70,75],
    ['TERBUKA (21-35 TAHUN)','G',75,80],['TERBUKA (21-35 TAHUN)','H',80,85],['TERBUKA (21-35 TAHUN)','BEBAS',85,999],
    ['MASTER 2 (35-45 TAHUN)','A',45,50],['MASTER 2 (35-45 TAHUN)','B',50,55],['MASTER 2 (35-45 TAHUN)','C',55,60],
    ['MASTER 2 (35-45 TAHUN)','D',60,65],['MASTER 2 (35-45 TAHUN)','E',65,70],['MASTER 2 (35-45 TAHUN)','F',70,75],
    ['MASTER 2 (35-45 TAHUN)','G',75,80],['MASTER 2 (35-45 TAHUN)','H',80,85],['MASTER 2 (35-45 TAHUN)','I',85,90],
    ['MASTER 2 (35-45 TAHUN)','J',90,95],['MASTER 2 (35-45 TAHUN)','BEBAS',95,999],
    ['MASTER 1 (45 TAHUN KE ATAS)','A',45,50],['MASTER 1 (45 TAHUN KE ATAS)','B',50,55],
    ['MASTER 1 (45 TAHUN KE ATAS)','C',55,60],['MASTER 1 (45 TAHUN KE ATAS)','D',60,65],
    ['MASTER 1 (45 TAHUN KE ATAS)','E',65,70],['MASTER 1 (45 TAHUN KE ATAS)','F',70,75],
    ['MASTER 1 (45 TAHUN KE ATAS)','G',75,80],['MASTER 1 (45 TAHUN KE ATAS)','H',80,85],
    ['MASTER 1 (45 TAHUN KE ATAS)','I',85,90],['MASTER 1 (45 TAHUN KE ATAS)','J',90,95],
    ['MASTER 1 (45 TAHUN KE ATAS)','BEBAS',95,999],
  ];
  sheet.getRange(2, 1, dataRujukan.length, 4).setValues(dataRujukan);
  warnaKategoriRujukan(sheet, dataRujukan);

  sheet.setFrozenRows(1);
  sheet.setTabColor('#888780');
  SpreadsheetApp.flush();
}


// ============================================================
//  SHEET 7: BEKAS_AHLI
// ============================================================
function buatSheet_BekasAhli(ss) {
  const sheet = sheetBaharu_(ss, 'BEKAS_AHLI', 6);
  if (!sheet) return;

  const headers = [
    'ID_AHLI','NO_KP','NAMA_PENUH','BENGKUNG_AKHIR',
    'TARIKH_DAFTAR','TARIKH_BERHENTI','SEBAB_BERHENTI','CATATAN'
  ];
  formatHeader(sheet, headers, '#A32D2D');

  sheet.setColumnWidth(1, 90);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 280);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 130);
  sheet.setColumnWidth(7, 200);
  sheet.setColumnWidth(8, 200);

  sheet.getRange(2, 2, 200, 1).setNumberFormat('@');
  const dataBekasAhli = [
    ['SGM-020','140319081048','MUHAMMAD SHAH HAIDAR BIN MOHAMAD SHAH RIMAN',
     'BENGKUNG HITAM KOSONG (AHLI BAHARU)', new Date(2025, 8, 22),'','BERHENTI',''],
  ];
  sheet.getRange(2, 1, dataBekasAhli.length, 8).setValues(dataBekasAhli);
  sheet.getRange(2, 5, 200, 2).setNumberFormat('dd/MM/yyyy');

  sheet.setFrozenRows(1);
  sheet.setTabColor('#A32D2D');
  SpreadsheetApp.flush();
}


// ============================================================
//  SHEET 8: DASHBOARD (hanya formula — selamat dibina semula)
// ============================================================
function buatSheet_Dashboard(ss) {
  const NAMA = 'DASHBOARD';
  const lama = ss.getSheetByName(NAMA);
  if (lama) ss.deleteSheet(lama);
  _dicipta.push(NAMA + ' (dibina semula)');
  const sheet = ss.insertSheet(NAMA, Math.min(7, ss.getSheets().length));
  sheet.setTabColor('#0C447C');

  // Tajuk utama
  sheet.getRange('A1:H1').merge()
    .setValue('DASHBOARD — GELANGGANG SRI GAYONG PANGLIMA ULUNG')
    .setBackground('#0C447C')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(13)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);

  // ── Bahagian 1: Ringkasan Ahli ──
  formatSubHeader(sheet.getRange('A3:D3').merge(), 'RINGKASAN KEAHLIAN');

  const labelAhli = [
    ['Jumlah Ahli Aktif','=COUNTIF(AHLI!M:M,"AKTIF")'],
    ['Sekolah Rendah','=COUNTIFS(AHLI!J:J,"SEKOLAH RENDAH (12 TAHUN KE BAWAH)",AHLI!M:M,"AKTIF")'],
    ['Sekolah Menengah','=COUNTIFS(AHLI!J:J,"SEKOLAH MENENGAH (17 TAHUN KE BAWAH)",AHLI!M:M,"AKTIF")'],
    ['Dewasa','=COUNTIFS(AHLI!J:J,"DEWASA (18 TAHUN KE ATAS)",AHLI!M:M,"AKTIF")'],
    ['Lelaki','=COUNTIFS(AHLI!D:D,"LELAKI",AHLI!M:M,"AKTIF")'],
    ['Perempuan','=COUNTIFS(AHLI!D:D,"PEREMPUAN",AHLI!M:M,"AKTIF")'],
    ['Bekas Ahli','=MAX(0,COUNTA(BEKAS_AHLI!B:B)-1)'],
  ];
  isiLabelNilai(sheet, 4, 1, labelAhli, '#E1F5EE', '#1D9E75');

  // ── Bahagian 2: Kehadiran Bulan Ini ──
  formatSubHeader(sheet.getRange('A13:D13').merge(), 'KEHADIRAN BULAN SEMASA');

  sheet.getRange('A14').setValue('Bulan');
  sheet.getRange('B14').setFormula('=TEXT(TODAY(),"MMMM YYYY")');
  sheet.getRange('A15').setValue('Sesi direkodkan');
  sheet.getRange('B15').setFormula(
    '=COUNTIFS(KEHADIRAN!D:D,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1),' +
    'KEHADIRAN!D:D,"<"&DATE(YEAR(TODAY()),MONTH(TODAY())+1,1),' +
    'KEHADIRAN!F:F,"HADIR")'
  );
  formatBlokLabel(sheet, 'A14:B15', '#E1F5EE', '#085041');

  // ── Bahagian 3: Yuran Bulan Ini ──
  formatSubHeader(sheet.getRange('A18:D18').merge(), 'YURAN BULAN SEMASA');

  // Nama bulan dalam Bahasa Melayu (TEXT() ikut bahasa akaun — mungkin keluar "SEPTEMBER"/"AUGUST")
  const BULAN_MS = '=CHOOSE(MONTH(TODAY()),"JANUARI","FEBRUARI","MAC","APRIL","MEI","JUN","JULAI","OGOS","SEPTEMBER","OKTOBER","NOVEMBER","DISEMBER")';
  const labelYuran = [
    ['Bulan', BULAN_MS],                                                                          // B19
    // TAHUN mungkin tersimpan sebagai nombor atau teks — banding sebagai teks supaya kedua-duanya dikira
    ['Jumlah Kutipan (RM)','=SUMPRODUCT((YURAN!E2:E5000=B19)*(YURAN!F2:F5000&""=YEAR(TODAY())&"")*(YURAN!K2:K5000="SELESAI"),YURAN!G2:G5000)'], // B20
    ['Bilangan Pembayar','=SUMPRODUCT((YURAN!E2:E5000=B19)*(YURAN!F2:F5000&""=YEAR(TODAY())&"")*(YURAN!K2:K5000="SELESAI")*(YURAN!D2:D5000="BULANAN"))'], // B21
    ['Belum Bayar (orang)','=MAX(0,COUNTIF(AHLI!M:M,"AKTIF")-B21)'],                              // B22 — tolak BILANGAN pembayar, bukan RM
  ];
  isiLabelNilai(sheet, 19, 1, labelYuran, '#EEEDFE', '#534AB7');
  sheet.getRange('B20').setNumberFormat('"RM"#,##0.00');

  // ── Format lebar lajur ──
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 150);

  sheet.setFrozenRows(2);
  SpreadsheetApp.flush();
}

// Baiki DASHBOARD sahaja (tanpa sentuh sheet lain)
function baikiDashboard() {
  _dicipta = []; _dilangkau = [];
  buatSheet_Dashboard(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert('✅ DASHBOARD telah dibina semula.');
}


// ============================================================
//  FUNGSI UTILITI
// ============================================================

function formatHeader(sheet, headers, bgColor) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers])
    .setBackground(bgColor)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 34);
}

function buatValidasi(sheet, barisAwal, lajur, jumlahBaris, senarai) {
  const range = sheet.getRange(barisAwal, lajur, jumlahBaris, 1);
  const rule  = SpreadsheetApp.newDataValidation()
    .requireValueInList(senarai, true)
    .setAllowInvalid(true)   // amaran sahaja — jangan halang data yang ditulis oleh aplikasi
    .build();
  range.setDataValidation(rule);
}

// Warna selang-seli — satu panggilan sahaja (jauh lebih pantas daripada setiap baris)
function warnaSelang(sheet, jumlahBaris, jumlahLajur) {
  const warna = [];
  for (let i = 0; i < jumlahBaris; i++) {
    const bg = (i % 2 === 0) ? WARNA.BARIS_GANJIL : WARNA.BARIS_GENAP;
    warna.push(new Array(jumlahLajur).fill(bg));
  }
  sheet.getRange(2, 1, jumlahBaris, jumlahLajur).setBackgrounds(warna);
}

function warnaKategoriRujukan(sheet, data) {
  const palet = ['#EAF3DE','#FAEEDA','#E1F5EE','#EEEDFE','#FAECE7','#E6F1FB','#FCEBEB','#F1EFE8'];
  let idx = 0, semasa = '';
  const warna = data.map(r => {
    if (r[0] && r[0] !== semasa) { semasa = r[0]; idx = (idx + 1) % palet.length; }
    return new Array(4).fill(palet[idx]);
  });
  sheet.getRange(2, 1, data.length, 4).setBackgrounds(warna);
}

function formatSubHeader(range, teks) {
  range.setValue(teks)
    .setBackground('#085041')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  range.getSheet().setRowHeight(range.getRow(), 30);
}

function isiLabelNilai(sheet, barisAwal, lajurAwal, data, bgLabel, bgNilai) {
  data.forEach(([label, nilai], i) => {
    const baris = barisAwal + i;
    sheet.getRange(baris, lajurAwal).setValue(label)
      .setBackground(bgLabel)
      .setFontWeight('bold')
      .setFontSize(11);
    if (nilai.toString().startsWith('=')) {
      sheet.getRange(baris, lajurAwal + 1).setFormula(nilai);
    } else {
      sheet.getRange(baris, lajurAwal + 1).setValue(nilai);
    }
    sheet.getRange(baris, lajurAwal + 1)
      .setBackground(bgNilai)
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(12)
      .setHorizontalAlignment('center');
    sheet.setRowHeight(baris, 28);
  });
}

function formatBlokLabel(sheet, range, bgLabel, fontColor) {
  sheet.getRange(range)
    .setBackground(bgLabel)
    .setFontColor(fontColor);
}

function padamSheetDefault(ss) {
  ['Sheet1','Helaian1','Sheet'].forEach(nama => {
    const s = ss.getSheetByName(nama);
    if (s && s.getLastRow() <= 1 && ss.getSheets().length > 1) {
      try { ss.deleteSheet(s); } catch(e) {}
    }
  });
}


// ============================================================
//  FUNGSI TAMBAHAN — Jana ID Ahli
// ============================================================
function janID_Ahli() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AHLI');
  if (!sheet) return '';

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'SGM-001';

  // Cari nombor terbesar (dalam AHLI dan BEKAS_AHLI — elak ID berulang)
  let ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const bekas = ss.getSheetByName('BEKAS_AHLI');
  if (bekas && bekas.getLastRow() > 1) {
    ids = ids.concat(bekas.getRange(2, 1, bekas.getLastRow() - 1, 1).getValues().flat());
  }
  const nombor = ids
    .filter(v => v && v.toString().startsWith('SGM-'))
    .map(v => parseInt(v.toString().replace('SGM-', ''), 10))
    .filter(n => !isNaN(n));

  const max = nombor.length > 0 ? Math.max(...nombor) : 0;
  return 'SGM-' + String(max + 1).padStart(3, '0');
}


// ============================================================
//  FUNGSI TAMBAHAN — Jana ID Kehadiran / Yuran / Sejarah
// ============================================================
function janIDRawak(prefix) { // nama berbeza — janID() dalam API.gs digunakan untuk ID ahli
  const timestamp = new Date().getTime().toString(36).toUpperCase();
  const rnd       = Math.random().toString(36).slice(2, 6).toUpperCase();
  return prefix + '-' + timestamp + rnd;
}
