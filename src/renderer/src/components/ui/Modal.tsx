import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeWidths = { sm: '400px', md: '520px', lg: '680px' }

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop — no backdrop-filter here; putting it on the overlay
                would create a new Chromium containing block that shifts
                position:fixed children (the centering wrapper below). */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15,15,35,0.55)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  zIndex: 1000
                }}
              />
            </Dialog.Overlay>

            {/* Centering wrapper — flex centering is immune to the
                backdrop-filter containing-block quirk in Chromium/Electron. */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                pointerEvents: 'none',
                padding: '20px'
              }}
            >
              <Dialog.Content asChild>
                <motion.div
                  className="modal-light"
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    pointerEvents: 'auto',
                    position: 'relative',
                    width: sizeWidths[size],
                    maxWidth: '100%',
                    maxHeight: 'calc(100vh - 40px)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.09)',
                    borderRadius: '16px',
                    boxShadow:
                      '0 24px 80px rgba(0,0,0,0.22), 0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(99,102,241,0.06)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Indigo gradient top accent */}
                  <div
                    style={{
                      height: '4px',
                      background:
                        'linear-gradient(90deg, #6366f1 0%, #818cf8 55%, #a78bfa 100%)',
                      flexShrink: 0
                    }}
                  />

                  {/* Header */}
                  {(title || description) && (
                    <div
                      style={{
                        padding: '18px 24px 14px',
                        borderBottom: '1px solid rgba(0,0,0,0.07)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexShrink: 0
                      }}
                    >
                      <div>
                        {title && (
                          <Dialog.Title
                            style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              color: '#12122a',
                              margin: 0,
                              letterSpacing: '-0.015em'
                            }}
                          >
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description
                            style={{
                              fontSize: '13px',
                              color: '#6b7280',
                              marginTop: '3px',
                              lineHeight: 1.5
                            }}
                          >
                            {description}
                          </Dialog.Description>
                        )}
                      </div>

                      <Dialog.Close
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.05)',
                          border: '1px solid rgba(0,0,0,0.09)',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.09)'
                          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
                          e.currentTarget.style.color = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0,0,0,0.05)'
                          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)'
                          e.currentTarget.style.color = '#9ca3af'
                        }}
                      >
                        <X size={14} />
                      </Dialog.Close>
                    </div>
                  )}

                  {/* Body */}
                  {children && (
                    <div
                      style={{
                        padding: '20px 24px',
                        overflowY: 'auto',
                        flex: 1
                      }}
                    >
                      {children}
                    </div>
                  )}

                  {/* Footer */}
                  {footer && (
                    <div
                      style={{
                        padding: '14px 24px',
                        borderTop: '1px solid rgba(99,102,241,0.1)',
                        background: 'rgba(99,102,241,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        flexShrink: 0
                      }}
                    >
                      {footer}
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
