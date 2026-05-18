# NexusMarket — реализация по Plan A.md

## Что сделано

Из 552 функций плана за одну сессию реалистично создан **дизайн-фундамент и каркас** проекта: дизайн-система Apple iOS 26, главный экран с motion-дизайном (центральное требование), все ключевые маршруты-скелеты, переиспользуемые UI-примитивы и standalone-превью без сборки.

### 1. Standalone preview (открыть прямо сейчас)

`preview.html` в корне — это **полностью рабочий главный экран** на чистом HTML/CSS/JS, который можно открыть в любом браузере без `npm install`. Полностью передаёт мотион-дизайн, дизайн-систему и UX.

### 2. Next.js 14 проект

```
frontend/
├─ src/app/
│  ├─ layout.tsx, page.tsx, globals.css
│  ├─ marketplace/, shop/, rental/, automation/
│  ├─ support/, profile/, admin/, orders/, notifications/
│  ├─ auth/register/, api/docs/
├─ src/components/
│  ├─ hero/        (Hero + HeroOrb + MagneticCTA)
│  ├─ home/        (MarketplacePreview, AutomationShowcase, ModulesGrid, CTA)
│  ├─ layout/      (Header, Footer)
│  ├─ ui/          (Button, Card, GlassPanel, Stripes, Badge)
│  └─ common/      (PageShell)
├─ src/lib/cn.ts
├─ tailwind.config.ts, next.config.js, tsconfig.json
└─ package.json
```

Чтобы запустить:

```bash
cd frontend
npm install
npm run dev
```

## Дизайн-система (точно по Plan A)

| Токен | Значение |
|-------|----------|
| Background | `#000000` / `#050507` |
| Stripes | 3px белые линии opacity 0.05, 45° (анимированный drift) |
| Primary | `#FFFFFF` |
| Glass | `rgba(255,255,255,0.06)` с `backdrop-filter: blur(40px)` |
| Border | `rgba(255,255,255,0.12)` + 1px inner refraction edge |
| Border-radius | `22px` (iOS-стиль) |
| Шрифты | SF Pro Display / SF Pro Text / SF Mono |
| Success / Warning / Error | `#30D158` / `#FF9F0A` / `#FF453A` |

## Motion-дизайн на главном экране

Применены принципы из скиллов **`design-motion-principles`**, **`taste-skill`**, **`impeccable`**, **`frontend-design`**:

1. **Staggered orchestration** входа hero (badge → headline → lede → CTAs → stats), spring `stiffness: 100, damping: 20, mass: 0.7`
2. **Liquid-glass orb** в центре экрана: 3 концентрических кольца с counter-rotation (36s/56s/80s) + refractive core
3. **Aurora gradient mesh** с медленным дыханием (14s ease-in-out)
4. **Diagonal stripes drift** — фирменные полосы из Plan A с движением 18s
5. **Magnetic CTA** — кнопки притягиваются к курсору через `useMotionValue`/`useTransform` (или RAF + lerp в standalone), внутреннее содержимое движется с большим коэффициентом → ощущение глубины
6. **Shimmer sweep** — пробег блика через CTA при hover
7. **Parallax-vignette** — радиальная виньетка фокусирует взгляд на хедлайне
8. **Live-stats glass-card** с `backdrop-filter: blur(60px) saturate(160%)` и нумерованными значениями (tabular-nums)
9. **Pulse-dot indicator** — «живой» индикатор онлайн-продавцов
10. **Scroll hint** с дыханием линии (`translateY` + `opacity`)
11. **Header transformation on scroll** — стекло уплотняется при прокрутке (Jakub Krehel — production polish)
12. **Sequential bot-logs** в секции автоматизации появляются с задержкой и завершаются shimmer-линией
13. **`prefers-reduced-motion`** обработан — все анимации останавливаются (доступность по design-motion-principles)
14. **GPU-only** — анимируются исключительно `transform` и `opacity` (taste-skill §5)

## Что НЕ сделано (честно)

552 функции — это месяцы работы команды. Ниже — следующие шаги, которые я бы делал последовательно:

| PR | Описание |
|----|----------|
| PR#2 | Полная Prisma-схема (26 моделей) и миграции |
| PR#3 | Backend Marketplace: CRUD, эскроу, поиск, диспуты |
| PR#4 | Frontend Marketplace: фильтры, инфинити-скролл, чат |
| PR#5 | Магазин: корзина, checkout, авто-доставка ключей |
| PR#6 | Аренда: тарифы, таймеры, авто-продление |
| PR#7 | Автоматизация: парсеры FunPay/Starvell/Playerok |
| PR#8 | Админ-панель: дашборд, RBAC, модерация |
| PR#9 | Поддержка: тикеты, FAQ, AI-бот |
| PR#10 | Кошелёк: ЮKassa/FreeKassa/CryptoCloud |
| PR#11 | WebSocket: real-time чат, уведомления |
| PR#12 | API & SDK: Swagger, GraphQL, webhooks |
| PR#13 | Профиль: бейджи, ачивки, рефералка |
| PR#14 | UX polish: PWA, Cmd+K, i18n, SEO |
| PR#15 | Тесты + CI/CD + Docker production |

## Применённые скиллы

- **frontend-design** (Anthropic) — bold direction, atmospheric layers, distinctive typography
- **impeccable** (pbakaus) — ease-out exponential curves, no gradient text, hierarchy через weight
- **design-motion-principles** (kylezantos) — frequency gate, spring physics, accessibility, GPU-only
- **taste-skill** (Leonxlnx) — MOTION_INTENSITY 8, magnetic micro-physics outside React render, anti-AI-slop правила
- **shadcn-ui** (Google Labs) — структура UI-примитивов
- **web-design-guidelines** (Vercel Labs) — баланс motion и production polish
