import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import JsBarcode from 'jsbarcode'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import type { Currency, SyncStatus, UnitStatus } from '../types'
import { formatMoney } from '../services/money'
import { Icon, type IconName } from './Icon'

/* ------------------------------------------------------------------ Buttons */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  loading?: boolean
  full?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  full,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${full ? 'btn-full' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 18} /> : icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  )
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn-${variant} icon-btn-${size} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 19} />
    </button>
  )
}

/* ------------------------------------------------------------------ Layout */

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  )
}

export function SectionHeader({
  title,
  subtitle,
  actions,
  icon
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  icon?: IconName
}) {
  return (
    <div className="section-header">
      <div className="section-title-wrap">
        {icon ? (
          <span className="section-icon">
            <Icon name={icon} size={18} />
          </span>
        ) : null}
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  className = ''
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: IconName
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet'
  className?: string
}) {
  return (
    <div className={`stat-card stat-${tone} ${className}`.trim()}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon ? (
          <span className="stat-icon">
            <Icon name={icon} size={19} />
          </span>
        ) : null}
      </div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  )
}

export function PageLoading({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div className="page-loading">
      <Spinner size={28} />
      <span>{label ?? t('common.loading')}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ Feedback */

export function Spinner({ size = 18 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
}

export function EmptyState({
  icon = 'package',
  title,
  text,
  action,
  compact
}: {
  icon?: IconName
  title: string
  text?: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`empty-state ${compact ? 'empty-compact' : ''}`.trim()}>
      <span className="empty-icon">
        <Icon name={icon} size={compact ? 24 : 30} />
      </span>
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  )
}

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'violet'

export function Badge({ children, tone = 'neutral', dot }: { children: ReactNode; tone?: BadgeTone; dot?: boolean }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot ? <span className="badge-dot" /> : null}
      {children}
    </span>
  )
}

const unitTone: Record<UnitStatus, BadgeTone> = {
  in_stock: 'success',
  sold: 'neutral',
  returned: 'warning',
  repair: 'info',
  reserved: 'violet',
  written_off: 'danger'
}

export function StatusBadge({ status }: { status: UnitStatus }) {
  const { t } = useI18n()
  return (
    <Badge tone={unitTone[status]} dot>
      {t(`status.${status}`)}
    </Badge>
  )
}

const syncTone: Record<SyncStatus, BadgeTone> = {
  local: 'neutral',
  pending: 'warning',
  synced: 'success',
  failed: 'danger',
  conflict: 'danger'
}

export function SyncBadge({ status }: { status: SyncStatus }) {
  const { t } = useI18n()
  return (
    <Badge tone={syncTone[status]}>
      <Icon name={status === 'conflict' ? 'alert' : status === 'synced' ? 'checkCircle' : status === 'failed' ? 'xCircle' : 'database'} size={12} />
      {t(`syncStatus.${status}`)}
    </Badge>
  )
}

/* ------------------------------------------------------------------ Forms */

export function Field({
  label,
  hint,
  error,
  children,
  required,
  className = ''
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <label className={`field ${error ? 'field-error' : ''} ${className}`.trim()}>
      <span className="field-label">
        {label}
        {required ? <em className="req">*</em> : null}
      </span>
      {children}
      {error ? <span className="field-message">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

export function FieldRow({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`field-row field-row-${cols}`}>{children}</div>
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  autoFocus,
  className = ''
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel?: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <div className={`search-input ${className}`.trim()}>
      <Icon name="search" size={18} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoFocus={autoFocus}
      />
      {value ? (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="search-clear">
          <Icon name="x" size={15} />
        </button>
      ) : null}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="toggle-wrap">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">{label}</span>
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md'
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  ariaLabel?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div className={`segmented segmented-${size}`} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={option.value === value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Modal */

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <IconButton icon="x" label={t('common.close')} onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger,
  children,
  loading
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string
  confirmLabel: string
  danger?: boolean
  children?: ReactNode
  loading?: boolean
}) {
  const { t } = useI18n()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message ? <p className="modal-message">{message}</p> : null}
      {children}
    </Modal>
  )
}

/* ------------------------------------------------------------------ Data display */

export function Money({ value, currency, className = '' }: { value: number; currency: Currency; className?: string }) {
  return <span className={`money ${className}`.trim()}>{formatMoney(value, currency)}</span>
}

export function ModelImage({
  src,
  alt,
  className = '',
  size = 'md'
}: {
  src?: string
  alt: string
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`model-image model-image-${size} ${className}`.trim()}>
      <img
        src={failed || !src ? '/catalog/placeholder.svg' : src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

export function Barcode({
  value,
  height = 54,
  width = 1.6,
  displayValue = true,
  fontSize = 13,
  className = ''
}: {
  value: string
  height?: number
  width?: number
  displayValue?: boolean
  fontSize?: number
  className?: string
}) {
  const ref = useRef<SVGSVGElement | null>(null)
  useEffect(() => {
    if (!ref.current) return
    try {
      JsBarcode(ref.current, value || 'EMPTY', {
        format: 'CODE128',
        width,
        height,
        displayValue,
        font: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize,
        margin: 4,
        lineColor: '#0b1f3a',
        background: '#ffffff'
      })
    } catch {
      // Keep the empty SVG if the value is not encodable
    }
  }, [value, height, width, displayValue, fontSize])
  return <svg ref={ref} className={`barcode-svg ${className}`.trim()} />
}

export function Avatar({ name, role }: { name: string; role?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return (
    <span className="avatar">
      <span className="avatar-initials">{initials || 'U'}</span>
      {role ? <span className="avatar-role">{role}</span> : null}
    </span>
  )
}

/* ------------------------------------------------------------------ Toasts */

const toastIcon: Record<string, IconName> = {
  success: 'checkCircle',
  error: 'xCircle',
  warning: 'alert',
  info: 'info'
}

export function ToastViewport() {
  const { toasts, dismissToast } = useApp()
  return createPortal(
    <div className="toast-viewport" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <Icon name={toastIcon[toast.tone]} size={19} />
          <span>{toast.message}</span>
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ Misc */

const ConfirmContext = createContext<((message: string, title?: string) => Promise<boolean>) | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used inside ConfirmProvider')
  return context
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [request, setRequest] = useState<{ message: string; title: string; resolve: (value: boolean) => void } | null>(null)
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')

  const confirm = (nextMessage: string, nextTitle?: string) =>
    new Promise<boolean>((resolve) => {
      setMessage(nextMessage)
      setTitle(nextTitle ?? t('common.confirm'))
      setRequest({ message: nextMessage, title: nextTitle ?? t('common.confirm'), resolve })
    })

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={Boolean(request)}
        onClose={() => {
          request?.resolve(false)
          setRequest(null)
        }}
        onConfirm={() => {
          request?.resolve(true)
          setRequest(null)
        }}
        title={request?.title ?? title}
        message={request?.message ?? message}
        confirmLabel={t('common.confirm')}
        danger
      />
    </ConfirmContext.Provider>
  )
}
