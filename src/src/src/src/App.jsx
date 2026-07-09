import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, Plus, Copy, Check, Loader2, Mail, Send, Instagram, LogOut } from 'lucide-react';

/* ============================================================
   CONFIG — swap these for your real values
   ============================================================ */
const STORAGE_KEY = 'kaze:v2:products';
const ADMIN_PASSWORD = 'YAS.RANY.377105';
const NOWPAYMENTS_API_KEY = 'VCJ60DE-3AAMYDW-J2TR8XS-0KS7XV8';
const FALLBACK_WALLET = 'TJnm9YWS4PDZYButYYoWps5UBMErzs1AmF';
// Replace with your real hero photo (e.g. your lh3.googleusercontent.com/d/FILE_ID link)
const BACKGROUND_IMAGE_URL = 'https://lh3.googleusercontent.com/d/1Qzome9FeRn_4OJl7qMwqrt4TeumjbuNq';
const CONTACT_EMAIL = 'kaze.2.7.7.9.3@gmail.com';
const TELEGRAM_HANDLE = 'RYNA_277';
const INSTAGRAM_HANDLE = 'ryna.277';
const TG_BOT_TOKEN = '8749577675:AAG7K0ge1ICSF44z0s3ScHY2QSiWsf04DyU';
const TG_CHAT_ID = '8895154067';

/* Send Telegram notification on successful order */
async function sendTelegramNotification({ orderId, email, product, amount, type, address }) {
  const addrLine = address
    ? `\n🏠 *Address:* ${address.address1}, ${address.city}, ${address.country}`
    : '';
  const text =
    `🛒 *New Order — Kaze*\n` +
    `━━━━━━━━━━━━━━\n` +
    `📦 *Product:* ${product}\n` +
    `🏷 *Type:* ${type === 'physical' ? '📮 Physical' : '💾 Digital'}\n` +
    `💰 *Amount:* $${amount} USDT\n` +
    `📧 *Customer:* ${email}\n` +
    `🔖 *Order ID:* \`${orderId}\`` +
    addrLine + `\n━━━━━━━━━━━━━━`;
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' }),
    });
  } catch (e) { console.error('Telegram notify failed', e); }
}

/* ============================================================
   PRINTIFY CONFIG
   ============================================================ */
const PRINTIFY_API_TOKEN = 'YOUR_PRINTIFY_API_TOKEN'; // ← ضع التوكن هنا
const PRINTIFY_SHOP_ID   = 'YOUR_PRINTIFY_SHOP_ID';   // ← ضع Shop ID هنا

async function sendPrintifyOrder({ product, address, orderId }) {
  const payload = {
    external_id: orderId,
    label: `Kaze Order #${orderId}`,
    line_items: [{
      product_id: product.printifyProductId,
      variant_id: Number(product.printifyVariantId),
      quantity: 1,
    }],
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: {
      first_name: address.first_name,
      last_name:  address.last_name,
      email:      address.email,
      phone:      address.phone,
      country:    address.country,
      region:     address.region,
      address1:   address.address1,
      city:       address.city,
      zip:        address.zip,
      ...(address.tax_id ? { tax_identifier: address.tax_id } : {}),
    },
  };
  try {
    await fetch(`https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) { console.error('Printify order failed', e); }
}

/* ============================================================
   BLOCKED COUNTRIES
   ============================================================ */
const BLOCKED_COUNTRIES = new Set([
  'RU','BY','KP','IR','SY','UA','PS','IL',
  'IN','PK','AF','LK','BD',
  'PH','VN','TH','LA','KH','MM','BT','NP',
  'IQ','JO','LB','YE',
  // Africa
  'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CD','CG','DJ',
  'EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','CI','KE','LS','LR',
  'LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN',
  'SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW',
]);

const COUNTRIES = [
  // North America
  {c:'US',n:'United States'},{c:'CA',n:'Canada'},
  // Europe
  {c:'GB',n:'United Kingdom'},{c:'DE',n:'Germany'},{c:'FR',n:'France'},
  {c:'IT',n:'Italy'},{c:'ES',n:'Spain'},{c:'NL',n:'Netherlands'},
  {c:'BE',n:'Belgium'},{c:'AT',n:'Austria'},{c:'CH',n:'Switzerland'},
  {c:'SE',n:'Sweden'},{c:'NO',n:'Norway'},{c:'DK',n:'Denmark'},
  {c:'FI',n:'Finland'},{c:'PT',n:'Portugal'},{c:'IE',n:'Ireland'},
  {c:'PL',n:'Poland'},{c:'CZ',n:'Czech Republic'},{c:'HU',n:'Hungary'},
  {c:'RO',n:'Romania'},{c:'GR',n:'Greece'},{c:'HR',n:'Croatia'},
  {c:'SK',n:'Slovakia'},{c:'BG',n:'Bulgaria'},{c:'LT',n:'Lithuania'},
  {c:'LV',n:'Latvia'},{c:'EE',n:'Estonia'},{c:'SI',n:'Slovenia'},
  {c:'AL',n:'Albania'},{c:'AD',n:'Andorra'},{c:'BA',n:'Bosnia & Herzegovina'},
  {c:'CY',n:'Cyprus'},{c:'GI',n:'Gibraltar'},{c:'IS',n:'Iceland'},
  {c:'XK',n:'Kosovo'},{c:'LI',n:'Liechtenstein'},{c:'LU',n:'Luxembourg'},
  {c:'MT',n:'Malta'},{c:'MD',n:'Moldova'},{c:'MC',n:'Monaco'},
  {c:'ME',n:'Montenegro'},{c:'MK',n:'North Macedonia'},{c:'SM',n:'San Marino'},
  {c:'RS',n:'Serbia'},{c:'VA',n:'Vatican City'},
  // Middle East (allowed)
  {c:'SA',n:'Saudi Arabia'},{c:'AE',n:'United Arab Emirates'},
  {c:'QA',n:'Qatar'},{c:'OM',n:'Oman'},{c:'KW',n:'Kuwait'},
  {c:'BH',n:'Bahrain'},{c:'TR',n:'Turkey'},
  // Asia (allowed)
  {c:'AU',n:'Australia'},{c:'NZ',n:'New Zealand'},
  {c:'JP',n:'Japan'},{c:'KR',n:'South Korea'},{c:'SG',n:'Singapore'},
  {c:'MY',n:'Malaysia'},{c:'ID',n:'Indonesia'},{c:'CN',n:'China'},
  {c:'HK',n:'Hong Kong'},{c:'TW',n:'Taiwan'},{c:'MN',n:'Mongolia'},
  {c:'BN',n:'Brunei'},
  {c:'AM',n:'Armenia'},{c:'AZ',n:'Azerbaijan'},{c:'GE',n:'Georgia'},
  {c:'KZ',n:'Kazakhstan'},{c:'KG',n:'Kyrgyzstan'},{c:'TJ',n:'Tajikistan'},
  {c:'TM',n:'Turkmenistan'},{c:'UZ',n:'Uzbekistan'},
  // South America (selected)
  {c:'BR',n:'Brazil (CPF required)'},{c:'CL',n:'Chile (RUT required)'},
  // Central America & Caribbean
  {c:'BZ',n:'Belize'},{c:'CR',n:'Costa Rica'},{c:'SV',n:'El Salvador'},
  {c:'GT',n:'Guatemala'},{c:'HN',n:'Honduras'},{c:'NI',n:'Nicaragua'},
  {c:'PA',n:'Panama'},{c:'BB',n:'Barbados'},{c:'BS',n:'Bahamas'},
  {c:'DM',n:'Dominica'},{c:'DO',n:'Dominican Republic'},{c:'GD',n:'Grenada'},
  {c:'HT',n:'Haiti'},{c:'JM',n:'Jamaica'},{c:'LC',n:'Saint Lucia'},
  {c:'KN',n:'Saint Kitts & Nevis'},{c:'VC',n:'Saint Vincent'},
  {c:'TT',n:'Trinidad & Tobago'},{c:'AG',n:'Antigua & Barbuda'},
  // Oceania
  {c:'FJ',n:'Fiji'},{c:'PG',n:'Papua New Guinea'},{c:'WS',n:'Samoa'},
  {c:'TO',n:'Tonga'},{c:'VU',n:'Vanuatu'},{c:'SB',n:'Solomon Islands'},
  {c:'KI',n:'Kiribati'},{c:'FM',n:'Micronesia'},{c:'PW',n:'Palau'},
  {c:'MH',n:'Marshall Islands'},{c:'NR',n:'Nauru'},{c:'TV',n:'Tuvalu'},
];

const heading = { fontFamily: "'Cormorant Garamond', serif" };
const script = { fontFamily: "'Alex Brush', cursive" };
const display = { fontFamily: "'Playfair Display', Georgia, serif" };

/* ============================================================
   GLOBAL STYLES — fonts + custom keyframes (Tailwind core only,
   so shimmer/glow need real CSS, injected once)
   ============================================================ */
function useGlobalStyles() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      * { font-family: 'Inter', sans-serif; }
      @keyframes kazeShimmer { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }
      @keyframes kazeGlow { 0%, 100% { box-shadow: 0 0 10px 0 rgba(129,140,248,.55), 0 0 0 1px rgba(129,140,248,.4); } 50% { box-shadow: 0 0 26px 6px rgba(129,140,248,.85), 0 0 0 1px rgba(129,140,248,.7); } }
      @keyframes kazeFadeUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
      @keyframes kazeSlideLeft { from { opacity:0; transform: translateX(-32px); } to { opacity:1; transform: translateX(0); } }
      @keyframes kazeSlideRight { from { opacity:0; transform: translateX(32px); } to { opacity:1; transform: translateX(0); } }
      @keyframes kazeScaleIn { from { opacity:0; transform: scale(0.92); } to { opacity:1; transform: scale(1); } }
      @keyframes kazePulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      @keyframes kazeCountUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
      .kaze-in-view { animation: kazeFadeUp .65s cubic-bezier(.22,1,.36,1) both; }
      .kaze-in-view-left { animation: kazeSlideLeft .65s cubic-bezier(.22,1,.36,1) both; }
      .kaze-in-view-right { animation: kazeSlideRight .65s cubic-bezier(.22,1,.36,1) both; }
      .kaze-in-view-scale { animation: kazeScaleIn .65s cubic-bezier(.22,1,.36,1) both; }
      .kaze-stat-line { background: linear-gradient(90deg, transparent, #818cf8, transparent); background-size: 200% 1px; animation: kazeShimmer 3s linear infinite; }
      .kaze-cta {
        background-image: linear-gradient(110deg, #818cf8 25%, #e0e7ff 50%, #818cf8 75%);
        background-size: 220% 100%;
        animation: kazeShimmer 2.8s linear infinite, kazeGlow 2.6s ease-in-out infinite;
      }
      .kaze-card { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
      .kaze-card:hover { transform: translateY(-6px); border-color: #818cf8; box-shadow: 0 16px 32px -12px rgba(129,140,248,.4); }
      .kaze-fade-up { animation: kazeFadeUp .6s ease both; }
      .kaze-scrollbar-hide::-webkit-scrollbar { display: none; }
      .kaze-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      @media (prefers-reduced-motion: reduce) {
        .kaze-cta, .kaze-fade-up { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
    document.title = 'KAZE — Premium Art Calendars';
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);
}

/* ============================================================
   ROOT APP — hash routing + product persistence
   ============================================================ */
export default function App() {
  useGlobalStyles();
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setProducts(res?.value ? JSON.parse(res.value) : []);
      } catch (e) {
        setProducts([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persistProducts = async (next) => {
    setProducts(next);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save products', e);
    }
  };

  if (route === '#/admin') {
    return <AdminPanel products={products} persistProducts={persistProducts} loaded={loaded} />;
  }
  return <Storefront products={products} loaded={loaded} />;
}

/* ============================================================
   STOREFRONT
   ============================================================ */
function Storefront({ products, loaded }) {
  const [scrolled, setScrolled] = useState(false);
  const [sizeModal, setSizeModal]     = useState(null); // { product }
  const [addressModal, setAddressModal] = useState(null); // { product, selectedVariant }
  const [paymentModal, setPaymentModal] = useState(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToProducts = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });

  const handleBuyNow = (product) => {
    if (product.type === 'physical') {
      const filled = (product.variants || []).filter(v => v.variantId && v.price > 0);
      if (filled.length > 1) {
        setSizeModal({ product });
      } else {
        const sv = filled[0] || { size: 'Standard', price: product.price, variantId: product.printifyVariantId };
        setAddressModal({ product, selectedVariant: sv });
      }
    } else {
      setPaymentModal({ step: 'creating', product, address: null, selectedVariant: null });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar scrolled={scrolled} />
      <Hero />
      <HeroContent currentYear={currentYear} onShopNow={scrollToProducts} />
      <StatsStrip />
      <FeaturesSection onShopNow={scrollToProducts} />
      <CTABanner onShopNow={scrollToProducts} />
      <Products products={products} loaded={loaded} onBuyNow={handleBuyNow} />
      <Contact />
      <Footer currentYear={currentYear} />

      {sizeModal && (
        <SizeModal
          product={sizeModal.product}
          onSelect={(sv) => {
            setSizeModal(null);
            setAddressModal({ product: sizeModal.product, selectedVariant: sv });
          }}
          onClose={() => setSizeModal(null)}
        />
      )}

      {addressModal && (
        <AddressModal
          product={addressModal.product}
          selectedVariant={addressModal.selectedVariant}
          onConfirm={(address) => {
            setAddressModal(null);
            setPaymentModal({ step: 'creating', product: addressModal.product, address, selectedVariant: addressModal.selectedVariant });
          }}
          onClose={() => setAddressModal(null)}
        />
      )}

      {paymentModal && (
        <PaymentModal state={paymentModal} setState={setPaymentModal} onClose={() => setPaymentModal(null)} />
      )}
    </div>
  );
}

/* ---------- Navbar ---------- */
function Navbar({ scrolled }) {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        <a href="#/" className="text-3xl sm:text-4xl select-none" style={script}>
          <span className="text-indigo-400">Ka</span>
          <span className="text-white">ze</span>
        </a>
        <div className="hidden sm:flex items-center gap-8 text-sm tracking-wide text-white/80">
          <a href="#shop" className="hover:text-white transition-colors">Shop</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
        <a
          href="#shop"
          className="kaze-cta text-black text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:scale-105 transition-transform duration-200 whitespace-nowrap"
        >
          Claim a Spot ↗
        </a>
      </div>
    </nav>
  );
}

/* ---------- Hero — image + KAZE only ---------- */
function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
          filter: 'brightness(0.88)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black" />

      {/* Giant KAZE background text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ zIndex: 1 }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(140px, 32vw, 420px)',
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'transparent',
            WebkitTextStroke: '1.5px rgba(255,255,255,0.07)',
            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          KAZE
        </span>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce" style={{ zIndex: 2 }}>↓</div>
    </section>
  );
}

/* ---------- HeroContent — full text section right below ---------- */
function HeroContent({ currentYear, onShopNow }) {
  return (
    <section className="relative bg-black py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center kaze-fade-up">
        <span className="inline-block bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs sm:text-sm tracking-wide text-white/90 mb-8">
          <span className="text-indigo-400 font-semibold">New Drop</span> · Printable Calendars {currentYear} &amp; {currentYear + 1} — Available Now
        </span>

        <h1 className="text-5xl sm:text-7xl font-bold italic leading-tight mb-6" style={display}>
          Premium Calendars.<br />
          <span className="text-indigo-400">Iconic Walls.</span>
        </h1>

        <p className="text-base sm:text-lg text-white/65 max-w-lg mx-auto mb-10 leading-relaxed tracking-wide">
          High-quality <strong className="text-white/90 font-medium">printable calendars &amp; wall art</strong> in JDM, anime, and cinematic themes. Download instantly. Print. Frame it. Live with it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={onShopNow}
            className="bg-white text-black px-8 py-3 rounded-full text-sm font-semibold tracking-wide hover:bg-indigo-400 hover:text-black transition-colors duration-200 w-full sm:w-auto"
          >
            Browse & Buy ↗
          </button>
          <button
            onClick={onShopNow}
            className="text-white/80 text-sm font-medium tracking-wide hover:text-white transition-colors flex items-center gap-1.5"
          >
            See All Calendars <span>▶</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm text-white/40 tracking-wide">
          {['Calendars', 'Posters', 'Custom Prints', 'Art Prints', 'Wall Art'].map((tag, i, arr) => (
            <React.Fragment key={tag}>
              <span>{tag}</span>
              {i < arr.length - 1 && <span className="text-white/20">·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── useInView hook — triggers animation when element enters viewport ── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* ── Animated counter hook ── */
function useCounter(target, inView, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return count;
}

/* ── Stats Strip ── */
function StatsStrip() {
  const [ref, inView] = useInView();
  const c1 = useCounter(104, inView);
  const c2 = useCounter(100, inView);
  const c3 = useCounter(35,  inView);
  const c4 = useCounter(30,  inView);

  const stats = [
    { value: c1,  suffix: '+', label: 'Countries Worldwide' },
    { value: c2,  suffix: '+', label: 'Unique Designs' },
    { value: c3,  suffix: ' days', label: 'Max Delivery Time' },
    { value: c4,  suffix: ' min', label: 'Crypto Checkout' },
  ];

  return (
    <section ref={ref} className="relative bg-black border-y border-white/5 py-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px kaze-stat-line" />
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4 text-center">
          {stats.map((s, i) => (
            <div
              key={i}
              className={inView ? 'kaze-in-view' : 'opacity-0'}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="text-4xl sm:text-5xl font-bold text-white mb-1" style={display}>
                {s.value}<span className="text-indigo-400">{s.suffix}</span>
              </div>
              <div className="text-xs sm:text-sm text-white/40 tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px kaze-stat-line" />
    </section>
  );
}

/* ── Features Section ── */
function FeaturesSection({ onShopNow }) {
  const [ref, inView] = useInView();

  const features = [
    {
      icon: '🎨',
      title: 'Exclusive Themes',
      desc: 'JDM cars, anime aesthetics, and cinematic art — designs you won\'t find anywhere else.',
      delay: '0s',
    },
    {
      icon: '💾',
      title: 'Instant Download',
      desc: 'Digital products delivered in seconds after payment. Print anywhere, any size.',
      delay: '0.1s',
    },
    {
      icon: '📮',
      title: 'Worldwide Shipping',
      desc: 'Physical prints shipped to 100+ countries via Printify\'s global network.',
      delay: '0.2s',
    },
    {
      icon: '🔐',
      title: 'Crypto Checkout',
      desc: 'Pay securely with USDT (TRC20). Fast, private, no banks involved.',
      delay: '0.3s',
    },
  ];

  return (
    <section ref={ref} className="relative bg-black py-20 sm:py-28 overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(129,140,248,0.06) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className={`text-center mb-14 sm:mb-20 ${inView ? 'kaze-in-view' : 'opacity-0'}`}>
          <p className="text-indigo-400 text-xs tracking-[0.25em] font-semibold uppercase mb-3">Why Kaze</p>
          <h2 className="text-4xl sm:text-6xl font-bold italic" style={display}>
            Built Different.
          </h2>
          <p className="text-white/40 text-base mt-4 max-w-md mx-auto">
            Every detail designed for people who take their walls seriously.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl p-7 border border-white/8 transition-all duration-300 hover:-translate-y-2 ${inView ? 'kaze-in-view' : 'opacity-0'}`}
              style={{
                animationDelay: f.delay,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.08) 0%, transparent 60%)', border: '1px solid rgba(129,140,248,0.2)' }} />

              <span className="text-4xl block mb-5">{f.icon}</span>
              <h3 className="font-bold text-lg mb-2 text-white">{f.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA Banner ── */
function CTABanner({ onShopNow }) {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.12) 0%, rgba(0,0,0,0) 50%, rgba(129,140,248,0.08) 100%)' }} />
      <div className="absolute inset-0 border-y border-indigo-400/10" />

      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 0% 0%, rgba(129,140,248,0.15), transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 100% 100%, rgba(129,140,248,0.15), transparent 70%)' }} />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <div className={inView ? 'kaze-in-view' : 'opacity-0'}>
          <p className="text-indigo-400 text-xs tracking-[0.25em] font-semibold uppercase mb-5">Limited Drops</p>
          <h2 className="text-5xl sm:text-7xl font-bold italic leading-tight mb-6" style={display}>
            Your Next Favorite<br />
            <span className="text-indigo-400">Wall Piece</span> Is Here.
          </h2>
          <p className="text-white/50 text-base sm:text-lg mb-10 leading-relaxed max-w-lg mx-auto">
            JDM legends. Anime icons. Cinematic art. All printable, all premium, all Kaze.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onShopNow}
              className="kaze-cta text-black font-bold px-10 py-4 rounded-full text-base hover:scale-105 transition-transform w-full sm:w-auto"
            >
              Shop the Collection ↗
            </button>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              New drops every season
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function Products({ products, loaded, onBuyNow }) {
  const [page, setPage] = useState(1);
  const perPage = 9;
  const totalPages = Math.max(1, Math.ceil(products.length / perPage));
  const visible = products.slice((page - 1) * perPage, page * perPage);

  return (
    <section id="shop" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
      <div className="mb-12 sm:mb-16 text-center">
        <p className="text-indigo-400 text-xs tracking-[0.2em] font-semibold uppercase mb-3">Our Collection</p>
        <h2 className="text-4xl sm:text-5xl italic font-medium mb-4" style={heading}>Premium Art Prints</h2>
        <div className="w-9 h-px bg-indigo-400 mx-auto" />
      </div>

      {!loaded ? (
        <div className="text-center text-white/40 py-16 text-sm">Loading collection…</div>
      ) : products.length === 0 ? (
        <div className="text-center text-white/40 py-16 text-sm">
          No products yet. Add your first piece from the admin panel.
        </div>
      ) : (
        <>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} onBuyNow={onBuyNow} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-14">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                    page === n ? 'bg-indigo-400 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ProductCard({ product, onBuyNow }) {
  const [imgIndex, setImgIndex] = useState(0);
  const images = product.images?.length ? product.images : [];
  const filledVariants = (product.variants || []).filter(v => v.variantId && v.price > 0);
  const isMultiSize = filledVariants.length > 1;
  const [selectedVariant, setSelectedVariant] = useState(filledVariants[0] || null);

  const prevImg = (e) => { e.stopPropagation(); setImgIndex(i => (i - 1 + images.length) % images.length); };
  const nextImg = (e) => { e.stopPropagation(); setImgIndex(i => (i + 1) % images.length); };

  const displayPrice = isMultiSize
    ? (selectedVariant?.price ?? filledVariants[0]?.price)
    : (filledVariants[0]?.price ?? product.price);

  const handleBuy = () => {
    if (isMultiSize && selectedVariant) {
      onBuyNow({ ...product, price: selectedVariant.price, printifyVariantId: selectedVariant.variantId });
    } else {
      onBuyNow(product);
    }
  };

  return (
    <div className="kaze-card bg-[#080808] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div className="relative w-full aspect-[4/5] bg-white/5">
        {images.length > 0
          ? <img src={images[imgIndex]} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No image</div>
        }
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-indigo-400' : 'bg-white/40'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base flex-1">{product.name}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${product.type === 'physical' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-400/15 text-indigo-400'}`}>
            {product.type === 'physical' ? '📮 Physical' : '💾 Digital'}
          </span>
        </div>

        {product.description && <p className="text-sm text-white/50 leading-snug">{product.description}</p>}
        {product.type === 'physical' && <p className="text-xs text-white/35">🚚 Delivery: 7–35 business days</p>}

        {/* Size selector for multi-variant products */}
        {isMultiSize && (
          <div className="flex gap-1.5 mt-1">
            {filledVariants.map((v, i) => (
              <button
                key={i}
                onClick={() => setSelectedVariant(v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedVariant?.label === v.label
                    ? 'bg-indigo-400/20 border-indigo-400 text-indigo-400'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="italic text-lg text-indigo-400" style={heading}>${displayPrice}</span>
          <button onClick={handleBuy} className="bg-indigo-400 text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-indigo-300 transition-colors">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Contact ---------- */
const CONTACT_BG = 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=2400&auto=format&fit=crop';

function Contact() {
  const cards = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-indigo-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75"/>
        </svg>
      ),
      label: 'EMAIL',
      title: 'Have a Question?',
      text: 'Reach out for support, order status, or anything about your purchase.',
      cta: 'Email Us',
      href: `mailto:${CONTACT_EMAIL}`,
      detail: CONTACT_EMAIL,
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-indigo-400">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.29 13.67l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.858.889z"/>
        </svg>
      ),
      label: 'TELEGRAM',
      title: 'Custom Calendar?',
      text: 'Want a calendar with your own theme? We build custom orders on request.',
      cta: 'Message on Telegram',
      href: `https://t.me/${TELEGRAM_HANDLE}`,
      detail: `@${TELEGRAM_HANDLE}`,
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-indigo-400">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
      label: 'INSTAGRAM',
      title: 'Follow Our Drops',
      text: 'New themes, behind-the-scenes, and limited collections — first on Instagram.',
      cta: 'Follow Us',
      href: `https://instagram.com/${INSTAGRAM_HANDLE}`,
      detail: `@${INSTAGRAM_HANDLE}`,
    },
  ];

  return (
    <section
      id="contact"
      className="relative w-full py-24 sm:py-36 overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${CONTACT_BG})`,
          filter: 'brightness(0.35)',
        }}
      />
      {/* Top fade from black */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />
      {/* Bottom fade to black */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="mb-14 sm:mb-20 text-center">
          <p className="text-indigo-400 text-xs tracking-[0.25em] font-semibold uppercase mb-4">Reach Out</p>
          <h2
            className="text-4xl sm:text-6xl font-bold italic mb-4"
            style={display}
          >
            Get In Touch
          </h2>
          <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto">
            We're here for orders, custom requests, and everything in between.
          </p>
        </div>

        {/* Glass cards grid */}
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {cards.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col gap-4 rounded-2xl p-7 overflow-hidden transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(129,140,248,0.08) 0%, transparent 60%)',
                  border: '1px solid rgba(129,140,248,0.25)',
                }}
              />

              {/* Label pill */}
              <span className="text-[10px] tracking-[0.2em] font-semibold text-indigo-400 uppercase">
                {c.label}
              </span>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(129,140,248,0.12)' }}>
                {c.icon}
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1.5 flex-1">
                <h3 className="font-semibold text-lg text-white">{c.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{c.text}</p>
              </div>

              {/* Detail + CTA */}
              <div className="mt-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs text-white/35 mb-2">{c.detail}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  {c.cta} →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer({ currentYear }) {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/40">
        <span className="text-2xl" style={script}>
          <span className="text-indigo-400">Ka</span>ze
        </span>
        <span>© {currentYear + 1} Kaze. All rights reserved.</span>
      </div>
    </footer>
  );
}

/* ============================================================
   SIZE MODAL — shown when physical product has multiple variants
   ============================================================ */
function SizeModal({ product, onSelect, onClose }) {
  const filled = (product.variants || []).filter(v => v.variantId && v.price > 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#080808] border border-white/10 rounded-2xl w-full max-w-sm p-7">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={18} /></button>
        <h3 className="text-xl font-bold italic mb-1" style={display}>Choose Size</h3>
        <p className="text-xs text-white/40 mb-6">📦 {product.name}</p>
        <div className="flex flex-col gap-3">
          {filled.map((v) => (
            <button
              key={v.variantId}
              onClick={() => onSelect(v)}
              className="flex items-center justify-between bg-white/5 border border-white/10 hover:border-indigo-400 rounded-xl px-5 py-4 transition-colors group"
            >
              <span className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{v.size}</span>
              <span className="text-indigo-400 font-bold text-lg italic" style={display}>${v.price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ADDRESS MODAL — shown for physical products before payment
   ============================================================ */
function AddressModal({ product, selectedVariant, onConfirm, onClose }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    country: '', region: '', city: '', address1: '', zip: '',
    tax_id: '',
  });
  const [blocked, setBlocked] = useState(false);
  const needsTaxId = ['BR','CL'].includes(form.country);
  const taxIdLabel = form.country === 'BR' ? 'CPF (Brazil Tax ID)' : form.country === 'CL' ? 'RUT (Chile Tax ID)' : '';
  const taxIdPlaceholder = form.country === 'BR' ? '000.000.000-00' : '12.345.678-9';

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (k === 'country') setBlocked(BLOCKED_COUNTRIES.has(val));
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 transition-colors w-full text-white placeholder-white/25";
  const selectCls = inputCls + ' appearance-none';

  const submit = (e) => {
    e.preventDefault();
    if (blocked) return;
    onConfirm(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#080808] border border-white/10 rounded-2xl w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto kaze-scrollbar-hide">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={18} /></button>

        <h3 className="text-xl font-bold italic mb-1" style={display}>Shipping Address</h3>
        <p className="text-xs text-white/40 mb-6">📦 {product.name} · 🚚 7–35 business days</p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name">
              <input value={form.first_name} onChange={set('first_name')} required placeholder="John" className={inputCls} />
            </Field>
            <Field label="Last Name">
              <input value={form.last_name} onChange={set('last_name')} required placeholder="Doe" className={inputCls} />
            </Field>
          </div>

          <Field label="Email">
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@email.com" className={inputCls} />
          </Field>

          <Field label="Phone">
            <input value={form.phone} onChange={set('phone')} required placeholder="+1 555 000 0000" className={inputCls} />
          </Field>

          <Field label="Country">
            <select value={form.country} onChange={set('country')} required className={selectCls}>
              <option value="">— Select Country —</option>
              {COUNTRIES.map(({ c, n }) => (
                <option key={c} value={c}>{n}</option>
              ))}
            </select>
          </Field>

          {/* Blocked country warning */}
          {blocked && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium">⚠️ We don't ship to this location</p>
              <p className="text-red-400/70 text-xs mt-1">Unfortunately we cannot deliver physical products to your country at this time.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="State / Region">
              <input value={form.region} onChange={set('region')} placeholder="California" className={inputCls} />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={set('city')} required placeholder="Los Angeles" className={inputCls} />
            </Field>
          </div>

          <Field label="Address">
            <input value={form.address1} onChange={set('address1')} required placeholder="123 Main Street, Apt 4B" className={inputCls} />
          </Field>

          <Field label="ZIP / Postal Code">
            <input value={form.zip} onChange={set('zip')} required placeholder="90001" className={inputCls} />
          </Field>

          {needsTaxId && (
            <Field label={taxIdLabel}>
              <input
                value={form.tax_id} onChange={set('tax_id')} required
                placeholder={taxIdPlaceholder}
                className="bg-white/5 border border-amber-400/40 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400 transition-colors w-full text-white placeholder-white/25"
              />
              <p className="text-xs text-amber-400/70 mt-1.5">
                ⚠️ Required by customs for delivery in {form.country === 'BR' ? 'Brazil' : 'Chile'}
              </p>
            </Field>
          )}

          <button
            type="submit"
            disabled={blocked}
            className={`w-full py-3 rounded-xl text-sm font-semibold mt-2 transition-colors ${
              blocked
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-indigo-400 text-black hover:bg-indigo-300'
            }`}
          >
            {blocked ? 'Delivery Not Available' : 'Continue to Payment →'}
          </button>

          {!blocked && (
            <p className="text-xs text-white/30 text-center leading-relaxed pt-1">
              🛃 Customs duties and import taxes may apply depending on your country and are the responsibility of the buyer.
            </p>
          )}

          {!blocked && (
            <p className="text-xs text-white/30 text-center leading-relaxed pt-1">
              🛃 Customs duties and import taxes may apply depending on your country and are the responsibility of the buyer.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   PAYMENT MODAL — create payment, poll status, fallback wallet
   ============================================================ */
function PaymentModal({ state, setState, onClose }) {
  const { step, product, payment, error, address } = state;
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  // create payment on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://api.nowpayments.io/v1/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': NOWPAYMENTS_API_KEY,
          },
          body: JSON.stringify({
            price_amount: product.price,
            price_currency: 'usd',
            pay_currency: 'usdttrc20',
            order_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            order_description: product.name,
          }),
        });
        if (!res.ok) throw new Error('payment_api_error');
        const data = await res.json();
        if (cancelled) return;
        setState((s) => ({
          ...s,
          step: 'pending',
          payment: {
            id: data.payment_id,
            address: data.pay_address,
            amount: data.pay_amount,
            network: 'TRC20',
          },
        }));
      } catch (e) {
        if (cancelled) return;
        // Fallback: manual wallet, no auto-confirmation possible
        setState((s) => ({
          ...s,
          step: 'pending',
          error: 'manual',
          payment: {
            id: null,
            address: FALLBACK_WALLET,
            amount: product.price,
            network: 'TRC20',
          },
        }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // countdown
  useEffect(() => {
    if (step !== 'pending') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step]);

  // poll payment status every 5s (only if we have a real payment id)
  useEffect(() => {
    if (step !== 'pending' || !payment?.id) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`https://api.nowpayments.io/v1/payment/${payment.id}`, {
          headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
        });
        const data = await res.json();
        if (['finished', 'confirmed', 'sending'].includes(data.payment_status)) {
          if (product.type === 'physical' && address) {
            sendPrintifyOrder({ product, address, orderId: payment.id });
          }
          sendTelegramNotification({
            orderId: payment.id,
            email: address?.email || 'N/A',
            product: product.name,
            amount: payment.amount,
            type: product.type || 'digital',
            address: address || null,
          });
          setState((s) => ({ ...s, step: 'success' }));
        }
      } catch (e) {
        // keep polling silently
      }
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [step, payment?.id, setState]);

  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const copyAddress = () => {
    if (!payment?.address) return;
    navigator.clipboard?.writeText(payment.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={step !== 'creating' ? onClose : undefined} />
      <div className="relative bg-[#080808] border border-white/10 rounded-2xl w-full max-w-sm p-7">
        {step !== 'creating' && (
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        )}

        {step === 'creating' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
            <p className="text-sm text-white/70">Creating payment…</p>
          </div>
        )}

        {step === 'pending' && payment && (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl italic font-medium" style={heading}>Complete Payment</h3>
            <span className="text-2xl font-semibold tracking-widest text-indigo-400 tabular-nums">{mm}:{ss}</span>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payment.address)}`}
              alt="Payment QR code"
              className="w-44 h-44 rounded-lg bg-white p-2"
            />

            <div className="w-full">
              <p className="text-xs text-white/40 mb-1">USDT address (TRC20)</p>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <span className="text-xs text-white/80 truncate flex-1">{payment.address}</span>
                <button onClick={copyAddress} className="text-white/60 hover:text-white shrink-0">
                  {copied ? <Check size={15} className="text-indigo-400" /> : <Copy size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between w-full text-sm">
              <span className="text-white/50">Amount</span>
              <span className="font-medium">{payment.amount} USDT</span>
            </div>
            <div className="flex items-center justify-between w-full text-sm">
              <span className="text-white/50">Network</span>
              <span className="font-medium">TRC20</span>
            </div>

            <p className="text-xs text-white/40 text-center leading-relaxed">
              {error === 'manual'
                ? 'Send the exact amount, then message us with your transaction ID to confirm and receive your download.'
                : 'Send exact amount. Page updates automatically. 1–5 mins.'}
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="text-4xl">{product.type === 'physical' ? '📦' : '✅'}</span>
            <h3 className="text-xl italic font-medium" style={display}>
              {product.type === 'physical' ? 'Order Confirmed!' : 'Payment Confirmed!'}
            </h3>
            {product.type === 'physical' ? (
              <p className="text-sm text-white/50 max-w-xs leading-relaxed">
                Your order is pending review. Estimated delivery: <span className="text-white/80">7–35 business days</span>.
              </p>
            ) : (
              <a
                href={product.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-400 text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-indigo-300 transition-colors"
              >
                ↓ Download Now
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN PANEL  (#/admin)
   ============================================================ */
function AdminPanel({ products, persistProducts, loaded }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setErr('');
    } else {
      setErr('Incorrect password.');
    }
  };

  const handleSave = (productData) => {
    if (editing) {
      persistProducts(products.map((p) => (p.id === editing.id ? { ...productData, id: editing.id } : p)));
    } else {
      persistProducts([...products, { ...productData, id: `${Date.now()}` }]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    persistProducts(products.filter((p) => p.id !== id));
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="w-full max-w-xs bg-[#080808] border border-white/10 rounded-2xl p-7 flex flex-col gap-4">
          <h1 className="text-3xl text-center mb-2" style={script}>
            <span className="text-indigo-400">Ka</span>ze Admin
          </h1>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(''); }}
            placeholder="Password"
            autoFocus
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition-colors"
          />
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <button type="submit" className="bg-indigo-400 text-black text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-300 transition-colors">
            Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-4xl" style={script}>
            <span className="text-indigo-400">Ka</span>ze Admin
          </h1>
          <button
            onClick={() => setLoggedIn(false)}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#080808] border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/40 mb-1">Total Products</p>
            <p className="text-2xl font-semibold">{products.length}</p>
          </div>
          <div className="bg-[#080808] border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/40 mb-1">Total Pages</p>
            <p className="text-2xl font-semibold">{Math.max(1, Math.ceil(products.length / 9))}</p>
          </div>
        </div>

        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-400 text-black text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-indigo-300 transition-colors mb-6"
        >
          <Plus size={16} /> Add Product
        </button>

        {!loaded ? (
          <p className="text-white/40 text-sm">Loading…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 bg-[#080808] border border-white/10 rounded-xl p-3">
                <div className="w-14 h-14 rounded-lg bg-white/5 overflow-hidden shrink-0">
                  {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{p.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${p.type === 'physical' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-400/15 text-indigo-400'}`}>
                      {p.type === 'physical' ? '📮' : '💾'}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">${p.price} · {p.images?.length || 0} image{(p.images?.length || 0) !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => { setEditing(p); setShowForm(true); }}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {products.length === 0 && <p className="text-white/40 text-sm">No products yet.</p>}
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [price, setPrice] = useState(initial?.price ?? '');
  const [description, setDescription] = useState(initial?.description || '');
  const [imagesText, setImagesText] = useState((initial?.images || []).join('\n'));
  const [pdfUrl, setPdfUrl] = useState(initial?.pdfUrl || '');
  const [type, setType] = useState(initial?.type || 'digital');
  const [printifyProductId, setPrintifyProductId] = useState(initial?.printifyProductId || '');
  const [printifyVariantId, setPrintifyVariantId] = useState(initial?.printifyVariantId || '');

  // Size mode: 'single' (calendar) or 'multiple' (poster S/M/L)
  const hasVariants = initial?.variants?.length > 0;
  const [sizeMode, setSizeMode] = useState(hasVariants ? 'multiple' : 'single');
  const [variants, setVariants] = useState(
    initial?.variants?.length > 0
      ? initial.variants
      : [
          { label: 'Small',  variantId: '', price: '' },
          { label: 'Medium', variantId: '', price: '' },
          { label: 'Large',  variantId: '', price: '' },
        ]
  );

  const updateVariant = (i, key, val) =>
    setVariants(v => v.map((row, idx) => idx === i ? { ...row, [key]: val } : row));

  const inp = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 w-full";

  const submit = (e) => {
    e.preventDefault();
    const images = imagesText.split('\n').map(s => s.trim()).filter(Boolean);
    const cleanVariants = sizeMode === 'multiple'
      ? variants.map(v => ({ label: v.label, variantId: v.variantId, price: Number(v.price) || 0 }))
      : [];
    onSave({
      name, price: Number(price) || 0, description, images, pdfUrl, type,
      printifyProductId,
      printifyVariantId: sizeMode === 'single' ? printifyVariantId : '',
      variants: cleanVariants,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <form
        onSubmit={submit}
        className="relative bg-[#080808] border border-white/10 rounded-2xl w-full max-w-md p-7 max-h-[85vh] overflow-y-auto kaze-scrollbar-hide flex flex-col gap-4"
      >
        <h3 className="text-xl italic font-medium" style={heading}>{initial ? 'Edit Product' : 'Add Product'}</h3>

        {/* Product Type */}
        <div className="flex gap-2">
          {['digital', 'physical'].map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                type === t
                  ? t === 'digital' ? 'bg-indigo-400/20 border-indigo-400 text-indigo-400' : 'bg-amber-500/20 border-amber-400 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
              }`}>
              {t === 'digital' ? '💾 Digital' : '📮 Physical'}
            </button>
          ))}
        </div>

        <Field label="Product Name">
          <input value={name} onChange={e => setName(e.target.value)} required className={inp} />
        </Field>

        <Field label="Description">
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
            className={inp + ' resize-none'} />
        </Field>

        <Field label="Image URLs (one per line)">
          <textarea rows={5} value={imagesText} onChange={e => setImagesText(e.target.value)}
            className={inp + ' resize-none'} />
        </Field>

        {/* Digital only */}
        {type === 'digital' && (
          <>
            <Field label="Price (USD)">
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required className={inp} />
            </Field>
            <Field label="PDF Download URL">
              <input value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} className={inp} />
            </Field>
          </>
        )}

        {/* Physical only */}
        {type === 'physical' && (
          <>
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-indigo-400 font-semibold mb-3 tracking-wide uppercase">Printify Settings</p>
            </div>

            <Field label="Printify Product ID">
              <input value={printifyProductId} onChange={e => setPrintifyProductId(e.target.value)}
                placeholder="e.g. 5d15ca4d05a47c6825b3bdb4" className={inp} />
            </Field>

            {/* Size mode toggle */}
            <div>
              <p className="text-xs text-white/40 mb-2">Size Type</p>
              <div className="flex gap-2">
                {[['single', '📅 Single Size (Calendar)'], ['multiple', '🖼 Multiple Sizes (S / M / L)']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setSizeMode(val)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      sizeMode === val ? 'bg-indigo-400/20 border-indigo-400 text-indigo-400' : 'bg-white/5 border-white/10 text-white/40'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Single size */}
            {sizeMode === 'single' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Field label="Variant ID">
                    <input value={printifyVariantId} onChange={e => setPrintifyVariantId(e.target.value)}
                      placeholder="e.g. 17887" className={inp} />
                  </Field>
                </div>
                <div className="w-28">
                  <Field label="Price (USD)">
                    <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                      required placeholder="25.00" className={inp} />
                  </Field>
                </div>
              </div>
            )}

            {/* Multiple sizes S/M/L */}
            {sizeMode === 'multiple' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-white/40">Leave Variant ID empty to hide that size</p>
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs font-semibold w-14 text-center py-1.5 rounded-lg ${
                      i === 0 ? 'bg-indigo-400/10 text-indigo-400' :
                      i === 1 ? 'bg-purple-400/10 text-purple-400' :
                      'bg-pink-400/10 text-pink-400'
                    }`}>{v.label}</span>
                    <input value={v.variantId} onChange={e => updateVariant(i, 'variantId', e.target.value)}
                      placeholder="Variant ID" className={inp + ' flex-1 text-xs'} />
                    <input type="number" step="0.01" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)}
                      placeholder="$0" className={inp + ' w-20 text-xs'} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onCancel} className="flex-1 text-sm text-white/60 hover:text-white py-2.5 transition-colors">Cancel</button>
          <button type="submit" className="flex-1 bg-indigo-400 text-black text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-300 transition-colors">Save</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-white/40">{label}</span>
      {children}
    </label>
  );
}