import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Move, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBranding } from '../hooks/useBranding'
import { useLang } from '../context/LanguageContext'

// 自動輪播主視覺
function HeroCarousel({ images, placeholder }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [images.length])

  const go = (next) => {
    setIdx((i) => (i + next + images.length) % images.length)
  }

  if (images.length === 0) {
    return (
      <div className="mt-16 mx-auto max-w-3xl">
        <div className="aspect-[16/9] flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
          {placeholder}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16 mx-auto max-w-3xl">
      {/* 簡潔白框 + 淺灰邊 + 柔和陰影 */}
      <div className="group relative aspect-[16/9] overflow-hidden rounded-3xl ">
        {images.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            className={`absolute inset-0 h-full w-full object-contain transition-all duration-1000 ${
              i === idx ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          />
        ))}

        {images.length > 1 && (
          <>
            {/* 左右切換箭頭，hover 先顯示 */}
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 shadow-md backdrop-blur transition hover:bg-white group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 shadow-md backdrop-blur transition hover:bg-white group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* 圓點 */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === idx ? 'w-6 bg-gray-800' : 'w-2 bg-gray-300 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Home() {
  const branding = useBranding()
  const { t } = useLang()
  const heroImages = Array.isArray(branding?.hero_images) ? branding.hero_images : []

  const features = [
    {
      icon: Camera,
      title: t('home.f1Title'),
      desc: t('home.f1Desc'),
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Move,
      title: t('home.f2Title'),
      desc: t('home.f2Desc'),
      gradient: 'from-fuchsia-500 to-purple-500',
    },
    {
      icon: ShieldCheck,
      title: t('home.f3Title'),
      desc: t('home.f3Desc'),
      gradient: 'from-pink-500 to-rose-500',
    },
  ]

  return (
    <div>
      {/* 主視覺 */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
        <p className="text-sm font-semibold tracking-[0.3em] uppercase mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t('home.eyebrow')}
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          {t('home.title1')}<br />{t('home.title2')}
        </h1>
        <p className="mt-6 text-base sm:text-lg font-semibold leading-relaxed bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t('home.subtitle')}
        </p>
        <div className="mt-10">
          <Link to="/order" className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg shadow-purple-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl transition">
            {t('home.startDesign')}
          </Link>
        </div>

        <HeroCarousel images={heroImages} placeholder={t('home.heroPlaceholder')} />
      </section>

      {/* 賣點 */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid sm:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc, gradient }) => (
          <div
            key={title}
            className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-transparent"
          >
            <div
              className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon className="h-7 w-7" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
            <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
          </div>
        ))}
      </section>

      {/* 下方 CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-gray-900 text-white rounded-2xl px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('home.ctaTitle')}</h2>
          <Link to="/order" className="mt-8 inline-block px-8 py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-100 transition">
            {t('home.ctaButton')}
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home