import type { Language } from '../types'

const printStyles = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px;
    font-family: "Segoe UI", system-ui, -apple-system, "Noto Sans Arabic", sans-serif;
    color: #0f172a;
    background: #fff;
  }
  body.rtl { font-family: "Noto Sans Arabic", "Segoe UI", system-ui, sans-serif; }
  .sheet { max-width: 760px; margin: 0 auto; }
  .muted { color: #64748b; }
  .row { display: flex; justify-content: space-between; gap: 16px; }
  h1, h2, h3 { margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: start; padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
  .num { font-variant-numeric: tabular-nums; direction: ltr; unicode-bidi: embed; }
  .barcode { text-align: center; }
  .barcode svg { max-width: 100%; height: auto; }
  .label {
    width: 64mm; border: 1px dashed #94a3b8; border-radius: 8px;
    padding: 4mm; page-break-inside: avoid; display: inline-block; margin: 3mm;
    text-align: center;
  }
  .label .name { font-weight: 700; font-size: 12px; margin-bottom: 2mm; }
  .label .meta { font-size: 10px; color: #475569; }
  .label .id { font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 1px; }
  .header { border-bottom: 3px solid #0f766e; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { color: #0f766e; font-weight: 800; letter-spacing: .5px; }
  .total { font-size: 24px; font-weight: 800; }
  .note { background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 12px; }
  @page { margin: 10mm; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
`

export function printHtml(title: string, innerHtml: string, language: Language): boolean {
  const win = window.open('', '_blank', 'width=880,height=760')
  if (!win) return false
  const rtl = language === 'ckb'
  win.document.open()
  win.document.write(`<!doctype html>
<html lang="${language}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${printStyles}</style>
</head>
<body class="${rtl ? 'rtl' : ''}">
  <div class="sheet">${innerHtml}</div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body>
</html>`)
  win.document.close()
  return true
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatDateTime(iso: string, language: Language): string {
  const locale = language === 'ckb' ? 'ckb-IQ' : 'en-GB'
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toLocaleString('en-GB')
  }
}
