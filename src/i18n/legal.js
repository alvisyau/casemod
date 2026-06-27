// src/i18n/legal.js
// 各條款內容(三語)。footer 連結會自動讀取對應語言。

const SHELF = {
  email: 'info@casemod.shop',
}

export const legal = {
  'zh-HK': {
    faq: {
      title: '常見問題',
      blocks: [
        { type: 'qa', items: [
          { q: '落單後幾耐會發貨?', a: '現成系列商品一般會喺確認付款後 1–3 個工作天內安排發貨;客製商品因需人手製作,約需 3–5 個工作天,實際時間視乎訂單數量而定。' },
          { q: '點樣查詢我嘅訂單狀態?', a: '落單成功後你會收到訂單編號,我哋亦會透過 WhatsApp 同你確認付款及製作進度。如有查詢可隨時聯絡我哋。' },
          { q: '可唔可以修改或取消訂單?', a: '訂單一經提交並付款,如未進入製作或發貨階段,可聯絡我哋協助修改或取消。客製商品一旦開始製作,恕不接受取消。' },
          { q: '支援邊啲付款方式?', a: '我哋接受信用卡(Visa / Mastercard)、轉數快 FPS 及 PayMe。信用卡付款經 Stripe 加密處理,安全可靠。' },
          { q: '收到貨品有問題點算?', a: '如收到商品有破損或與訂單不符,請於收貨後 7 日內連同相片聯絡我哋,我哋會盡快為你跟進換貨事宜。' },
        ]},
      ],
    },
    privacy: {
      title: '私隱條例',
      blocks: [
        { type: 'p', text: 'Casemod(下稱「本店」)非常重視閣下嘅個人私隱。本私隱政策說明我哋如何收集、使用及保護你嘅個人資料。' },
        { type: 'h', text: '1. 收集嘅資料' },
        { type: 'p', text: '當你落單或聯絡我哋時,我哋可能會收集你嘅姓名、聯絡電話、電郵地址、送貨地址及付款相關資料。' },
        { type: 'h', text: '2. 資料用途' },
        { type: 'p', text: '所收集嘅個人資料僅用於處理訂單、安排送貨、客戶服務、發送訂單通知,以及在你同意下發送推廣資訊。' },
        { type: 'h', text: '3. 資料保護' },
        { type: 'p', text: '我哋採取合理嘅技術及管理措施保護你嘅個人資料。付款資料均經第三方加密支付平台(如 Stripe)處理,本店不會儲存你嘅完整信用卡資料。' },
        { type: 'h', text: '4. 資料披露' },
        { type: 'p', text: '除為完成訂單而需提供予物流公司或支付服務商外,本店不會在未經你同意下向第三方出售或披露你嘅個人資料,惟法律要求者除外。' },
        { type: 'h', text: '5. 查閱及更正' },
        { type: 'p', text: `根據《個人資料(私隱)條例》,你有權要求查閱及更正你嘅個人資料。如有需要,請透過 ${SHELF.email} 聯絡我哋。` },
        { type: 'h', text: '6. 政策更新' },
        { type: 'p', text: '本店保留隨時修訂本私隱政策嘅權利,修訂後嘅版本將於本網站公佈。' },
      ],
    },
    terms: {
      title: '條款及細則',
      blocks: [
        { type: 'p', text: '歡迎使用 Casemod。當你瀏覽本網站或落單購物,即表示你同意以下條款及細則。' },
        { type: 'h', text: '1. 訂單及接受' },
        { type: 'p', text: '所有訂單須經本店確認及收到付款後方告成立。本店保留因缺貨、定價錯誤或其他原因而拒絕或取消任何訂單嘅權利。' },
        { type: 'h', text: '2. 價格及付款' },
        { type: 'p', text: '所有價格以港幣(HKD)顯示,並可能因應情況調整,恕不另行通知。訂單價格以落單當時所示為準。' },
        { type: 'h', text: '3. 客製商品' },
        { type: 'p', text: '客製商品根據你提供嘅圖片及設計製作。請確保上載內容無侵犯任何第三方版權,因內容引起嘅任何法律責任概由顧客承擔。客製商品一經製作,除產品本身有瑕疵外,恕不接受退換。' },
        { type: 'h', text: '4. 知識產權' },
        { type: 'p', text: '本網站所有內容,包括圖片、設計、文字及商標,均為本店或其授權人所擁有,未經許可不得複製或使用。' },
        { type: 'h', text: '5. 責任限制' },
        { type: 'p', text: '本店已盡力確保網站資料準確,惟不保證完全無誤。在法律允許嘅最大範圍內,本店毋須就因使用本網站或產品而引致嘅任何間接損失負責。' },
        { type: 'h', text: '6. 適用法律' },
        { type: 'p', text: '本條款受香港特別行政區法律管轄,並按其詮釋。' },
      ],
    },
    shipping: {
      title: '送貨及換貨',
      blocks: [
        { type: 'h', text: '運送安排' },
        { type: 'ul', items: [
          '本店主要透過順豐速運安排送貨,顧客可選擇順豐站、智能櫃或住宅地址收件。',
          '現成系列一般於確認付款後 1–3 個工作天內發貨;客製商品約需 3–5 個工作天製作。',
          '發貨後我哋會提供物流單號,方便你追蹤包裹狀態。',
          '公眾假期及惡劣天氣可能影響派送時間,敬請見諒。',
        ]},
        { type: 'h', text: '運送費用' },
        { type: 'table', headers: ['目的地', '運費(HKD)'], rows: [
          ['香港', '免運費'], ['中國內地', '免運費'], ['澳門', '$60'], ['台灣', '$80'], ['其他地區', '$150'],
        ]},
        { type: 'note', text: '* 實際運費以結帳頁面顯示為準,海外運費可能因重量或政策調整。' },
        { type: 'h', text: '換貨安排' },
        { type: 'ul', items: [
          '如收到嘅商品有製造瑕疵、破損或與訂單不符,請於收貨後 7 日內連同商品相片及訂單編號聯絡我哋。',
          '換貨商品須保持全新及未使用狀態,並連同原裝包裝一併退回。',
          '客製商品因屬個人化製作,除產品本身有瑕疵外,恕不接受退換。',
          '因個人喜好(如顏色、款式)而要求退換,恕不受理。',
          '所有換貨個案須經本店審核確認,我哋會於收到申請後盡快回覆。',
        ]},
      ],
    },
  },

  'zh-CN': {
    faq: {
      title: '常见问题',
      blocks: [
        { type: 'qa', items: [
          { q: '下单后多久会发货?', a: '现成系列商品一般会在确认付款后 1–3 个工作天内安排发货;客制商品因需人手制作,约需 3–5 个工作天,实际时间视乎订单数量而定。' },
          { q: '怎样查询我的订单状态?', a: '下单成功后你会收到订单编号,我们也会通过 WhatsApp 与你确认付款及制作进度。如有查询可随时联系我们。' },
          { q: '可以修改或取消订单吗?', a: '订单一经提交并付款,如未进入制作或发货阶段,可联系我们协助修改或取消。客制商品一旦开始制作,恕不接受取消。' },
          { q: '支持哪些付款方式?', a: '我们接受信用卡(Visa / Mastercard)、转数快 FPS 及 PayMe。信用卡付款经 Stripe 加密处理,安全可靠。' },
          { q: '收到货品有问题怎么办?', a: '如收到商品有破损或与订单不符,请于收货后 7 日内连同相片联系我们,我们会尽快为你跟进换货事宜。' },
        ]},
      ],
    },
    privacy: {
      title: '隐私条例',
      blocks: [
        { type: 'p', text: 'Casemod(下称「本店」)非常重视您的个人隐私。本隐私政策说明我们如何收集、使用及保护您的个人资料。' },
        { type: 'h', text: '1. 收集的资料' },
        { type: 'p', text: '当您下单或联系我们时,我们可能会收集您的姓名、联系电话、电邮地址、送货地址及付款相关资料。' },
        { type: 'h', text: '2. 资料用途' },
        { type: 'p', text: '所收集的个人资料仅用于处理订单、安排送货、客户服务、发送订单通知,以及在您同意下发送推广资讯。' },
        { type: 'h', text: '3. 资料保护' },
        { type: 'p', text: '我们采取合理的技术及管理措施保护您的个人资料。付款资料均经第三方加密支付平台(如 Stripe)处理,本店不会储存您的完整信用卡资料。' },
        { type: 'h', text: '4. 资料披露' },
        { type: 'p', text: '除为完成订单而需提供予物流公司或支付服务商外,本店不会在未经您同意下向第三方出售或披露您的个人资料,惟法律要求者除外。' },
        { type: 'h', text: '5. 查阅及更正' },
        { type: 'p', text: `根据《个人资料(隐私)条例》,您有权要求查阅及更正您的个人资料。如有需要,请通过 ${SHELF.email} 联系我们。` },
        { type: 'h', text: '6. 政策更新' },
        { type: 'p', text: '本店保留随时修订本隐私政策的权利,修订后的版本将于本网站公布。' },
      ],
    },
    terms: {
      title: '条款及细则',
      blocks: [
        { type: 'p', text: '欢迎使用 Casemod。当您浏览本网站或下单购物,即表示您同意以下条款及细则。' },
        { type: 'h', text: '1. 订单及接受' },
        { type: 'p', text: '所有订单须经本店确认及收到付款后方告成立。本店保留因缺货、定价错误或其他原因而拒绝或取消任何订单的权利。' },
        { type: 'h', text: '2. 价格及付款' },
        { type: 'p', text: '所有价格以港币(HKD)显示,并可能因应情况调整,恕不另行通知。订单价格以下单当时所示为准。' },
        { type: 'h', text: '3. 客制商品' },
        { type: 'p', text: '客制商品根据您提供的图片及设计制作。请确保上传内容无侵犯任何第三方版权,因内容引起的任何法律责任概由顾客承担。客制商品一经制作,除产品本身有瑕疵外,恕不接受退换。' },
        { type: 'h', text: '4. 知识产权' },
        { type: 'p', text: '本网站所有内容,包括图片、设计、文字及商标,均为本店或其授权人所拥有,未经许可不得复制或使用。' },
        { type: 'h', text: '5. 责任限制' },
        { type: 'p', text: '本店已尽力确保网站资料准确,惟不保证完全无误。在法律允许的最大范围内,本店毋须就因使用本网站或产品而引致的任何间接损失负责。' },
        { type: 'h', text: '6. 适用法律' },
        { type: 'p', text: '本条款受香港特别行政区法律管辖,并按其诠释。' },
      ],
    },
    shipping: {
      title: '送货及换货',
      blocks: [
        { type: 'h', text: '运送安排' },
        { type: 'ul', items: [
          '本店主要通过顺丰速运安排送货,顾客可选择顺丰站、智能柜或住宅地址收件。',
          '现成系列一般于确认付款后 1–3 个工作天内发货;客制商品约需 3–5 个工作天制作。',
          '发货后我们会提供物流单号,方便您追踪包裹状态。',
          '公众假期及恶劣天气可能影响派送时间,敬请见谅。',
        ]},
        { type: 'h', text: '运送费用' },
        { type: 'table', headers: ['目的地', '运费(HKD)'], rows: [
          ['香港', '免运费'], ['中国内地', '免运费'], ['澳门', '$60'], ['台湾', '$80'], ['其他地区', '$150'],
        ]},
        { type: 'note', text: '* 实际运费以结算页面显示为准,海外运费可能因重量或政策调整。' },
        { type: 'h', text: '换货安排' },
        { type: 'ul', items: [
          '如收到的商品有制造瑕疵、破损或与订单不符,请于收货后 7 日内连同商品相片及订单编号联系我们。',
          '换货商品须保持全新及未使用状态,并连同原装包装一并退回。',
          '客制商品因属个人化制作,除产品本身有瑕疵外,恕不接受退换。',
          '因个人喜好(如颜色、款式)而要求退换,恕不受理。',
          '所有换货个案须经本店审核确认,我们会于收到申请后尽快回复。',
        ]},
      ],
    },
  },

  'en': {
    faq: {
      title: 'FAQ',
      blocks: [
        { type: 'qa', items: [
          { q: 'How soon will my order ship?', a: 'In-stock collection items are usually shipped within 1–3 working days after payment is confirmed. Custom items require handcrafting and take around 3–5 working days, depending on order volume.' },
          { q: 'How do I check my order status?', a: 'After ordering you will receive an order number, and we will also confirm payment and production progress with you via WhatsApp. Feel free to contact us anytime.' },
          { q: 'Can I modify or cancel my order?', a: 'Once an order is submitted and paid, it can be modified or cancelled if it has not yet entered production or shipping. Custom items cannot be cancelled once production has started.' },
          { q: 'What payment methods are supported?', a: 'We accept credit cards (Visa / Mastercard), FPS and PayMe. Card payments are processed securely through Stripe.' },
          { q: 'What if there is a problem with my item?', a: 'If your item arrives damaged or does not match your order, please contact us with photos within 7 days of receipt and we will follow up on an exchange as soon as possible.' },
        ]},
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      blocks: [
        { type: 'p', text: 'Casemod ("we", "us") takes your privacy seriously. This policy explains how we collect, use and protect your personal data.' },
        { type: 'h', text: '1. Information We Collect' },
        { type: 'p', text: 'When you place an order or contact us, we may collect your name, contact number, email address, delivery address and payment-related information.' },
        { type: 'h', text: '2. Use of Information' },
        { type: 'p', text: 'Personal data is used solely to process orders, arrange delivery, provide customer service, send order notifications, and — with your consent — send promotional information.' },
        { type: 'h', text: '3. Data Protection' },
        { type: 'p', text: 'We adopt reasonable technical and administrative measures to protect your data. Payment information is processed by third-party encrypted payment platforms (e.g. Stripe); we do not store your full credit card details.' },
        { type: 'h', text: '4. Disclosure' },
        { type: 'p', text: 'Except for sharing with logistics or payment providers as needed to fulfil your order, we will not sell or disclose your personal data to third parties without your consent, unless required by law.' },
        { type: 'h', text: '5. Access & Correction' },
        { type: 'p', text: `Under the Personal Data (Privacy) Ordinance, you have the right to request access to and correction of your personal data. Please contact us at ${SHELF.email}.` },
        { type: 'h', text: '6. Policy Updates' },
        { type: 'p', text: 'We reserve the right to revise this policy at any time. The latest version will be published on this website.' },
      ],
    },
    terms: {
      title: 'Terms & Conditions',
      blocks: [
        { type: 'p', text: 'Welcome to Casemod. By browsing this website or placing an order, you agree to the following terms and conditions.' },
        { type: 'h', text: '1. Orders & Acceptance' },
        { type: 'p', text: 'All orders are confirmed only after we accept them and receive payment. We reserve the right to refuse or cancel any order due to stock shortage, pricing errors or other reasons.' },
        { type: 'h', text: '2. Pricing & Payment' },
        { type: 'p', text: 'All prices are shown in Hong Kong Dollars (HKD) and may change without prior notice. The price shown at the time of ordering applies.' },
        { type: 'h', text: '3. Custom Products' },
        { type: 'p', text: 'Custom items are made based on the images and designs you provide. Please ensure your content does not infringe any third-party copyright; any legal liability arising from the content rests with the customer. Once produced, custom items cannot be returned or exchanged unless defective.' },
        { type: 'h', text: '4. Intellectual Property' },
        { type: 'p', text: 'All content on this website, including images, designs, text and trademarks, belongs to us or our licensors and may not be copied or used without permission.' },
        { type: 'h', text: '5. Limitation of Liability' },
        { type: 'p', text: 'We strive to keep website information accurate but do not guarantee it is error-free. To the maximum extent permitted by law, we are not liable for any indirect loss arising from use of this website or products.' },
        { type: 'h', text: '6. Governing Law' },
        { type: 'p', text: 'These terms are governed by and construed in accordance with the laws of the Hong Kong SAR.' },
      ],
    },
    shipping: {
      title: 'Shipping & Returns',
      blocks: [
        { type: 'h', text: 'Delivery Arrangements' },
        { type: 'ul', items: [
          'We mainly ship via SF Express. You may choose an SF Store, smart locker or home address for delivery.',
          'Collection items are usually shipped within 1–3 working days after payment; custom items take around 3–5 working days to produce.',
          'A tracking number will be provided after shipment so you can follow your parcel.',
          'Public holidays and adverse weather may affect delivery times. Thank you for your understanding.',
        ]},
        { type: 'h', text: 'Shipping Fees' },
        { type: 'table', headers: ['Destination', 'Fee (HKD)'], rows: [
          ['Hong Kong', 'Free'], ['Mainland China', 'Free'], ['Macau', '$60'], ['Taiwan', '$80'], ['Other regions', '$150'],
        ]},
        { type: 'note', text: '* Actual shipping is shown at checkout. Overseas fees may vary by weight or policy.' },
        { type: 'h', text: 'Exchange Policy' },
        { type: 'ul', items: [
          'If your item is defective, damaged or does not match your order, contact us with photos and your order number within 7 days of receipt.',
          'Items for exchange must be unused and in their original condition and packaging.',
          'Custom items, being personalised, cannot be returned or exchanged unless defective.',
          'Exchanges due to personal preference (e.g. colour, style) are not accepted.',
          'All exchange cases are subject to our review. We will respond as soon as we receive your request.',
        ]},
      ],
    },
  },
}

// footer 連結顯示次序
export const LEGAL_KEYS = ['faq', 'shipping', 'privacy', 'terms']