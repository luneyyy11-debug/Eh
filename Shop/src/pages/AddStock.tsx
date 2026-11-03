import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { useErrorMessage } from '../i18n/useError'
import { addUnit } from '../services/inventory'
import { generateUniqueBarcode } from '../services/barcode'
import { parseAmount } from '../services/money'
import { Button, Card, Field, ModelImage, PageHeader, Segmented } from '../components/ui'
import { Icon } from '../components/Icon'
import type { Condition, Currency } from '../types'

interface UnitFormState {
  modelId: string
  variantId: string
  ram: string
  storage: string
  colour: string
  region: string
  network: string
  condition: Condition
  batteryHealth: string
  imei1: string
  imei2: string
  serial: string
  supplier: string
  dateReceived: string
  notes: string
  purchaseCost: string
  purchaseCurrency: Currency
  sellingPrice: string
  sellingCurrency: Currency
  exchangeRate: string
  barcode: string
}

const emptyForm = (): UnitFormState => ({
  modelId: '',
  variantId: '',
  ram: '',
  storage: '',
  colour: '',
  region: 'Global',
  network: 'Dual SIM',
  condition: 'new',
  batteryHealth: '',
  imei1: '',
  imei2: '',
  serial: '',
  supplier: '',
  dateReceived: new Date().toISOString().slice(0, 10),
  notes: '',
  purchaseCost: '',
  purchaseCurrency: 'IQD',
  sellingPrice: '',
  sellingCurrency: 'IQD',
  exchangeRate: '1310',
  barcode: ''
})

export default function AddStockPage() {
  const { user } = useApp()
  const { t } = useI18n()
  const error = useErrorMessage()

  const brands = useLiveQuery(() => db.brands.toArray(), [])
  const models = useLiveQuery(() => db.models.toArray(), [])
  const variants = useLiveQuery(() => db.variants.toArray(), [])

  const [step, setStep] = useState(1)
  const [brandId, setBrandId] = useState('')
  const [modelId, setModelId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [customVariant, setCustomVariant] = useState(false)
  const [form, setForm] = useState<UnitFormState>(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const activeBrands = useMemo(() => (brands ?? []).filter((b) => b.active), [brands])
  const brandList = useMemo(() => (brands ?? []).filter((b) => b.id === brandId), [brands, brandId])
  const brand = brandList[0]
  const modelList = useMemo(() => (models ?? []).filter((m) => m.brandId === brandId && m.active), [models, brandId])
  const selectedModel = useMemo(() => (models ?? []).find((m) => m.id === modelId), [models, modelId])
  const modelVariants = useMemo(() => (variants ?? []).filter((v) => v.modelId === modelId && v.active), [variants, modelId])

  const set = <K extends keyof UnitFormState>(key: K, value: UnitFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const pickBrand = (id: string) => {
    setBrandId(id)
    setModelId('')
    setVariantId('')
  }

  const pickModel = (id: string) => {
    setModelId(id)
    setVariantId('')
  }

  const pickVariant = (id: string) => {
    setVariantId(id)
    const variant = modelVariants.find((v) => v.id === id)
    if (variant) {
      setForm((current) => ({
        ...current,
        ram: variant.ram,
        storage: variant.storage,
        colour: variant.colour,
        region: variant.region ?? 'Global'
      }))
    }
  }

  const validateDetails = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.modelId) next.modelId = t('addStock.selectModelFirst')
    if (!form.ram.trim()) next.ram = t('addStock.requiredFields')
    if (!form.storage.trim()) next.storage = t('addStock.requiredFields')
    if (!form.colour.trim()) next.colour = t('addStock.requiredFields')
    if (form.batteryHealth.trim() !== '') {
      const value = Number(form.batteryHealth)
      if (!Number.isFinite(value) || value < 0 || value > 100) next.batteryHealth = t('addStock.batteryInvalid')
    }
    const imei = form.imei1.trim() || form.imei2.trim()
    if (imei && !/^\d{14,17}$/.test(imei)) next.imei1 = t('addStock.imeiInvalid')
    if (form.sellingPrice.trim() !== '' && Number(form.sellingPrice) <= 0) next.sellingPrice = t('addStock.priceInvalid')
    if (form.purchaseCost.trim() !== '' && Number(form.purchaseCost) < 0) next.purchaseCost = t('error.cost_invalid')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async () => {
    if (!user) return
    if (!validateDetails()) return
    setBusy(true)
    try {
      const purchased = parseAmount(form.purchaseCost, form.purchaseCurrency)
      const sold = parseAmount(form.sellingPrice, form.sellingCurrency)
      const unit = await addUnit(
        {
          modelId,
          brandId: brand?.id ?? '',
          variantId: variantId || undefined,
          ram: form.ram,
          storage: form.storage,
          colour: form.colour,
          region: form.region,
          network: form.network,
          condition: form.condition,
          batteryHealth: form.batteryHealth.trim() === '' ? null : Number(form.batteryHealth),
          imei1: form.imei1,
          imei2: form.imei2,
          serial: form.serial,
          supplier: form.supplier,
          dateReceived: form.dateReceived,
          notes: form.notes,
          purchaseCost: purchased,
          purchaseCurrency: form.purchaseCurrency,
          sellingPrice: sold,
          sellingCurrency: form.sellingCurrency,
          exchangeRate: Number(form.exchangeRate) || 0,
          barcode: form.barcode,
          shortId: form.barcode.trim().toUpperCase().replace(/^SHP-/i, '') || undefined
        },
        user
      )
      // addUnit ignores shortId semantics only when absent; keep generated barcode authoritative
      void unit
      const nextBarcode = await generateUniqueBarcode()
      void nextBarcode
      return
    } catch (err) {
      error(err)
      return
    } finally {
      setBusy(false)
    }
  }

  const generateBarcode = async () => {
    const barcode = await generateUniqueBarcode()
    set('barcode', barcode)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={t('addStock.title')}
        subtitle={t('addStock.subtitle')}
        actions={
          <div className="segmented segmented-sm" aria-label={t('addStock.stepOf', { current: step, total: 3 })}>
            <button type="button" className={step === 1 ? 'active' : ''} onClick={() => setStep(1)}>
              {t('addStock.step1')}
            </button>
            <button type="button" className={step === 2 ? 'active' : ''} onClick={() => setStep(2)}>
              {t('addStock.step2')}
            </button>
            <button type="button" className={step === 3 ? 'active' : ''} onClick={() => setStep(3)}>
              {t('addStock.step3')}
            </button>
          </div>
        }
      />

      {step === 1 && (
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="catalogue" size={18} />
              </span>
              <div>
                <h2>{t('addStock.step1')}</h2>
              </div>
            </div>
          </div>
          {!brand ? (
            <div className="grid grid-3">
              {activeBrands.map((b) => (
                <button key={b.id} type="button" className="card pick-card" onClick={() => pickBrand(b.id)}>
                  <span className="pick-swatch" style={{ background: b.color }} />
                  <strong>{b.name}</strong>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="toolbar">
                <button type="button" className="btn btn-secondary" onClick={() => setBrandId('')}>
                  {t('common.back')}
                </button>
                <span className="badge badge-brand">{brand.name}</span>
              </div>
              <div className="grid grid-3">
                {modelList.map((m) => (
                  <button key={m.id} type="button" className={`card model-card ${m.id === modelId ? 'model-card-active' : ''}`} onClick={() => pickModel(m.id)}>
                    <span className="model-card-img">
                      <ModelImage src={m.image} alt={m.name} size="sm" />
                    </span>
                    <strong>{m.name}</strong>
                    {m.specs ? <small>{m.specs}</small> : null}
                  </button>
                ))}
              </div>
              {modelId ? (
                <div style={{ marginTop: 18 }}>
                  <div className="section-header" style={{ margin: '18px 0 12px' }}>
                    <div className="section-title-wrap">
                      <span className="section-icon">
                        <Icon name="box" size={18} />
                      </span>
                      <div>
                        <h2>{t('addStock.chooseVariant')}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="list">
                    {modelVariants.map((v) => (
                      <label key={v.id} className="list-row" style={{ cursor: 'pointer' }}>
                        <input type="radio" name="variant" checked={variantId === v.id} onChange={() => pickVariant(v.id)} />
                        <div className="list-row-main">
                          <div className="list-row-title">
                            {v.ram} / {v.storage} · {v.colour}
                          </div>
                          <div className="list-row-sub">{v.region}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="toolbar" style={{ marginTop: 12 }}>
                    <Button variant="secondary" onClick={() => setCustomVariant((value) => !value)}>
                      {t('addStock.custom')}
                    </Button>
                  </div>
                  {customVariant ? (
                    <div className="grid grid-2">
                      <Field label={t('addStock.ram')}>
                        <input type="text" value={form.ram} onChange={(e) => set('ram', e.target.value)} />
                      </Field>
                      <Field label={t('addStock.storage')}>
                        <input type="text" value={form.storage} onChange={(e) => set('storage', e.target.value)} />
                      </Field>
                      <Field label={t('addStock.colour')}>
                        <input type="text" value={form.colour} onChange={(e) => set('colour', e.target.value)} />
                      </Field>
                      <Field label={t('addStock.region')}>
                        <input type="text" value={form.region} onChange={(e) => set('region', e.target.value)} />
                      </Field>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </Card>
      )}

      {step === 2 && (
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="phone" size={18} />
              </span>
              <div>
                <h2>{t('addStock.step2')}</h2>
              </div>
            </div>
          </div>
          <div className="grid grid-2">
            <Field label={t('addStock.condition')} required>
              <Segmented<Condition>
                value={form.condition}
                onChange={(value) => set('condition', value)}
                ariaLabel={t('addStock.condition')}
                options={[
                  { value: 'new', label: t('addStock.new') },
                  { value: 'used', label: t('addStock.used') },
                  { value: 'refurbished', label: t('addStock.refurbished') }
                ]}
              />
            </Field>
            <Field label={t('addStock.batteryHealth')}>
              <input type="number" min={0} max={100} value={form.batteryHealth} onChange={(e) => set('batteryHealth', e.target.value)} />
              <span className="field-hint">{t('addStock.batteryHint')}</span>
            </Field>
            <Field label={t('addStock.imei1')}>
              <input type="text" inputMode="numeric" value={form.imei1} onChange={(e) => set('imei1', e.target.value)} />
            </Field>
            <Field label={t('addStock.imei2')}>
              <input type="text" inputMode="numeric" value={form.imei2} onChange={(e) => set('imei2', e.target.value)} />
            </Field>
            <Field label={t('addStock.serial')}>
              <input type="text" value={form.serial} onChange={(e) => set('serial', e.target.value)} />
            </Field>
            <Field label={t('addStock.supplier')}>
              <input type="text" value={form.supplier} onChange={(e) => set('supplier', e.target.value)} />
            </Field>
            <Field label={t('addStock.dateReceived')}>
              <input type="date" value={form.dateReceived} onChange={(e) => set('dateReceived', e.target.value)} />
            </Field>
            <Field label={t('addStock.notes')} className="field-span-2">
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>

          <div className="section-header">
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="wallet" size={18} />
              </span>
              <div>
                <h2>{t('addStock.step3')}</h2>
              </div>
            </div>
          </div>
          <div className="grid grid-2">
            <Field label={t('addStock.purchasePrice')}>
              <input type="number" min={0} step="any" value={form.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)} />
            </Field>
            <Field label={t('common.currency')}>
              <select value={form.purchaseCurrency} onChange={(e) => set('purchaseCurrency', e.target.value as Currency)}>
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label={t('addStock.sellingPrice')}>
              <input type="number" min={0} step="any" value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} />
            </Field>
            <Field label={t('common.currency')}>
              <select value={form.sellingCurrency} onChange={(e) => set('sellingCurrency', e.target.value as Currency)}>
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label={t('addStock.exchangeRate')}>
              <input type="number" min={0} step="any" value={form.exchangeRate} onChange={(e) => set('exchangeRate', e.target.value)} />
              <span className="field-hint">{t('addStock.exchangeHint', { value: form.exchangeRate || '—' })}</span>
            </Field>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="barcode" size={18} />
              </span>
              <div>
                <h2>{t('addStock.step3')}</h2>
              </div>
            </div>
          </div>
          <Field label={t('addStock.barcode')} required error={errors.barcode} hint={t('addStock.barcodeHint')}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="text" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="SHP-…" />
              <Button type="button" variant="secondary" icon="refresh" onClick={() => void generateBarcode()}>
                {t('addStock.generateBarcode')}
              </Button>
            </div>
          </Field>

          {form.modelId ? (
            <div className="review-box">
              <div className="section-header" style={{ margin: 0 }}>
                <div className="section-title-wrap">
                  <span className="section-icon">
                    <Icon name="box" size={18} />
                  </span>
                  <div>
                    <h2>{t('addStock.preview')}</h2>
                  </div>
                </div>
              </div>
              <div className="grid grid-2">
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                    {t('stock.model')}
                  </div>
                  <div style={{ fontWeight: 700 }}>{selectedModel?.name ?? form.modelId}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {form.ram} / {form.storage} · {form.colour}
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                    {t('common.total')}
                  </div>
                  <div className="money">{form.sellingPrice ? formatPriceInput(Number(form.sellingPrice), form.sellingCurrency) : '—'}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setStep(2)}>
              {t('addStock.continue')}
            </Button>
            <Button
              onClick={() => {
                void save()
              }}
              loading={busy}
              disabled={!form.barcode.trim()}
            >
              {t('addStock.save')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void save()
              }}
              loading={busy}
              disabled={!form.barcode.trim()}
            >
              {t('addStock.saveAnother')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function formatPriceInput(minor: number, currency: Currency): string {
  const major = minor / (currency === 'USD' ? 100 : 1)
  return currency === 'USD' ? `$${major.toFixed(2)}` : `${major} IQD`
}
