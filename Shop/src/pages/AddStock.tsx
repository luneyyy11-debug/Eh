import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { useErrorMessage } from '../i18n/useError'
import { addUnit } from '../services/inventory'
import { generateUniqueBarcode } from '../services/barcode'
import { parseAmount } from '../services/money'
import { Button, Card, Field, ModelImage, PageHeader, SearchInput, Segmented } from '../components/ui'
import { Icon } from '../components/Icon'
import type { Condition, Currency } from '../types'

interface UnitFormState {
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
  const { user, notify } = useApp()
  const { t } = useI18n()
  const error = useErrorMessage()
  const navigate = useNavigate()

  const brands = useLiveQuery(() => db.brands.toArray(), [])
  const models = useLiveQuery(() => db.models.toArray(), [])
  const variants = useLiveQuery(() => db.variants.toArray(), [])

  const [step, setStep] = useState(1)
  const [brandId, setBrandId] = useState('')
  const [modelId, setModelId] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [variantId, setVariantId] = useState('')
  const [customVariant, setCustomVariant] = useState(false)
  const [savedUnitId, setSavedUnitId] = useState<string | null>(null)
  const [form, setForm] = useState<UnitFormState>(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const activeBrands = useMemo(() => (brands ?? []).filter((b) => b.active), [brands])
  const brandList = useMemo(() => (brands ?? []).filter((b) => b.id === brandId), [brands, brandId])
  const brand = brandList[0]
  const modelList = useMemo(() => (models ?? []).filter((m) => m.brandId === brandId && m.active), [models, brandId])
  const filteredModels = useMemo(() => {
    const query = modelSearch.trim().toLowerCase()
    if (!query) return modelList
    return modelList.filter((model) =>
      [model.name, model.family ?? '', model.specs ?? ''].some((value) => value.toLowerCase().includes(query))
    )
  }, [modelList, modelSearch])
  const selectedModel = useMemo(() => (models ?? []).find((m) => m.id === modelId), [models, modelId])
  const modelVariants = useMemo(() => (variants ?? []).filter((v) => v.modelId === modelId && v.active), [variants, modelId])

  useEffect(() => {
    let cancelled = false
    void generateUniqueBarcode()
      .then((barcode) => {
        if (!cancelled) setForm((current) => current.barcode ? current : { ...current, barcode })
      })
      .catch((err: unknown) => {
        if (!cancelled) notify(error(err), 'error')
      })
    return () => {
      cancelled = true
    }
  }, [error, notify])

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
    setModelSearch('')
    setVariantId('')
    setCustomVariant(false)
    setForm((current) => ({ ...current, ram: '', storage: '', colour: '' }))
  }

  const pickModel = (id: string) => {
    setModelId(id)
    setVariantId('')
    setCustomVariant(!((variants ?? []).some((variant) => variant.modelId === id && variant.active)))
    setForm((current) => ({ ...current, ram: '', storage: '', colour: '', region: 'Global' }))
    setErrors((current) => {
      if (!current.modelId) return current
      const next = { ...current }
      delete next.modelId
      return next
    })
  }

  const pickVariant = (id: string) => {
    setVariantId(id)
    setCustomVariant(false)
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
    if (!modelId) next.modelId = t('addStock.selectModelFirst')
    if (!form.ram.trim()) next.ram = t('addStock.requiredFields')
    if (!form.storage.trim()) next.storage = t('addStock.requiredFields')
    if (!form.colour.trim()) next.colour = t('addStock.requiredFields')
    if (form.batteryHealth.trim() !== '') {
      const value = Number(form.batteryHealth)
      if (!Number.isFinite(value) || value < 0 || value > 100) next.batteryHealth = t('addStock.batteryInvalid')
    }
    if (form.imei1.trim() && !/^\d{14,17}$/.test(form.imei1.trim())) next.imei1 = t('addStock.imeiInvalid')
    if (form.imei2.trim() && !/^\d{14,17}$/.test(form.imei2.trim())) next.imei2 = t('addStock.imeiInvalid')
    if (!form.sellingPrice.trim() || !Number.isFinite(Number(form.sellingPrice)) || Number(form.sellingPrice) <= 0) {
      next.sellingPrice = t('addStock.priceInvalid')
    }
    if (form.purchaseCost.trim() !== '' && (!Number.isFinite(Number(form.purchaseCost)) || Number(form.purchaseCost) < 0)) {
      next.purchaseCost = t('error.cost_invalid')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async (addAnother = false) => {
    if (!user) return
    if (!validateDetails()) {
      if (!modelId || !form.ram.trim() || !form.storage.trim() || !form.colour.trim()) {
        setStep(1)
      } else if (
        (form.batteryHealth.trim() !== '' && (!Number.isFinite(Number(form.batteryHealth)) || Number(form.batteryHealth) < 0 || Number(form.batteryHealth) > 100)) ||
        (form.imei1.trim() !== '' && !/^\d{14,17}$/.test(form.imei1.trim())) ||
        (form.imei2.trim() !== '' && !/^\d{14,17}$/.test(form.imei2.trim())) ||
        (form.purchaseCost.trim() !== '' && (!Number.isFinite(Number(form.purchaseCost)) || Number(form.purchaseCost) < 0))
      ) {
        setStep(2)
      }
      return
    }
    setBusy(true)
    try {
      const nextBarcode = addAnother ? await generateUniqueBarcode() : ''
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
          barcode: form.barcode
        },
        user
      )
      if (addAnother) {
        resetForAnother(nextBarcode)
      } else {
        setSavedUnitId(unit.id)
      }
      notify(t('addStock.savedTitle'))
    } catch (err) {
      notify(error(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const generateBarcode = async () => {
    try {
      const barcode = await generateUniqueBarcode()
      set('barcode', barcode)
    } catch (err) {
      notify(error(err), 'error')
    }
  }

  const resetForAnother = (barcode: string) => {
    setSavedUnitId(null)
    setStep(1)
    setBrandId('')
    setModelId('')
    setModelSearch('')
    setVariantId('')
    setCustomVariant(false)
    setForm({ ...emptyForm(), barcode })
    setErrors({})
  }

  const startAnother = async () => {
    try {
      resetForAnother(await generateUniqueBarcode())
    } catch (err) {
      notify(error(err), 'error')
    }
  }

  if (savedUnitId) {
    return (
      <div className="add-stock-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader title={t('addStock.savedTitle')} />
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="check" size={18} />
              </span>
              <div>
                <h2>{selectedModel?.name ?? t('addStock.savedTitle')}</h2>
                <p className="muted">{t('addStock.savedHint')}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button icon="eye" onClick={() => void navigate(`/stock/${savedUnitId}`)}>
              {t('addStock.viewUnit')}
            </Button>
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => void startAnother()}
            >
              {t('addStock.addAnother')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="add-stock-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
            <>
              {errors.modelId ? <p className="field-message">{errors.modelId}</p> : null}
              <div className="grid grid-3 add-stock-brands">
                {activeBrands.map((b) => (
                  <button key={b.id} type="button" className="card pick-card" onClick={() => pickBrand(b.id)}>
                    <span className="pick-swatch" style={{ background: b.color }} />
                    <strong>{b.name}</strong>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="toolbar">
                <button type="button" className="btn btn-secondary" onClick={() => setBrandId('')}>
                  {t('common.back')}
                </button>
                <span className="badge badge-brand">{brand.name}</span>
              </div>
              <SearchInput
                value={modelSearch}
                onChange={setModelSearch}
                placeholder={t('addStock.searchModels')}
                ariaLabel={t('addStock.searchModels')}
              />
              {errors.modelId && !modelId ? <p className="field-message">{errors.modelId}</p> : null}
              <div className="grid grid-3 add-stock-models">
                {filteredModels.map((m) => (
                  <button key={m.id} type="button" className={`card model-card ${m.id === modelId ? 'model-card-active' : ''}`} onClick={() => pickModel(m.id)}>
                    <span className="model-card-img">
                      <ModelImage src={m.image} alt={m.name} size="sm" />
                    </span>
                    <strong>{m.name}</strong>
                    {m.specs ? <small>{m.specs}</small> : null}
                  </button>
                ))}
              </div>
              {filteredModels.length === 0 ? <p className="muted">{t('addStock.noModels')}</p> : null}
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
                  <div className="list add-stock-variants">
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
                  {modelVariants.length === 0 ? <p className="muted">{t('addStock.noVariantPresets')}</p> : null}
                  <div className="toolbar" style={{ marginTop: 12 }}>
                    <Button variant="secondary" onClick={() => setCustomVariant((value) => !value)}>
                      {t('addStock.custom')}
                    </Button>
                  </div>
                  {customVariant ? (
                    <div className="grid grid-2">
                      <Field label={t('addStock.ram')} required error={errors.ram}>
                        <input type="text" value={form.ram} onChange={(e) => set('ram', e.target.value)} />
                      </Field>
                      <Field label={t('addStock.storage')} required error={errors.storage}>
                        <input type="text" value={form.storage} onChange={(e) => set('storage', e.target.value)} />
                      </Field>
                      <Field label={t('addStock.colour')} required error={errors.colour}>
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
            <Field label={t('addStock.batteryHealth')} error={errors.batteryHealth}>
              <input type="number" min={0} max={100} value={form.batteryHealth} onChange={(e) => set('batteryHealth', e.target.value)} />
              <span className="field-hint">{t('addStock.batteryHint')}</span>
            </Field>
            <Field label={t('addStock.imei1')} error={errors.imei1}>
              <input type="text" inputMode="numeric" value={form.imei1} onChange={(e) => set('imei1', e.target.value)} />
            </Field>
            <Field label={t('addStock.imei2')} error={errors.imei2}>
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
            <Field label={t('addStock.purchasePrice')} error={errors.purchaseCost}>
              <input type="number" min={0} step="any" value={form.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)} />
            </Field>
            <Field label={t('common.currency')}>
              <select value={form.purchaseCurrency} onChange={(e) => set('purchaseCurrency', e.target.value as Currency)}>
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label={t('addStock.sellingPrice')} required error={errors.sellingPrice}>
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
            <div className="add-stock-barcode-input" style={{ display: 'flex', gap: 10 }}>
              <input type="text" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="SHP-…" />
              <Button type="button" variant="secondary" icon="refresh" onClick={() => void generateBarcode()}>
                {t('addStock.generateBarcode')}
              </Button>
            </div>
          </Field>

          {modelId ? (
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
                  <div style={{ fontWeight: 700 }}>{selectedModel?.name ?? modelId}</div>
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

          <div className="add-stock-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setStep(2)}>
              {t('addStock.continue')}
            </Button>
            <Button
              onClick={() => {
                void save(false)
              }}
              loading={busy}
              disabled={!form.barcode.trim()}
            >
              {t('addStock.save')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void save(true)
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
  return currency === 'USD' ? `$${minor.toFixed(2)}` : `${new Intl.NumberFormat('en-US').format(minor)} IQD`
}
