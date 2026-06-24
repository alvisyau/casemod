import { useRef, useState } from 'react'

// 手機殼框嘅長闊比(大約 iPhone 比例)
const FRAME_W = 260
const FRAME_H = 540

function PhotoEditor({ value, onChange }) {
  const [imgSrc, setImgSrc] = useState(value?.imgSrc || null)
  const [file, setFile] = useState(value?.file || null)
  const [scale, setScale] = useState(value?.scale || 1)
  const [pos, setPos] = useState({ x: value?.posX || 0, y: value?.posY || 0 })

  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  // 將最新狀態回傳俾上層
  const emit = (next) => {
    onChange?.({
      file,
      imgSrc,
      scale,
      posX: pos.x,
      posY: pos.y,
      ...next,
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
    onChange?.({ file: f, imgSrc: url, scale: 1, posX: 0, posY: 0 })
  }

  // ---- 拖動 ----
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
          <p className="text-gray-600 font-medium">點此上載相片</p>
          <p className="text-xs text-gray-400 mt-1">支援 JPG / PNG</p>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}

      {imgSrc && (
        <>
          {/* 手機殼框 */}
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
              alt="預覽"
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none"
              style={{
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                width: FRAME_W,
              }}
            />
            {/* 鏡頭位提示(右上角) */}
            <div className="absolute top-3 left-3 w-14 h-14 rounded-2xl border-2 border-white/70 pointer-events-none" />
          </div>

          {/* 放大縮小 */}
          <div className="w-full max-w-xs mt-4">
            <label className="text-sm text-gray-600">縮放</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => onScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <p className="text-xs text-gray-400 mt-1">拖動相片移位，拉桿調大小</p>

          <label className="cursor-pointer text-sm text-blue-600 mt-3 underline">
            更換相片
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </>
      )}
    </div>
  )
}

export default PhotoEditor