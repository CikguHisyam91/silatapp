// ============================================================
//  SILATAPP — WEB API v3 (dibaiki)
//  Selepas paste kod baru, klik:
//  Deploy > Manage Deployments > Edit > Version: New version > Deploy
//
//  Pembaikan v3 (ditanda [BAIKI] dalam kod):
//   1. Lulus pendaftaran keluar ralat "idBaharu is not defined"
//   2. Cache senarai ahli tidak pernah dikosongkan (huruf besar/kecil)
//      → ahli baru / naik gred / berhenti lambat 5 minit muncul
//   3. Cache silibus & tetapan tidak dikosongkan selepas kemaskini
//   4. No. KP bermula dengan 0 (lahir 2000–2009) tidak dijumpai
//   5. Yuran PENDAFTARAN dikira sebagai yuran BULANAN dibayar
//   6. "Belum bayar" di dashboard salah kira (rekod berganda / sedekah)
//   7. getOwner() ralat jika fail dalam Shared Drive
//   8. Router: kes berganda dibuang; kemaskini_ahli guna versi selamat
//   9. Kehadiran dilindungi LockService (elak rekod berganda)
//  10. OPR: senarai nama hadir & kiraan yuran dibetulkan
// ============================================================

const NAMA_SHEET = {
  AHLI:'AHLI', KEHADIRAN:'KEHADIRAN', YURAN:'YURAN',
  SEJARAH_GRED:'SEJARAH_GRED', SILIBUS:'SILIBUS', BEKAS_AHLI:'BEKAS_AHLI',
  RUJUKAN:'RUJUKAN',
};

function balas(data, cb) {
  const j = JSON.stringify({ ok:true, data });
  return cb
    ? ContentService.createTextOutput(cb+'('+j+')').setMimeType(ContentService.MimeType.JAVASCRIPT)
    : ContentService.createTextOutput(j).setMimeType(ContentService.MimeType.JSON);
}

function balasRalat(msg, cb) {
  const j = JSON.stringify({ ok:false, error:msg });
  return cb
    ? ContentService.createTextOutput(cb+'('+j+')').setMimeType(ContentService.MimeType.JAVASCRIPT)
    : ContentService.createTextOutput(j).setMimeType(ContentService.MimeType.JSON);
}

// ── Router utama ─────────────────────────────────────────────
function doGet(e) {
  const cb = e.parameter.callback || '';
  try {
    if (e.parameter._data) {
      const body     = JSON.parse(e.parameter._data);
      const tindakan = body.tindakan || '';
      switch(tindakan) {
        case 'daftar_ahli'          : return balas(daftarAhli(body), cb);
        case 'kemaskini_ahli'       : return balas(kemaskiniAhliV2(body), cb); // [BAIKI] versi ikut header (selamat)
        case 'berhenti_ahli'        : return balas(berhentiAhli(body), cb);
        case 'rekod_kehadiran'      : return balas(rekodKehadiran(body), cb);
        case 'tambah_yuran'         : return balas(tambahYuran(body), cb);
        case 'naik_gred'            : return balas(naikGred(body), cb);
        case 'kemaskini_berat'      : return balas(kemaskiniBeratTinggi(body), cb);
        case 'simpan_laporan'       : return balas(simpanLaporan(body), cb);
        case 'padam_laporan'        : return balas(padamLaporan(body), cb);
        case 'kemaskini_laporan'    : return balas(kemaskiniLaporan(body), cb);
        case 'simpan_foto_pesilat'  : return balas(simpanFotoPesilat(body), cb);
        case 'tambah_item_penilaian': return balas(tambahItemPenilaian(body), cb);
        case 'padam_item_penilaian' : return balas(padamItemPenilaian(body), cb);
        case 'kemaskini_silibus'    : return balas(kemaskiniSilibus(body), cb);
        case 'tambah_silibus'       : return balas(tambahSilibus2(body), cb);
        case 'padam_silibus'        : return balas(padamSilibus(body), cb);
        case 'tambah_kewangan'      : return balas(tambahKewangan(body), cb);
        case 'padam_kewangan'       : return balas(padamKewangan(body), cb);
        case 'kemaskini_kewangan'   : return balas(kemaskiniKewangan(body), cb);
        case 'tambah_tandingan'     : return balas(tambahTandingan(body), cb);
        case 'kemaskini_tandingan'  : return balas(kemaskiniTandingan(body), cb);
        case 'padam_tandingan'      : return balas(padamTandingan(body), cb);
        case 'tambah_galeri'        : return balas(tambahGaleri(body), cb);
        case 'padam_galeri'         : return balas(padamGaleri(body), cb);
        case 'simpan_ujian'         : return balas(simpanUjian(body), cb);
        case 'simpan_markah_ujian'  : return balas(simpanMarkahUjian(body), cb);
        case 'padam_ujian'          : return balas(padamUjian(body), cb);
        case 'tambah_latihan'       : return balas(tambahLatihan(body), cb);
        case 'rekod_latihan'        : return balas(rekodLatihanKendiri(body), cb);
        case 'padam_latihan'        : return balas(padamLatihan(body), cb);
        case 'batal_kecuali'        : return balas(batalKecualiBulan(body), cb);
        case 'padam_ahli'           : return balas(padamAhli(body), cb);
        case 'daftar_baharu'        : return balas(simpanPendaftaranBaharu(body), cb);
        case 'lulus_pendaftaran'    : return balas(lulusPendaftaran(body), cb);
        case 'tolak_pendaftaran'    : return balas(tolakPendaftaran(body), cb);
        case 'kemaskini_tetapan'    : return balas(kemaskiniTetapan(body), cb);
        case 'padam_data_ahli'      : return balas(padamDataAhli(body), cb);
        case 'padam_rekod_yuran'    : return balas(padamRekodYuran(body), cb);
        case 'padam_yuran_bulan'    : return balas(padamYuranBulan(body), cb);
        default: return balasRalat('Tindakan tulis tidak dikenali: '+tindakan, cb);
      }
    }
    const tindakan = e.parameter.tindakan || '';
    switch(tindakan) {
      case 'dashboard'          : return balas(getDashboard(), cb);
      case 'senarai_ahli'       : return balas(getSenaraiAhli(e), cb);
      case 'profil_ahli'        : return balas(getProfilAhli(e), cb);
      case 'kehadiran'          : return balas(getKehadiran(e), cb);
      case 'statistik_kehadiran': return balas(getStatistikKehadiran(e), cb);
      case 'yuran'              : return balas(getYuran(e), cb);
      case 'status_yuran'       : return balas(getStatusYuran(e), cb);
      case 'sejarah_gred'       : return balas(getSejarahGred(e), cb);
      case 'silibus'            : return balas(getSilibus(e), cb);
      case 'cari_ahli'          : return balas(cariAhli(e), cb);
      case 'set_tidak_aktif'    : return balas(setTidakAktif(e), cb);
      case 'stat_hadir_semua'   : return balas(getStatHadirSemua(e), cb);
      case 'kemaskini_ahli_get' : return balas(kemaskiniAhliGet(e), cb);
      case 'senarai_pendaftaran': return balas(getSenaraiPendaftaran(e), cb);
      case 'silibus_rujukan'    : return balas(getRujukan(), cb);
      case 'senarai_ahli_bmi'   : return balas(getSenaraiAhliBMI(), cb);
      case 'item_penilaian'     : return balas(getItemPenilaian(e), cb);
      case 'tetapan'            : return balas(getTetapan(), cb);
      case 'senarai_laporan'    : return balas(getSenaraiLaporan(e), cb);
      case 'laporan_pesilat'    : return balas(getLaporanPesilat(e), cb);
      case 'kewangan'           : return balas(getKewangan(e), cb);
      case 'ringkasan_kewangan' : return balas(getRingkasanKewangan(e), cb);
      case 'lejer_kewangan'     : return balas(getLejerKewangan(e), cb);
      case 'repair_kewangan'    : return balas(repairKewangan(), cb);
      case 'lejer_kewangan_full': return balas(getLejerKewanganFull(e), cb);
      case 'latihan_kendiri'    : return balas(getLatihanKendiri(e), cb);
      case 'latihan_pesilat'    : return balas(getLatihanPesilat(e), cb);
      case 'senarai_tandingan'  : return balas(getSenaraiTandingan(e), cb);
      case 'senarai_galeri'     : return balas(getSenaraiGaleri(e), cb);
      case 'stat_hadir_trend'   : return balas(getStatHadirTrend(e), cb);
      case 'senarai_ujian'      : return balas(getSenaraiUjian(), cb);
      case 'ujian_ahli'         : return balas(getUjianAhli(e), cb);
      case 'data_opr'           : return balas(getDataOPR(e), cb);
      default: return balasRalat('Tindakan tidak dikenali: '+tindakan, cb);
    }
  } catch(err) {
    Logger.log(err);
    return balasRalat('Ralat: '+err.message, cb);
  }
}

function doPost(e) {
  try {
    return doGet({ parameter: { _data: e.postData.contents || '{}', callback: '' } });
  } catch(err) {
    return balasRalat('Ralat POST: '+err.message, '');
  }
}

// ═══════════════════════════════════════════════════════════════
//  CACHE SYSTEM — CacheService Google Apps Script
//  TTL: AHLI=5min | TETAPAN=10min | SILIBUS=10min | DASHBOARD=2min
// ═══════════════════════════════════════════════════════════════
const CACHE_TTL = { AHLI:300, TETAPAN:600, SILIBUS:600, DASHBOARD:120, LEJER:60 };

function cacheGet(key) {
  try { const v = CacheService.getScriptCache().get(key); return v ? JSON.parse(v) : null; }
  catch(e) { return null; }
}
function cachePut(key, data, ttl) {
  try {
    const s = JSON.stringify(data);
    if (s.length < 90000) CacheService.getScriptCache().put(key, s, ttl || 300);
  } catch(e) {}
}
function cacheDel(key) { try { CacheService.getScriptCache().remove(key); } catch(e) {} }
function cacheClear(...keys) { try { CacheService.getScriptCache().removeAll(keys); } catch(e) {} }

// Panggil bila sebarang data tukar — clear semua cache berkaitan
function invalidateCache(jenis) {
  var thnKini = new Date().getFullYear();
  switch(jenis) {
    // [BAIKI] kunci sebenar ialah 'ahli_AKTIF' (huruf besar) — dulu 'ahli_aktif' tidak pernah padan
    case 'ahli':      cacheClear('ahli_AKTIF','ahli_semua','ahli_TIDAK AKTIF','dashboard'); break;
    case 'kehadiran': cacheDel('dashboard'); break;
    case 'yuran':     cacheClear('dashboard','lejer_'+thnKini,'lejer_'+(thnKini-1)); break;
    case 'lejer':     cacheClear('lejer_'+thnKini,'lejer_'+(thnKini-1),'lejer_'+(thnKini+1)); break;
    case 'silibus':   cacheDel('silibus'); break;
    case 'tetapan':   cacheDel('tetapan'); break;
    case 'semua':     cacheClear('ahli_AKTIF','ahli_semua','ahli_TIDAK AKTIF','dashboard','silibus','tetapan'); break;
  }
}

// Jalankan sekali secara manual jika data kelihatan lama
function kosongkanSemuaCache() { invalidateCache('semua'); invalidateCache('lejer'); Logger.log('Cache dikosongkan'); }

// Keep-warm function — set trigger setiap 5 minit dalam GAS
function keepWarm() { Logger.log('keepWarm: ' + new Date().toISOString()); }

// ── No. KP ───────────────────────────────────────────────────
// [BAIKI] No. KP bermula 0 (cth 050512...) yang tersimpan sebagai nombor hilang sifar di depan.
function normKP(v) {
  let s = String(v == null ? '' : v).trim();
  if (/^\d{11}$/.test(s)) s = '0' + s;          // 50512080141 → 050512080141
  return s;
}
function samaKP(a, b) { return normKP(a) === normKP(b) && normKP(a) !== ''; }
// Simpan No. KP sebagai teks supaya sifar di depan kekal dalam Google Sheets
function kpTeks(v) { const s = normKP(v); return /^\d+$/.test(s) ? "'" + s : s; }

// Yuran yang dikira sebagai bayaran bulanan (bukan pendaftaran / rekod sistem)
function yuranBulanan(r) {
  const j = String(r.JENIS_YURAN || 'BULANAN').toUpperCase();
  return j !== 'PENDAFTARAN' && j !== 'DIKECUALIKAN' && j !== 'TIADA_BAYARAN' && j !== 'SEDEKAH' && r.NO_KP !== 'SEDEKAH';
}

// [BAIKI] getOwner() kembali null untuk fail dalam Shared Drive
function emelPengguna() {
  try { const o = SpreadsheetApp.getActiveSpreadsheet().getOwner(); if (o) return o.getEmail(); } catch(e) {}
  try { return Session.getEffectiveUser().getEmail() || ''; } catch(e) { return ''; }
}

// ── Fungsi Baca ───────────────────────────────────────────────
function getDashboard() {
  const cached = cacheGet('dashboard');
  if (cached) return cached;
  const aktif = ambilData(NAMA_SHEET.AHLI).filter(r=>r.STATUS==='AKTIF');
  const hadir = ambilData(NAMA_SHEET.KEHADIRAN);
  const yuran = ambilData(NAMA_SHEET.YURAN);
  const bulan = namaBulanSkrg(), tahun = new Date().getFullYear();
  const hari  = tarikhFmt(new Date());
  const hadirHari  = hadir.filter(r=>tarikhFmt(r.TARIKH)===hari&&(r.STATUS_KEHADIRAN||'HADIR').toUpperCase()==='HADIR').length;
  const yuranBulan = yuran.filter(r=>r.BULAN===bulan&&String(r.TAHUN)===String(tahun)&&r.STATUS_PENGESAHAN==='SELESAI');
  const kutipan    = yuranBulan.reduce((s,r)=>s+(parseFloat(r.JUMLAH_BAYARAN)||0),0);
  // [BAIKI] kira ahli aktif UNIK yang sudah bayar yuran bulanan (bukan bilangan rekod)
  const kpAktif = new Set(aktif.map(a=>normKP(a.NO_KP)));
  const pembayar = new Set(yuranBulan.filter(yuranBulanan).map(r=>normKP(r.NO_KP)).filter(k=>kpAktif.has(k)));
  const hasil = { jumlah_ahli_aktif:aktif.length, rendah:aktif.filter(r=>r.KATEGORI.includes('RENDAH')).length, menengah:aktif.filter(r=>r.KATEGORI.includes('MENENGAH')).length, dewasa:aktif.filter(r=>r.KATEGORI.includes('DEWASA')).length, hadir_hari_ini:hadirHari, bulan_yuran:bulan, tahun_yuran:tahun, kutipan_bulan_ini:kutipan, sudah_bayar:pembayar.size, belum_bayar:Math.max(0,aktif.length-pembayar.size) };
  cachePut('dashboard', hasil, CACHE_TTL.DASHBOARD);
  return hasil;
}

function getSenaraiAhli(e) {
  const status = (e.parameter.status||'').toUpperCase();
  const ck = 'ahli_' + (status||'semua');
  const cached = cacheGet(ck);
  if (cached) return cached;
  const hasil = ambilData(NAMA_SHEET.AHLI)
    .filter(r=>!status||r.STATUS===status)
    .map(r=>({id_ahli:r.ID_AHLI,no_kp:r.NO_KP,nama:r.NAMA_PENUH,jantina:r.JANTINA,tarikh_lahir:fmtTarikhGAS(r.TARIKH_LAHIR),kategori:r.KATEGORI,bengkung:r.BENGKUNG_SEMASA,tarikh_daftar:fmtTarikhGAS(r.TARIKH_DAFTAR),status:r.STATUS,no_tel:r.NO_TEL_WARIS}));
  cachePut(ck, hasil, CACHE_TTL.AHLI);
  return hasil;
}

function getProfilAhli(e) {
  const noKp = e.parameter.no_kp||''; if(!noKp) throw new Error('no_kp diperlukan');
  const ahli = ambilData(NAMA_SHEET.AHLI).find(r=>samaKP(r.NO_KP,noKp));
  if(!ahli) throw new Error('Ahli tidak dijumpai'); return ahli;
}

function fmtTarikhGAS(val) {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(val))) return String(val).substring(0,10);
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).substring(0,10);
  // Elak "Dec 30 1899" — ambil tarikh sahaja bukan masa
  const tahun = d.getFullYear();
  if (tahun < 1970) return ''; // masa sahaja, buang
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return tahun + '-' + mm + '-' + dd;
}

function fmtMasaGAS(val) {
  if (!val) return '20:00';
  if (/^\d{1,2}:\d{2}/.test(String(val))) return String(val).substring(0,5);
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).substring(0,5);
  const hh = String(d.getHours()).padStart(2,'0');
  const mn = String(d.getMinutes()).padStart(2,'0');
  return hh + ':' + mn;
}

function getKehadiran(e) {
  let h = ambilData(NAMA_SHEET.KEHADIRAN);
  const noKp = e.parameter.no_kp;
  const tParam = e.parameter.tarikh;
  const bulanParam = e.parameter.bulan ? parseInt(e.parameter.bulan) : null;
  const tahunParam = e.parameter.tahun ? parseInt(e.parameter.tahun) : null;

  if (noKp) h = h.filter(r => samaKP(r.NO_KP, noKp));
  if (tParam) h = h.filter(r => fmtTarikhGAS(r.TARIKH) === tParam);
  if (bulanParam) h = h.filter(r => {
    const t = new Date(r.TARIKH); return !isNaN(t) && t.getMonth()+1 === bulanParam;
  });
  if (tahunParam) h = h.filter(r => {
    const t = new Date(r.TARIKH); return !isNaN(t) && t.getFullYear() === tahunParam;
  });

  return h.map(r => {
    // Status kosong → anggap HADIR jika ada rekod
    const status = (r.STATUS_KEHADIRAN||r.STATUS||'').toString().trim();
    const statusBersih = status === '' ? 'HADIR' : status.toUpperCase();
    const tarikhBersih = fmtTarikhGAS(r.TARIKH);
    return {
      id: r.ID_KEHADIRAN,
      no_kp: normKP(r.NO_KP),
      nama: r.NAMA_PESILAT||'',
      tarikh: tarikhBersih,
      masa: fmtMasaGAS(r.MASA),
      STATUS_KEHADIRAN: statusBersih
    };
  }).filter(r => r.tarikh); // buang rekod tanpa tarikh sah
}

function getStatistikKehadiran(e) {
  const noKp=e.parameter.no_kp||''; if(!noKp) throw new Error('no_kp diperlukan');
  const tahun=parseInt(e.parameter.tahun||new Date().getFullYear());
  const data=ambilData(NAMA_SHEET.KEHADIRAN).filter(r=>samaKP(r.NO_KP,noKp)).filter(r=>{ const t=new Date(r.TARIKH); return !isNaN(t)&&t.getFullYear()===tahun; });
  // Rekod tanpa status = HADIR (rekod wujud bermakna hadir)
  const st=r=>(r.STATUS_KEHADIRAN||'HADIR').toUpperCase();
  const hadir=data.filter(r=>st(r)==='HADIR').length;
  const tidak=data.filter(r=>st(r)==='TIDAK HADIR').length;
  const jum=hadir+tidak, pct=jum>0?Math.round(hadir/jum*100):0;
  const ikut={};for(let b=1;b<=12;b++) ikut[b]={hadir:0,tidak_hadir:0};
  data.forEach(r=>{const b=new Date(r.TARIKH).getMonth()+1;if(st(r)==='HADIR')ikut[b].hadir++;else ikut[b].tidak_hadir++;});
  return {no_kp:noKp,tahun,hadir,tidak_hadir:tidak,jumlah:jum,peratus:pct,ikut_bulan:ikut};
}

function getYuran(e) {
  let y=ambilData(NAMA_SHEET.YURAN);
  if(e.parameter.no_kp)  y=y.filter(r=>e.parameter.no_kp==='SEDEKAH' ? r.NO_KP==='SEDEKAH' : samaKP(r.NO_KP,e.parameter.no_kp));
  if(e.parameter.bulan)  y=y.filter(r=>r.BULAN===(e.parameter.bulan||'').toUpperCase());
  if(e.parameter.tahun)  y=y.filter(r=>String(r.TAHUN)===String(e.parameter.tahun));
  return y;
}

function getStatusYuran(e) {
  const bulan=(e.parameter.bulan||namaBulanSkrg()).toUpperCase(), tahun=e.parameter.tahun||new Date().getFullYear();
  const aktif=ambilData(NAMA_SHEET.AHLI).filter(r=>r.STATUS==='AKTIF');
  // [BAIKI] hanya yuran bulanan — yuran pendaftaran tidak lagi dianggap "sudah bayar" bulan itu
  const yuran=ambilData(NAMA_SHEET.YURAN).filter(y=>y.BULAN===bulan&&String(y.TAHUN)===String(tahun)&&y.STATUS_PENGESAHAN==='SELESAI'&&yuranBulanan(y));
  const senarai=aktif.map(a=>{
    const rek=yuran.filter(y=>samaKP(y.NO_KP,a.NO_KP));
    const jumlah=rek.reduce((s,r)=>s+(parseFloat(r.JUMLAH_BAYARAN)||0),0);
    return {id_ahli:a.ID_AHLI,no_kp:a.NO_KP,nama:a.NAMA_PENUH,kategori:a.KATEGORI,bengkung:a.BENGKUNG_SEMASA,bulan,tahun,sudah_bayar:rek.length>0,jumlah:rek.length?jumlah:0,tarikh_bayar:rek.length?fmtTarikhGAS(rek[0].TARIKH_BAYAR):''};
  });
  return {bulan,tahun,senarai,sudah_bayar:senarai.filter(r=>r.sudah_bayar).length,belum_bayar:senarai.filter(r=>!r.sudah_bayar).length,jumlah_kutipan:senarai.reduce((s,r)=>s+(parseFloat(r.jumlah)||0),0)};
}

function getSejarahGred(e) {
  const d=ambilData(NAMA_SHEET.SEJARAH_GRED);
  return e.parameter.no_kp ? d.filter(r=>samaKP(r.NO_KP,e.parameter.no_kp)) : d;
}

function getSilibus(e) {
  const cached = cacheGet('silibus');
  const d = cached || ambilData(NAMA_SHEET.SILIBUS);
  if (!cached && d.length) cachePut('silibus', d, CACHE_TTL.SILIBUS);
  const bengkung = (e.parameter.bengkung||'').toUpperCase();
  let hasil = e.parameter.kategori ? d.filter(r=>r.KATEGORI===(e.parameter.kategori||'').toUpperCase()) : d;
  // Filter ikut bengkung_tag jika parameter bengkung diberikan
  if (bengkung) {
    hasil = hasil.filter(r => {
      const tag = (r.BENGKUNG_TAG||'').toUpperCase();
      return !tag || tag.includes('SEMUA') || tag.includes(bengkung.split(' ')[1]||bengkung);
    });
  }
  return hasil;
}

function cariAhli(e) {
  const q=(e.parameter.q||'').toUpperCase().trim(); if(!q) return [];
  return ambilData(NAMA_SHEET.AHLI).filter(r=>r.NAMA_PENUH.toUpperCase().includes(q)||r.NO_KP.includes(q)||r.ID_AHLI.toUpperCase().includes(q)).map(r=>({id_ahli:r.ID_AHLI,no_kp:r.NO_KP,nama:r.NAMA_PENUH,bengkung:r.BENGKUNG_SEMASA,kategori:r.KATEGORI,status:r.STATUS}));
}

// ── Fungsi Tulis ─────────────────────────────────────────────
function daftarAhli(b) {
  if(!b.no_kp||!b.nama_penuh) throw new Error('no_kp dan nama_penuh wajib');
  const sheet=sheetRef(NAMA_SHEET.AHLI);
  if(ambilData(NAMA_SHEET.AHLI).find(r=>samaKP(r.NO_KP,b.no_kp))) throw new Error('No KP sudah berdaftar');
  const id=janID(sheet,'SGM'), tdk=tarikhFmt(new Date());
  sheet.appendRow([id,kpTeks(b.no_kp),(b.nama_penuh||'').toUpperCase(),(b.jantina||'').toUpperCase(),b.tarikh_lahir||'',b.alamat||'',(b.nama_waris||'').toUpperCase(),b.no_tel_waris||'',b.no_tel_ahli||'',b.kategori||'',b.bengkung_semasa||'BENGKUNG HITAM KOSONG (AHLI BAHARU)',tdk,'AKTIF',b.catatan||'']);
  invalidateCache('ahli');
  return {id_ahli:id,no_kp:normKP(b.no_kp),nama:b.nama_penuh,tarikh_daftar:tdk,mesej:'Ahli berjaya didaftarkan'};
}

function berhentiAhli(b) {
  var sA   = sheetRef(NAMA_SHEET.AHLI);
  var data = sA.getDataRange().getValues();
  var hdr  = data[0].map(function(h){return h.toString().trim().toUpperCase();});
  var idxKP  = hdr.indexOf('NO_KP');
  var idxSts = hdr.indexOf('STATUS');
  var idxCat = hdr.indexOf('CATATAN');
  for (var i=1;i<data.length;i++) {
    if (samaKP(data[i][idxKP<0?1:idxKP], b.no_kp)) {
      var nama = data[i][hdr.indexOf('NAMA_PENUH')] || b.no_kp;
      // Simpan ke BEKAS_AHLI dengan SEMUA data
      try {
        var sB = sheetRef(NAMA_SHEET.BEKAS_AHLI);
        var bHdr = sB.getLastRow()<1 ? [] : sB.getRange(1,1,1,sB.getLastColumn()).getValues()[0];
        if (bHdr.length===0) {
          var newHdr = data[0].concat(['TARIKH_BERHENTI','SEBAB_BERHENTI']);
          sB.appendRow(newHdr);
        }
        var rowData = data[i].concat([tarikhFmt(new Date()), b.sebab||'Tidak dinyatakan']);
        sB.appendRow(rowData);
      } catch(e2) { Logger.log('BEKAS_AHLI error: '+e2); }
      // Set STATUS = TIDAK AKTIF dalam AHLI (JANGAN delete row)
      if (idxSts>=0) sA.getRange(i+1,idxSts+1).setValue('TIDAK AKTIF');
      if (idxCat>=0) {
        var sedia = String(data[i][idxCat]||'');
        var log   = '[BERHENTI '+tarikhFmt(new Date())+': '+(b.sebab||'—')+']';
        sA.getRange(i+1,idxCat+1).setValue(sedia?sedia+' '+log:log);
      }
      invalidateCache('ahli'); // [BAIKI]
      return {ok:true, no_kp:b.no_kp, nama:nama, mesej:nama+' diarkibkan. Data penuh disimpan dalam BEKAS_AHLI.'};
    }
  }
  throw new Error('Ahli tidak dijumpai: '+b.no_kp);
}

function rekodKehadiran(b) {
  const {rekod, tarikh, masa, edit_mode} = b;
  if (!rekod || !Array.isArray(rekod)) throw new Error('rekod tidak sah');
  // [BAIKI] kunci — dua telefon menyimpan serentak tidak lagi mencipta rekod berganda
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sheet    = sheetRef(NAMA_SHEET.KEHADIRAN);
    const dataAhli = ambilData(NAMA_SHEET.AHLI);
    const tdk = tarikh || tarikhFmt(new Date());
    const msk = masa   || masaFmt();
    const namaAhli = kp => { const a = dataAhli.find(x => samaKP(x.NO_KP, kp)); return a ? a.NAMA_PENUH : '?'; };

    if (edit_mode) {
      // Mode kemaskini: update existing → tiada duplikasi
      const allData = sheet.getDataRange().getValues();
      const hdrs = allData[0].map(h => h.toString().trim().toUpperCase());
      const iKP  = hdrs.indexOf('NO_KP') >= 0 ? hdrs.indexOf('NO_KP') : 1;
      const iT   = hdrs.indexOf('TARIKH') >= 0 ? hdrs.indexOf('TARIKH') : 3;
      const iS   = hdrs.indexOf('STATUS_KEHADIRAN') >= 0 ? hdrs.indexOf('STATUS_KEHADIRAN') : 5;

      const toDelete = [];
      rekod.forEach(({no_kp, nama, status}) => {
        const s = (status||'HADIR').toUpperCase();
        let foundRow = -1;
        for (let i = 1; i < allData.length; i++) {
          if (samaKP(allData[i][iKP], no_kp) && fmtTarikhGAS(allData[i][iT]) === tdk) {
            foundRow = i + 1; break; // 1-indexed
          }
        }
        if (foundRow > 0) {
          if (s === 'TIDAK HADIR') toDelete.push(foundRow);      // hapus rekod
          else sheet.getRange(foundRow, iS + 1).setValue(s);     // update status
        } else if (s !== 'TIDAK HADIR') {
          sheet.appendRow([id8(), kpTeks(no_kp), nama||namaAhli(no_kp), tdk, msk, s]);
        }
      });
      // Delete dari bawah ke atas (supaya row index tak berubah)
      toDelete.sort((a,b) => b-a).forEach(r => sheet.deleteRow(r));
    } else {
      // Mode lama: batch append (untuk rekod massal)
      rekod.forEach(({no_kp, status}) => {
        sheet.appendRow([id8(), kpTeks(no_kp), namaAhli(no_kp), tdk, msk, status||'HADIR']);
      });
    }
    SpreadsheetApp.flush();
    invalidateCache('kehadiran');
    return {tarikh:tdk, masa:msk, jumlah:rekod.length, mesej:'Kehadiran dikemaskini'};
  } finally { lock.releaseLock(); }
}

function tambahYuran(b) {
  if(!b.no_kp) throw new Error('no_kp wajib');
  // Jumlah boleh 0 untuk rekod sistem (DIKECUALIKAN, TIADA_BAYARAN, CARRY_FORWARD)
  const sheet=sheetRef(NAMA_SHEET.YURAN);
  const ahli=b.no_kp==='SEDEKAH' ? null : ambilData(NAMA_SHEET.AHLI).find(a=>samaKP(a.NO_KP,b.no_kp));
  sheet.appendRow([id8(),b.no_kp==='SEDEKAH'?'SEDEKAH':kpTeks(b.no_kp),ahli?ahli.NAMA_PENUH:'',(b.jenis_yuran||'BULANAN').toUpperCase(),(b.bulan||namaBulanSkrg()).toUpperCase(),b.tahun||new Date().getFullYear(),parseFloat(b.jumlah)||0,b.tarikh_bayar||tarikhFmt(new Date()),(b.kaedah_bayar||'TUNAI').toUpperCase(),'','SELESAI',b.catatan||'']);
  invalidateCache('yuran');
  return {no_kp:b.no_kp,jumlah:b.jumlah,mesej:'Yuran direkodkan'};
}

function naikGred(b) {
  if(!b.no_kp||!b.bengkung_baru) throw new Error('no_kp dan bengkung_baru diperlukan');
  const sA=sheetRef(NAMA_SHEET.AHLI), sG=sheetRef(NAMA_SHEET.SEJARAH_GRED), data=sA.getDataRange().getValues();
  const hdr=data[0].map(h=>h.toString().trim().toUpperCase());
  const iKP=hdr.indexOf('NO_KP')>=0?hdr.indexOf('NO_KP'):1, iNama=hdr.indexOf('NAMA_PENUH')>=0?hdr.indexOf('NAMA_PENUH'):2, iBkg=hdr.indexOf('BENGKUNG_SEMASA')>=0?hdr.indexOf('BENGKUNG_SEMASA'):10;
  for(let i=1;i<data.length;i++) if(samaKP(data[i][iKP],b.no_kp)){
    const nama=data[i][iNama], lama=data[i][iBkg];
    sG.appendRow([id8(),kpTeks(b.no_kp),nama,lama,b.bengkung_baru,tarikhFmt(new Date()),b.catatan||'']);
    sA.getRange(i+1,iBkg+1).setValue(b.bengkung_baru);
    invalidateCache('ahli'); // [BAIKI] bengkung baru terus kelihatan
    return {no_kp:b.no_kp,nama,bengkung_lama:lama,bengkung_baru:b.bengkung_baru,mesej:'Kenaikan gred direkodkan'};
  }
  throw new Error('Ahli tidak dijumpai');
}

// ── Utiliti ───────────────────────────────────────────────────
function sheetRef(nama){const s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nama);if(!s)throw new Error('Sheet "'+nama+'" tidak dijumpai');return s;}

// Auto-cipta sheet jika tak wujud (untuk modul baru)
function sheetRefOrCreate(nama, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(nama);
  if (!s) {
    s = ss.insertSheet(nama);
    if (headers && headers.length) s.appendRow(headers);
    Logger.log('Sheet ' + nama + ' dicipta automatik');
  }
  return s;
}

// Baca data dari sheet — return [] jika sheet tak wujud
function ambilDataSelamat(nama) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s  = ss.getSheetByName(nama);
    if (!s || s.getLastRow() < 2) return [];
    return ambilData(nama);
  } catch(e) { return []; }
}
function ambilData(nama){
  const sheet=sheetRef(nama),lr=sheet.getLastRow();if(lr<2)return[];
  const hdr=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim().toUpperCase());
  const iKP=hdr.indexOf('NO_KP');
  return sheet.getRange(2,1,lr-1,hdr.length).getValues().filter(r=>r.some(v=>v!=='')).map(r=>{
    const o={};hdr.forEach((h,i)=>{o[h]=String(r[i]??'').trim();});
    if(iKP>=0) o.NO_KP=normKP(o.NO_KP); // [BAIKI] pulihkan sifar di depan No. KP
    return o;
  });
}
function tarikhFmt(t){if(!t)return'';if(/^\d{4}-\d{2}-\d{2}$/.test(String(t)))return String(t);const d=new Date(t);if(isNaN(d.getTime()))return String(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function masaFmt(){const t=new Date();return String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');}
function namaBulanSkrg(){return['JANUARI','FEBRUARI','MAC','APRIL','MEI','JUN','JULAI','OGOS','SEPTEMBER','OKTOBER','NOVEMBER','DISEMBER'][new Date().getMonth()];}
function id8(){const c='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';let s='';for(let i=0;i<8;i++)s+=c[Math.floor(Math.random()*36)];return s;}
function janID(sheet,prefix){
  const lr=sheet.getLastRow();if(lr<2)return prefix+'-001';
  const ids=sheet.getRange(2,1,lr-1,1).getValues().flat().filter(v=>String(v).startsWith(prefix+'-')).map(v=>parseInt(String(v).replace(prefix+'-',''),10)).filter(n=>!isNaN(n));
  return prefix+'-'+String((ids.length?Math.max(...ids):0)+1).padStart(3,'0');
}

// ============================================================
//  BMI + Portal Ibu Bapa
// ============================================================
function getRujukan() {
  return ambilData(NAMA_SHEET.RUJUKAN);
}

function getSenaraiAhliBMI() {
  const ahli    = ambilData(NAMA_SHEET.AHLI).filter(r => r.STATUS === 'AKTIF');
  const rujukan = ambilDataSelamat(NAMA_SHEET.RUJUKAN);
  return ahli.map(a => {
    const usia   = kiraUsiaGAS(a.TARIKH_LAHIR, a.NO_KP);
    const berat  = parseFloat(a.BERAT_KG) || 0;
    const tinggi = parseFloat(a.TINGGI_CM) || 0;
    const bmi    = (berat > 0 && tinggi > 0) ? Math.round(berat / Math.pow(tinggi/100, 2) * 10) / 10 : null;
    const katUs  = usia ? kategoriUsiaGAS(usia) : null;
    const kelas  = (katUs && berat > 0) ? cariKelasGAS(rujukan, katUs, berat) : null;
    return { id_ahli:a.ID_AHLI, no_kp:a.NO_KP, nama:a.NAMA_PENUH, kategori:a.KATEGORI, bengkung:a.BENGKUNG_SEMASA, usia, berat: berat||null, tinggi: tinggi||null, bmi, kategori_usia:katUs, kelas_berat:kelas };
  });
}

function kemaskiniBeratTinggi(b) {
  const { no_kp, berat_kg, tinggi_cm } = b;
  if (!no_kp) throw new Error('no_kp diperlukan');
  const sheet = sheetRef(NAMA_SHEET.AHLI);
  const hdr   = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim().toUpperCase());
  const lBerat  = hdr.indexOf('BERAT_KG')  + 1;
  const lTinggi = hdr.indexOf('TINGGI_CM') + 1;
  const iKP     = hdr.indexOf('NO_KP') >= 0 ? hdr.indexOf('NO_KP') : 1;
  if (!lBerat || !lTinggi) throw new Error('Kolum BERAT_KG / TINGGI_CM tidak dijumpai. Jalankan skrip tambahKolumBeratTinggi() dulu.');
  const data = sheet.getDataRange().getValues();
  for (let i=1; i<data.length; i++) {
    if (samaKP(data[i][iKP], no_kp)) {
      if (berat_kg  !== undefined) sheet.getRange(i+1, lBerat).setValue(parseFloat(berat_kg)||'');
      if (tinggi_cm !== undefined) sheet.getRange(i+1, lTinggi).setValue(parseFloat(tinggi_cm)||'');
      return { no_kp, mesej:'Berat & tinggi dikemaskini' };
    }
  }
  throw new Error('Ahli tidak dijumpai');
}

// Helper GAS
function kiraUsiaGAS(tarikhLahir, noKp) {
  let tLahir = null;
  if (tarikhLahir && tarikhLahir.length >= 6) { tLahir = new Date(tarikhLahir); }
  else if (noKp && noKp.length >= 6) {
    const yy=parseInt(noKp.substring(0,2)),mm=noKp.substring(2,4),dd=noKp.substring(4,6);
    // [BAIKI] tahun 2 digit ikut tahun semasa (dulu tetap ≤30 → 20xx)
    const tahun = yy <= new Date().getFullYear() % 100 ? 2000+yy : 1900+yy;
    tLahir = new Date(tahun+'-'+mm+'-'+dd);
  }
  if (!tLahir || isNaN(tLahir.getTime())) return null;
  const skrg=new Date(); let usia=skrg.getFullYear()-tLahir.getFullYear();
  if (skrg.getMonth()<tLahir.getMonth()||(skrg.getMonth()===tLahir.getMonth()&&skrg.getDate()<tLahir.getDate())) usia--;
  return usia;
}

function kategoriUsiaGAS(usia) {
  if (usia<=6)  return 'PRA TUNAS (5-6 TAHUN)';
  if (usia<=8)  return 'TUNAS (7-8 TAHUN)';
  if (usia<=10) return 'PRA DINI (9-10 TAHUN)';
  if (usia<=12) return 'DINI (11-12 TAHUN)';
  if (usia<=14) return 'PRA REMAJA (13-14 TAHUN)';
  if (usia<=16) return 'REMAJA (15-16 TAHUN)';
  if (usia<=20) return 'SUKMA (16-20 TAHUN)';
  if (usia<=35) return 'TERBUKA (21-35 TAHUN)';
  if (usia<=45) return 'MASTER 2 (35-45 TAHUN)';
  return 'MASTER 1 (45 TAHUN KE ATAS)';
}

function cariKelasGAS(rujukan, katUsia, berat) {
  const senarai = rujukan.filter(r => (r.KATEGORI_USIA||'') === katUsia);
  for (const r of senarai) {
    const min=parseFloat(r['BERAT_MIN_(KG)']||r.BERAT_MIN||0);
    const max=parseFloat(r['BERAT_MAX_(KG)']||r.BERAT_MAX||999);
    if (berat>=min && berat<max) return r.KELAS;
  }
  return 'BEBAS';
}

function getItemPenilaian(e) {
  const bengkung = (e.parameter.bengkung || '').toUpperCase().trim();
  const data     = ambilDataSelamat('ITEM_PENILAIAN');
  if (!bengkung) return data.filter(r => r.AKTIF !== 'TIDAK');
  const exact = data.filter(r => r.BENGKUNG === bengkung && r.AKTIF !== 'TIDAK');
  if (exact.length) return exact;
  const partial = data.filter(r => r.BENGKUNG && (bengkung.includes(r.BENGKUNG) || r.BENGKUNG.includes(bengkung.split(' ').slice(0,3).join(' '))));
  return partial.filter(r => r.AKTIF !== 'TIDAK');
}

function getTetapan() {
  const cached = cacheGet('tetapan');
  if (cached) return cached;
  const data = ambilDataSelamat('TETAPAN');
  const obj  = {};
  data.forEach(r => { if (r.KUNCI) obj[r.KUNCI] = r.NILAI; });
  cachePut('tetapan', obj, CACHE_TTL.TETAPAN);
  return obj;
}

function getSenaraiLaporan(e) {
  const noKp = e.parameter.no_kp || '';
  const data = ambilDataSelamat('LAPORAN');
  return noKp ? data.filter(r => samaKP(r.NO_KP, noKp)) : data;
}

function getLaporanPesilat(e) {
  const idLaporan = e.parameter.id_laporan || '';
  if (!idLaporan) throw new Error('id_laporan diperlukan');
  const detail = ambilDataSelamat('DETAIL_LAPORAN').filter(r => r.ID_LAPORAN === idLaporan);
  const laporan = ambilData('LAPORAN').find(r => r.ID_LAPORAN === idLaporan);
  if (!laporan) throw new Error('Laporan tidak dijumpai');
  return { ...laporan, detail };
}

function simpanLaporan(b) {
  const {
    no_kp, bengkung_semasa, bakat, jumlah_markah, markah_max,
    peratus, catatan, item_detail, foto_base64
  } = b;
  if (!no_kp) throw new Error('no_kp diperlukan');

  const sheetAhli  = sheetRef('AHLI');
  const sheetLpran = sheetRef('LAPORAN');
  const sheetDtail = sheetRef('DETAIL_LAPORAN');

  const ahli = ambilData('AHLI').find(a => samaKP(a.NO_KP, no_kp));
  const nama = ahli ? ahli.NAMA_PENUH : '';

  const idLaporan = 'LPR-' + tarikhFmt(new Date()).replace(/-/g,'') + '-' + id8().slice(0,4);

  sheetLpran.appendRow([
    idLaporan, kpTeks(no_kp), nama, bengkung_semasa, tarikhFmt(new Date()),
    bakat || 'BELUM DIKENALPASTI',
    parseInt(jumlah_markah) || 0,
    parseInt(markah_max) || 0,
    parseFloat(peratus) || 0,
    catatan || '',
    emelPengguna() // [BAIKI]
  ]);

  if (Array.isArray(item_detail)) {
    // Tulis sekali gus (lebih pantas daripada appendRow satu demi satu)
    const baris = item_detail.map(item => [id8(), idLaporan, item.nama || '', item.status || 'TIADA', parseInt(item.markah) || 0]);
    if (baris.length) sheetDtail.getRange(sheetDtail.getLastRow()+1, 1, baris.length, 5).setValues(baris);
  }

  if (foto_base64 && foto_base64.length > 10) {
    const dataRows = sheetAhli.getDataRange().getValues();
    const hdrs = dataRows[0].map(h => h.toString().trim().toUpperCase());
    const lFoto = hdrs.indexOf('FOTO_BASE64') + 1;
    const iKP = hdrs.indexOf('NO_KP') >= 0 ? hdrs.indexOf('NO_KP') : 1;
    if (lFoto > 0) {
      for (let i = 1; i < dataRows.length; i++) {
        if (samaKP(dataRows[i][iKP], no_kp)) { sheetAhli.getRange(i+1, lFoto).setValue(foto_base64); break; }
      }
    }
  }

  return { id_laporan: idLaporan, no_kp, nama, mesej: 'Laporan berjaya disimpan' };
}

function simpanFotoPesilat(b) {
  const { no_kp, foto_base64 } = b;
  if (!no_kp || !foto_base64) throw new Error('no_kp dan foto_base64 diperlukan');
  const sheet = sheetRef('AHLI');
  const data  = sheet.getDataRange().getValues();
  const hdrs  = data[0].map(h => h.toString().trim().toUpperCase());
  const lFoto = hdrs.indexOf('FOTO_BASE64') + 1;
  const iKP   = hdrs.indexOf('NO_KP') >= 0 ? hdrs.indexOf('NO_KP') : 1;
  if (!lFoto) throw new Error('Kolum FOTO_BASE64 tidak dijumpai. Jalankan setupLaporanSheets() dulu.');
  for (let i = 1; i < data.length; i++) {
    if (samaKP(data[i][iKP], no_kp)) {
      sheet.getRange(i+1, lFoto).setValue(foto_base64);
      return { no_kp, mesej: 'Foto berjaya disimpan' };
    }
  }
  throw new Error('Ahli tidak dijumpai');
}

function tambahItemPenilaian(b) {
  const { bengkung, nama_item } = b;
  if (!bengkung || !nama_item) throw new Error('bengkung dan nama_item diperlukan');
  const sheet   = sheetRef('ITEM_PENILAIAN');
  const lastRow = sheet.getLastRow();
  const ids = lastRow > 1
    ? sheet.getRange(2,1,lastRow-1,1).getValues().flat()
        .filter(v => String(v).startsWith('IP'))
        .map(v => parseInt(String(v).replace('IP',''), 10))
        .filter(n => !isNaN(n))
    : [0];
  const max   = ids.length ? Math.max(...ids) : 0;
  const idBaru = 'IP' + String(max+1).padStart(3,'0');
  sheet.appendRow([idBaru, bengkung.toUpperCase(), nama_item, lastRow, 'YA']);
  return { id: idBaru, bengkung, nama_item, mesej: 'Item berjaya ditambah' };
}

function padamItemPenilaian(b) {
  const { id_item } = b;
  if (!id_item) throw new Error('id_item diperlukan');
  const sheet = sheetRef('ITEM_PENILAIAN');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id_item).trim()) {
      sheet.getRange(i+1, 5).setValue('TIDAK'); // Tandakan tidak aktif
      return { id_item, mesej: 'Item dipadamkan' };
    }
  }
  throw new Error('Item tidak dijumpai');
}

function kemaskiniSilibus(b) {
  const sheet = sheetRef('SILIBUS');
  const hdr   = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim().toUpperCase());
  const data  = sheet.getDataRange().getValues();
  let lTag = hdr.indexOf('BENGKUNG_TAG') + 1;
  if (!lTag) {
    const lastCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, lastCol).setValue('BENGKUNG_TAG').setBackground('#534AB7').setFontColor('#fff').setFontWeight('bold');
    lTag = lastCol;
  }
  for (let i=1;i<data.length;i++) {
    if (String(data[i][0])===String(b.id)) {
      if (b.tajuk !== undefined) sheet.getRange(i+1,3).setValue(b.tajuk);
      if (b.link  !== undefined) sheet.getRange(i+1,2).setValue(b.link);
      if (b.bengkung_tag !== undefined) sheet.getRange(i+1,lTag).setValue(b.bengkung_tag||'');
      invalidateCache('silibus'); // [BAIKI]
      return { mesej:'Silibus dikemaskini' };
    }
  }
  throw new Error('Item tidak dijumpai');
}

function tambahSilibus2(b) {
  const sheet = sheetRef('SILIBUS');
  const hdr   = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim().toUpperCase());
  let lTag = hdr.indexOf('BENGKUNG_TAG') + 1;
  if (!lTag) {
    lTag = sheet.getLastColumn() + 1;
    sheet.getRange(1, lTag).setValue('BENGKUNG_TAG').setBackground('#534AB7').setFontColor('#fff').setFontWeight('bold');
  }
  // [BAIKI] ID = ID terbesar + 1 (dulu guna bilangan baris — boleh berulang selepas padam)
  const lr = sheet.getLastRow();
  const ids = lr > 1 ? sheet.getRange(2,1,lr-1,1).getValues().flat().map(v=>parseInt(v,10)).filter(n=>!isNaN(n)) : [];
  const idBaru = (ids.length ? Math.max(...ids) : 0) + 1;
  const newRow = [idBaru, b.link||'', b.tajuk||'', '', b.kategori||'LAIN-LAIN'];
  while (newRow.length < lTag-1) newRow.push('');
  newRow.push(b.bengkung_tag||'');
  sheet.appendRow(newRow);
  invalidateCache('silibus'); // [BAIKI]
  return { id: idBaru, mesej:'Video ditambah' };
}

function padamSilibus(b) {
  const { id } = b;
  if (!id) throw new Error('id diperlukan');
  const sheet = sheetRef('SILIBUS');
  const data  = sheet.getDataRange().getValues();
  for (let i=1; i<data.length; i++) {
    if (String(data[i][0])===String(id)) {
      sheet.deleteRow(i+1);
      invalidateCache('silibus'); // [BAIKI]
      return { mesej:'Video dipadamkan' };
    }
  }
  throw new Error('Item tidak dijumpai');
}

// ── KEWANGAN ─────────────────────────────────────────────────
function getKewangan(e) {
  const data  = ambilDataSelamat('KEWANGAN');
  const tahun = e.parameter.tahun || '';
  const jenis = (e.parameter.jenis || '').toUpperCase();
  let hasil   = data;
  if (tahun) hasil = hasil.filter(r => r.TARIKH && fmtTarikhGAS(r.TARIKH).startsWith(tahun));
  if (jenis) hasil = hasil.filter(r => r.JENIS === jenis);
  return hasil.sort((a,b) => fmtTarikhGAS(b.TARIKH).localeCompare(fmtTarikhGAS(a.TARIKH)));
}

function getRingkasanKewangan(e) {
  const tahun = e.parameter.tahun || new Date().getFullYear().toString();
  const data  = ambilDataSelamat('KEWANGAN').filter(r => r.TARIKH && fmtTarikhGAS(r.TARIKH).startsWith(tahun));

  const yuran    = ambilData('YURAN').filter(r =>
    String(r.TAHUN) === String(tahun) && r.STATUS_PENGESAHAN === 'SELESAI' &&
    r.JENIS_YURAN !== 'SEDEKAH'
  );
  const kutipanYuran = yuran.reduce((s,r) => s + (parseFloat(r.JUMLAH_BAYARAN)||0), 0);

  const pendapatan   = data.filter(r => r.JENIS === 'PENDAPATAN').reduce((s,r) => s + (parseFloat(r.JUMLAH)||0), 0);
  const perbelanjaan = data.filter(r => r.JENIS === 'PERBELANJAAN').reduce((s,r) => s + (parseFloat(r.JUMLAH)||0), 0);
  const jumlahMasuk  = pendapatan + kutipanYuran;
  const baki         = jumlahMasuk - perbelanjaan;

  const ikutBulan = {};
  const BULAN = ['JAN','FEB','MAC','APR','MEI','JUN','JUL','OGS','SEP','OKT','NOV','DIS'];
  for (let b = 1; b <= 12; b++) ikutBulan[b] = { bulan: BULAN[b-1], masuk: 0, keluar: 0 };

  data.forEach(r => {
    const b = parseInt((fmtTarikhGAS(r.TARIKH)||'').split('-')[1]) || 0;
    if (!b || !ikutBulan[b]) return;
    if (r.JENIS === 'PENDAPATAN') ikutBulan[b].masuk += parseFloat(r.JUMLAH)||0;
    else ikutBulan[b].keluar += parseFloat(r.JUMLAH)||0;
  });
  yuran.forEach(r => {
    const idx = ['JANUARI','FEBRUARI','MAC','APRIL','MEI','JUN','JULAI','OGOS','SEPTEMBER','OKTOBER','NOVEMBER','DISEMBER'].indexOf(r.BULAN) + 1;
    if (ikutBulan[idx]) ikutBulan[idx].masuk += parseFloat(r.JUMLAH_BAYARAN)||0;
  });

  const terkini = [...data].sort((a,b) => fmtTarikhGAS(b.TARIKH).localeCompare(fmtTarikhGAS(a.TARIKH))).slice(0, 10);
  var kutipanBulan = Object.values(ikutBulan).map(function(b, i) {
    return { bulan_idx: i+1, bulan: b.bulan, jumlah: b.masuk };
  });
  return { tahun, kutipan_yuran: kutipanYuran, pendapatan_lain: pendapatan, jumlah_masuk: jumlahMasuk, perbelanjaan, baki, ikut_bulan: Object.values(ikutBulan), kutipan_bulanan: kutipanBulan, terkini };
}

function tambahKewangan(b) {
  const { jenis, kategori, jumlah, tarikh, keterangan } = b;
  if (!jenis || !jumlah) throw new Error('jenis dan jumlah wajib');
  const sheet = sheetRefOrCreate('KEWANGAN', ['ID', 'TARIKH', 'JENIS', 'KATEGORI', 'JUMLAH', 'KETERANGAN', 'DICIPTA_OLEH']);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'TARIKH', 'JENIS', 'KATEGORI', 'JUMLAH', 'KETERANGAN', 'DICIPTA_OLEH']);
  }
  sheet.getRange('B:B').setNumberFormat('@STRING@');

  const id = 'KW-' + id8();
  const tarikhStr = tarikh && String(tarikh).length >= 10
    ? String(tarikh).substring(0, 10)
    : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const jenisUpper = (jenis || '').toUpperCase();
  sheet.appendRow([id, tarikhStr, jenisUpper, kategori || 'LAIN-LAIN', parseFloat(jumlah), keterangan || '', emelPengguna()]);
  SpreadsheetApp.flush();
  invalidateCache('lejer');
  return { id, jenis: jenisUpper, jumlah, tarikh: tarikhStr, mesej: 'Rekod kewangan ditambah' };
}

// ── Repair KEWANGAN sheet (panggil sekali jika ada masalah) ──
function repairKewangan() {
  const sheet = sheetRefOrCreate('KEWANGAN', []);
  const lr    = sheet.getLastRow();
  if (lr === 0) {
    sheet.appendRow(['ID', 'TARIKH', 'JENIS', 'KATEGORI', 'JUMLAH', 'KETERANGAN', 'DICIPTA_OLEH']);
    sheet.getRange('B:B').setNumberFormat('@STRING@');
    return { mesej: 'Header dicipta, sheet kosong.' };
  }
  const row1 = sheet.getRange(1, 1, 1, 7).getValues()[0];
  const firstCell = String(row1[0] || '').trim().toUpperCase();
  if (firstCell.startsWith('KW-')) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, 7).setValues([['ID', 'TARIKH', 'JENIS', 'KATEGORI', 'JUMLAH', 'KETERANGAN', 'DICIPTA_OLEH']]);
    sheet.getRange('B:B').setNumberFormat('@STRING@');
    return { mesej: 'Header diinsert. Rekod diselamatkan! Jumlah rekod: ' + lr };
  }
  sheet.getRange('B:B').setNumberFormat('@STRING@');
  return { mesej: 'Sheet OK. Header sudah ada. Rekod: ' + (lr - 1) };
}

function padamKewangan(b) {
  const { id } = b;
  if (!id) throw new Error('ID rekod diperlukan');
  const sheet = sheetRef('KEWANGAN');
  const data  = sheet.getDataRange().getValues();
  const hdrs  = data[0].map(h => String(h).trim().toUpperCase());
  const iID   = hdrs.indexOf('ID');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][iID] || '').trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      invalidateCache('lejer');
      return { id, mesej: 'Rekod berjaya dipadam' };
    }
  }
  throw new Error('Rekod tidak dijumpai: ' + id);
}

function kemaskiniKewangan(b) {
  const { id, jumlah, keterangan, kategori, tarikh } = b;
  if (!id) throw new Error('ID rekod diperlukan');
  const sheet = sheetRef('KEWANGAN');
  const data  = sheet.getDataRange().getValues();
  const hdrs  = data[0].map(h => String(h).trim().toUpperCase());
  const iID   = hdrs.indexOf('ID');
  const peta  = { TARIKH: hdrs.indexOf('TARIKH'), JUMLAH: hdrs.indexOf('JUMLAH'), KETERANGAN: hdrs.indexOf('KETERANGAN'), KATEGORI: hdrs.indexOf('KATEGORI') };
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][iID] || '').trim() === String(id).trim()) {
      const row = i + 1;
      if (jumlah   !== undefined && peta.JUMLAH >= 0)       sheet.getRange(row, peta.JUMLAH + 1).setValue(parseFloat(jumlah));
      if (keterangan !== undefined && peta.KETERANGAN >= 0) sheet.getRange(row, peta.KETERANGAN + 1).setValue(keterangan);
      if (kategori !== undefined && peta.KATEGORI >= 0)     sheet.getRange(row, peta.KATEGORI + 1).setValue(kategori);
      if (tarikh   !== undefined && peta.TARIKH >= 0) {
        const tStr = tarikh && String(tarikh).length >= 10 ? String(tarikh).substring(0,10) : tarikhFmt(new Date());
        sheet.getRange(row, peta.TARIKH + 1).setValue(tStr);
      }
      SpreadsheetApp.flush();
      invalidateCache('lejer');
      return { id, mesej: 'Rekod berjaya dikemaskini' };
    }
  }
  throw new Error('Rekod tidak dijumpai: ' + id);
}

function getLejerKewanganFull(e) {
  var hasil = getLejerKewangan(e);
  var kewData = ambilDataSelamat('KEWANGAN');
  var tahun = e.parameter.tahun || new Date().getFullYear().toString();
  var kewById = {};
  kewData.filter(function(r){
    var t = fmtTarikhGAS(r.TARIKH); return t && t.substring(0,4) === String(tahun);
  }).forEach(function(r){ kewById[r.KETERANGAN + '|' + fmtTarikhGAS(r.TARIKH)] = r.ID; });
  hasil.transaksi = hasil.transaksi.map(function(t) {
    if (t.sumber === 'KEWANGAN' && !t.id) t.id = kewById[t.keterangan + '|' + t.tarikh] || '';
    return t;
  });
  return hasil;
}

function getLejerKewangan(e) {
  var tahun = e.parameter.tahun || new Date().getFullYear().toString();
  var _ckey = 'lejer_' + tahun;
  var _cached = cacheGet(_ckey);
  if (_cached) return _cached;
  var kew = ambilDataSelamat('KEWANGAN')
    .filter(function(r){
      if (!r.TARIKH || r.TARIKH === 'TARIKH') return false;
      var t = fmtTarikhGAS(r.TARIKH);
      return t && t.substring(0,4) === String(tahun);
    })
    .map(function(r){
      return { id: r.ID || '', tarikh: fmtTarikhGAS(r.TARIKH), jenis: (r.JENIS||'').toUpperCase(), kategori: r.KATEGORI||'—', keterangan: r.KETERANGAN||r.KATEGORI||'—', jumlah: parseFloat(r.JUMLAH)||0, sumber: 'KEWANGAN' };
    });
  var BLN = ['JANUARI','FEBRUARI','MAC','APRIL','MEI','JUN','JULAI','OGOS','SEPTEMBER','OKTOBER','NOVEMBER','DISEMBER'];
  var yuran = ambilData('YURAN')
    .filter(function(r){
      return String(r.TAHUN)===String(tahun) && r.STATUS_PENGESAHAN==='SELESAI' && r.NO_KP !== 'SEDEKAH' && parseFloat(r.JUMLAH_BAYARAN)>0;
    })
    .map(function(r){
      var fallback = tahun+'-'+String(BLN.indexOf(r.BULAN)+1).padStart(2,'0')+'-01';
      var tFmt = fmtTarikhGAS(r.TARIKH_BAYAR);
      var tarikh = (tFmt && tFmt.substring(0,4) === String(tahun)) ? tFmt : fallback;
      return { tarikh: tarikh, jenis: 'PENDAPATAN', kategori: 'YURAN '+r.JENIS_YURAN, keterangan: r.NAMA_PESILAT||r.NO_KP, jumlah: parseFloat(r.JUMLAH_BAYARAN)||0, sumber: 'YURAN' };
    });
  var semua = kew.concat(yuran).sort(function(a,b){ return String(a.tarikh).localeCompare(String(b.tarikh)); });
  var baki = 0;
  semua = semua.map(function(r){
    if (r.jenis==='PENDAPATAN') baki += r.jumlah; else baki -= r.jumlah;
    return Object.assign({}, r, {baki: Math.round(baki*100)/100});
  });
  var masuk  = semua.filter(function(r){return r.jenis==='PENDAPATAN';}).reduce(function(s,r){return s+r.jumlah;},0);
  var keluar = semua.filter(function(r){return r.jenis==='PERBELANJAAN';}).reduce(function(s,r){return s+r.jumlah;},0);
  var _hasil = { tahun, transaksi: semua.reverse(),
    ringkasan: { masuk, keluar, baki: masuk-keluar, bilMasuk: semua.filter(function(r){return r.jenis==='PENDAPATAN';}).length, bilKeluar: semua.filter(function(r){return r.jenis==='PERBELANJAAN';}).length }
  };
  cachePut(_ckey, _hasil, CACHE_TTL.LEJER);
  return _hasil;
}

// ── LATIHAN KENDIRI ───────────────────────────────────────────
function getLatihanKendiri(e) {
  const noKp = e.parameter.no_kp || '';
  const data = ambilDataSelamat('LATIHAN_KENDIRI').filter(r => r.STATUS !== 'PADAM');
  return noKp ? data.filter(r => samaKP(r.NO_KP, noKp) || r.NO_KP === 'SEMUA') : data;
}

function getLatihanPesilat(e) {
  const noKp = e.parameter.no_kp || '';
  if (!noKp) throw new Error('no_kp diperlukan');
  const latihan = ambilDataSelamat('LATIHAN_KENDIRI').filter(r => (samaKP(r.NO_KP, noKp) || r.NO_KP === 'SEMUA') && r.STATUS === 'AKTIF');
  const rekod   = ambilDataSelamat('REKOD_LATIHAN').filter(r => samaKP(r.NO_KP, noKp));
  const hari    = tarikhFmt(new Date());
  return latihan.map(l => {
    const rekodHariIni = rekod.find(r => r.ID_LATIHAN === l.ID_LATIHAN && fmtTarikhGAS(r.TARIKH) === hari);
    const jumlahSelesai = rekod.filter(r => r.ID_LATIHAN === l.ID_LATIHAN && r.STATUS === 'SELESAI').length;
    const tempoh        = parseInt(l.TEMPOH_HARI) || 0;
    const pct           = tempoh > 0 ? Math.min(100, Math.round(jumlahSelesai / tempoh * 100)) : 0;
    return { ...l, status_hari_ini: rekodHariIni?.STATUS || '', jumlah_selesai: jumlahSelesai, peratus: pct, selesai_hari_ini: rekodHariIni?.STATUS === 'SELESAI' };
  });
}

function tambahLatihan(b) {
  const { no_kp, nama_tugasan, penerangan, tempoh_hari, tarikh_mula } = b;
  if (!nama_tugasan) throw new Error('nama_tugasan diperlukan');
  const sheet   = sheetRefOrCreate('LATIHAN_KENDIRI', ['ID_LATIHAN','NO_KP','NAMA','NAMA_TUGASAN','PENERANGAN','TEMPOH_HARI','TARIKH_MULA','TARIKH_TAMAT','STATUS']);
  const id      = 'LT-' + id8();
  const mula    = tarikh_mula || tarikhFmt(new Date());
  const tempoh  = parseInt(tempoh_hari) || 30;
  const tamat   = tarikhTambahHari(mula, tempoh);
  const ahliNama = no_kp && no_kp !== 'SEMUA'
    ? (ambilData('AHLI').find(a => samaKP(a.NO_KP, no_kp))?.NAMA_PENUH || '')
    : 'Semua Pesilat';
  sheet.appendRow([id, no_kp && no_kp !== 'SEMUA' ? kpTeks(no_kp) : 'SEMUA', ahliNama, nama_tugasan, penerangan || '', tempoh, mula, tamat, 'AKTIF']);
  return { id, nama_tugasan, mesej: 'Latihan kendiri berjaya ditambah' };
}

function rekodLatihanKendiri(b) {
  const { id_latihan, no_kp, status } = b;
  if (!id_latihan || !no_kp) throw new Error('id_latihan dan no_kp diperlukan');
  const sheet = sheetRefOrCreate('REKOD_LATIHAN', ['ID','ID_LATIHAN','NO_KP','TARIKH','STATUS','CATATAN']);
  const hari  = tarikhFmt(new Date());
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(id_latihan) && samaKP(data[i][2], no_kp) && fmtTarikhGAS(data[i][3]) === hari) {
      sheet.getRange(i+1, 5).setValue(status || 'SELESAI');
      return { mesej: 'Status dikemaskini' };
    }
  }
  sheet.appendRow([id8(), id_latihan, kpTeks(no_kp), hari, status || 'SELESAI', '']);
  return { mesej: 'Latihan direkodkan' };
}

function padamLatihan(b) {
  const { id_latihan } = b;
  if (!id_latihan) throw new Error('id_latihan diperlukan');
  const sheet = sheetRef('LATIHAN_KENDIRI');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id_latihan)) {
      sheet.getRange(i+1, 9).setValue('PADAM');
      return { mesej: 'Latihan dipadamkan' };
    }
  }
  throw new Error('Latihan tidak dijumpai');
}

function tarikhTambahHari(tarikh, hari) {
  const d = new Date(tarikh);
  d.setDate(d.getDate() + parseInt(hari));
  return tarikhFmt(d);
}

// ── Set Pesilat Tidak Aktif (GET endpoint) ───────────────────
function setTidakAktif(e) {
  var noKp  = String(e.parameter.no_kp||'').trim();
  var sebab = String(e.parameter.sebab||'Tidak dinyatakan');
  try { sebab = decodeURIComponent(sebab); } catch(x) {}
  if (!noKp) throw new Error('no_kp diperlukan');
  var sheet = sheetRef(NAMA_SHEET.AHLI);
  var data  = sheet.getDataRange().getValues();
  var hdr   = data[0].map(function(h){return h.toString().trim().toUpperCase();});
  var idxKP = hdr.indexOf('NO_KP'); if (idxKP === -1) idxKP = 1;
  var idxSts = hdr.indexOf('STATUS');
  var idxCat = hdr.indexOf('CATATAN');
  for (var i = 1; i < data.length; i++) {
    if (samaKP(data[i][idxKP], noKp)) {
      var nama = data[i][hdr.indexOf('NAMA_PENUH')] || noKp;
      if (idxSts !== -1) sheet.getRange(i+1, idxSts+1).setValue('TIDAK AKTIF');
      if (idxCat !== -1) {
        var sedia = String(data[i][idxCat]||'');
        var log   = '[BERHENTI ' + tarikhFmt(new Date()) + ': ' + sebab + ']';
        sheet.getRange(i+1, idxCat+1).setValue(sedia ? sedia+' '+log : log);
      }
      invalidateCache('ahli'); // [BAIKI]
      return {ok:true, mesej: nama + ' ditetapkan TIDAK AKTIF', no_kp: noKp};
    }
  }
  throw new Error('Pesilat tidak dijumpai: ' + noKp);
}

// ── TAMBAHAN TERKINI ─────────────────────────────────────────
function batalKecualiBulan(d) {
  const bulan=(d.bulan||'').toUpperCase(),tahun=String(d.tahun||'');
  if(!bulan||!tahun) throw new Error('bulan dan tahun diperlukan');
  const sheet=sheetRef(NAMA_SHEET.YURAN),data=sheet.getDataRange().getValues();
  const rows=[];
  for(let i=1;i<data.length;i++){
    if(String(data[i][1]).trim()==='SEDEKAH'&&String(data[i][4]).toUpperCase()===bulan&&String(data[i][5])===tahun&&
       (data[i][3]==='DIKECUALIKAN'||data[i][3]==='TIADA_BAYARAN')) rows.push(i+1);
  }
  rows.reverse().forEach(r=>sheet.deleteRow(r));
  invalidateCache('yuran');
  return {ok:true,mesej:'Pengecualian '+bulan+' '+tahun+' dibatalkan',bilang:rows.length};
}

function padamDataAhli(d) {
  const noKp=String(d.no_kp||'').trim();
  if(!noKp) throw new Error('no_kp diperlukan');
  const sheet=sheetRef(NAMA_SHEET.AHLI),data=sheet.getDataRange().getValues();
  const hdr=data[0].map(h=>h.toString().trim().toUpperCase());
  const idxKP=hdr.indexOf('NO_KP');
  const row=data.findIndex((r,i)=>i>0&&samaKP(r[idxKP],noKp));
  if(row===-1) throw new Error('Ahli tidak dijumpai');
  ['FOTO_BASE64','ALAMAT'].forEach(kol=>{const idx=hdr.indexOf(kol);if(idx!==-1)sheet.getRange(row+1,idx+1).setValue('');});
  if(d.padam_kontak===true||d.padam_kontak==='true'){
    ['NO_TEL_WARIS','NO_TEL_AHLI'].forEach(kol=>{const idx=hdr.indexOf(kol);if(idx!==-1)sheet.getRange(row+1,idx+1).setValue('');});
  }
  try{
    let ls=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG_PDPA');
    if(!ls){ls=SpreadsheetApp.getActiveSpreadsheet().insertSheet('LOG_PDPA');ls.appendRow(['TARIKH','NO_KP','NAMA','SEBAB','DIPROSES_OLEH']);}
    ls.appendRow([tarikhFmt(new Date()),kpTeks(noKp),data[row][hdr.indexOf('NAMA_PENUH')]||noKp,d.sebab||'—',d.diproses_oleh||'Admin']);
  }catch(e2){}
  invalidateCache('ahli');
  return {ok:true,mesej:'Data sensitif dipadamkan',no_kp:noKp};
}

function padamRekodYuran(d) {
  if(!d.id_rekod) throw new Error('id_rekod diperlukan');
  const sheet=sheetRef(NAMA_SHEET.YURAN),data=sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){if(String(data[i][0])===String(d.id_rekod)){sheet.deleteRow(i+1);invalidateCache('yuran');return{ok:true,mesej:'Rekod yuran dipadamkan'};}}
  throw new Error('Rekod tidak dijumpai');
}

function padamYuranBulan(d) {
  if(!d.no_kp||!d.bulan||!d.tahun) throw new Error('no_kp, bulan, tahun diperlukan');
  const sheet=sheetRef(NAMA_SHEET.YURAN),data=sheet.getDataRange().getValues();
  const rows=[];
  for(let i=1;i<data.length;i++){
    if(samaKP(data[i][1],d.no_kp)&&String(data[i][4]).toUpperCase()===d.bulan.toUpperCase()&&String(data[i][5])===String(d.tahun))
      rows.push(i+1);
  }
  rows.reverse().forEach(r=>sheet.deleteRow(r));
  invalidateCache('yuran');
  return{ok:true,mesej:rows.length+' rekod dipadamkan',bilang:rows.length};
}

function padamAhli(d) {
  const noKp=String(d.no_kp||'').trim(),sebab=String(d.sebab||'Tidak dinyatakan');
  if(!noKp) throw new Error('no_kp diperlukan');
  const sheet=sheetRef(NAMA_SHEET.AHLI),data=sheet.getDataRange().getValues();
  const hdr=data[0].map(h=>h.toString().trim().toUpperCase());
  const row=data.findIndex((r,i)=>i>0&&samaKP(r[hdr.indexOf('NO_KP')],noKp));
  if(row===-1) throw new Error('Pesilat tidak dijumpai');
  const nama=data[row][hdr.indexOf('NAMA_PENUH')]||noKp;
  const idxSts=hdr.indexOf('STATUS'),idxCat=hdr.indexOf('CATATAN');
  if(idxSts!==-1) sheet.getRange(row+1,idxSts+1).setValue('TIDAK AKTIF');
  if(idxCat!==-1){
    const sedia=String(data[row][idxCat]||'');
    const log='[PADAM '+tarikhFmt(new Date())+': '+sebab+']';
    sheet.getRange(row+1,idxCat+1).setValue(sedia?sedia+' '+log:log);
  }
  invalidateCache('ahli'); // [BAIKI]
  return{ok:true,mesej:nama+' ditetapkan TIDAK AKTIF',no_kp:noKp};
}

function kemaskiniAhliV2(d) {
  const noKp=String(d.no_kp||'').trim();
  if(!noKp) throw new Error('no_kp diperlukan');
  const sheet=sheetRef(NAMA_SHEET.AHLI),data=sheet.getDataRange().getValues();
  const hdr=data[0].map(h=>h.toString().trim().toUpperCase());
  const row=data.findIndex((r,i)=>i>0&&samaKP(r[hdr.indexOf('NO_KP')],noKp));
  if(row===-1) throw new Error('Pesilat tidak dijumpai: '+noKp);
  const fields={'NAMA_PENUH':d.nama_penuh,'JANTINA':d.jantina,'KATEGORI':d.kategori,'BENGKUNG_SEMASA':d.bengkung_semasa,'ALAMAT':d.alamat,'NAMA_WARIS':d.nama_waris,'NO_TEL_WARIS':d.no_tel_waris,'CATATAN':d.catatan,'STATUS':d.status};
  Object.entries(fields).forEach(function([col,val]){if(val===undefined||val===null)return;const cIdx=hdr.indexOf(col);if(cIdx!==-1)sheet.getRange(row+1,cIdx+1).setValue(val);});
  invalidateCache('ahli'); // [BAIKI]
  return{ok:true,mesej:'Maklumat dikemaskini',no_kp:noKp};
}

// ── Edit Ahli via GET ─────────────────────────────────────────
function kemaskiniAhliGet(e) {
  var noKp = String(e.parameter.no_kp||'').trim();
  if (!noKp) throw new Error('no_kp diperlukan');
  var sheet = sheetRef(NAMA_SHEET.AHLI);
  var data  = sheet.getDataRange().getValues();
  var hdr   = data[0].map(function(h){return h.toString().trim().toUpperCase();});
  var row   = -1;
  for (var i=1;i<data.length;i++) {
    if (samaKP(data[i][hdr.indexOf('NO_KP')], noKp)){row=i;break;}
  }
  if (row===-1) throw new Error('Pesilat tidak dijumpai: '+noKp);
  var dekod = function(v){ if (v===undefined) return undefined; try { return decodeURIComponent(v); } catch(x) { return v; } };
  var fields = {
    'NAMA_PENUH'    : e.parameter.nama_penuh,
    'JANTINA'       : e.parameter.jantina,
    'KATEGORI'      : e.parameter.kategori,
    'BENGKUNG_SEMASA': e.parameter.bengkung,
    'ALAMAT'        : dekod(e.parameter.alamat),
    'NAMA_WARIS'    : e.parameter.nama_waris,
    'NO_TEL_WARIS'  : e.parameter.no_tel,
    'CATATAN'       : dekod(e.parameter.catatan),
  };
  Object.keys(fields).forEach(function(col){
    var val = fields[col];
    if (val===undefined||val===null||val==='undefined') return;
    var cIdx = hdr.indexOf(col);
    if (cIdx!==-1) sheet.getRange(row+1,cIdx+1).setValue(val);
  });
  invalidateCache('ahli'); // [BAIKI] perubahan bengkung/nama terus kelihatan
  return {ok:true, mesej:'Maklumat dikemaskini', no_kp:noKp};
}

// ── Pendaftaran Baharu (Public Form) ─────────────────────────
function simpanPendaftaranBaharu(d) {
  if (!d.no_kp||!d.nama_penuh) throw new Error('no_kp dan nama_penuh wajib');
  if (!/^\d{12}$/.test(normKP(d.no_kp))) throw new Error('No. KP mesti 12 digit');
  var ahli = ambilData(NAMA_SHEET.AHLI);
  if (ahli.find(function(a){return samaKP(a.NO_KP, d.no_kp);}))
    throw new Error('No. KP sudah berdaftar dalam sistem');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PENDAFTARAN_BAHARU');
  if (!sheet) {
    sheet = ss.insertSheet('PENDAFTARAN_BAHARU');
    sheet.appendRow(['ID','TARIKH_HANTAR','NO_KP','NAMA_PENUH','JANTINA','TARIKH_LAHIR','ALAMAT','NAMA_WARIS','NO_TEL_WARIS','KATEGORI','STATUS_SEMAK','CATATAN_ADMIN']);
    sheet.getRange(1,1,1,12).setBackground('#1D9E75').setFontColor('#fff').setFontWeight('bold');
  }
  // [BAIKI] elak permohonan berganda (ibu bapa tekan Hantar dua kali)
  var menunggu = ambilDataSelamat('PENDAFTARAN_BAHARU').find(function(r){ return samaKP(r.NO_KP, d.no_kp) && r.STATUS_SEMAK === 'MENUNGGU'; });
  if (menunggu) return {ok:true, id:menunggu.ID, mesej:'Permohonan sudah diterima sebelum ini. Sila tunggu pengesahan jurulatih.'};
  var id = 'PD-'+id8();
  sheet.appendRow([id,tarikhFmt(new Date()),kpTeks(d.no_kp),(d.nama_penuh||'').toUpperCase(),(d.jantina||'').toUpperCase(),d.tarikh_lahir||'',d.alamat||'',(d.nama_waris||'').toUpperCase(),d.no_tel||'',d.kategori||'','MENUNGGU','']);
  return {ok:true, id:id, mesej:'Pendaftaran berjaya dihantar. Sila tunggu pengesahan jurulatih.'};
}

function getSenaraiPendaftaran(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PENDAFTARAN_BAHARU');
  if (!sheet||sheet.getLastRow()<2) return [];
  return ambilData('PENDAFTARAN_BAHARU').filter(function(r){return r.STATUS_SEMAK!=='DILULUSKAN'&&r.STATUS_SEMAK!=='DITOLAK';});
}

function lulusPendaftaran(d) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PENDAFTARAN_BAHARU');
    if (!sheet) throw new Error('Sheet PENDAFTARAN_BAHARU tidak wujud');
    var data = sheet.getDataRange().getValues();
    var hdr  = data[0].map(function(h){return h.toString().trim().toUpperCase();});
    var idxID = hdr.indexOf('ID');
    for (var i=1;i<data.length;i++) {
      if (String(data[i][idxID])===String(d.id)) {
        var noKp   = normKP(data[i][hdr.indexOf('NO_KP')]);
        var nama   = String(data[i][hdr.indexOf('NAMA_PENUH')]);
        // [BAIKI] elak ahli berganda jika butang Lulus ditekan dua kali
        if (ambilData(NAMA_SHEET.AHLI).find(function(a){return samaKP(a.NO_KP, noKp);})) {
          sheet.getRange(i+1,hdr.indexOf('STATUS_SEMAK')+1).setValue('DILULUSKAN');
          throw new Error(nama+' sudah berdaftar sebagai ahli');
        }
        var sAhli  = sheetRef(NAMA_SHEET.AHLI);
        var idAhli = janID(sAhli,'SGM');
        sAhli.appendRow([idAhli,kpTeks(noKp),nama,data[i][hdr.indexOf('JANTINA')],data[i][hdr.indexOf('TARIKH_LAHIR')],data[i][hdr.indexOf('ALAMAT')],(data[i][hdr.indexOf('NAMA_WARIS')])||'',data[i][hdr.indexOf('NO_TEL_WARIS')]||'','',data[i][hdr.indexOf('KATEGORI')]||'','BENGKUNG HITAM KOSONG (AHLI BAHARU)',tarikhFmt(new Date()),'AKTIF','']);
        sheet.getRange(i+1,hdr.indexOf('STATUS_SEMAK')+1).setValue('DILULUSKAN');
        sheet.getRange(i+1,hdr.indexOf('CATATAN_ADMIN')+1).setValue('Diluluskan: '+tarikhFmt(new Date()));
        invalidateCache('ahli');
        // [BAIKI] dulu "idBaharu" (tidak wujud) → ralat walaupun ahli sudah didaftarkan
        return {ok:true, id_ahli:idAhli, no_kp:noKp, nama:nama, mesej:nama+' berjaya didaftarkan'};
      }
    }
    throw new Error('Rekod pendaftaran tidak dijumpai');
  } finally { lock.releaseLock(); }
}

function tolakPendaftaran(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PENDAFTARAN_BAHARU');
  if (!sheet) throw new Error('Sheet tidak wujud');
  var data = sheet.getDataRange().getValues();
  var hdr  = data[0].map(function(h){return h.toString().trim().toUpperCase();});
  for (var i=1;i<data.length;i++) {
    if (String(data[i][hdr.indexOf('ID')])===String(d.id)) {
      sheet.getRange(i+1,hdr.indexOf('STATUS_SEMAK')+1).setValue('DITOLAK');
      sheet.getRange(i+1,hdr.indexOf('CATATAN_ADMIN')+1).setValue(d.sebab||'Ditolak oleh admin');
      return {ok:true, mesej:'Permohonan ditolak'};
    }
  }
  throw new Error('Rekod tidak dijumpai');
}

// ── Kemaskini Tetapan (key-value) ────────────────────────────
function kemaskiniTetapan(d) {
  var kunci = String(d.kunci||'').trim().toUpperCase();
  var nilai = String(d.nilai||'');
  if (!kunci) throw new Error('kunci diperlukan');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('TETAPAN');
  if (!sheet) {
    sheet = ss.insertSheet('TETAPAN');
    sheet.appendRow(['KUNCI','NILAI']);
  }
  var data = sheet.getDataRange().getValues();
  var hdr  = data[0].map(function(h){return h.toString().trim().toUpperCase();});
  var idxK = hdr.indexOf('KUNCI'), idxV = hdr.indexOf('NILAI');
  if (idxK===-1){idxK=0;idxV=1;}
  for (var i=1;i<data.length;i++) {
    if (String(data[i][idxK]).trim().toUpperCase()===kunci) {
      sheet.getRange(i+1,idxV+1).setValue(nilai);
      invalidateCache('tetapan');
      return {ok:true,kunci,nilai,mesej:'Tetapan dikemaskini'};
    }
  }
  var row = [];
  row[idxK] = kunci; row[idxV] = nilai;
  for (var x=0;x<row.length;x++) if (row[x]===undefined) row[x]='';
  sheet.appendRow(row);
  invalidateCache('tetapan'); // [BAIKI] tetapan baharu terus kelihatan
  return {ok:true,kunci,nilai,mesej:'Tetapan ditambah'};
}

// ── Statistik Kehadiran Semua Ahli (untuk carta ANALISIS) ────
function getStatHadirSemua(e) {
  var tahun = parseInt(e.parameter.tahun||new Date().getFullYear());
  var hadir = ambilData(NAMA_SHEET.KEHADIRAN).filter(function(r){
    var t = new Date(r.TARIKH);
    return !isNaN(t) && t.getFullYear()===tahun;
  });
  var aktif = ambilData(NAMA_SHEET.AHLI).filter(function(r){return r.STATUS==='AKTIF';}).length;
  var BULAN = ['JAN','FEB','MAC','APR','MEI','JUN','JUL','OGS','SEP','OKT','NOV','DIS'];
  var ikutBulan = {};
  for (var b=1;b<=12;b++) ikutBulan[b]={bulan:BULAN[b-1],hadir:0,tidak:0,sesi:0,peratus:0};
  var sesiPerBulan = {};
  for (var b2=1;b2<=12;b2++) sesiPerBulan[b2]={};
  hadir.forEach(function(r){
    var t = new Date(r.TARIKH);
    var b = t.getMonth()+1;
    sesiPerBulan[b][tarikhFmt(t)] = true;
    var s = (r.STATUS_KEHADIRAN||r.STATUS||'').toString().trim();
    if (s===''||s.toUpperCase()==='HADIR') ikutBulan[b].hadir++;
    else ikutBulan[b].tidak++;
  });
  for (var b3=1;b3<=12;b3++) {
    var bilSesi = Object.keys(sesiPerBulan[b3]).length;
    ikutBulan[b3].sesi = bilSesi;
    var jum = ikutBulan[b3].hadir + ikutBulan[b3].tidak;
    ikutBulan[b3].peratus = jum>0 ? Math.round(ikutBulan[b3].hadir/jum*100) : 0;
  }
  return {tahun:tahun, aktif:aktif, ikut_bulan:ikutBulan};
}

// ── Padam Laporan ─────────────────────────────────────────────
function padamLaporan(d) {
  var id = String(d.id_laporan||'').trim();
  if (!id) throw new Error('id_laporan diperlukan');
  var shL = sheetRef('LAPORAN');
  var shD = sheetRef('DETAIL_LAPORAN');
  var dataL = shL.getDataRange().getValues();
  var hdrL  = dataL[0].map(function(h){return h.toString().trim().toUpperCase();});
  var idxL  = hdrL.indexOf('ID_LAPORAN');
  for (var i=dataL.length-1;i>=1;i--) {
    if (String(dataL[i][idxL]).trim()===id) { shL.deleteRow(i+1); break; }
  }
  var dataD = shD.getDataRange().getValues();
  var hdrD  = dataD[0].map(function(h){return h.toString().trim().toUpperCase();});
  var idxD  = hdrD.indexOf('ID_LAPORAN');
  for (var j=dataD.length-1;j>=1;j--) {
    if (String(dataD[j][idxD]).trim()===id) shD.deleteRow(j+1);
  }
  return {ok:true, mesej:'Laporan '+id+' dipadamkan'};
}

// ── Kemaskini Laporan (catatan + bakat) ───────────────────────
function kemaskiniLaporan(d) {
  var id = String(d.id_laporan||'').trim();
  if (!id) throw new Error('id_laporan diperlukan');
  var sheet = sheetRef('LAPORAN');
  var data  = sheet.getDataRange().getValues();
  var hdr   = data[0].map(function(h){return h.toString().trim().toUpperCase();});
  var idxID = hdr.indexOf('ID_LAPORAN');
  for (var i=1;i<data.length;i++) {
    if (String(data[i][idxID]).trim()===id) {
      if (d.catatan !== undefined) {
        var idxCat = hdr.indexOf('CATATAN') >= 0 ? hdr.indexOf('CATATAN') : hdr.indexOf('CATATAN_GURU');
        if (idxCat>=0) sheet.getRange(i+1,idxCat+1).setValue(d.catatan);
      }
      if (d.bakat !== undefined) {
        var idxBkt = hdr.indexOf('BAKAT');
        if (idxBkt>=0) sheet.getRange(i+1,idxBkt+1).setValue(d.bakat);
      }
      return {ok:true, mesej:'Laporan dikemaskini'};
    }
  }
  throw new Error('Laporan tidak dijumpai: '+id);
}

// ═══════════════════════════════════════════════════════════════
//  MODUL: PERTANDINGAN
// ═══════════════════════════════════════════════════════════════
function getSenaraiTandingan(e) {
  const noKp  = e.parameter.no_kp || '';
  const tahun = e.parameter.tahun || '';
  let data = ambilDataSelamat('PERTANDINGAN');
  if (noKp)  data = data.filter(r => samaKP(r.NO_KP, noKp));
  if (tahun) data = data.filter(r => fmtTarikhGAS(r.TARIKH).startsWith(tahun));
  return data.map(r => ({
    id: r.ID, no_kp: r.NO_KP, nama: r.NAMA,
    nama_tandingan: r.NAMA_TANDINGAN, tarikh: fmtTarikhGAS(r.TARIKH),
    kategori: r.KATEGORI_TANDINGAN, acara: r.ACARA,
    keputusan: r.KEPUTUSAN, tempat: r.TEMPAT, catatan: r.CATATAN
  }));
}

function tambahTandingan(b) {
  const sheet = sheetRefOrCreate('PERTANDINGAN', ['ID','NO_KP','NAMA','NAMA_TANDINGAN','TARIKH','KATEGORI_TANDINGAN','ACARA','KEPUTUSAN','TEMPAT','CATATAN','DICIPTA']);
  const id = 'TDG-' + id8();
  const ahli = ambilData(NAMA_SHEET.AHLI).find(a => samaKP(a.NO_KP, b.no_kp));
  sheet.appendRow([id, kpTeks(b.no_kp), ahli ? ahli.NAMA_PENUH : (b.nama||''), b.nama_tandingan||'',
    b.tarikh || tarikhFmt(new Date()), b.kategori||'', b.acara||'',
    (b.keputusan||'').toUpperCase(), b.tempat||'', b.catatan||'', tarikhFmt(new Date())]);
  SpreadsheetApp.flush();
  return { id, mesej: 'Rekod pertandingan ditambah' };
}

function kemaskiniTandingan(b) {
  const sheet = sheetRef('PERTANDINGAN');
  const data  = sheet.getDataRange().getValues();
  const hdrs  = data[0].map(h => String(h).toUpperCase());
  const iID   = hdrs.indexOf('ID');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][iID]).trim() === String(b.id).trim()) {
      const row = i + 1;
      // [BAIKI] kunci data daripada aplikasi: kategori (bukan kategori_tandingan)
      const peta = {nama_tandingan:4, tarikh:5, kategori:6, kategori_tandingan:6, acara:7, keputusan:8, tempat:9, catatan:10};
      Object.entries(peta).forEach(([k,col]) => { if (b[k] !== undefined) sheet.getRange(row, col).setValue(k==='keputusan' ? String(b[k]).toUpperCase() : b[k]); });
      SpreadsheetApp.flush();
      return { id: b.id, mesej: 'Rekod dikemaskini' };
    }
  }
  throw new Error('Rekod tidak dijumpai');
}

function padamTandingan(b) {
  const sheet = sheetRef('PERTANDINGAN');
  const data  = sheet.getDataRange().getValues();
  const iID   = data[0].map(h => String(h).toUpperCase()).indexOf('ID');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][iID]).trim() === String(b.id).trim()) {
      sheet.deleteRow(i + 1); SpreadsheetApp.flush();
      return { mesej: 'Rekod dipadam' };
    }
  }
  throw new Error('Rekod tidak dijumpai');
}

// ═══════════════════════════════════════════════════════════════
//  MODUL: GALERI FOTO LATIHAN
// ═══════════════════════════════════════════════════════════════
function getSenaraiGaleri(e) {
  const tahun = e.parameter.tahun || '';
  let data = ambilDataSelamat('GALERI');
  if (tahun) data = data.filter(r => fmtTarikhGAS(r.TARIKH).startsWith(tahun));
  return data.sort((a,b) => fmtTarikhGAS(b.TARIKH).localeCompare(fmtTarikhGAS(a.TARIKH)))
    .map(r => ({ id:r.ID, tarikh:fmtTarikhGAS(r.TARIKH), tajuk:r.TAJUK, pautan:r.PAUTAN_FOTO, keterangan:r.KETERANGAN, dicipta:r.DICIPTA }));
}

function tambahGaleri(b) {
  const sheet = sheetRefOrCreate('GALERI', ['ID','TARIKH','TAJUK','PAUTAN_FOTO','KETERANGAN','DICIPTA']);
  const id = 'GAL-' + id8();
  sheet.appendRow([id, b.tarikh || tarikhFmt(new Date()), b.tajuk||'Sesi Latihan', b.pautan||'', b.keterangan||'', tarikhFmt(new Date())]);
  SpreadsheetApp.flush();
  return { id, mesej: 'Foto ditambah' };
}

function padamGaleri(b) {
  const sheet = sheetRef('GALERI');
  const data  = sheet.getDataRange().getValues();
  const iID   = data[0].map(h => String(h).toUpperCase()).indexOf('ID');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][iID]).trim() === String(b.id).trim()) {
      sheet.deleteRow(i + 1); SpreadsheetApp.flush();
      return { mesej: 'Foto dipadam' };
    }
  }
  throw new Error('Rekod tidak dijumpai');
}

// ═══════════════════════════════════════════════════════════════
//  MODUL: STATISTIK KEHADIRAN TREND (6 bulan)
// ═══════════════════════════════════════════════════════════════
function getStatHadirTrend(e) {
  const hadir = ambilData(NAMA_SHEET.KEHADIRAN);
  const ahliAktif = ambilData(NAMA_SHEET.AHLI).filter(r => r.STATUS === 'AKTIF').length;
  const bulanData = {};
  hadir.filter(r => (r.STATUS_KEHADIRAN||'HADIR').toUpperCase() === 'HADIR').forEach(r => {
    const t = fmtTarikhGAS(r.TARIKH);
    if (!t) return;
    const k = t.substring(0,7);
    if (!bulanData[k]) bulanData[k] = new Set();
    bulanData[k].add(r.NO_KP);
  });
  const kini = new Date();
  const BULAN_S = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogs','Sep','Okt','Nov','Dis'];
  const hasil = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(kini.getFullYear(), kini.getMonth() - i, 1);
    const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    hasil.push({ bulan: BULAN_S[d.getMonth()] + ' ' + d.getFullYear(), key: k, hadir: bulanData[k] ? bulanData[k].size : 0, ahliAktif });
  }
  return { trend: hasil, ahliAktif };
}

// ═══════════════════════════════════════════════════════════════
//  MODUL: DATA OPR (Objektif Pencapaian Rekod)
// ═══════════════════════════════════════════════════════════════
function getDataOPR(e) {
  const tahun = e.parameter.tahun || String(new Date().getFullYear());
  const bulan = e.parameter.bulan || String(new Date().getMonth() + 1);
  const awalan = tahun+'-'+String(bulan).padStart(2,'0');
  const NAMA_BLN = ['JANUARI','FEBRUARI','MAC','APRIL','MEI','JUN','JULAI','OGOS','SEPTEMBER','OKTOBER','NOVEMBER','DISEMBER'][parseInt(bulan,10)-1];
  const ahliAktif = ambilData(NAMA_SHEET.AHLI).filter(r => r.STATUS === 'AKTIF');
  const hadir = ambilData(NAMA_SHEET.KEHADIRAN).filter(r => {
    const t = fmtTarikhGAS(r.TARIKH);
    return t && t.startsWith(awalan) && (r.STATUS_KEHADIRAN||'HADIR').toUpperCase() === 'HADIR';
  });
  const hadirUnik = new Set(hadir.map(r => r.NO_KP)).size;
  // [BAIKI] yuran bulan itu = ahli unik yang bayar yuran BULANAN bagi bulan tersebut
  const yuranBulan = new Set(ambilData(NAMA_SHEET.YURAN).filter(r =>
    r.BULAN === NAMA_BLN && String(r.TAHUN) === String(tahun) && r.STATUS_PENGESAHAN === 'SELESAI' && yuranBulanan(r)
  ).map(r => r.NO_KP)).size;
  const tandingan = ambilDataSelamat('PERTANDINGAN').filter(r => fmtTarikhGAS(r.TARIKH).startsWith(tahun));
  const menang = tandingan.filter(r => (r.KEPUTUSAN||'').includes('EMAS') || (r.KEPUTUSAN||'').includes('1') || (r.KEPUTUSAN||'').includes('MENANG'));
  const tetapan = getTetapan();
  // [BAIKI] nama hadir unik (dulu NAMA_PENUH — lajur tiada dalam KEHADIRAN)
  const namaHadir = [];
  hadir.forEach(r => { const n = r.NAMA_PESILAT || r.NO_KP; if (namaHadir.indexOf(n) < 0) namaHadir.push(n); });
  return {
    tahun, bulan,
    nama_gelanggang: tetapan.NAMA_GELANGGANG || 'Gelanggang Seni Mutiara',
    nama_pengerusi: tetapan.NAMA_PENGERUSI || '',
    jumlah_ahli: ahliAktif.length,
    hadir_bulan: hadirUnik,
    peratus_hadir: ahliAktif.length > 0 ? Math.round(hadirUnik/ahliAktif.length*100) : 0,
    yuran_kutip: yuranBulan,
    peratus_yuran: ahliAktif.length > 0 ? Math.round(yuranBulan/ahliAktif.length*100) : 0,
    jumlah_tandingan: tandingan.length,
    jumlah_menang: menang.length,
    sesi_hadir_list: namaHadir.slice(0,20)
  };
}

// ═══════════════════════════════════════════════════════════════
//  UJIAN BENGKUNG — satu baris = satu sesi ujian (data JSON)
// ═══════════════════════════════════════════════════════════════
const UJIAN_HDR = ['ID_UJIAN','TARIKH','TAJUK','LULUS_MIN','ITEMS','PESERTA','MARKAH','DIKEMASKINI'];

function _sheetUjian() { return sheetRefOrCreate('UJIAN_BENGKUNG', UJIAN_HDR); }

function _jsonSelamat(v, lalai) {
  try { return v ? JSON.parse(v) : lalai; } catch(e) { return lalai; }
}

function _tarikhUjian(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  return String(v || '');
}

function getSenaraiUjian() {
  const sh = _sheetUjian();
  const data = sh.getDataRange().getValues();
  const hasil = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    hasil.push({
      id: String(r[0]), tarikh: _tarikhUjian(r[1]), tajuk: String(r[2] || ''),
      lulus_min: Number(r[3]) || 50,
      items: _jsonSelamat(r[4], []), peserta: _jsonSelamat(r[5], []),
      markah: _jsonSelamat(r[6], {}), dikemaskini: String(r[7] || '')
    });
  }
  hasil.sort((a, b) => b.tarikh.localeCompare(a.tarikh));
  return hasil;
}

// Portal Ibu Bapa — keputusan ujian SEORANG pesilat sahaja (tiada data pesilat lain)
function getUjianAhli(e) {
  const kp = normKP(e.parameter.no_kp);
  if (!kp) throw new Error('No. KP diperlukan');
  const hasil = [];
  getSenaraiUjian().forEach(u => {
    const p = (u.peserta || []).find(x => samaKP(x.no_kp, kp));
    if (!p) return;
    const m = u.markah || {};
    const kunci = Object.keys(m).find(k => samaKP(k, kp));
    hasil.push({ id: u.id, tarikh: u.tarikh, tajuk: u.tajuk, lulus_min: u.lulus_min,
      items: (Array.isArray(p.items) && p.items.length) ? p.items : u.items, bengkung: p.bengkung || '', markah: kunci ? m[kunci] : {} });
  });
  return hasil;
}

function _cariBarisUjian(sh, id) {
  const ids = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
  for (let i = 1; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 1;
  return -1;
}

// [BAIKI] Satu sel Google Sheets maksimum 50,000 aksara — beri amaran jelas
function _semakSaizSel(teks, apa) {
  if (teks.length > 49000) throw new Error('Data ' + apa + ' terlalu besar untuk satu sel (' + teks.length + ' aksara). Bahagikan ujian kepada beberapa sesi.');
  return teks;
}

function simpanUjian(b) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = _sheetUjian();
    const id = b.id || ('UJ-' + new Date().getTime());
    const masa = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'dd/MM/yyyy HH:mm');
    const baris = _cariBarisUjian(sh, id);
    let markah = b.markah;
    if (baris > 0 && markah === undefined) markah = _jsonSelamat(sh.getRange(baris, 7).getValue(), {});
    const nilai = [id, "'" + (b.tarikh || ''), b.tajuk || 'Ujian Bengkung', Number(b.lulus_min) || 50,
      _semakSaizSel(JSON.stringify(b.items || []), 'item'), _semakSaizSel(JSON.stringify(b.peserta || []), 'peserta'),
      _semakSaizSel(JSON.stringify(markah || {}), 'markah'), masa];
    if (baris > 0) sh.getRange(baris, 1, 1, nilai.length).setValues([nilai]);
    else sh.appendRow(nilai);
    SpreadsheetApp.flush();
    return { id: id, mesej: 'Ujian disimpan' };
  } finally { lock.releaseLock(); }
}

function simpanMarkahUjian(b) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = _sheetUjian();
    const baris = _cariBarisUjian(sh, b.id);
    if (baris < 0) throw new Error('Ujian tidak dijumpai');
    sh.getRange(baris, 7).setValue(_semakSaizSel(JSON.stringify(b.markah || {}), 'markah'));
    sh.getRange(baris, 8).setValue(Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'dd/MM/yyyy HH:mm'));
    SpreadsheetApp.flush();
    return { id: b.id, mesej: 'Markah disimpan' };
  } finally { lock.releaseLock(); }
}

function padamUjian(b) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = _sheetUjian();
    const baris = _cariBarisUjian(sh, b.id);
    if (baris < 0) throw new Error('Ujian tidak dijumpai');
    sh.deleteRow(baris);
    return { mesej: 'Ujian dipadam' };
  } finally { lock.releaseLock(); }
}
