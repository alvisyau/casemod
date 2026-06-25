import { useMemo } from 'react'

// ── 由型號名判斷鏡頭排列 ───────────────────────────
function getLayout(model = '') {
  const m = model.toLowerCase()
  // ⭐ 順序好重要:要先撈 17 Pro,再撈 17,最後先撈 16 Pro
  if (m.includes('17') && m.includes('pro')) return 'bar17'  // 17 Pro / Pro Max → 橫條
  if (m.includes('17')) return 'dual'                        // 17 標準 → 雙鏡頭
  if (m.includes('pro')) return 'pro'                        // 16/15 Pro → 三鏡頭方島
  return 'dual'                                              // 其他 → 雙鏡頭
}

// ── 單個鏡頭 ──────────────────────────────────────
function Lens({ width = '100%' }) {
  return (
    <div style={{
      width, aspectRatio: '1 / 1', borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #5b626d 0%, #1f2937 45%, #000 80%)',
      boxShadow:
        '0 0 0 1.5px rgba(255,255,255,0.18), inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -2px 5px rgba(0,0,0,0.7)',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: '20%', left: '24%',
        width: '26%', aspectRatio: '1 / 1', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(219,234,254,0.9), rgba(96,165,250,0.05) 70%)',
      }} />
    </div>
  )
}

// 小圓點(閃光燈 / LiDAR)
function Dot({ style }) {
  return <div style={{
    aspectRatio: '1 / 1', borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #e5e7eb, #9ca3af 60%, #4b5563)',
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), 0 0 0 1px rgba(0,0,0,0.15)',
    position: 'absolute', ...style,
  }} />
}

const islandBase = {
  position: 'absolute',
  background: 'linear-gradient(150deg, rgba(42,42,48,0.45), rgba(8,8,10,0.62))',
  boxShadow:
    'inset 0 1px 1px rgba(155,255,255,0.22), inset 0 -3px 7px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(1.5px)',
  WebkitBackdropFilter: 'blur(1.5px)',
}

// ── 鏡頭島 ────────────────────────────────────────
function CameraIsland({ layout }) {
// 🟦 iPhone 17 Pro / Pro Max:橫向相機條(左三角大鏡頭 + 右感應器)
  if (layout === 'bar17') {
    const lensAt = (cx, cy, size) => (
      <div style={{
        position: 'absolute', left: cx, top: cy,
        width: size, transform: 'translate(-50%, -50%)',
      }}><Lens /></div>
    )
    return (
  <div style={{
        ...islandBase,
        top: '1.5%', left: '2%', right: '2%', height: '22%',
        borderRadius: '10%',
      }}>
        {/* 左邊:三粒鏡頭砌三角(上下拉開,唔重疊) */}
        {lensAt('13%', '24%', '17%')}   {/* 左上 */}
        {lensAt('13%', '76%', '17%')}   {/* 左下 */}
        {lensAt('32%', '50%', '18%')}   {/* 中(略大) */}

        {/* 右邊:閃光燈(白)+ LiDAR(黑)上下對齊,right 一樣 */}
        <Dot style={{
          top: '16%', right: '6%', width: '8%',
          background: 'radial-gradient(circle at 40% 35%, #ffffff, #e5e7eb 60%, #cbd5e1)',
        }} />
        <Dot style={{
          bottom: '16%', right: '6%', width: '8%',
          background: 'radial-gradient(circle at 40% 35%, #374151, #111827 70%, #000)',
        }} />
        <Dot style={{ top: '50%', right: '9%', width: '1%' }} />  {/* 細咪孔 */}
      </div>
    )
  }
  // 🟥 iPhone 16 / 15 Pro:三鏡頭方形島
  if (layout === 'pro') {
    return (
      <div style={{ ...islandBase, top: '3.5%', left: '5%', width: '40%', aspectRatio: '1 / 1.04', borderRadius: '24%' }}>
        <div style={{ position: 'absolute', top: '9%',  left: '8%',  width: '40%' }}><Lens /></div>
        <div style={{ position: 'absolute', bottom: '9%', left: '8%', width: '40%' }}><Lens /></div>
        <div style={{ position: 'absolute', top: '31%', right: '7%', width: '40%' }}><Lens /></div>
        <Dot style={{ top: '11%', right: '12%', width: '11%' }} />
        <Dot style={{ bottom: '13%', right: '12%', width: '9%' }} />
      </div>
    )
  }

  // ⬜ iPhone 16 / 17 標準:雙鏡頭直立 pill
  return (
    <div style={{ ...islandBase, top: '3.5%', left: '5%', width: '23%', aspectRatio: '1 / 2', borderRadius: '999px' }}>
      <div style={{ position: 'absolute', top: '4%',    left: '8%', width: '84%' }}><Lens /></div>
      <div style={{ position: 'absolute', bottom: '4%', left: '8%', width: '84%' }}><Lens /></div>
    </div>
  )
}

// ── 主組件 ────────────────────────────────────────
export default function CaseFrame({
  image, model, gradient = 'from-gray-200 to-gray-400',
  frameUrl, soldOut, soldOutLabel, previewLabel,
}) {
  const layout = useMemo(() => getLayout(model), [model])

  return (
    <div className="relative aspect-[9/19] rounded-[2rem] overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
      {image ? (
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-xs text-white/70">{previewLabel}</span>
        </div>
      )}

      {frameUrl ? (
        <img src={frameUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
      ) : (
        <CameraIsland layout={layout} />
      )}

      <div className="pointer-events-none absolute inset-0 rounded-[2rem]"
        style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.22), inset 0 0 12px 2px rgba(255,255,255,0.06)' }} />
      <div className="pointer-events-none absolute inset-0 rounded-[2rem]"
        style={{ background: 'linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.1) 100%)' }} />

      {soldOut && (
        <span className="absolute top-4 right-4 text-xs bg-black/70 text-white px-2.5 py-1 rounded-full">
          {soldOutLabel}
        </span>
      )}
    </div>
  )
}