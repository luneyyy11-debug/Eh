import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { uuid } from '../services/id'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { Badge, Button, Card, EmptyState, Field, FieldRow, PageHeader, SearchInput, Toggle } from '../components/ui'
import type { Brand, PhoneModel, Variant } from '../types'

export default function CataloguePage() {
  const { t } = useI18n()
  const { notify } = useApp()
  const brands = useLiveQuery(() => db.brands.toArray(), [])
  const models = useLiveQuery(() => db.models.toArray(), [])
  const variants = useLiveQuery(() => db.variants.toArray(), [])

  const brandList = useMemo(() => brands ?? [], [brands])
  const modelList = useMemo(() => models ?? [], [models])
  const variantList = useMemo(() => variants ?? [], [variants])

  const [query, setQuery] = useState('')
  const [brandId, setBrandId] = useState('')

  const [editingBrandId, setEditingBrandId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')
  const [brandColor, setBrandColor] = useState('#0b1f3a')

  const [editingModelId, setEditingModelId] = useState<string | null>(null)
  const [modelFormOpen, setModelFormOpen] = useState(false)
  const [modelBrandId, setModelBrandId] = useState('')
  const [modelName, setModelName] = useState('')
  const [modelFamily, setModelFamily] = useState('')
  const [modelSpecs, setModelSpecs] = useState('')
  const [modelActive, setModelActive] = useState(true)

  const [variantModelId, setVariantModelId] = useState('')
  const [variantRam, setVariantRam] = useState('')
  const [variantStorage, setVariantStorage] = useState('')
  const [variantColour, setVariantColour] = useState('')
  const [variantRegion, setVariantRegion] = useState('')

  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return brandList
    return brandList.filter((b) => b.name.toLowerCase().includes(q))
  }, [brandList, query])

  const selectedBrand = brandId ? brandList.find((b) => b.id === brandId) ?? null : null
  const selectedModels = useMemo(
    () => (selectedBrand ? modelList.filter((m) => m.brandId === selectedBrand.id) : []),
    [modelList, selectedBrand]
  )

  const startEditBrand = (brand: Brand) => {
    setEditingBrandId(brand.id)
    setBrandName(brand.name)
    setBrandColor(brand.color)
  }

  const saveBrand = async () => {
    const name = brandName.trim()
    if (!name) {
      notify(t('catalogue.brandRequired'))
      return
    }
    if (editingBrandId) {
      const existing = brandList.find((b) => b.id === editingBrandId)
      if (existing) {
        await db.brands.put({ ...existing, name, color: brandColor })
        notify(t('catalogue.saved'))
        setEditingBrandId(null)
        setBrandName('')
        setBrandColor('#0b1f3a')
        return
      }
    }
    await db.brands.put({ id: uuid(), name, color: brandColor, sort: brandList.length, active: true })
    notify(t('catalogue.brandAdded'))
    setEditingBrandId(null)
    setBrandName('')
    setBrandColor('#0b1f3a')
  }

  const toggleBrand = async (brand: Brand) => {
    await db.brands.put({ ...brand, active: !brand.active })
  }

  const startEditModel = (model: PhoneModel) => {
    setEditingModelId(model.id)
    setModelFormOpen(true)
    setModelBrandId(model.brandId)
    setModelName(model.name)
    setModelFamily(model.family ?? '')
    setModelSpecs(model.specs ?? '')
    setModelActive(model.active)
  }

  const saveModel = async () => {
    const name = modelName.trim()
    if (!name) {
      notify(t('catalogue.modelRequired'))
      return
    }
    const brand = modelBrandId ? brandList.find((b) => b.id === modelBrandId) : null
    if (!brand) {
      notify(t('catalogue.brandRequired'))
      return
    }
    if (editingModelId) {
      const existing = modelList.find((m) => m.id === editingModelId)
      if (existing) {
        await db.models.put({ ...existing, brandId: brand.id, name, family: modelFamily.trim(), specs: modelSpecs.trim(), active: modelActive })
        notify(t('catalogue.saved'))
        setEditingModelId(null)
        setModelFormOpen(false)
        setModelName('')
        setModelFamily('')
        setModelSpecs('')
        setModelActive(true)
        setModelBrandId('')
        return
      }
    }
    await db.models.put({ id: uuid(), brandId: brand.id, name, family: modelFamily.trim(), specs: modelSpecs.trim(), image: '/catalog/placeholder.svg', active: true, createdAt: new Date().toISOString() })
    notify(t('catalogue.modelAdded'))
    setEditingModelId(null)
    setModelFormOpen(false)
    setModelName('')
    setModelFamily('')
    setModelSpecs('')
    setModelActive(true)
    setModelBrandId('')
  }

  const toggleModel = async (model: PhoneModel) => {
    await db.models.put({ ...model, active: !model.active })
  }

  const addVariant = async () => {
    if (!variantModelId) {
      notify(t('catalogue.brandRequired'))
      return
    }
    const model = modelList.find((m) => m.id === variantModelId)
    if (!model) return
    const ram = variantRam.trim()
    const storage = variantStorage.trim()
    const colour = variantColour.trim()
    if (!ram || !storage) {
      notify(t('catalogue.nameRequired'))
      return
    }
    const clash = variantList.some((v) => v.modelId === variantModelId && v.ram === ram && v.storage === storage && v.colour === colour)
    if (clash) {
      notify(t('catalogue.modelNameExists'))
      return
    }
    const variant: Variant = { id: uuid(), modelId: variantModelId, ram, storage, colour, region: variantRegion.trim(), active: true }
    await db.variants.put(variant)
    notify(t('catalogue.variantAdded'))
    setVariantRam('')
    setVariantStorage('')
    setVariantColour('')
    setVariantRegion('')
    setVariantModelId('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={t('catalogue.title')}
        subtitle={t('catalogue.subtitle')}
        actions={
          <Button
            icon="plus"
            onClick={() => {
              setEditingBrandId(null)
              setBrandName('')
              setBrandColor('#0b1f3a')
            }}
          >
            {t('catalogue.addBrand')}
          </Button>
        }
      />

      {editingBrandId ? (
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <div>
                <h2>{t('catalogue.editBrand')}</h2>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label={t('catalogue.brandName')}>
              <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            </Field>
            <Field label={t('catalogue.brandColor')}>
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
            </Field>
            <div>
              <Button icon="check" onClick={() => void saveBrand()}>
                {t('catalogue.save')}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {modelFormOpen ? (
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <div>
                <h2>{t(editingModelId ? 'catalogue.editModel' : 'catalogue.addModel')}</h2>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label={t('catalogue.brands')}>
              <select value={modelBrandId} onChange={(e) => setModelBrandId(e.target.value)}>
                <option value="">{t('catalogue.selectBrand')}</option>
                {brandList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('catalogue.modelName')}>
              <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} />
            </Field>
            <Field label={t('catalogue.family')}>
              <input type="text" value={modelFamily} onChange={(e) => setModelFamily(e.target.value)} />
            </Field>
            <Field label={t('catalogue.specs')}>
              <input type="text" value={modelSpecs} onChange={(e) => setModelSpecs(e.target.value)} />
            </Field>
            <Field label={t('catalogue.active')}>
              <Toggle checked={modelActive} onChange={setModelActive} label={t('catalogue.statusActive')} />
            </Field>
            <div>
              <Button icon="check" onClick={() => void saveModel()}>{t('catalogue.save')}</Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder={t('catalogue.search')} ariaLabel={t('catalogue.search')} />
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} style={{ width: 'auto' }} aria-label={t('catalogue.brands')}>
            <option value="">{t('catalogue.allBrands')}</option>
            {brandList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {filteredBrands.length === 0 ? (
          <EmptyState icon="catalogue" title={t('catalogue.noBrands')} text={t('catalogue.noModelsHint')} />
        ) : (
          <div className="list" style={{ marginTop: 14 }}>
            {filteredBrands.map((brand) => (
              <div className="list-row" key={brand.id}>
                <div className="list-row-main">
                  <div className="list-row-title">{brand.name}</div>
                  <div className="list-row-sub">
                    {t('catalogue.modelCount', { count: modelList.filter((m) => m.brandId === brand.id).length })} · {t('catalogue.stockCount', { count: variantList.filter((v) => modelList.some((m) => m.id === v.modelId && m.brandId === brand.id)).length })}
                  </div>
                </div>
                <Badge tone={brand.active ? 'success' : 'neutral'}>{t(brand.active ? 'catalogue.statusActive' : 'catalogue.statusHidden')}</Badge>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" size="sm" icon="plus" onClick={() => { setEditingModelId(null); setModelFormOpen(true); setModelBrandId(brand.id); setModelName(''); setModelFamily(''); setModelSpecs(''); setModelActive(true); }}>
                    {t('catalogue.addModel')}
                  </Button>
                  <Button variant="ghost" size="sm" icon="edit" onClick={() => startEditBrand(brand)}>
                    {t('catalogue.editBrand')}
                  </Button>
                  <Button variant="ghost" size="sm" icon="eye" onClick={() => void toggleBrand(brand)}>
                    {t(brand.active ? 'catalogue.hide' : 'catalogue.show')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedBrand ? (
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <div>
                <h2>{selectedBrand.name}</h2>
              </div>
            </div>
          </div>
          {selectedModels.length === 0 ? (
            <EmptyState icon="catalogue" title={t('catalogue.noModels')} text={t('catalogue.noModelsHint')} />
          ) : (
            <div className="list">
              {selectedModels.map((model) => (
                <div className="list-row" key={model.id}>
                  <div className="list-row-main">
                    <div className="list-row-title">{model.name}</div>
                    <div className="list-row-sub">{model.family || '—'}</div>
                  </div>
                  <Badge tone={model.active ? 'success' : 'neutral'}>{t(model.active ? 'catalogue.statusActive' : 'catalogue.statusHidden')}</Badge>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" size="sm" icon="plus" onClick={() => { setVariantModelId(model.id); setVariantRam(''); setVariantStorage(''); setVariantColour(''); setVariantRegion(''); }}>
                      {t('catalogue.addVariant')}
                    </Button>
                    <Button variant="ghost" size="sm" icon="edit" onClick={() => startEditModel(model)}>
                      {t('catalogue.editModel')}
                    </Button>
                    <Button variant="ghost" size="sm" icon="eye" onClick={() => void toggleModel(model)}>
                      {t(model.active ? 'catalogue.hide' : 'catalogue.show')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      <Card>
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title-wrap">
            <div>
              <h2>{t('catalogue.variantPresets')}</h2>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t('catalogue.selectBrand')}>
            <select value={variantModelId} onChange={(e) => setVariantModelId(e.target.value)}>
              <option value="">{t('catalogue.selectBrand')}</option>
              {selectedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <FieldRow>
            <Field label={t('catalogue.ram')}>
              <input type="text" value={variantRam} onChange={(e) => setVariantRam(e.target.value)} />
            </Field>
            <Field label={t('catalogue.storage')}>
              <input type="text" value={variantStorage} onChange={(e) => setVariantStorage(e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label={t('catalogue.colour')}>
              <input type="text" value={variantColour} onChange={(e) => setVariantColour(e.target.value)} />
            </Field>
            <Field label={t('catalogue.region')}>
              <input type="text" value={variantRegion} onChange={(e) => setVariantRegion(e.target.value)} />
            </Field>
          </FieldRow>
          <div>
            <Button icon="plus" onClick={() => void addVariant()}>
              {t('catalogue.addVariant')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
