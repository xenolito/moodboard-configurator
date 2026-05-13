import { useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import DOMPurify from 'dompurify'
import { notifyModalOpen, notifyModalClose } from '../../utils/modalSignal.js'

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel']
}

const ZoneEntry = ({ entry }) => (
  <div className="info-modal-zone">
    {entry.zoneName && <div className="info-modal-zone-name">{entry.zoneName}</div>}
    <div className="info-modal-model-name">{entry.modelName}</div>
    {entry.variantLabel && <div className="info-modal-variant-label">{entry.variantLabel}</div>}
    {entry.description && (
      <div
        className="info-modal-description"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.description, PURIFY_CONFIG) }}
      />
    )}
  </div>
)

const CompareColumn = ({ heading, entries }) => (
  <div className="info-compare-col">
    <div className="info-compare-heading">{heading}</div>
    {Array.isArray(entries)
      ? entries.map((e, i) => <ZoneEntry key={i} entry={e} />)
      : <ZoneEntry entry={entries} />}
  </div>
)

const InfoModal = ({ data, onClose }) => {
  const dialogRef = useRef(null)

  const closeWithAnimation = useCallback(() => {
    const el = dialogRef.current
    if (!el || el.classList.contains('is-closing')) return
    el.classList.add('is-closing')
    const handleEnd = (e) => {
      if (e.target !== el || e.propertyName !== 'opacity') return
      el.removeEventListener('transitionend', handleEnd)
      el.close()
    }
    el.addEventListener('transitionend', handleEnd)
  }, [])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    el.showModal()
    notifyModalOpen()
    const handleClose = () => {
      notifyModalClose()
      onClose?.()
    }
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose])

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) closeWithAnimation()
  }

  const isCompare = data.type === 'compare' || data.type === 'compare-combined'

  return (
    <dialog
      ref={dialogRef}
      className={`info-modal${isCompare ? ' is-compare' : ''}`}
      onClick={handleBackdropClick}
      onCancel={(e) => { e.preventDefault(); closeWithAnimation() }}
    >
      <div className="info-modal-inner">
        <div className="info-modal-header">
          <h2 className="info-modal-title">Tu selección actual</h2>
          <button
            className="info-modal-close"
            aria-label="Cerrar"
            onClick={closeWithAnimation}
          >
            <X size={18} />
          </button>
        </div>

        <div className="info-modal-body">
          {data.type === 'single' && <ZoneEntry entry={data} />}

          {data.type === 'combined' && data.zones.map((z, i) => (
            <ZoneEntry key={i} entry={z} />
          ))}

          {isCompare && (
            <div className="info-compare">
              <CompareColumn heading="Antes" entries={data.left} />
              <CompareColumn heading="Después" entries={data.right} />
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}

export default InfoModal
