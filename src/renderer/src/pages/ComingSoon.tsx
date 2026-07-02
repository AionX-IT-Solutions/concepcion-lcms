import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { MODULES } from '../config/modules'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

export function ComingSoon() {
  const { pathname } = useLocation()
  const module = MODULES.find((m) => m.path === pathname)
  const Icon = module?.icon ?? Sparkles

  return (
    <motion.div
      key={pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
    >
      <PageHeader icon={<Icon size={20} />} title={module?.label ?? 'Coming Soon'} />
      <Card>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 14,
            padding: '48px 24px'
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--accent-primary-subtle)',
              border: '1px solid var(--accent-primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {module?.label ?? 'This module'} is coming soon
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                maxWidth: 480,
                marginTop: 6,
                lineHeight: 1.6
              }}
            >
              {module?.description ??
                'This module is on the roadmap and not yet available in this build.'}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
