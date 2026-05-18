# NexusMarket — реализация по Plan A.md

## Обзор

Реализация платформы из Plan A.md идёт серией PR. Текущий статус — после PR#4:

| PR | Содержание | Статус |
|----|------------|--------|
| PR#1 | Frontend scaffold + iOS 26 design system + motion hero | ✅ landed |
| PR#2 | Backend skeleton: Express + Prisma + Redis + Socket.io + auth | ✅ landed |
| PR#3 | Marketplace + Orders + Reviews + escrow + auto-confirm worker | ✅ landed |
| **PR#4** | **Тёмный hero + анимированная планета + Marketplace UI** | **🆕 this PR** |
| PR#5 | Магазин: корзина, checkout, авто-доставка ключей | ⏳ next |
| PR#6 | Аренда: тарифы, таймеры, авто-продление | ⏳ |
| PR#7 | Автоматизация: парсеры FunPay/Starvell/Playerok | ⏳ |
| PR#8 | Админ-панель: дашборд, RBAC, модерация | ⏳ |
| PR#9 | Поддержка: тикеты, FAQ, AI-бот | ⏳ |
| PR#10 | Кошелёк: ЮKassa/FreeKassa/CryptoCloud | ⏳ |
| PR#11 | WebSocket: real-time чат, уведомления | ⏳ |
| PR#12 | API & SDK: Swagger, GraphQL, webhooks | ⏳ |
| PR#13 | Профиль: бейджи, ачивки, рефералка | ⏳ |
| PR#14 | UX polish: PWA, Cmd+K, i18n, SEO | ⏳ |
| PR#15 | Тесты + CI/CD + Docker production | ⏳ |

---

## PR#3 — что в этой ветке

### Cross-cutting

- **`utils/pagination.ts`** — cursor pagination (base64url-токены, `hasMore` через `take: limit + 1`, стабильный sort с `id` desc как якорь)
- **`services/commission.ts`** — комиссия по `SellerTier`: NONE 8.5% → BRONZE 7.0 → SILVER 6.0 → GOLD 5.0 → PLATINUM 3.5. Decimal-safe (никакого float-drift). `commissionFor(tier, subtotal)` → `{ commission, sellerNet }`.
- **`services/wallet.ts`** — единая точка для всех денежных операций:
  - `credit / debit` — кредит/дебит баланса с `Transaction` рядом
  - `freezeForEscrow / releaseEscrow / refundEscrow` — заморозка/выплата/возврат
  - `recordCommission` — отдельная audit-запись для отчётности
  - инвариант: `total = balance + balanceFrozen`, outflow → отрицательная сумма
  - race-safe debit через `updateMany({ where: { balance: { gte: amount } } })`

### Marketplace (`/api/v1/marketplace`)

14 эндпоинтов:

| Method | Path | Auth |
|--------|------|------|
| GET | `/games` | public |
| GET | `/categories` | public |
| GET | `/listings` | public (ауth расширяет видимость для owner/mod) |
| GET | `/listings/search` | public — autocomplete suggestions |
| GET | `/listings/featured` | public — boosted listings |
| GET | `/listings/:slug` | public — bumps view counter (если viewer ≠ owner) |
| GET | `/listings/:slug/related` | public |
| POST | `/listings` | SELLER+ |
| PATCH | `/listings/:id` | owner / MOD |
| DELETE | `/listings/:id` | owner / MOD — soft delete (ARCHIVED, не удаляет) |
| PATCH | `/listings/:id/status` | owner — ACTIVE/PAUSED/ARCHIVED |
| POST | `/listings/:id/duplicate` | owner — клонирует как DRAFT, stockQty=0 |
| POST | `/listings/:id/boost` | owner — стэкуется от `max(now, current boostedUntil)` |
| POST | `/listings/:id/report` | auth — rate-limit 5/min |

Особенности:
- **Cursor pagination** + 5 видов сортировки (`newest|price_asc|price_desc|popular|rating`), boosted всегда первый
- **Поиск**: prefix-first, fuzzy fill — `ILIKE` через Prisma `mode: insensitive`
- **Slug-генерация** с транслитерацией кириллицы, до 12 попыток уникализации
- **AUTO-delivery contract**: `deliveryCodes` или `unlimited=true`, валидируется и в DTO, и в service
- **Visibility**: 404 (не 403) для скрытых листингов — не выдаём существование чужих DRAFT'ов

### Reviews (`/api/v1/marketplace/...`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/listings/:id/reviews` | public (`includeHidden` — только owner/mod) |
| POST | `/reviews` | auth — only buyer of COMPLETED order, unique `(authorId, orderId)` |
| POST | `/reviews/:id/reply` | seller (subject of review) |
| GET | `/sellers/:sellerId/reviews` | public |

- При создании/публикации/скрытии — **пересчёт** `listing.ratingAvg` и `reviewCount` в той же транзакции (`isPublished: true` only) — гарантирует, что скрытие отзыва модератором сразу обновляет публичный рейтинг.

### Orders (`/api/v1/orders`)

8 эндпоинтов с полным lifecycle:

```
PENDING ──pay──▶ PAID ──deliver──▶ DELIVERING ─┬─ confirm ──▶ COMPLETED
                                               ├─ auto-confirm 48h ──▶ COMPLETED
                                               └─ dispute ──▶ DISPUTED ─┬─ release ──▶ COMPLETED
                                                                        ├─ refund ──▶ REFUNDED
                                                                        └─ split (% refund + remainder) ──▶ REFUNDED

PENDING ──cancel──▶ CANCELLED  (только до оплаты, восстанавливает stock)
```

| Method | Path | Auth |
|--------|------|------|
| GET | `/orders` | auth — `?role=buyer\|seller` |
| POST | `/orders` | auth — checkout limiter 20/min |
| GET | `/orders/:id` | buyer / seller / mod (404 для остальных) |
| PATCH | `/orders/:id/deliver` | seller — PAID → DELIVERING |
| PATCH | `/orders/:id/confirm` | buyer — DELIVERING → COMPLETED + releaseEscrow |
| PATCH | `/orders/:id/cancel` | PENDING only |
| POST | `/orders/:id/dispute` | buyer / seller |
| POST | `/orders/:id/dispute/resolve` | MODERATOR+ — refund / release / split |

Money flow при checkout (всё атомарно в `prisma.$transaction`):
1. Stock decrement через conditional `updateMany` (race-safe — гонка двух последних единиц решается на уровне БД)
2. `debit(buyer, total)` — выводит из кошелька
3. `freezeForEscrow(seller, sellerNet)` — замораживает чистую сумму продавцу
4. `recordCommission(seller, commission)` — отдельная аудит-запись
5. Pop AUTO-delivery codes (или `generateUnlimitedCodes` для `unlimited`); AUTO сразу прыгает в DELIVERING
6. `salesCount++`

Order numbers — `NM-YYYY-NNNNNN` через postgres-секвенс `order_number_seq` (lazy create в `nextOrderNumber()`, race-safe независимо от количества реплик).

### Auto-confirm worker

`jobs/orderAutoConfirm.job.ts` — BullMQ-job каждые 60 секунд:
- Pulls до 200 DELIVERING-заказов где `autoConfirmAt <= now`, oldest-first (FIFO)
- **Per-order транзакция** (не batch — bad row не должен ронять весь батч)
- Re-check статуса внутри tx для идемпотентности (между SELECT и UPDATE покупатель мог уже confirm'нуть, или модератор открыть dispute)
- `releaseEscrow` + `status = COMPLETED` + best-effort notification

### OpenAPI

`openapi.ts` v0.3.0 — 28 документированных путей. Полные схемы для `Listing*`, `Order*`, `Review*`, `Page<T>`, плюс enum'ы (`ListingType`, `OrderStatus`, `Currency`, `Platform`, `SellerTier`, ...). Доступно через `GET /openapi.json` и Swagger UI на `/docs`.

---

## Что **не** в PR#3

Сознательно отложено в следующие PR:

- **Frontend для marketplace** (фильтры, бесконечная прокрутка, чат buyer↔seller, real-time типинг) — **PR#4**.
- **Multi-item carts** (для официального магазина) — DTO принимает один листинг, схема БД уже поддерживает множественные `OrderItem` — **PR#5**.
- **Реальные платежи** (ЮKassa / FreeKassa / CryptoCloud) — сейчас "оплата" просто дебитит внутренний баланс пользователя (seed даёт каждому покупателю достаточный баланс); webhook'и провайдеров — **PR#10**.
- **Промокоды** — DTO принимает `promoCode`, но валидация и применение — **PR#10**.
- **Шифрование `deliveryCodes`** — сейчас хранятся как plain JSON в `deliveryPayload`. Шифрование at-rest — **PR#10**.
- **AI-модерация листингов** — все новые листинги ACTIVE сразу. PR#8 поднимет default до `PENDING_REVIEW` и добавит pipeline.
- **Real-time order chat** — endpoints стабнуты, фактический WebSocket-канал и persistence — **PR#11**.
- **Отдельная "platform ledger" модель** для отчётов по комиссиям — сейчас комиссия выводится из дельты buyer-paid и seller-received + отдельный COMMISSION-ряд — **PR#10**.

---

## PR#4 — что в этой ветке

Frontend-PR. Два направления:

### 1. Тёмный hero + анимированная motion-планета

**Тема стала чернее.** Палитра ужата: `--bg #030305` (было `#050507`), `--muted #6E6E73` (было `#8E8E93`), glass `0.04/0.075` (было `0.06/0.10`), border `0.09` (было `0.12`), полосы `0.035` (было `0.05`). Aurora-mesh снижен до ~60% прежней интенсивности, зелёный hotspot уехал в bottom-right (`80% 95%`) чтобы освободить фокальную зону для планеты. Tailwind-токены `ink` / `chrome` синхронизированы с CSS-переменными. Контраст текста на главном бампнут (`white/0.62` подзаголовок и `white/0.66` lede) чтобы остаться читаемым.

**HeroPlanet** заменил HeroOrb. 7-слойная композиция:

1. **Atmosphere** — мягкий halo шире планеты, biased в сторону "солнца" (upper-left).
2. **Shell** — сфера с радиальной маской (без SVG → нативная пиксельная плотность); ночная сторона тонирована blue-grey, не чёрная.
3. **Surface bands** — `conic-gradient` под маской, период вращения 64s.
4. **Cloud bands** — второй conic в более светлых тонах + `mix-blend-mode: screen`, контр-вращение 38s. Период != surface, чтобы слои не сходились в один и тот же кадр.
5. **Terminator** — фиксированный `linear-gradient(135deg, ...)` (солнце не вращается, планета вращается).
6. **Specular** — точечный radial highlight на освещённой полусфере.
7. **Moon orbit** — wrapper-rotate + смещение луны; орбита-эллипс через `transform: rotateZ(-12deg) scaleY(0.42)` (обманка на наклон орбитальной плоскости).
8. **Stars** — сетка radial-точек + единый twinkle (per-star phase — over-engineering на этом масштабе).

**Mouse-parallax tilt** — `useMotionValue + useSpring` вне React-render-cycle (taste-skill §4). Внутренняя оболочка наклоняется в 1.6× больше внешней атмосферы для иллюзии глубины (rotateY ±9.6° vs ±6°). `prefers-reduced-motion` отключает parallax-listener и фризит CSS-spin'ы через `.planet-static`. GPU-only — анимируется только `transform`/`opacity`.

**`preview.html`** зеркалирован: те же токены, тот же 7-слойный планет-стек на чистом CSS, parallax-JS с `matchMedia('(prefers-reduced-motion: reduce)')` гейтом и одним RAF-loop с lerp 0.08 (визуально соответствует React-spring stiffness 80 / damping 18).

### 2. Marketplace UI

Полностью рабочий маркетплейс на `/marketplace` и `/marketplace/[slug]`, говорящий с реальным API из PR#3.

**Cross-cutting plumbing:**

- **`lib/types.ts`** — frontend-mirrors всех Marketplace DTO (`ListingCard`, `ListingDetail`, `Game`, `CategoryNode`, `Page<T>`, `ListingSort`, все enum'ы). Hand-maintained — заменится на OpenAPI-кодоген в PR#12.
- **`lib/api.ts`** — типизированный fetch-wrapper:
  - env-driven `baseUrl` (Server-Components пользуются `API_BASE_INTERNAL`, browser — `NEXT_PUBLIC_API_BASE`)
  - `ApiError` класс нормализует AppError-конверт бэкенда
  - **registerTokenSource** pattern — `auth-store` инжектирует токен-getter, чтобы api ↔ store не было циклов
  - **Single-flight refresh** через `inflightRefresh` Promise — три одновременных 401 не приведут к трём refresh'ам (что уронило бы все сессии)
  - 401 → refresh → retry-once policy; больше одного retry не делаем во избежание петель
  - Next.js fetch caching hints: `revalidate 30s` для листингов, `60s` для related/featured, `300s` для catalog, `no-store` для search-suggestions
- **`lib/auth-store.ts`** (Zustand + persist):
  - LocalStorage-перс с `_hasHydrated` флагом и `onRehydrateStorage` callback'ом — устраняет SSR-mismatch на первом paint'е
  - `partialize` пропускает `_hasHydrated` (он runtime-only)
  - `useBootstrapAuth()` re-валидирует сессию через `/auth/me` после гидрации; 401 → `clear()`, transient (network/5xx) — оставляет state как есть
- **`AuthBootstrap`** client-component вмонтирован в root layout — единственная точка инициализации store в дереве

**Список (`/marketplace`):**

- Server Component резолвит `searchParams` → `ResolvedFilters` через `parseSearchParams`, грузит `/catalog/games` (cached 5min) и hand'ит client-компоненту
- **`MarketplaceBrowser`** держит state филтров+sort, синхронизированный с URL (источник истины — URL; `router.replace` со `scroll: false` чтобы chip-spam не раздувал history)
- **`useInfiniteListings`** — кастомный reducer-hook с тремя load-режимами:
  - `initial` → скелетоны
  - `refresh` → поверх старых карточек ставится translucent overlay (избегаем flash-to-empty на смене фильтров)
  - `more` → tail-spinner внизу
- AbortController на каждый запрос — гонка типа `q=cs2 → q=cs2 knife` решается отменой первого запроса
- `IntersectionObserver` с `rootMargin: 400px` — подгрузка триггерится до того, как пользователь упрётся в дно
- **`FilterPanel`** — search debounced 300ms, chip-rows для game/type/platform с горизонтальной прокруткой при overflow, price min/max с `onCommit`-семантикой (blur или Enter, не на каждый символ)
- **`SortBar`** — нативный `<select>` (бесплатные iOS wheel picker, keyboard, screen-reader)
- **`ListingCard`** — Link оборачивает всю карточку, manual currency formatting (Decimal-as-string preservation: backend возвращает `"18400.00"`, мы НЕ пускаем через `Number()`), graceful image fallback (broken cdn URL → скрытый img → видимый gradient placeholder)

**Деталь (`/marketplace/[slug]`):**

- Server Component, fetch listing+related параллельно. 404 → `notFound()` (не leak'аем существование hidden листингов через 403); прочие ошибки идут в error-boundary
- **`ListingGallery`** — hero + thumb-strip с cross-fade (`AnimatePresence`), keyboard ←/→, fallback на gradient placeholder при пустых images
- **`SellerCard`** — avatar (или стабильный monogram fallback), tier badge с per-tier color treatment (PLATINUM/GOLD/SILVER/BRONZE), join year, contact CTA → `/users/[username]#contact` (storefront лежит в PR#13)
- **`BuyBox`** — sticky на lg+, qty stepper скрывается при `stockQty === 1`, **BigInt-based total** через cents (никакого float-drift на `142_700.99 × 3`), auth-gated CTA: гости → `/auth/login?return=…`. Сам checkout-call отложен в PR#5 (вместе с многотоварной корзиной)
- **`ListingReviews`** — client lazy-load: первые 6 на mount, "Показать ещё" пагинация. Star-row, русские плюрал-правила inline (без i18n до PR#14), relative-time formatter без date-fns. Обрабатывает seller-replies
- **`RelatedListings`** — server-renderable, `withMotion={false}` чтобы не staggеr'ить cards при прямой навигации; скрывается если рейл пуст

---

## Что **не** в PR#4

- **Реальный checkout** — Buy-кнопка ведёт на `/orders/new?listingId=…`, но сама страница оформления ждёт PR#5 (вместе с многотоварной корзиной и промокодами)
- **Real-time chat покупатель↔продавец** — endpoint в backend стабнут, WebSocket-комната и UI — PR#11
- **Storefront продавца** — `/users/[username]` сейчас рендерит существующий PageShell-стаб; полная витрина с бейджами и achievements — PR#13
- **Image upload pipeline** (S3/MinIO + next/image оптимизация) — PR#15. Сейчас `<img>` напрямую с серверных URL'ов, c graceful onError-фолбэком
- **OpenAPI кодоген** — `lib/types.ts` руками. Будет авто-сгенерирован в PR#12
- **HttpOnly-cookies для refresh-токенов** — пока localStorage. Миграция в PR#10 вместе с реальными платежами и CSP-хардингом

---

## Применённые скиллы

- **frontend-design** (Anthropic) — bold direction, atmospheric layers, distinctive typography
- **impeccable** (pbakaus) — ease-out exponential curves, no gradient text, hierarchy через weight
- **design-motion-principles** (kylezantos) — frequency gate, spring physics, accessibility, GPU-only
- **taste-skill** (Leonxlnx) — MOTION_INTENSITY 8, magnetic micro-physics outside React render, anti-AI-slop правила
- **shadcn-ui** (Google Labs) — структура UI-примитивов
- **web-design-guidelines** (Vercel Labs) — баланс motion и production polish

---

## Запуск

```bash
# 1) Поднять БД и кэш
cp .env.example .env
docker compose up -d

# 2) Backend
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed   # 6 sellers, 12 buyers, 24 listings, 30 orders, etc.
npm run dev           # http://localhost:4000/docs (Swagger UI)

# 3) Frontend
cd ../frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE по умолчанию указывает на :4000
npm install
npm run dev           # http://localhost:3000
```

Standalone превью главного экрана без сборки — `preview.html` в корне репо.
