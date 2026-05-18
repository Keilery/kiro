# NexusMarket — реализация по Plan A.md

## Обзор

Реализация платформы из Plan A.md идёт серией PR. Текущий статус — после PR#3:

| PR | Содержание | Статус |
|----|------------|--------|
| PR#1 | Frontend scaffold + iOS 26 design system + motion hero | ✅ landed |
| PR#2 | Backend skeleton: Express + Prisma + Redis + Socket.io + auth | ✅ landed |
| **PR#3** | **Marketplace + Orders + Reviews + escrow + auto-confirm worker** | **🆕 this PR** |
| PR#4 | Marketplace UI — фильтры, бесконечная прокрутка, чат | ⏳ next |
| PR#5 | Магазин: корзина, checkout, авто-доставка ключей | ⏳ |
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
npm install
npm run dev           # http://localhost:3000
```

Standalone превью главного экрана без сборки — `preview.html` в корне репо.
