import { motion } from 'framer-motion'
import * as Switch from '@radix-ui/react-switch'
import * as Slider from '@radix-ui/react-slider'
import * as Select from '@radix-ui/react-select'
import { useState, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Tooltip } from '../components/ui/Tooltip'
import { Input } from '../components/ui/Input'
import { useAppStore, type AccentColor } from '../store/app.store'
import { auth } from '../lib/firebase'
import { updateOwnDisplayName, changeOwnPassword } from '../lib/users'
import {
  Palette,
  Bell,
  Shield,
  Settings as SettingsIcon,
  ChevronDown,
  Check,
  AlertTriangle,
  RotateCcw,
  Sun,
  Moon,
  User,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react'

function mapChangePasswordError(err: unknown): string {
  const code = err instanceof Error && 'code' in err ? String((err as { code: string }).code) : ''
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Current password is incorrect.'
    case 'auth/weak-password':
      return 'New password must be at least 6 characters.'
    case 'auth/requires-recent-login':
      return 'Please sign out and sign in again, then retry.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return 'Could not change password. Please try again.'
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

/* ── Setting Row ────────────────────────────────────────────── */
interface SettingRowProps {
  label: string
  description?: string
  children: ReactNode
  badge?: string
}

function SettingRow({ label, description, children, badge }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '14px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: description ? '3px' : 0
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {label}
          </span>
          {badge && (
            <Badge variant="primary" style={{ fontSize: '9px' }}>
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

/* ── Section Header ─────────────────────────────────────────── */
interface SectionHeaderProps {
  icon: ReactNode
  title: string
  description?: string
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      <div>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '2px'
          }}
        >
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</p>
        )}
      </div>
    </div>
  )
}

/* ── Styled Switch ──────────────────────────────────────────── */
interface StyledSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
}

function StyledSwitch({ checked, onCheckedChange, id }: StyledSwitchProps) {
  return (
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: '22px',
        width: '40px',
        cursor: 'pointer',
        borderRadius: '999px',
        border: `1px solid ${checked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
        background: checked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        outline: 'none',
        boxShadow: checked ? '0 0 12px var(--accent-primary-glow)' : 'none'
      }}
    >
      <Switch.Thumb
        style={{
          display: 'block',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          transition: 'transform 0.2s ease',
          transform: checked ? 'translateX(20px)' : 'translateX(2px)',
          willChange: 'transform',
          marginTop: '2px'
        }}
      />
    </Switch.Root>
  )
}

/* ── Accent Color Picker ────────────────────────────────────── */
const accentOptions: { value: AccentColor; color: string; label: string }[] = [
  { value: 'indigo', color: '#6366f1', label: 'Indigo' },
  { value: 'cyan', color: '#06b6d4', label: 'Cyan' },
  { value: 'emerald', color: '#10b981', label: 'Emerald' },
  { value: 'rose', color: '#f43f5e', label: 'Rose' }
]

function AccentPicker() {
  const accentColor = useAppStore((s) => s.accentColor)
  const setAccentColor = useAppStore((s) => s.setAccentColor)

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {accentOptions.map((opt) => (
        <Tooltip key={opt.value} content={opt.label} side="top">
          <button
            onClick={() => {
              setAccentColor(opt.value)
              toast.success(`Accent: ${opt.label}`)
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: opt.color,
              border: accentColor === opt.value ? `3px solid white` : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: accentColor === opt.value ? `0 0 12px ${opt.color}80` : 'none',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
          >
            {accentColor === opt.value && <Check size={12} color="white" strokeWidth={3} />}
          </button>
        </Tooltip>
      ))}
    </div>
  )
}

/* ── Styled Slider ──────────────────────────────────────────── */
interface StyledSliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

function StyledSlider({
  value,
  onValueChange,
  onValueCommit,
  min = 10,
  max = 20,
  step = 1
}: StyledSliderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '200px' }}>
      <Slider.Root
        value={value}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
        min={min}
        max={max}
        step={step}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          touchAction: 'none',
          flex: 1,
          height: '20px'
        }}
      >
        <Slider.Track
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            flexGrow: 1,
            borderRadius: '999px',
            height: '5px'
          }}
        >
          <Slider.Range
            style={{
              position: 'absolute',
              background: 'var(--accent-primary)',
              borderRadius: '999px',
              height: '100%',
              boxShadow: '0 0 8px var(--accent-primary-glow)'
            }}
          />
        </Slider.Track>
        <Slider.Thumb
          style={{
            display: 'block',
            width: '16px',
            height: '16px',
            background: 'white',
            border: '2px solid var(--accent-primary)',
            borderRadius: '50%',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 0 0 0 var(--accent-primary-glow)',
            transition: 'box-shadow 0.15s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 4px var(--accent-primary-glow)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 0 var(--accent-primary-glow)'
          }}
        />
      </Slider.Root>
      <span
        style={{
          fontSize: '12px',
          color: 'var(--accent-primary)',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          minWidth: '28px'
        }}
      >
        {value[0]}px
      </span>
    </div>
  )
}

/* ── Password field with show/hide toggle ──────────────────── */
function PasswordField({
  label,
  value,
  onChange,
  autoComplete
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <Input
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      rightIcon={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          style={{
            pointerEvents: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            padding: 0
          }}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      }
    />
  )
}

/* ── Change Password Modal ──────────────────────────────────── */
function ChangePasswordModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
  }

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await changeOwnPassword(currentPassword, newPassword)
      toast.success('Password changed')
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(mapChangePasswordError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
      title="Change Password"
      description="You'll need your current password to set a new one."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<KeyRound size={13} />}
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            {saving ? 'Changing…' : 'Change Password'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <PasswordField
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '12px'
            }}
          >
            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ── Profile ────────────────────────────────────────────────── */
function ProfileSection() {
  const [name, setName] = useState(auth.currentUser?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const email = auth.currentUser?.email ?? ''

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateOwnDisplayName(name)
      toast.success('Display name updated')
    } catch {
      toast.error('Could not update display name')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card header={<SectionHeader icon={<User size={18} />} title="Profile" description="This name is shown across LCMS — including the activity feed and audit trail." />} padding="20px">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <Input
            label="Display Name"
            placeholder={email || 'Your name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '10px'
        }}
      >
        {email && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Signed in as {email}</p>
        )}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<KeyRound size={13} />}
          onClick={() => setPasswordModalOpen(true)}
        >
          Change Password
        </Button>
      </div>
      <ChangePasswordModal open={passwordModalOpen} onOpenChange={setPasswordModalOpen} />
    </Card>
  )
}

/* ── Settings View ──────────────────────────────────────────── */
export function Settings() {
  const { t } = useTranslation()
  const {
    theme,
    toggleTheme,
    setTheme,
    language,
    setLanguage,
    notificationsEnabled,
    soundEnabled,
    updateNotifs,
    securityAlerts,
    dataCollection,
    crashReports,
    compactMode,
    fontSize,
    setNotificationsEnabled,
    setSoundEnabled,
    setUpdateNotifs,
    setSecurityAlerts,
    setDataCollection,
    setCrashReports,
    setCompactMode,
    setFontSize
  } = useAppStore()

  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [draftFontSize, setDraftFontSize] = useState(fontSize)

  // Keep draft in sync if fontSize changes externally (e.g. reset)
  useEffect(() => {
    setDraftFontSize(fontSize)
  }, [fontSize])

  // Inform main process whenever crash-reporting preference changes
  useEffect(() => {
    window.api?.log.info(`[settings] Crash reporting ${crashReports ? 'enabled' : 'disabled'}`)
  }, [crashReports])

  const handleReset = () => {
    setTheme('dark')
    setNotificationsEnabled(true)
    setSoundEnabled(false)
    setUpdateNotifs(true)
    setSecurityAlerts(true)
    setDataCollection(false)
    setCompactMode(false)
    setFontSize([14])
    setCrashReports(true)
    setResetModalOpen(false)
    toast.success('Settings reset to defaults')
  }

  return (
    <motion.div
      key="settings"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '4px'
          }}
        >
          {t('settings.title')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('settings.subtitle')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <ProfileSection />
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card
            header={
              <SectionHeader
                icon={<Palette size={18} />}
                title={t('settings.appearance')}
                description={t('settings.appearanceDesc')}
              />
            }
            padding="20px"
          >
            <div>
              <SettingRow label={t('settings.darkMode')} description={t('settings.darkModeDesc')}>
                <Tooltip
                  content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  side="top"
                >
                  <button
                    onClick={() => {
                      toggleTheme()
                      toast.success(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} mode`)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      background:
                        theme === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(251,191,36,0.1)',
                      color: theme === 'dark' ? 'var(--accent-primary)' : '#f59e0b',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    {theme === 'dark' ? (
                      <>
                        <Moon size={13} />
                        {t('settings.dark')}
                      </>
                    ) : (
                      <>
                        <Sun size={13} />
                        {t('settings.light')}
                      </>
                    )}
                  </button>
                </Tooltip>
              </SettingRow>

              <SettingRow
                label={t('settings.accentColor')}
                description={t('settings.accentColorDesc')}
              >
                <AccentPicker />
              </SettingRow>

              <SettingRow label={t('settings.fontSize')} description={t('settings.fontSizeDesc')}>
                <StyledSlider
                  value={draftFontSize}
                  onValueChange={setDraftFontSize}
                  onValueCommit={(v) => {
                    setFontSize(v)
                    toast.success(`Font size: ${v[0]}px`)
                  }}
                  min={10}
                  max={20}
                  step={1}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.compactMode')}
                description={t('settings.compactModeDesc')}
                badge={t('common.beta')}
              >
                <StyledSwitch
                  checked={compactMode}
                  onCheckedChange={(v) => {
                    setCompactMode(v)
                    toast.success(v ? 'Compact mode ON' : 'Compact mode OFF')
                  }}
                />
              </SettingRow>

              <SettingRow label={t('settings.language')}>
                <Select.Root
                  value={language}
                  onValueChange={(v) => {
                    setLanguage(v as 'en' | 'tl')
                    toast.success('Language updated')
                  }}
                >
                  <Select.Trigger
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      outline: 'none',
                      minWidth: '130px',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown size={13} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      style={{
                        background: 'var(--popover-bg)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid var(--popover-border)',
                        borderRadius: '10px',
                        padding: '4px',
                        boxShadow: 'var(--popover-shadow)',
                        zIndex: 9999
                      }}
                      position="popper"
                      sideOffset={4}
                    >
                      <Select.Viewport>
                        {[
                          { value: 'en', label: 'English' },
                          { value: 'tl', label: 'Tagalog' }
                        ].map((opt) => (
                          <Select.Item
                            key={opt.value}
                            value={opt.value}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              outline: 'none',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--popover-item-hover)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <Select.ItemText>{opt.label}</Select.ItemText>
                            <Select.ItemIndicator>
                              <Check size={12} color="var(--accent-primary)" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </SettingRow>
            </div>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
        >
          <Card
            header={
              <SectionHeader
                icon={<Bell size={18} />}
                title={t('settings.notifications')}
                description={t('settings.notificationsDesc')}
              />
            }
            padding="20px"
          >
            <div>
              <SettingRow
                label={t('settings.enableNotifications')}
                description={t('settings.enableNotificationsDesc')}
              >
                <StyledSwitch
                  checked={notificationsEnabled}
                  onCheckedChange={(v) => {
                    setNotificationsEnabled(v)
                    toast.success(v ? 'Notifications enabled' : 'Notifications disabled')
                  }}
                />
              </SettingRow>
              <SettingRow
                label={t('settings.soundAlerts')}
                description={t('settings.soundAlertsDesc')}
              >
                <StyledSwitch
                  checked={soundEnabled}
                  onCheckedChange={(v) => {
                    setSoundEnabled(v)
                    toast.success(v ? 'Sound alerts ON' : 'Sound alerts OFF')
                  }}
                />
              </SettingRow>
              <SettingRow
                label={t('settings.updateNotifications')}
                description={t('settings.updateNotificationsDesc')}
              >
                <StyledSwitch
                  checked={updateNotifs}
                  onCheckedChange={(v) => {
                    setUpdateNotifs(v)
                    toast.success(v ? 'Update notifications ON' : 'Update notifications OFF')
                  }}
                />
              </SettingRow>
              <SettingRow
                label={t('settings.securityAlerts')}
                description={t('settings.securityAlertsDesc')}
              >
                <StyledSwitch
                  checked={securityAlerts}
                  onCheckedChange={(v) => {
                    setSecurityAlerts(v)
                    toast.success(v ? 'Security alerts ON' : 'Security alerts OFF')
                  }}
                />
              </SettingRow>
            </div>
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.19 }}
        >
          <Card
            header={
              <SectionHeader
                icon={<Shield size={18} />}
                title={t('settings.privacy')}
                description={t('settings.privacyDesc')}
              />
            }
            padding="20px"
          >
            <div>
              <SettingRow
                label={t('settings.dataCollection')}
                description={t('settings.dataCollectionDesc')}
              >
                <StyledSwitch
                  checked={dataCollection}
                  onCheckedChange={(v) => {
                    setDataCollection(v)
                    toast.success(v ? 'Data collection ON' : 'Data collection OFF')
                  }}
                />
              </SettingRow>
              <SettingRow
                label={t('settings.crashReports')}
                description={t('settings.crashReportsDesc')}
              >
                <StyledSwitch
                  checked={crashReports}
                  onCheckedChange={(v) => {
                    setCrashReports(v)
                    toast.success(v ? 'Crash reports ON' : 'Crash reports OFF')
                  }}
                />
              </SettingRow>
            </div>
          </Card>
        </motion.div>

        {/* Advanced */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.26 }}
        >
          <Card
            header={
              <SectionHeader
                icon={<SettingsIcon size={18} />}
                title={t('settings.advanced')}
                description={t('settings.advancedDesc')}
              />
            }
            padding="20px"
          >
            <div
              style={{
                padding: '16px',
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
                >
                  <AlertTriangle size={14} color="#ef4444" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('settings.resetSettings')}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {t('settings.resetSettingsDesc')}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<RotateCcw size={13} />}
                onClick={() => setResetModalOpen(true)}
                style={{ flexShrink: 0 }}
              >
                {t('common.reset')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        title={t('settings.resetConfirmTitle')}
        description={t('settings.resetConfirmDesc')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setResetModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<RotateCcw size={13} />}
              onClick={handleReset}
            >
              {t('common.reset')}
            </Button>
          </>
        }
      >
        <div
          style={{
            padding: '14px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '10px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}
        >
          <AlertTriangle size={16} color="#ef4444" style={{ marginTop: '1px', flexShrink: 0 }} />
          <div>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              The following will be reset:
            </p>
            <ul
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                paddingLeft: '16px',
                lineHeight: '1.8'
              }}
            >
              <li>Accent color → Indigo</li>
              <li>Font size → 14px</li>
              <li>All notification preferences</li>
              <li>Privacy settings</li>
              <li>Compact mode → Off</li>
            </ul>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
