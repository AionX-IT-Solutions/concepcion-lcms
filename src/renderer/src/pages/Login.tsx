import { useState, type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, ArrowRight, Gavel } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/app.store'
import { useElectron } from '../hooks/useElectron'

const loginSchema = z.object({
  email: z.string().min(1, 'auth.emailRequired').email('auth.emailRequired'),
  password: z.string().min(6, 'auth.passwordMinLength')
})

type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const { t } = useTranslation()
  const login = useAppStore((s) => s.login)
  const { appVersion } = useElectron()
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    const errorKey = await login(data.email, data.password)
    if (errorKey) {
      setError('root', { message: errorKey })
    }
  }

  const rootError = errors.root?.message
  const emailError = errors.email?.message
  const passwordError = errors.password?.message
  const displayError = rootError ?? emailError ?? passwordError

  const features = t('auth.features', { returnObjects: true }) as string[]

  function fieldStyle(active: boolean, hasError: boolean): CSSProperties {
    return {
      width: '100%',
      height: '42px',
      padding: '0 14px',
      fontSize: '13px',
      fontFamily: 'inherit',
      borderRadius: '10px',
      outline: 'none',
      background: active ? 'var(--accent-primary-subtle)' : 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${hasError ? 'rgba(239,68,68,0.6)' : active ? 'var(--accent-primary)' : 'var(--border-default)'}`,
      color: 'var(--text-primary)',
      boxShadow: hasError
        ? '0 0 0 3px rgba(239,68,68,0.15)'
        : active
          ? '0 0 0 3px var(--accent-primary-glow)'
          : 'none',
      transition: 'all 0.15s ease'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}
    >
      {/* ── Left brand panel ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, var(--login-brand-bg-start) 0%, var(--login-brand-bg-mid) 40%, var(--login-brand-bg-end) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px'
        }}
      >
        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '-60px',
            left: '-60px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <motion.div
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{
            position: 'absolute',
            bottom: '-70px',
            right: '-50px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Dot grid overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'radial-gradient(circle, var(--login-brand-ring) 1px, transparent 1px)',
            backgroundSize: '22px 22px'
          }}
        />

        {/* Ring decorations */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '20px',
            right: '-40px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '1px solid var(--login-brand-ring)',
            pointerEvents: 'none'
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '1px solid var(--login-brand-ring)',
            pointerEvents: 'none'
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '22px',
              margin: '0 auto 16px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(14px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 38px var(--login-brand-shadow)'
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}lcms-logo.png`}
              alt="LCMS"
              style={{ width: '56px', height: '56px', objectFit: 'contain' }}
              draggable={false}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '10px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'var(--login-brand-chip-bg)',
              border: '1px solid var(--login-brand-chip-border)'
            }}
          >
            <Gavel size={10} color="rgba(255,255,255,0.75)" />
            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Edwin A. Concepcion, Jr. Law Office
            </span>
          </div>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: 900,
              color: 'var(--login-brand-text)',
              letterSpacing: '-0.5px',
              lineHeight: 1,
              marginBottom: '6px',
              textShadow: '0 2px 20px var(--accent-primary-glow)'
            }}
          >
            LCMS
          </h1>

          <p
            style={{
              fontSize: '11px',
              color: 'var(--login-brand-muted)',
              lineHeight: '1.5',
              maxWidth: '180px',
              margin: '0 auto 24px'
            }}
          >
            Legal Case Management System
          </p>

          {features.map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 12px',
                borderRadius: '8px',
                marginBottom: '6px',
                background: 'var(--login-brand-chip-bg)',
                border: '1px solid var(--login-brand-chip-border)'
              }}
            >
              <div
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: '10.5px', color: 'var(--login-brand-muted)', fontWeight: 500 }}>
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}developer-logo.png`}
            alt="AionX"
            style={{ width: '48px', height: '48px', opacity: 1 }}
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--login-brand-muted)' }}>
            AionX IT Solutions
          </span>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 28px',
          background: 'var(--bg-base)',
          overflow: 'hidden'
        }}
      >
        {/* Ambient blobs */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            pointerEvents: 'none',
            background: 'radial-gradient(circle, var(--accent-primary-subtle) 0%, transparent 70%)'
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)'
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.05 }}
          style={{ width: '100%', maxWidth: '360px', position: 'relative', zIndex: 1 }}
        >
          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}
            >
              {t('auth.welcomeBack')}
            </p>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '-0.4px',
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              {t('auth.signInHeading')}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {t('auth.signInDescription')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '7px',
                    letterSpacing: '0.02em'
                  }}
                >
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  {...register('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                  autoFocus
                  style={fieldStyle(focusedField === 'email', Boolean(errors.email))}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '7px',
                    letterSpacing: '0.02em'
                  }}
                >
                  {t('auth.password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete="current-password"
                    style={{
                      ...fieldStyle(focusedField === 'password', Boolean(errors.password)),
                      paddingRight: '40px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: '11px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '3px'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '9px 12px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: '8px',
                      color: '#f87171',
                      fontSize: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    {t(displayError)}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                whileTap={isSubmitting ? {} : { scale: 0.97 }}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: '44px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: '11px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.75 : 1,
                  fontFamily: 'inherit',
                  boxShadow: '0 6px 20px var(--accent-primary-glow)',
                  transition: 'opacity 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting)
                    e.currentTarget.style.boxShadow = '0 10px 28px var(--accent-primary-glow)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px var(--accent-primary-glow)'
                }}
              >
                {isSubmitting ? (
                  <svg
                    style={{ width: '16px', height: '16px', animation: 'spin 0.8s linear infinite' }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <>
                    {t('common.signIn')}
                    <ArrowRight size={15} />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <p style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} Edwin A. Concepcion, Jr. Law Office
            </p>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '5px',
                background: 'var(--accent-primary-subtle)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--accent-primary-subtle)'
              }}
            >
              v{appVersion}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
