import { useRef, useState } from 'react'

const FRAME_W = 180
const FRAME_H = 380

function PuzzleEditor({ count = 2, value, onChange }) {
  const [imgSrc, setImgSrc] = useState(value?.imgSrc || null)
  const [file, setFile] = useState(value?.file || null)
  const [scale, setScale] = useState(value?.scale || 1)
  const [offsets, setOffsets] = useState(
    value?.offsets && value.offsets.length === count
      ? value.offsets
      : Array.from({ length: count }, () => ({ dx: 0, dy: 0 }))
  )

  const totalW = FRAME_W * count
  const dragging = useRef(null)
  const last = useRef({ x: 0, y: 0 })

  const emit = (next) => {
    onChange?.({
      file, imgSrc, scale, offsets,
      frameW: FRAME_W, frameH: FRAME_H, totalW, count,
      ...next,
    })
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => {
      const ratio = img.width / img.height
      // cover:確保大圖至少蓋滿總框高度
      const s = Math.max(1, (FRAME_H * ratio) / totalW)
      const init = Array.from({ length: count }, () => ({ dx: 0, dy: 0 }))
      setFile(f); setImgSrc(url); setScale(s); setOffsets(init)
      onChange?.({
        file: f, imgSrc: url, scale: s, offsets: init,
        frameW: FRAME_W, frameH: FRAME_H, totalW, count,
      })
    }
    img.src = url
  }

  const startDrag = (i, cx, cy) => {
    dragging.current = i
    last.current = { x: cx, y: cy }
  }
  const moveDrag = (i, cx, cy) => {
    if (dragging.current !== i) return
    const ddx = cx - last.current.x
    const ddy = cy - last.current.y
    last.current = { x: cx, y: cy }
    setOffsets((prev) => {
      const n = prev.map((o) => ({ ...o }))
      n[i] = { dx: n[i].dx + ddx, dy: n[i].dy + ddy }
      emit({ offsets: n })
      return n
    })
  }
  const endDrag = () => { dragging.current = null }

  const onScale = (v) => { setScale(v); emit({ scale: v }) }
  const resetOffsets = () => {
    const init = Array.from({ length: count }, () => ({ dx: 0, dy: 0 }))
    setOffsets(init); emit({ offsets: init })
  }

  return (
    <div className="flex flex-col items-center">
      {!imgSrc && (
        <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-8 py-12 text-center hover:border-gray-500 transition">
          <p className="text-gray-600 font-medium">點此上載一張大圖</p>
          <p className="text-xs text-gray-400 mt-1">系統會自動橫切成 {count} 格</p>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}

      {imgSrc && (
        <>
          <div className="w-full overflow-x-auto">
            <div className="flex gap-2 justify-center min-w-min mx-auto" style={{ width: 'fit-content' }}>
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex flex-col items-center shrink-0">
                  <div
                    className="relative overflow-hidden bg-gray-100 rounded-[20px] border-4 border-gray-800 touch-none select-none"
                    style={{ width: FRAME_W, height: FRAME_H }}
                    onMouseDown={(e) => startDrag(i, e.clientX, e.clientY)}
                    onMouseMove={(e) => moveDrag(i, e.clientX, e.clientY)}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchStart={(e) => startDrag(i, e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchMove={(e) => moveDrag(i, e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={endDrag}
                  >
                    <div
                      className="absolute top-0 left-0"
                      style={{
                        width: totalW,
                        height: FRAME_H,
                        transform: `translate(${-i * FRAME_W + offsets[i].dx}px, ${offsets[i].dy}px)`,
                      }}
                    >
                      <img
                        src={imgSrc}
                        alt=""
                        draggable={false}
                        className="absolute left-1/2 top-1/2 max-w-none"
                        style={{
                          transform: `translate(-50%, -50%) scale(${scale})`,
                          width: totalW,
                        }}
                      />
                    </div>
                    <span className="absolute top-1.5 left-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      殼 {i + 1}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">拖動微調</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-xs mt-4">
            <label className="text-sm text-gray-600">整體縮放</label>
            <input type="range" min="0.5" max="3" step="0.01" value={scale}
              onChange={(e) => onScale(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div className="flex gap-4 mt-2">
            <button type="button" onClick={resetOffsets}
              className="text-sm text-gray-500 underline">重設對齊</button>
            <label className="cursor-pointer text-sm text-blue-600 underline">
              更換大圖
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            大圖已自動切成 {count} 份,每格可獨立拖動對齊,整體用拉桿調大小。
          </p>
        </>
      )}
    </div>
  )
}

export default PuzzleEditor