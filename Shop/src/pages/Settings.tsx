import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { buildBackup, restoreBackup } from '../services/backup'
import { downloadJson } from '../services/csv'
import { resetDemoData } from '../db/seed'
import { Button, Card, ConfirmDialog, Field, FieldRow, PageHeader } from '../components/ui'
import type { Currency, Language } from '../types'

export default function SettingsPage() {
  const { t, setLanguage } = useI18n()
  const { settings, updateSettings, notify } = useApp()
  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [language, setLanguageState] = useState<Language>('en')
  const [exchangeRate, setExchangeRate] = useState('1310')
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>('IQD')
  const [receiptPrefix, setReceiptPrefix] = useState('INV')
  const [resetOpen, setResetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!settings) return
    setShopName(settings.shopName)
    setShopPhone(settings.shopPhone)
    setShopAddress(settings.shopAddress)
    setLanguageState(settings.language)
    setExchangeRate(String(settings.exchangeRate))
    setDefaultCurrency(settings.defaultCurrency)
    setReceiptPrefix(settings.receiptPrefix)
  }, [settings])

  const saveShopInfo = async () => {
    if (!settings) return
    setBusy(true)
    try {
      await updateSettings({
        shopName: shopName.trim() || settings.shopName,
        shopPhone: shopPhone.trim(),
        shopAddress: shopAddress.trim()
      })
      notify(t('settings.saved'))
    } finally {
      setBusy(false)
    }
  }

  const savePreferences = async () => {
    if (!settings) return
    setBusy(true)
    try {
      await updateSettings({
        language,
        exchangeRate: Number(exchangeRate) || settings.exchangeRate,
        defaultCurrency,
        receiptPrefix: receiptPrefix.trim() || settings.receiptPrefix
      })
      notify(t('settings.saved'))
    } finally {
      setBusy(false)
    }
  }

  const doBackup = async () => {
    setBusy(true)
    try {
      const backup = await buildBackup()
      downloadJson('dukan-backup.json', backup)
      notify(t('settings.backupReady'))
    } finally {
      setBusy(false)
    }
  }

  const doRestore = async (file: File) => {
    setBusy(true)
    try {
      const text = await file.text()
      const summary = await restoreBackup(text)
      notify(t('settings.restoreSuccess', { units: summary.units, sales: summary.sales }))
      
    } catch {
      notify(t('settings.restoreError'))
    } finally {
      setBusy(false)
    }
  }

  const doReset = async () => {
    setBusy(true)
    try {
      await resetDemoData()
      notify(t('settings.resetSuccess'))
      setResetOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Card>
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title-wrap">
            <div>
              <h2>{t('settings.shopInfo')}</h2>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t('settings.shopName')}>
            <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} />
          </Field>
          <Field label={t('settings.shopPhone')}>
            <input type="text" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} />
          </Field>
          <Field label={t('settings.shopAddress')}>
            <input type="text" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} />
          </Field>
          <div>
            <Button icon="check" onClick={() => void saveShopInfo()} loading={busy}>
              {t('settings.save')}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title-wrap">
            <div>
              <h2>{t('settings.preferences')}</h2>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t('settings.language')}>
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
              <option value="en">{t('common.english')}</option>
              <option value="ckb">{t('common.sorani')}</option>
            </select>
          </Field>
          <Field label={t('settings.exchangeRate')} hint={t('settings.exchangeHint')}>
            <input type="number" min={0} step="any" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
          </Field>
          <FieldRow>
            <Field label={t('settings.defaultCurrency')}>
              <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value as Currency)}>
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label={t('settings.receiptPrefix')}>
              <input type="text" value={receiptPrefix} onChange={(e) => setReceiptPrefix(e.target.value)} />
            </Field>
          </FieldRow>
          <div>
            <Button icon="check" onClick={() => void savePreferences()} loading={busy}>
              {t('settings.save')}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title-wrap">
            <div>
              <h2>{t('settings.data')}</h2>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Button icon="download" variant="secondary" onClick={() => void doBackup()} loading={busy}>
              {t('settings.backup')}
            </Button>
            <p className="muted" style={{ marginBottom: 0 }}>
              {t('settings.backupHint')}
            </p>
          </div>
          <Field label={t('settings.restore')}>
            <input type="file" accept="application/json" onChange={(e) => { const file = e.target.files?.[0]; if (file) void doRestore(file); e.target.value = '' }} />
          </Field>
          <p className="muted" style={{ margin: 0 }}>
            {t('settings.restoreHint')}
          </p>
        </div>
      </Card>

      <Card>
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title-wrap">
            <div>
              <h2>{t('settings.device')}</h2>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('settings.deviceId')}
            </div>
            <div>{settings?.deviceId ?? '—'}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('settings.syncMode')}
            </div>
            <div>{settings?.syncMode === 'cloud' ? t('settings.cloudMode') : t('settings.localMode')}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('settings.lastSync')}
            </div>
            <div>{settings?.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString() : t('common.never')}</div>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => void doReset()}
        title={t('settings.resetConfirm')}
        message={t('settings.resetHint')}
        confirmLabel={t('settings.resetDemo')}
        danger
        loading={busy}
      />

      <div>
        <Button icon="refresh" variant="danger" onClick={() => setResetOpen(true)} loading={busy}>
          {t('settings.resetDemo')}
        </Button>
      </div>
    </div>
  )
}
