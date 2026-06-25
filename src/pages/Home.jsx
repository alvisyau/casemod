import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBranding } from '../hooks/useBranding'

// 自動輪播主視覺
function HeroCarousel({ images }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [images.length])

  // 冇相:預設 placeholder
  if (images.length === 0) {
    return (
      <div className="mt-16 mx-auto max-w-3xl aspect-[16/9] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
        主視覺相片（placeholder）
      </div>
    )
  }

  return (
    <div className="mt-16 mx-auto max-w-3xl">
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
        {images.map((url, i) => (
          <img key={url} src={url} alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              i === idx ? 'opacity-100' : 'opacity-0'
            }`} />
        ))}

        {/* 小圓點 */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition ${
                  i === idx ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                }`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Home() {
  const branding = useBranding()
  const heroImages = Array.isArray(branding?.hero_images) ? branding.hero_images : []

  return (
    <div>
      {/* 主視覺 */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
        <p className="text-sm text-gray-400 tracking-widest uppercase mb-4">Custom Made Phone Cases</p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          CaseMod<br />你的故事 獨一無二
        </h1>
        <p className="mt-6 text-gray-500 max-w-xl mx-auto">
          上載相片、自由調整構圖，打造獨一無二嘅手機殼。簡約設計，香港製造。
        </p>
        <div className="mt-10">
          <Link to="/order" className="inline-block px-8 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition">
            開始設計
          </Link>
        </div>

        {/* 主視覺輪播 */}
        <HeroCarousel images={heroImages} />
      </section>

      {/* 賣點 */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid sm:grid-cols-3 gap-8">
        {[
          ['高清印刷', '色彩鮮明持久，還原相片每個細節。'],
          ['自由構圖', '即時預覽，拖動縮放，完全你話事。'],
          ['多種款式', '透明、霧面、防摔軍規，啱晒不同需要。'],
        ].map(([title, desc]) => (
          <div key={title}>
            <div className="w-10 h-10 rounded-lg bg-black mb-4" />
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </section>

      {/* 下方 CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-gray-900 text-white rounded-2xl px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">準備好打造你嘅專屬手機殼？</h2>
          <Link to="/order" className="mt-8 inline-block px-8 py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-100 transition">
            立即開始
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home