import { useRef } from 'react'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import type { MockFileRef } from '../../types/lcms.types'

interface FileDropzoneProps {
  value?: MockFileRef
  onSelect: (file: File) => void
  onClear: () => void
  label?: string
  uploading?: boolean
}

export function FileDropzone({ value, onSelect, onClear, label, uploading }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (uploading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          border: '1px dashed var(--border-strong)',
          color: 'var(--text-muted)',
          fontSize: 12
        }}
      >
        <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
        Uploading…
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onSelect(file)
          e.target.value = ''
        }}
      />
      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)'
          }}
        >
          <FileText size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={value.name}
          >
            {value.name}
          </span>
          <button
            type="button"
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              flexShrink: 0
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: '1px dashed var(--border-strong)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)'
            e.currentTarget.style.color = 'var(--accent-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <Upload size={14} />
          {label ?? 'Click to upload a file'}
        </button>
      )}
    </div>
  )
}
