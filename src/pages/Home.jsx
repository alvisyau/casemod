import { Link } from 'react-router-dom'

function Home() {
  return (
    <div>
      {/* 主視覺 */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
        <p className="text-sm text-gray-400 tracking-widest uppercase mb-4">Custom Phone Cases</p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          將你最愛嘅一刻<br />戴喺身邊
        </h1>
        <p className="mt-6 text-gray-500 max-w-xl mx-auto">
          上載相片、自由調整構圖，打造獨一無二嘅手機殼。簡約設計，品質之選。
        </p>
        <div className="mt-10">
          <Link to="/order" className="inline-block px-8 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition">
            開始設計
          </Link>
        </div>
        {/* 主視覺 placeholder */}
        <div className="mt-16 mx-auto max-w-3xl aspect-[16/9] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
          主視覺相片（placeholder）
        </div>
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