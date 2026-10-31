import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { useErrorMessage } from '../i18n/useError'
import { findUnitByCode } from '../services/barcode'
import { sellUnit } from '../services/inventory'
import { formatMoney } from '../services/money'
import { Button, Card, Field, PageHeader, StatusBadge } from '../components/ui'
import { Icon } from '../components/Icon'
import type { Currency, InventoryUnit, PaymentMethod } from '../types'

export default function SellPhonePage() {
  const { t } = useI18n()
  const { user } = useApp()
  const error = useErrorMessage()
  const navigate = useNavigate()

  const [scan, setScan] = useState('')
  const [found, setFound] = useState<InventoryUnit | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [salePrice, setSalePrice] = useState('')
  const [currency, setCurrency] = useState<Currency>('IQD')
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const doLookup = async () => {
    const value = scan.trim()
    if (!value) return
    const unit = await findUnitByCode(value)
    if (unit) {
      setFound(unit)
      setLookupError(null)
      setSalePrice((unit.sellingPrice / (unit.sellingCurrency === 'USD' ? 100 : 1)).toFixed(currency === 'USD' ? 2 : 0))
    } else {
      setFound(null)
      setLookupError(t('sell.unknown'))
    }
  }

  const submitSale = async () => {
    if (!found || !user) return
    const price = Number(salePrice)
    const discountValue = Number(discount || 0)
    if (!Number.isFinite(price) || price <= 0) {
      error(new Error(t('sell.priceInvalid')))
      return
    }
    if (discountValue < 0 || discountValue >= price) {
      error(new Error(t('sell.discountInvalid')))
      return
    }
    setBusy(true)
    try {
      const sale = await sellUnit(
        {
          unitId: found.id,
          salePrice: Math.round(price * (currency === 'USD' ? 100 : 1)),
          discount: Math.round(discountValue * (currency === 'USD' ? 100 : 1)),
          currency,
          exchangeRate: 1310,
          paymentMethod,
          customerName,
          customerPhone,
          note
        },
        user
      )
      navigate(`/sales/${sale.id}`)
    } catch (err) {
      error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title={t('sell.title')} subtitle={t('sell.subtitle')} />

      <Card>
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title-wrap">
            <span className="section-icon">
              <Icon name="scan" size={18} />
            </span>
            <div>
              <h2>{t('sell.scanTitle')}</h2>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={scan}
            onChange={(e) => setScan(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void doLookup()
            }}
            placeholder={t('sell.scanPlaceholder')}
            autoFocus
          />
          <Button onClick={() => void doLookup()} icon="scan">
            {t('sell.lookup')}
          </Button>
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          {t('sell.scanHint')}
        </p>
        {lookupError ? <p style={{ color: 'var(--danger)', fontWeight: 700 }}>{lookupError}</p> : null}
      </Card>

      {found ? (
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="checkCircle" size={18} />
              </span>
              <div>
                <h2>{t('sell.found')}</h2>
              </div>
            </div>
            <StatusBadge status={found.status} />
          </div>
          <div className="grid grid-2">
            <div>
              <div style={{ fontWeight: 800 }}>{found.shortId}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {found.ram} / {found.storage} · {found.colour}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {t('sell.battery')}: {found.batteryHealth == null ? '—' : `${found.batteryHealth}%`}
              </div>
            </div>
            <div>
              <div className="money" style={{ fontSize: 22 }}>
                {formatMoney(found.sellingPrice, found.sellingCurrency)}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>{t('sell.price')}</div>
            </div>
          </div>
          {found.status !== 'in_stock' ? (
            <p style={{ color: 'var(--danger)', fontWeight: 700 }}>{t('sell.notInStock')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid grid-2">
                <Field label={t('sell.salePrice')} required>
                  <input type="number" min={0} step="any" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
                </Field>
                <Field label={t('sell.currency')}>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                    <option value="IQD">IQD</option>
                    <option value="USD">USD</option>
                  </select>
                </Field>
                <Field label={t('sell.discount')}>
                  <input type="number" min={0} step="any" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </Field>
                <Field label={t('sell.payment')}>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank / card</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label={t('sell.customerName')}>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </Field>
                <Field label={t('sell.customerPhone')}>
                  <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </Field>
              </div>
              <div>
                <Field label={t('sell.note')}>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button onClick={() => void submitSale()} loading={busy} icon="checkCircle">
                  {t('sell.completeSale')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  )
}
