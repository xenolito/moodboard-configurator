import { useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import DOMPurify from 'dompurify'
import { notifyModalOpen, notifyModalClose } from '../../utils/modalSignal.js'

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel']
}

const ZoneEntry = ({ entry, ambientName, onClose }) => (
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
    <div className="wp-block-buttons is-layout-flex wp-block-buttons-is-layout-flex">
      <div
        className="wp-block-button arrow"
        data-modalform_input_name="producto"
        data-modalform_input_data={`Información sobre '${entry.modelName}' en color '${entry.variantName ?? ''}' desde el ambiente '${ambientName ?? ''}'`}
        data-modalform_target="lead"
      >
        <a
          className="wp-block-button__link wp-element-button"
          href="#modal-lead"
          onClick={onClose}
        >
          Solicita presupuesto
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256">
            <rect width="256" height="256" fill="none"></rect>
            <line x1="40" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
            <polyline points="144 56 216 128 144 200" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></polyline>
          </svg>
        </a>
      </div>
    </div>
    {entry.productFamilyURL && (
      <a
        href={`/${entry.productFamilyURL}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
      >
        Consulta otras medidas disponibles
      </a>
    )}
  </div>
)

const CompareColumn = ({ heading, entries, ambientName, onClose }) => (
  <div className="info-compare-col">
    <div className="info-compare-heading">{heading}</div>
    {Array.isArray(entries)
      ? entries.map((e, i) => <ZoneEntry key={i} entry={e} ambientName={ambientName} onClose={onClose} />)
      : <ZoneEntry entry={entries} ambientName={ambientName} onClose={onClose} />}
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
          {data.type === 'single' && (
            <ZoneEntry entry={data} ambientName={data.ambientName} onClose={closeWithAnimation} />
          )}

          {data.type === 'combined' && data.zones.map((z, i) => (
            <ZoneEntry key={i} entry={z} ambientName={data.ambientName} onClose={closeWithAnimation} />
          ))}

          {isCompare && (
            <div className="info-compare">
              <CompareColumn heading="Antes" entries={data.left} ambientName={data.ambientName} onClose={closeWithAnimation} />
              <CompareColumn heading="Después" entries={data.right} ambientName={data.ambientName} onClose={closeWithAnimation} />
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}

export default InfoModal
