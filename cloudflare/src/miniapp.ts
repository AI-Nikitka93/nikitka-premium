type MiniAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type MiniAppAuthResult = {
  ok: true;
  user: MiniAppUser | null;
  demo: boolean;
} | {
  ok: false;
  status: number;
  error: string;
};

const MINI_APP_CSS = `
:root {
  --bg: #efe7d7;
  --bg-2: #e4d6c2;
  --panel: rgba(255, 251, 245, 0.88);
  --panel-strong: rgba(255, 249, 240, 0.96);
  --ink: #171412;
  --muted: #62574f;
  --line: rgba(23, 20, 18, 0.08);
  --flag-red: #b3262e;
  --flag-red-deep: #8f1e27;
  --flag-green: #0f5a3d;
  --flag-green-deep: #0b4430;
  --flag-cream: #fbf4e8;
  --gold: #b78d4f;
  --shadow-soft: 0 14px 36px rgba(31, 26, 21, 0.08);
  --shadow-panel: 0 22px 60px rgba(31, 26, 21, 0.14);
  --safe-top: 0px;
  --safe-bottom: 0px;
  --safe-left: 0px;
  --safe-right: 0px;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family: Georgia, "Times New Roman", serif;
  color: var(--ink);
  background:
    linear-gradient(0deg, rgba(244, 237, 220, 0.94), rgba(244, 237, 220, 0.94)),
    url('/miniapp/pattern-tile.png'),
    radial-gradient(circle at top left, rgba(179, 38, 46, 0.18), rgba(179, 38, 46, 0) 26%),
    radial-gradient(circle at top right, rgba(15, 90, 61, 0.16), rgba(15, 90, 61, 0) 26%),
    linear-gradient(180deg, #f6efdf 0%, var(--bg) 48%, var(--bg-2) 100%);
  background-size: auto, 220px 220px, auto, auto, auto;
  background-attachment: scroll, scroll, scroll, scroll, scroll;
}
body {
  min-height: 100vh;
  overflow-x: hidden;
}
.shell {
  position: relative;
  max-width: 1240px;
  margin: 0 auto;
  padding:
    calc(12px + var(--safe-top))
    calc(12px + var(--safe-right))
    calc(110px + var(--safe-bottom))
    calc(12px + var(--safe-left));
}
.shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.08;
  background:
    linear-gradient(90deg, transparent 0 3.5%, rgba(179, 38, 46, 0.18) 3.5% 4.5%, transparent 4.5% 100%),
    linear-gradient(180deg, transparent 0 89%, rgba(15, 90, 61, 0.14) 89% 100%);
}
.hero {
  position: relative;
  overflow: hidden;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: linear-gradient(180deg, rgba(255, 251, 245, 0.96), rgba(247, 239, 227, 0.92));
  box-shadow: var(--shadow-panel);
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 12px;
  background: linear-gradient(180deg, var(--flag-red) 0 48%, var(--flag-green) 48% 100%);
}
.hero-media {
  position: relative;
  min-height: clamp(220px, 38vw, 320px);
  background:
    linear-gradient(180deg, rgba(17, 16, 15, 0.14), rgba(17, 16, 15, 0.44)),
    url('/miniapp/hero-background.jpeg') center / cover no-repeat;
}
.hero-media::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(179, 38, 46, 0.16), rgba(15, 90, 61, 0.14)),
    url('/miniapp/ribbon-texture.png') center / cover no-repeat;
  mix-blend-mode: screen;
  opacity: 0.36;
}
.hero-media::after {
  content: "";
  position: absolute;
  inset: auto 18px 18px 18px;
  height: 92px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(15, 90, 61, 0.9), rgba(143, 30, 39, 0.92));
  box-shadow: 0 18px 40px rgba(17, 16, 15, 0.28);
}
.hero-seal {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 84px;
  height: 84px;
  object-fit: cover;
  border-radius: 22px;
  filter: drop-shadow(0 10px 24px rgba(17, 16, 15, 0.3));
}
.hero-mark {
  position: absolute;
  left: 18px;
  top: 16px;
  width: 72px;
  height: 72px;
  object-fit: cover;
  filter: drop-shadow(0 10px 24px rgba(17, 16, 15, 0.28));
}
.hero-card {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 2;
  display: grid;
  gap: 10px;
  color: #fffaf4;
  max-width: min(100%, 620px);
}
.hero-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 250, 244, 0.8);
}
.hero-label::before {
  content: "";
  width: 26px;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 250, 244, 0.95), rgba(255, 250, 244, 0.2));
}
.hero-card h1 {
  margin: 0;
  max-width: 8ch;
  font-size: clamp(26px, 7.4vw, 44px);
  line-height: 0.94;
  letter-spacing: -0.04em;
  text-wrap: balance;
}
.hero-card p {
  margin: 0;
  max-width: 32ch;
  font-size: 13px;
  line-height: 1.48;
  color: rgba(255, 250, 244, 0.86);
}
.hero-copy {
  padding: 18px 18px 20px 22px;
}
.hero-copy-grid {
  display: grid;
  gap: 16px;
}
.hero-copy-main {
  display: grid;
  gap: 10px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--flag-green);
}
.eyebrow::before {
  content: "";
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, var(--flag-red), var(--flag-green));
}
.title {
  margin: 0;
  font-size: clamp(24px, 5.8vw, 42px);
  line-height: 0.98;
  letter-spacing: -0.03em;
  text-wrap: balance;
}
.subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.55;
}
.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: stretch;
}
.hero-meta > * {
  flex: 1 1 180px;
}
.status-chip,
.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.68);
  box-shadow: var(--shadow-soft);
  min-width: 0;
}
.status-chip img,
.ghost-btn img {
  width: 20px;
  height: 20px;
  object-fit: cover;
  border-radius: 7px;
}
.ghost-btn {
  cursor: pointer;
  color: var(--ink);
  font: inherit;
}
.toolbar {
  display: grid;
  gap: 14px;
  margin: 18px 0 0;
  align-items: start;
}
.search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border-radius: 24px;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow-soft);
}
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.search-input-wrap img {
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 8px;
}
.search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 16px;
}
.search button,
.cta-btn,
.fav-btn,
.qty button,
.cart-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  cursor: pointer;
  font: inherit;
}
.search button,
.cta-btn {
  min-height: 46px;
  padding: 12px 16px;
  border-radius: 16px;
  color: white;
  font-weight: 700;
  background: linear-gradient(135deg, var(--flag-red), var(--flag-green));
  box-shadow: 0 12px 30px rgba(17, 16, 15, 0.18);
}
.btn-icon {
  width: 18px;
  height: 18px;
  object-fit: cover;
  border-radius: 7px;
}
.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.summary-card {
  position: relative;
  overflow: hidden;
  min-width: 0;
  padding: 16px 14px;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255, 252, 247, 0.95), rgba(247, 238, 225, 0.92));
  box-shadow: var(--shadow-soft);
}
.summary-card::after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 4px;
  background: linear-gradient(90deg, var(--flag-red), var(--flag-green));
}
.assistant-panel {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 26px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255, 251, 245, 0.96), rgba(247, 239, 227, 0.92));
  box-shadow: var(--shadow-soft);
}
.assistant-head {
  display: grid;
  gap: 8px;
}
.assistant-title {
  margin: 0;
  font-size: 22px;
  line-height: 1;
}
.assistant-subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}
.assistant-thread {
  display: grid;
  gap: 10px;
}
.assistant-bubble {
  max-width: 100%;
  padding: 12px 14px;
  border-radius: 18px;
  line-height: 1.5;
  font-size: 14px;
  white-space: pre-wrap;
}
.assistant-bubble.assistant {
  background: rgba(15, 90, 61, 0.08);
  border: 1px solid rgba(15, 90, 61, 0.14);
}
.assistant-bubble.user {
  background: rgba(179, 38, 46, 0.08);
  border: 1px solid rgba(179, 38, 46, 0.14);
}
.assistant-bubble-meta {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--muted);
}
.assistant-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.assistant-chip {
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink);
  font: inherit;
  cursor: pointer;
}
.assistant-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}
.assistant-form textarea {
  min-height: 98px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--line);
  resize: vertical;
  background: rgba(255, 255, 255, 0.78);
  color: var(--ink);
  font: inherit;
}
.assistant-form button {
  min-width: 128px;
}
.summary-label {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}
.summary-value {
  margin-top: 8px;
  font-size: clamp(20px, 5vw, 28px);
  font-weight: 700;
  line-height: 1;
}
.categories {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}
.category-btn {
  min-width: 0;
  padding: 12px;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.78);
  color: var(--ink);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
  text-align: left;
}
.category-btn img {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 13px;
}
.category-btn strong {
  display: block;
  font-size: 14px;
  line-height: 1.1;
}
.category-btn span {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}
.category-btn.active {
  background: linear-gradient(135deg, rgba(179, 38, 46, 0.96), rgba(15, 90, 61, 0.94));
  color: #fffaf4;
  border-color: transparent;
  box-shadow: 0 20px 38px rgba(18, 16, 15, 0.2);
  transform: translateY(-1px);
}
.category-btn.active span {
  color: rgba(255, 250, 244, 0.76);
}
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 20px;
}
.card {
  display: grid;
  gap: 14px;
  padding: 14px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  background: linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(248, 240, 229, 0.94));
  box-shadow: var(--shadow-panel);
}
.card-shell {
  position: relative;
}
.card-media {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 22px;
  background: #efe6da;
}
.card-shell::after {
  content: "";
  position: absolute;
  inset: auto 14px 14px auto;
  width: 50px;
  height: 50px;
  border-radius: 18px;
  background: url('/miniapp/ornament-accent.png') center / cover no-repeat;
  opacity: 0.92;
  filter: drop-shadow(0 12px 26px rgba(17, 16, 15, 0.2));
}
.card-copy {
  display: grid;
  gap: 10px;
}
.card-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.category-pill,
.badge-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.category-pill {
  background: rgba(15, 90, 61, 0.1);
  color: var(--flag-green);
}
.badge-pill {
  background: rgba(179, 38, 46, 0.12);
  color: var(--flag-red);
}
.card-title {
  margin: 0;
  font-size: 24px;
  line-height: 0.98;
}
.card-desc {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.52;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}
.price {
  display: flex;
  gap: 10px;
  align-items: baseline;
}
.price-main {
  font-size: 26px;
  font-weight: 700;
}
.price-old {
  color: var(--muted);
  text-decoration: line-through;
}
.actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}
.size-block {
  display: grid;
  gap: 8px;
}
.size-label {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}
.size-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.size-btn {
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.86);
  color: var(--ink);
  font: inherit;
  cursor: pointer;
}
.size-btn.active {
  background: linear-gradient(135deg, rgba(179, 38, 46, 0.94), rgba(15, 90, 61, 0.94));
  color: #fffaf4;
  border-color: transparent;
}
.size-note {
  color: var(--muted);
  font-size: 12px;
}
.fav-btn {
  min-height: 46px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(15, 90, 61, 0.12);
  color: var(--flag-green);
  font-weight: 700;
}
.notice {
  margin-top: 18px;
  padding: 16px;
  border-radius: 24px;
  border: 1px dashed rgba(179, 38, 46, 0.2);
  background: rgba(255, 248, 239, 0.88);
  color: var(--muted);
}
.notice[hidden] {
  display: none;
}
.empty-state {
  display: grid;
  justify-items: center;
  gap: 12px;
  text-align: center;
}
.empty-state img {
  width: min(100%, 220px);
  border-radius: 28px;
  box-shadow: var(--shadow-soft);
}
.empty-state strong {
  font-size: 18px;
  color: var(--ink);
}
.empty-state span {
  max-width: 36ch;
  line-height: 1.55;
}
.footer-note {
  margin-top: 18px;
  padding: 0 4px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
}
.cart-panel {
  position: fixed;
  left: 50%;
  bottom: calc(12px + var(--safe-bottom));
  width: min(1240px, calc(100vw - 24px - var(--safe-left) - var(--safe-right)));
  transform: translateX(-50%);
  z-index: 30;
  padding: 10px;
  border-radius: 28px;
  color: #fffaf4;
  background: linear-gradient(135deg, rgba(11, 68, 48, 0.96), rgba(143, 30, 39, 0.96));
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.26);
  backdrop-filter: blur(18px);
}
.cart-panel[hidden] {
  display: none;
}
.cart-toggle {
  width: 100%;
  min-height: 58px;
  border-radius: 20px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
}
.cart-toggle img {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 8px;
}
.cart-toggle-copy {
  min-width: 0;
  text-align: left;
}
.cart-toggle-copy strong {
  display: block;
  font-size: 16px;
}
.cart-toggle-copy span {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 250, 244, 0.72);
}
.cart-total {
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}
.cart-list {
  display: grid;
  gap: 10px;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 220ms ease, opacity 180ms ease, margin-top 180ms ease;
  margin-top: 0;
}
.cart-panel.open .cart-list {
  max-height: 360px;
  opacity: 1;
  margin-top: 10px;
}
.cart-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
}
.qty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.qty button {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  color: inherit;
}
.muted { color: var(--muted); }
.cart-panel .muted { color: rgba(255, 250, 244, 0.72); }
@media (min-width: 700px) {
  .shell {
    padding-left: max(18px, calc(18px + var(--safe-left)));
    padding-right: max(18px, calc(18px + var(--safe-right)));
  }
  .categories {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 920px) {
  .hero {
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
  }
  .hero-media {
    min-height: 100%;
  }
  .hero-copy {
    display: flex;
    align-items: center;
  }
  .categories {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (min-width: 1100px) {
  .toolbar {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: start;
  }
  .assistant-form {
    grid-template-columns: 1fr 148px;
  }
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 899px) {
  .hero-media::after {
    left: 16px;
    right: 16px;
    height: 84px;
  }
  .hero-card {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
  .search {
    grid-template-columns: 1fr;
  }
  .search button {
    width: 100%;
  }
  .summary {
    grid-template-columns: 1fr;
  }
}
`;

const MINI_APP_JS = `
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.('#f4ede0');
  tg.setBackgroundColor?.('#efe7d7');
  tg.setBottomBarColor?.('#163c31');
}

const UI_ASSETS = {
  search: '/miniapp/icon-search.png',
  cart: '/miniapp/icon-cart.png',
  profile: '/miniapp/icon-profile.png',
  emptyCart: '/miniapp/empty-cart.png',
  emptyFavorites: '/miniapp/empty-favorites.png',
  emptySearch: '/miniapp/empty-search.png',
  brandSeal: '/miniapp/brand-seal.png',
  ornament: '/miniapp/ornament-primary.png',
  loading: '/miniapp/loading-mark.png'
};

const CATEGORY_ICONS = {
  tshirts: '/miniapp/icon-tshirts.png',
  hoodies: '/miniapp/icon-hoodies.png',
  outerwear: '/miniapp/icon-outerwear.png',
  bottoms: '/miniapp/icon-bottoms.png',
  footwear: '/miniapp/icon-footwear.png',
  headwear: '/miniapp/icon-headwear.png',
  accessories: '/miniapp/icon-accessories.png',
  souvenirs: '/miniapp/icon-souvenirs.png'
};

const state = {
  demo: !tg || !tg.initData,
  category: '',
  query: '',
  showFavorites: false,
  cartOpen: false,
  cart: null,
  bootstrap: null,
  selectedSizes: {},
  productsCache: new Map()
};

const els = {
  status: document.querySelector('[data-status]'),
  chips: document.querySelector('[data-chips]'),
  filters: document.querySelector('[data-filters]'),
  grid: document.querySelector('[data-grid]'),
  cartPanel: document.querySelector('[data-cart-panel]'),
  cartToggle: document.querySelector('[data-cart-toggle]'),
  cartList: document.querySelector('[data-cart-list]'),
  cartTotal: document.querySelector('[data-cart-total]'),
  cartCount: document.querySelector('[data-cart-count]'),
  searchInput: document.querySelector('[data-search-input]'),
  searchBtn: document.querySelector('[data-search-btn]'),
  favoritesBtn: document.querySelector('[data-favorites-btn]'),
  catalogBtn: document.querySelector('[data-catalog-btn]'),
  notice: document.querySelector('[data-notice]')
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function setRootVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function applySafeAreaInsets() {
  const insets = tg?.contentSafeAreaInset || tg?.safeAreaInset || {};
  setRootVar('--safe-top', (insets.top || 0) + 'px');
  setRootVar('--safe-bottom', (insets.bottom || 0) + 'px');
  setRootVar('--safe-left', (insets.left || 0) + 'px');
  setRootVar('--safe-right', (insets.right || 0) + 'px');
}

function applyThemeHints() {
  const theme = tg?.themeParams;
  if (!theme) return;
  if (theme.bg_color) {
    setRootVar('--tg-host-bg', theme.bg_color);
  }
  if (theme.text_color) {
    setRootVar('--tg-host-text', theme.text_color);
  }
}

applySafeAreaInsets();
applyThemeHints();
tg?.onEvent?.('safeAreaChanged', applySafeAreaInsets);
tg?.onEvent?.('contentSafeAreaChanged', applySafeAreaInsets);
tg?.onEvent?.('themeChanged', applyThemeHints);

function initHeaders(method = 'GET') {
  const headers = {};
  if (tg?.initData) headers['X-Telegram-Init-Data'] = tg.initData;
  if (state.demo) headers['X-Miniapp-Demo'] = '1';
  if (method !== 'GET') headers['Content-Type'] = 'application/json';
  return headers;
}

async function api(path, options = {}) {
  const method = options.method || 'GET';
  const response = await fetch(path, {
    ...options,
    method,
    headers: {
      ...initHeaders(method),
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function renderFilters(categories) {
  const pills = [
    '<button class="category-btn ' + (!state.category && !state.showFavorites ? 'active' : '') + '" data-filter-all><img src="' + UI_ASSETS.ornament + '" alt=""><div><strong>Все</strong><span>Capsule</span></div></button>',
    ...categories.map((category) =>
      '<button class="category-btn ' + (state.category === category.slug ? 'active' : '') + '" data-category="' + category.slug + '"><img src="' + (CATEGORY_ICONS[category.slug] || UI_ASSETS.ornament) + '" alt=""><div><strong>' + category.title + '</strong><span>' + category.slug.replace(/-/g, ' ') + '</span></div></button>'
    ),
    '<button class="category-btn ' + (state.showFavorites ? 'active' : '') + '" data-filter-favorites><img src="' + UI_ASSETS.emptyFavorites + '" alt=""><div><strong>Избранное</strong><span>Сохранено</span></div></button>'
  ];
  els.filters.innerHTML = pills.join('');
  els.filters.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.showFavorites = false;
      state.category = button.dataset.category || '';
      renderFilters(categories);
      loadProducts();
    });
  });
  els.filters.querySelector('[data-filter-all]')?.addEventListener('click', () => {
    state.showFavorites = false;
    state.category = '';
    renderFilters(categories);
    loadProducts();
  });
  els.filters.querySelector('[data-filter-favorites]')?.addEventListener('click', () => {
    state.showFavorites = true;
    state.category = '';
    renderFilters(categories);
    loadProducts();
  });
}

function renderChips(summary) {
  els.chips.innerHTML = [
    '<div class="summary-card"><div class="summary-label">Проект</div><div class="summary-value">' + (state.demo ? 'Demo' : 'Test') + '</div></div>',
    '<div class="summary-card"><div class="summary-label">Избранное</div><div class="summary-value">' + summary.favoritesCount + '</div></div>',
    '<div class="summary-card"><div class="summary-label">Корзина</div><div class="summary-value">' + summary.cartQuantity + '</div></div>'
  ].join('');
}

function renderEmptyState(image, title, text) {
  return '<div class="notice empty-state">' +
    '<img src="' + image + '" alt="">' +
    '<strong>' + title + '</strong>' +
    '<span>' + text + '</span>' +
  '</div>';
}

function setNotice(text = '', visible = false) {
  els.notice.textContent = text;
  els.notice.hidden = !visible;
}

function ensureSelectedSize(product) {
  const sizes = Array.isArray(product.availableSizes) && product.availableSizes.length ? product.availableSizes : ['ONE SIZE'];
  if (!state.selectedSizes[product.productId] || !sizes.includes(state.selectedSizes[product.productId])) {
    state.selectedSizes[product.productId] = sizes[0];
  }
  return state.selectedSizes[product.productId];
}

function renderProducts(products) {
  if (!products.length) {
    if (state.showFavorites) {
      els.grid.innerHTML = renderEmptyState(UI_ASSETS.emptyFavorites, 'Избранное пока пустое', 'Отметь интересные позиции в каталоге, и они соберутся здесь в отдельную подборку.');
      return;
    }
    if (state.query) {
      els.grid.innerHTML = renderEmptyState(UI_ASSETS.emptySearch, 'Ничего не найдено', 'Смени запрос, попробуй другой стиль, артикул или переключись на категорию.');
      return;
    }
    els.grid.innerHTML = '<div class="notice notice-plain">По текущему фильтру товаров нет. Попробуйте другую категорию или очистите поиск.</div>';
    return;
  }
  els.grid.innerHTML = products.map((product) => {
    const oldPrice = product.oldPriceStars ? '<div class="price-old">' + product.oldPriceStars + ' Stars</div>' : '';
    const badge = product.badge ? '<div class="badge-pill">' + product.badge + '</div>' : '';
    const favoriteLabel = product.isFavorite ? 'Убрать' : 'В избранное';
    const stockLabel = product.stockQty > 0 ? 'В наличии ' + product.stockQty + ' шт' : 'Нет в наличии';
    const selectedSize = ensureSelectedSize(product);
    const sizes = Array.isArray(product.availableSizes) && product.availableSizes.length ? product.availableSizes : ['ONE SIZE'];
    const sizeBlock = \`
      <div class="size-block">
        <div class="size-label">Размер</div>
        <div class="size-row">
          \${sizes.map((size) => \`<button class="size-btn \${selectedSize === size ? 'active' : ''}" data-size-select="\${product.productId}" data-size="\${size}">\${size}</button>\`).join('')}
        </div>
        <div class="size-note">\${product.sizeGroup === 'footwear' ? 'Для обуви доступны числовые размеры.' : product.sizeGroup === 'one-size' ? 'У этой позиции единый размер.' : 'Выберите размер перед добавлением в корзину.'}</div>
      </div>
    \`;
    return \`
      <article class="card">
        <div class="card-shell">
          <img class="card-media" src="\${product.photoUrl}" alt="\${product.title}">
        </div>
        <div class="card-copy">
          <div class="card-topline">
            <div class="category-pill">\${product.categoryTitle}</div>
            \${badge}
          </div>
          <h3 class="card-title">\${product.title}</h3>
          <p class="card-desc">\${product.description}</p>
          <div class="card-meta">
            <span>SKU: \${product.sku}</span>
            <span>\${stockLabel}</span>
          </div>
          <div class="price">
            <div class="price-main">\${product.priceStars} Stars</div>
            \${oldPrice}
          </div>
          \${sizeBlock}
          <div class="actions">
            <button class="cta-btn" data-add-cart="\${product.productId}" \${product.stockQty < 1 ? 'disabled' : ''}>В корзину</button>
            <button class="fav-btn" data-favorite="\${product.productId}">\${favoriteLabel}</button>
          </div>
        </div>
      </article>
    \`;
  }).join('');

  els.grid.querySelectorAll('[data-size-select]').forEach((button) => {
    button.addEventListener('click', async () => {
      const productId = Number(button.dataset.sizeSelect);
      const size = button.dataset.size || 'ONE SIZE';
      state.selectedSizes[productId] = size;
      renderProducts(products);
    });
  });

  els.grid.querySelectorAll('[data-add-cart]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (state.demo) return demoNotice();
      const productId = Number(button.dataset.addCart);
      await api('/api/miniapp/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          sizeLabel: state.selectedSizes[productId] || 'ONE SIZE'
        })
      });
      invalidateCatalogCache();
      await refreshAll(true);
    });
  });

  els.grid.querySelectorAll('[data-favorite]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (state.demo) return demoNotice();
      await api('/api/miniapp/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId: Number(button.dataset.favorite) })
      });
      invalidateCatalogCache();
      await refreshAll(true);
    });
  });
}

function renderCart(cart) {
  state.cart = cart;
  if (!cart.items.length) {
    els.cartPanel.hidden = false;
    els.cartPanel.classList.toggle('open', state.cartOpen);
    els.cartTotal.textContent = '0 Stars';
    els.cartCount.textContent = 'Пока пусто';
    els.cartList.innerHTML = '<div class="cart-row"><div><strong>Корзина пока пустая</strong><br><span class="muted">Добавьте товары из каталога или из избранного.</span></div></div>';
    syncMainButton();
    return;
  }
  els.cartPanel.hidden = false;
  els.cartPanel.classList.toggle('open', state.cartOpen);
  els.cartTotal.textContent = cart.totalStars + ' Stars';
  els.cartCount.textContent = cart.totalQuantity + ' товар(ов)';
  els.cartList.innerHTML = cart.items.map((item) => \`
    <div class="cart-row">
      <div>
        <strong>\${item.title}\${item.sizeLabel ? \` • \${item.sizeLabel}\` : ''}</strong><br>
        <span class="muted">\${item.subtotalStars} Stars</span>
      </div>
      <div class="qty">
        <button data-set-qty="\${item.productId}" data-size="\${item.sizeLabel || ''}" data-delta="-1">-</button>
        <span>\${item.quantity}</span>
        <button data-set-qty="\${item.productId}" data-size="\${item.sizeLabel || ''}" data-delta="1">+</button>
      </div>
    </div>
  \`).join('');

  els.cartList.querySelectorAll('[data-set-qty]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (state.demo) return demoNotice();
      const productId = Number(button.dataset.setQty);
      const sizeLabel = button.dataset.size || '';
      const delta = Number(button.dataset.delta);
      const item = state.cart.items.find((entry) => entry.productId === productId && entry.sizeLabel === sizeLabel);
      if (!item) return;
      const quantity = item.quantity + delta;
      await api('/api/miniapp/cart/set', {
        method: 'POST',
        body: JSON.stringify({ productId, sizeLabel, quantity })
      });
      invalidateCatalogCache();
      await refreshAll(true);
    });
  });
  syncMainButton();
}

function syncMainButton() {
  if (!tg) return;
  tg.MainButton.offClick?.(checkout);
  if (state.cart && state.cart.totalQuantity > 0 && !state.demo) {
    tg.MainButton.setText('Оформить ' + state.cart.totalStars + ' Stars');
    tg.MainButton.show();
    tg.MainButton.onClick(checkout);
  } else {
    tg.MainButton.hide();
  }
}

function demoNotice() {
  setNotice('Демо-режим: для корзины, избранного и оплаты откройте витрину из Telegram.', true);
}

function catalogCacheKey() {
  return JSON.stringify({
    demo: state.demo,
    category: state.category || '',
    query: state.query || '',
    favorites: !!state.showFavorites
  });
}

function invalidateCatalogCache() {
  state.productsCache.clear();
}

async function loadBootstrap(force = false) {
  if (state.bootstrap && !force) {
    renderFilters(state.bootstrap.categories);
    renderChips(state.bootstrap.summary);
    els.status.textContent = state.demo ? 'Публичный demo-preview' : 'Подключено к Telegram';
    return;
  }
  const data = await api('/api/miniapp/bootstrap' + (state.demo ? '?demo=1' : ''));
  state.demo = !!data.demo;
  state.bootstrap = data;
  renderFilters(data.categories);
  renderChips(data.summary);
  els.status.textContent = data.demo ? 'Публичный demo-preview' : 'Подключено к Telegram';
  if (data.demo) {
    demoNotice();
  } else {
    setNotice('', false);
  }
}

async function loadProducts(force = false) {
  const cacheKey = catalogCacheKey();
  if (!force && state.productsCache.has(cacheKey)) {
    renderProducts(state.productsCache.get(cacheKey));
    return;
  }
  const params = new URLSearchParams();
  if (state.demo) params.set('demo', '1');
  if (state.category) params.set('category', state.category);
  if (state.query) params.set('q', state.query);
  if (state.showFavorites) params.set('favorites', '1');
  const data = await api('/api/miniapp/products?' + params.toString());
  state.productsCache.set(cacheKey, data.items);
  renderProducts(data.items);
}

async function loadCart() {
  if (state.demo) {
    state.cartOpen = false;
    renderCart({ items: [], totalStars: 0, totalQuantity: 0, isEmpty: true });
    return;
  }
  const data = await api('/api/miniapp/cart');
  renderCart(data.cart);
}

async function refreshAll(force = false) {
  await Promise.all([
    loadBootstrap(force),
    loadProducts(force),
    loadCart()
  ]);
}

async function checkout() {
  if (state.demo) return;
  const data = await api('/api/miniapp/checkout', { method: 'POST', body: '{}' });
  setNotice(data.message || 'Инвойс отправлен в чат с ботом.', true);
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

els.searchBtn.addEventListener('click', async () => {
  state.query = els.searchInput.value.trim();
  await loadProducts();
});
els.searchInput.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    state.query = els.searchInput.value.trim();
    await loadProducts();
  }
});
els.favoritesBtn.addEventListener('click', async () => {
  state.showFavorites = true;
  state.category = '';
  renderFilters(state.bootstrap?.categories || []);
  await loadProducts();
});
els.catalogBtn.addEventListener('click', async () => {
  state.showFavorites = false;
  state.category = '';
  state.query = '';
  els.searchInput.value = '';
  renderFilters(state.bootstrap?.categories || []);
  await loadProducts();
});
els.cartToggle?.addEventListener('click', () => {
  if (!state.cart) return;
  state.cartOpen = !state.cartOpen;
  els.cartPanel.classList.toggle('open', state.cartOpen);
});

refreshAll(true).catch((error) => {
  els.status.textContent = 'Витрина временно недоступна';
  setNotice(error.message, true);
});
`;

export function renderMiniAppHtml(title: string): string {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <title>${title} - тестовый проект</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>${MINI_APP_CSS}</style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="hero-media">
          <img class="hero-mark" src="/miniapp/ornament-accent.png" alt="">
          <img class="hero-seal" src="/miniapp/brand-seal.png" alt="">
          <div class="hero-card">
            <div class="hero-label">Belarus Heritage Store</div>
            <h1>${title}</h1>
            <p>Витрина магазина Nikitka AI в красно-зеленом коде Беларуси: одежда, обувь, аксессуары и сувениры в единой Belarus Heritage-концепции.</p>
          </div>
        </div>
        <div class="hero-copy">
          <div class="hero-copy-grid">
            <div class="hero-copy-main">
              <div class="eyebrow">Тестовый проект</div>
              <h2 class="title">${title} Витрина магазина</h2>
              <p class="subtitle">Это демонстрационная витрина магазина Nikitka AI. Реального магазина не существует, а все товары и изображения созданы для тестирования концепта.</p>
            </div>
            <div class="hero-meta">
              <div class="status-chip"><img src="/miniapp/icon-profile.png" alt=""><span data-status>Загрузка...</span></div>
              <button class="ghost-btn" data-catalog-btn><img class="btn-icon" src="/miniapp/loading-mark.png" alt=""><span>Каталог</span></button>
              <button class="ghost-btn" data-favorites-btn><img class="btn-icon" src="/miniapp/empty-favorites.png" alt=""><span>Избранное</span></button>
            </div>
          </div>
        </div>
      </section>

      <section class="toolbar">
        <div class="search">
          <div class="search-input-wrap">
            <img src="/miniapp/icon-search.png" alt="">
            <input data-search-input placeholder="Поиск по товарам, артикулу, стилю">
          </div>
          <button data-search-btn><img class="btn-icon" src="/miniapp/icon-search.png" alt=""><span>Искать</span></button>
        </div>
        <div class="summary" data-chips></div>
      </section>

      <section class="categories" data-filters></section>
      <section class="grid" data-grid></section>
      <section class="notice" data-notice hidden></section>
      <section class="footer-note"><b>Важно:</b> это тестовый проект. Такого магазина не существует, реальных товаров здесь нет, а все изображения и позиции созданы для демонстрации. Вопросы по товарам и размерам задавайте в чате бота через кнопку «Общение с AI-менеджером».</section>
    </main>

    <aside class="cart-panel" data-cart-panel>
      <button class="cart-toggle" data-cart-toggle>
        <img src="/miniapp/icon-cart.png" alt="">
        <div class="cart-toggle-copy">
          <strong>Корзина</strong>
          <span data-cart-count>Пока пусто</span>
        </div>
        <span class="cart-total" data-cart-total>0 Stars</span>
      </button>
      <div class="cart-list" data-cart-list></div>
    </aside>

    <script>${MINI_APP_JS}</script>
  </body>
</html>`;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function hmacSha256Raw(keyBytes: Uint8Array, message: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, toArrayBuffer(new TextEncoder().encode(message)));
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function authorizeMiniAppRequest(request: Request, botToken: string): Promise<MiniAppAuthResult> {
  const url = new URL(request.url);
  const demo = request.headers.get("X-Miniapp-Demo") === "1" || url.searchParams.get("demo") === "1";
  const initData = request.headers.get("X-Telegram-Init-Data") ?? url.searchParams.get("initData") ?? "";

  if (!initData) {
    return demo ? { ok: true, user: null, demo: true } : { ok: false, status: 401, error: "Mini App auth required" };
  }

  const params = new URLSearchParams(initData);
  const providedHash = params.get("hash");
  const authDate = Number(params.get("auth_date") ?? "0");
  const userJson = params.get("user");

  if (!providedHash || !authDate || !userJson) {
    return { ok: false, status: 401, error: "Invalid init data" };
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > 86400) {
    return { ok: false, status: 401, error: "Expired init data" };
  }

  const entries: Array<[string, string]> = [];
  params.forEach((value, key) => {
    if (key !== "hash") {
      entries.push([key, value]);
    }
  });
  entries.sort(([left], [right]) => left.localeCompare(right));
  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join("\n");

  const secret = await hmacSha256Raw(new TextEncoder().encode("WebAppData"), botToken);
  const signature = await hmacSha256Raw(new Uint8Array(secret), dataCheckString);
  if (toHex(signature) !== providedHash) {
    return { ok: false, status: 401, error: "Invalid init data signature" };
  }

  return {
    ok: true,
    user: JSON.parse(userJson),
    demo: false
  };
}
