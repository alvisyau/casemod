import { useRef, useState } from 'react'
import { useLang } from '../context/LanguageContext'

const FRAME_W = 260
const FRAME_H = 540

function PhotoEditor({ value, onChange }) {
  const { t } = useLang()
  const [imgSrc, setImgSrc] = useState(value?.imgSrc || null)
  const [file, setFile] = useState(value?.file || null)
  const [scale, setScale] = useState(value?.scale || 1)
  const [pos, setPos] = useState({ x: value?.posX || 0, y: value?.posY || 0 })

  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const emit = (next) => {
    onChange?.({
      file, imgSrc, scale, posX: pos.x, posY: pos.y,
      frameW: FRAME_W, frameH: FRAME_H, ...next,
    })
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setFile(f)
    setImgSrc(url)
    setScale(1)
    setPos({ x: 0, y: 0 })
    onChange?.({
      file: f, imgSrc: url, scale: 1, posX: 0, posY: 0,
      frameW: FRAME_W, frameH: FRAME_H,
    })
  }

  const startDrag = (clientX, clientY) => {
    dragging.current = true
    last.current = { x: clientX, y: clientY }
  }
  const moveDrag = (clientX, clientY) => {
    if (!dragging.current) return
    const dx = clientX - last.current.x
    const dy = clientY - last.current.y
    last.current = { x: clientX, y: clientY }
    setPos((p) => {
      const np = { x: p.x + dx, y: p.y + dy }
      emit({ posX: np.x, posY: np.y })
      return np
    })
  }
  const endDrag = () => { dragging.current = false }

  const onScale = (v) => {
    setScale(v)
    emit({ scale: v })
  }

  return (
    <div className="flex flex-col items-center">
      {!imgSrc && (
        <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-8 py-12 text-center hover:border-gray-500 transition">
          <p className="text-gray-600 font-medium">{t('editor.uploadPhoto')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('editor.photoFormat')}</p>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}

      {imgSrc && (
        <>
          <div
            className="relative overflow-hidden bg-gray-100 rounded-[28px] border-4 border-gray-800 touch-none select-none"
            style={{ width: FRAME_W, height: FRAME_H }}
            onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
            onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={endDrag}
          >
            <img
              src={imgSrc}
              alt="preview"
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none"
              style={{
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                width: FRAME_W,
              }}
            />
            <div className="absolute top-3 left-3 w-14 h-14 rounded-2xl border-2 border-white/70 pointer-events-none" />
          </div>

          <div className="w-full max-w-xs mt-4">
            <label className="text-sm text-gray-600">{t('editor.scale')}</label>
            <input
              type="range" min="0.5" max="3" step="0.01" value={scale}
              onChange={(e) => onScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <p className="text-xs text-gray-400 mt-1">{t('editor.dragMove')}</p>

          <label className="cursor-pointer text-sm text-blue-600 mt-3 underline">
            {t('editor.changePhoto')}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </>
      )}
    </div>
  )
}

export default PhotoEditor