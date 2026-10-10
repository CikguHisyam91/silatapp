// ═══ Kad Ahli Digital — dikongsi oleh index.html & parent.html ═══
const STATUS_AHLI = {
  'AKTIF':       { label: 'AKTIF',       warna: '#4CC38A', ikon: '✓' },
  'TIDAK AKTIF': { label: 'TIDAK AKTIF', warna: '#9AA3AF', ikon: '–' },
  'DIGANTUNG':   { label: 'DIGANTUNG',   warna: '#E9A23B', ikon: '!' },
  'DIBATALKAN':  { label: 'DIBATALKAN',  warna: '#F2706B', ikon: '✕' }
};
function statusAhliInfo(s) { return STATUS_AHLI[String(s || 'AKTIF').toUpperCase().trim()] || STATUS_AHLI['AKTIF']; }

(function () {
  if (document.getElementById('css-kad-ahli')) return;
  const st = document.createElement('style'); st.id = 'css-kad-ahli';
  st.textContent = `
.kad-ahli{position:relative;width:100%;max-width:400px;aspect-ratio:1.586;margin:0 auto;border-radius:18px;overflow:hidden;color:#F5EBD3;
  background:radial-gradient(120% 90% at 100% 0%,rgba(226,181,90,.28),transparent 55%),linear-gradient(135deg,#1B1410 0%,#2A0F12 55%,#120D0A 100%);
  box-shadow:0 14px 34px rgba(0,0,0,.5),inset 0 0 0 1px rgba(226,181,90,.45);font-family:inherit}
.kad-ahli::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(226,181,90,.05) 0 2px,transparent 2px 14px);pointer-events:none}
.kad-ahli::after{content:"";position:absolute;right:-60px;bottom:-60px;width:200px;height:200px;border-radius:50%;border:18px solid rgba(226,181,90,.08)}
.ka-atas{position:absolute;left:5%;right:5%;top:6%;display:flex;align-items:center;gap:9px}
.ka-logo{width:34px;height:34px;border-radius:50%;background:#fff;padding:2px;object-fit:contain;flex-shrink:0}
.ka-gel{font-size:clamp(10px,3vw,13px);font-weight:800;letter-spacing:.6px;line-height:1.15;color:#E2B55A}
.ka-sub{font-size:clamp(7px,2.1vw,9px);letter-spacing:1.4px;opacity:.75}
.ka-tengah{position:absolute;left:5%;right:5%;top:30%}
.ka-nama{font-size:clamp(13px,4.3vw,18px);font-weight:800;line-height:1.2;text-transform:uppercase;max-height:2.4em;overflow:hidden}
.ka-id{font-family:ui-monospace,Menlo,monospace;font-size:clamp(11px,3.4vw,14px);letter-spacing:2px;margin-top:5px;color:#E2B55A}
.ka-bawah{position:absolute;left:5%;right:5%;bottom:7%;display:flex;justify-content:space-between;align-items:flex-end;gap:8px}
.ka-lbl{font-size:clamp(7px,2vw,8.5px);letter-spacing:1px;opacity:.6;text-transform:uppercase}
.ka-val{font-size:clamp(9px,2.8vw,12px);font-weight:700;margin-top:1px}
.ka-tali{display:inline-block;width:30px;height:7px;border-radius:2px;vertical-align:middle;margin-right:5px;box-shadow:0 0 0 1px rgba(255,255,255,.25)}
.ka-status{display:inline-block;margin-top:7px;padding:3px 10px;border-radius:20px;font-size:clamp(8px,2.4vw,10px);font-weight:900;letter-spacing:1px;color:#111}
.ka-cop{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%) rotate(-14deg);padding:6px 18px;border:4px solid currentColor;border-radius:10px;
  font-size:clamp(18px,7vw,30px);font-weight:900;letter-spacing:3px;opacity:.85;background:rgba(0,0,0,.35);white-space:nowrap}
.kad-ahli.tak-aktif .ka-nama,.kad-ahli.tak-aktif .ka-id,.kad-ahli.tak-aktif .ka-bawah{filter:grayscale(1);opacity:.55}`;
  document.head.appendChild(st);
})();

function _kaEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function _kaTarikh(t) {
  const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) { const d = new Date(t); if (isNaN(d)) return '—'; return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
  return m[3] + '/' + m[2] + '/' + m[1];
}
function _kaWarnaTali(b) {
  const W = { HITAM: '#1E1E1E', PUTIH: '#F2F2F2', BIRU: '#2F80ED', HIJAU: '#27AE60', KUNING: '#F2C94C', MERAH: '#EB5757' };
  const m = String(b || '').toUpperCase().match(/BENGKUNG\s+(HITAM|PUTIH|BIRU|HIJAU|KUNING|MERAH)/);
  return W[m ? m[1] : ''] || '#888';
}

// a: rekod AHLI (NAMA_PENUH, ID_AHLI, NO_KP, BENGKUNG_SEMASA, KATEGORI, TARIKH_DAFTAR, STATUS)
function htmlKadAhli(a) {
  const s = statusAhliInfo(a.STATUS);
  const aktif = s.label === 'AKTIF';
  const bkg = String(a.BENGKUNG_SEMASA || '—').replace(/^BENGKUNG\s+/i, '');
  const kat = String(a.KATEGORI || '').includes('RENDAH') ? 'Sekolah Rendah' : String(a.KATEGORI || '').includes('MENENGAH') ? 'Sekolah Menengah' : (a.KATEGORI ? 'Dewasa' : '—');
  const logo = new URL('apple-icon.png', location.href).href;
  return `
  <div class="kad-ahli${aktif ? '' : ' tak-aktif'}">
    <div class="ka-atas">
      <img class="ka-logo" src="${logo}" alt="" onerror="this.style.display='none'">
      <div><div class="ka-gel">GELANGGANG SERI MUTIARA</div><div class="ka-sub">SRI GAYONG PANGLIMA ULUNG · KAD AHLI</div></div>
    </div>
    <div class="ka-tengah">
      <div class="ka-nama">${_kaEsc(a.NAMA_PENUH || '—')}</div>
      <div class="ka-id">${_kaEsc(a.ID_AHLI || '—')}</div>
      <div class="ka-status" style="background:${s.warna}">${s.ikon} ${s.label}</div>
    </div>
    <div class="ka-bawah">
      <div><div class="ka-lbl">Bengkung</div><div class="ka-val"><span class="ka-tali" style="background:${_kaWarnaTali(a.BENGKUNG_SEMASA)}"></span>${_kaEsc(bkg)}</div></div>
      <div><div class="ka-lbl">Kategori</div><div class="ka-val">${kat}</div></div>
      <div style="text-align:right"><div class="ka-lbl">Ahli sejak</div><div class="ka-val">${_kaTarikh(a.TARIKH_DAFTAR)}</div></div>
    </div>
    ${aktif ? '' : `<div class="ka-cop" style="color:${s.warna}">${s.label}</div>`}
  </div>`;
}
