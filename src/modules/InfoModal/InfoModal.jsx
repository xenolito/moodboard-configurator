import { useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import DOMPurify from 'dompurify'
import { notifyModalOpen, notifyModalClose } from '../../utils/modalSignal.js'

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel']
}

const ZoneEntry = ({ entry, onClose, showZoneName = true }) => (
  <div className="info-modal-zone">
    {showZoneName && entry.zoneName && <div className="info-modal-zone-name header-tag">Zona de {entry.zoneName}</div>}
    <div className="info-modal-model-name"><span className='info-model-label'>Modelo: </span>{entry.modelName}</div>
    {entry.variantLabel && (
      <div className="info-model-variant">
        {(() => {
          const sep = entry.variantLabel.indexOf(': ')
          if (sep === -1) return entry.variantLabel
          return <><span className="info-model-label">{entry.variantLabel.slice(0, sep)}: </span>{entry.variantLabel.slice(sep + 2)}</>
        })()}
      </div>
    )}
    {entry.description && (
      <div
        className="info-modal-description"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.description, PURIFY_CONFIG) }}
      />
    )}
    {entry.productFamilyURL && (
      <a
        href={`/${entry.productFamilyURL}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className='to-model-catalog'
      >
        Consulta otras medidas disponibles
      </a>
    )}
  </div>
)

const CompareColumn = ({ heading, entries, onClose }) => {
  const multiZone = Array.isArray(entries) && entries.length > 1
  return (
    <div className="info-compare-col">
      <div className="info-compare-heading"><span class="header-tag">{heading}</span></div>
      {Array.isArray(entries)
        ? entries.map((e, i) => <ZoneEntry key={i} entry={e} onClose={onClose} showZoneName={multiZone} />)
        : <ZoneEntry entry={entries} onClose={onClose} showZoneName={false} />}
    </div>
  )
}

const buildCtaData = (data) => {
  const fmt = (e) => `'${e.modelName}' en color '${e.variantName ?? ''}'`
  const SEP = ' | '
  if (data.type === 'single')
    return `Información sobre ${fmt(data)} desde el ambiente '${data.ambientName ?? ''}'`
  if (data.type === 'combined')
    return data.zones.map(e =>
      `Información sobre ${fmt(e)} desde el ambiente '${data.ambientName ?? ''}'`
    ).join(SEP)
  const fmtSide = (side) => Array.isArray(side) ? side.map(fmt).join(' / ') : fmt(side)
  return `Izquierda: ${fmtSide(data.left)}${SEP}Derecha: ${fmtSide(data.right)}${SEP}Ambiente: '${data.ambientName ?? ''}'`
}

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

  const CtaButton = (
    <div className="wp-block-buttons is-layout-flex wp-block-buttons-is-layout-flex">
      <div
        className="wp-block-button arrow"
        data-modalform_input_name="producto"
        data-modalform_input_data={buildCtaData(data)}
        data-modalform_target="lead"
      >
        <a className="wp-block-button__link wp-element-button" href="#modal-lead" onClick={closeWithAnimation}>
          Solicita presupuesto
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256">
            <rect width="256" height="256" fill="none"></rect>
            <line x1="40" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
            <polyline points="144 56 216 128 144 200" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></polyline>
          </svg>
        </a>
      </div>
    </div>
  )

  return (
    <dialog
      ref={dialogRef}
      className={`info-modal${isCompare ? ' is-compare' : ''}`}
      onClick={handleBackdropClick}
      onCancel={(e) => { e.preventDefault(); closeWithAnimation() }}
    >
      <button
        className="info-modal-close icon-close"
        aria-label="Cerrar"
        onClick={closeWithAnimation}
      >
        <X size={18} />
      </button>
      <div className="info-modal-inner">
        <div className="info-modal-body">
          <h3 className="info-modal-title">Tu selección actual</h3>

          {data.type === 'single' && (
            <ZoneEntry entry={data} onClose={closeWithAnimation} showZoneName={false} />
          )}

          {data.type === 'combined' && data.zones.map((z, i) => (
            <ZoneEntry key={i} entry={z} onClose={closeWithAnimation} showZoneName={data.zones.length > 1} />
          ))}

          {isCompare && (
            <div className="info-compare">
              <CompareColumn heading="Izquierda" entries={data.left} onClose={closeWithAnimation} />
              <CompareColumn heading="Derecha" entries={data.right} onClose={closeWithAnimation} />
            </div>
          )}

          {CtaButton}
        </div>
      </div>
    </dialog>
  )
}

export default InfoModal
