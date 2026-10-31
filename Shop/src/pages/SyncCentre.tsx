import { useEffect, useState } from 'react'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { syncNow, syncSummary, type SyncSummary } from '../services/sync'
import { Badge, Button, Card, PageHeader, SyncBadge } from '../components/ui'
import type { SyncOperation } from '../types'

export default function SyncCentrePage() {
  const { t } = useI18n()
  const { online, notify } = useApp()
  const [summary, setSummary] = useState<SyncSummary | null>(null)
  const [ops, setOps] = useState<SyncOperation[]>([])

  const refresh = async () => {
    setSummary(await syncSummary())
    setOps(await db.syncOps.toArray())
  }

  useEffect(() => {
    void refresh()
  }, [])

  const doSync = async () => {
    const result = await syncNow()
    await refresh()
    notify(result.ok ? t('common.saved') : t('settings.localMode'), result.ok ? 'success' : 'info')
  }

  const badgeStatus = summary?.failed
    ? 'failed'
    : summary?.conflict
      ? 'conflict'
      : summary?.pending
        ? 'pending'
        : summary?.synced
          ? 'synced'
          : 'local'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={t('nav.sync')}
        subtitle={t('settings.subtitle')}
        actions={
          <Button icon="refresh" onClick={() => void doSync()}>
            {t('common.syncNow')}
          </Button>
        }
      />

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800 }}>{t('settings.syncNote')}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {t('settings.cloudNote')}
              </div>
            </div>
            <SyncBadge status={badgeStatus} />
          </div>
          <div className="grid grid-2">
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {t('settings.syncMode')}
              </div>
              <div>{t(`settings.${summary?.mode ?? 'local'}` as never)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {t('settings.lastSync')}
              </div>
              <div>{summary?.lastSyncAt ? new Date(summary.lastSyncAt).toLocaleString() : t('common.never')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className={`conn ${online ? 'conn-on' : 'conn-off'}`}>
              <span className="conn-dot" />
            </span>
            <span>{online ? t('common.online') : t('common.offline')}</span>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>{t('settings.data')}</div>
        <p className="muted" style={{ marginTop: 0 }}>
          {t('settings.backupHint')}
        </p>
        {ops.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            {t('settings.lastSync')}
          </p>
        ) : (
          <div className="list">
            {ops.map((op) => (
              <div className="list-row" key={op.id}>
                <div className="list-row-main">
                  <div className="list-row-title">{op.action}</div>
                  <div className="list-row-sub">{op.entityId}</div>
                </div>
                <Badge tone={op.status === 'failed' || op.status === 'conflict' ? 'danger' : op.status === 'pending' ? 'warning' : 'success'}>
                  {t(`syncStatus.${op.status}` as never)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
