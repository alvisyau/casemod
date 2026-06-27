export function pickLang(obj, field, lang) {
  if (!obj) return ''
  const map = {
    'zh-HK': obj[`${field}_zh_hk`],
    'zh-CN': obj[`${field}_zh_cn`],
    'en':    obj[`${field}_en`],
  }
  // 順序 fallback:目前語言 → 繁中(_zh_hk)→ 舊 description 欄 → 簡中 → 英文
  return map[lang] || obj[`${field}_zh_hk`] || obj[field] || map['zh-CN'] || map['en'] || ''
}
