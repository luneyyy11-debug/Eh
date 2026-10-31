import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { Button, Field, Segmented } from '../components/ui'
import { Icon } from '../components/Icon'
import type { Language, Role } from '../types'

const ROLE_IDS: Record<Role, string> = { owner: 'owner', cashier: 'cashier' }

export default function LoginPage() {
  const { login } = useApp()
  const { t, language, setLanguage } = useI18n()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('owner')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await login(ROLE_IDS[role], pin)
    setBusy(false)
    if (result.ok) {
      navigate('/', { replace: true })
      return
    }
    setError(result.reason === 'wrong_pin' ? t('auth.wrongPin') : result.reason === 'inactive' ? t('auth.inactive') : t('auth.pinPlaceholder'))
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <Icon name="phone" size={30} />
          </span>
          <h1>{t('app.name')}</h1>
          <p>{t('auth.subtitle')}</p>
        </div>

        <Segmented<Language>
          value={language}
          onChange={setLanguage}
          ariaLabel={t('common.language')}
          options={[
            { value: 'en', label: t('common.english') },
            { value: 'ckb', label: t('common.sorani') }
          ]}
        />

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t('auth.chooseRole')}>
            <Segmented<Role>
              value={role}
              onChange={setRole}
              ariaLabel={t('auth.chooseRole')}
              options={[
                { value: 'owner', label: t('auth.owner') },
                { value: 'cashier', label: t('auth.cashier') }
              ]}
            />
          </Field>

          <Field label={t('auth.pin')} required error={error ?? undefined}>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('auth.pinPlaceholder')}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
            />
          </Field>

          <Button type="submit" size="lg" full loading={busy}>
            {t('auth.signIn')}
          </Button>
        </form>

        <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
          {t('auth.hint')}
        </p>
      </div>
    </div>
  )
}
