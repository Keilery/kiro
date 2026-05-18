/**
 * NexusMarket — database seed
 *
 * Populates a development database with realistic content:
 *  - 1 superadmin, 1 moderator, 6 sellers (varied tiers), 12 buyers
 *  - 8 games, 14 categories
 *  - 24 listings across types and games, with images
 *  - 30 completed orders with reviews, escrow transactions
 *  - 6 active bots wired to 3 integrations, 80 bot logs
 *  - 4 active rentals, 3 promos, 8 achievements
 *  - 200 analytics events, 40 audit log entries
 *
 * Names, prices, ratings — organic, not "John Doe / 99.99% / Acme"
 * (per taste-skill anti-AI-slop rules in §7).
 */

import {
  PrismaClient,
  UserRole,
  AccountStatus,
  SellerTier,
  AuthProvider,
  Currency,
  Platform,
  ListingType,
  ListingStatus,
  DeliveryMode,
  OrderStatus,
  TransactionType,
  TransactionStatus,
  PaymentProvider,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  NotificationType,
  NotificationChannel,
  BotPlatform,
  BotStatus,
  BotLogLevel,
  RentalStatus,
  PromoKind,
} from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("pick: empty array");
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]!);
  }
  return out;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPastDate(maxDaysAgo: number): Date {
  const ms = rand(0, maxDaysAgo * 24 * 60 * 60 * 1000);
  return new Date(Date.now() - ms);
}

function orderNumber(seq: number): string {
  return `NM-2026-${String(seq).padStart(6, "0")}`;
}

function ticketNumber(seq: number): string {
  return `T-2026-${String(seq).padStart(6, "0")}`;
}

// ─── Reset (dev-only) ────────────────────────────────────────────────

async function reset() {
  // Order matters because of FKs. Cascade where possible, but be explicit.
  const tables = [
    "BotLog",
    "Bot",
    "Integration",
    "WebhookDelivery",
    "Webhook",
    "RentalSession",
    "Rental",
    "RentalUnit",
    "PromoUsage",
    "Promo",
    "Report",
    "Review",
    "TicketMessage",
    "Ticket",
    "Transaction",
    "Withdrawal",
    "OrderItem",
    "Order",
    "ListingImage",
    "Listing",
    "Category",
    "Game",
    "AnalyticsEvent",
    "PageView",
    "AuditLog",
    "UserAchievement",
    "Achievement",
    "Notification",
    "NotificationPreference",
    "Referral",
    "ApiKey",
    "OAuthAccount",
    "Session",
    "User",
  ];

  for (const t of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
  }
}

// ─── Static catalog data ─────────────────────────────────────────────

const GAMES = [
  { slug: "genshin-impact", title: "Genshin Impact", publisher: "miHoYo", platforms: [Platform.PC, Platform.PLAYSTATION, Platform.MOBILE] },
  { slug: "cs2", title: "Counter-Strike 2", publisher: "Valve", platforms: [Platform.PC] },
  { slug: "dota-2", title: "Dota 2", publisher: "Valve", platforms: [Platform.PC] },
  { slug: "wow", title: "World of Warcraft", publisher: "Blizzard", platforms: [Platform.PC] },
  { slug: "valorant", title: "Valorant", publisher: "Riot Games", platforms: [Platform.PC] },
  { slug: "lol", title: "League of Legends", publisher: "Riot Games", platforms: [Platform.PC] },
  { slug: "fortnite", title: "Fortnite", publisher: "Epic Games", platforms: [Platform.PC, Platform.PLAYSTATION, Platform.XBOX] },
  { slug: "ea-fc-25", title: "EA Sports FC 25", publisher: "EA", platforms: [Platform.PC, Platform.PLAYSTATION, Platform.XBOX] },
] as const;

const CATEGORIES_ROOT = [
  { slug: "accounts", title: "Аккаунты", iconName: "user-circle" },
  { slug: "currency", title: "Игровая валюта", iconName: "coins" },
  { slug: "items", title: "Предметы и скины", iconName: "package" },
  { slug: "boost", title: "Прокачка", iconName: "trending-up" },
  { slug: "keys", title: "Ключи", iconName: "key" },
  { slug: "services", title: "Услуги", iconName: "wrench" },
] as const;

// Realistic gaming-flavoured handles (no John/Sarah/Jack — per taste-skill §7)
const SELLER_HANDLES = [
  { username: "voltage_eu",   displayName: "Voltage (EU)",        tier: SellerTier.PLATINUM },
  { username: "skin_lab",     displayName: "Skin Lab",            tier: SellerTier.GOLD     },
  { username: "tideguild",    displayName: "Tideguild Boosting",  tier: SellerTier.GOLD     },
  { username: "kira_shop",    displayName: "Kira Shop",           tier: SellerTier.SILVER   },
  { username: "thresholdco",  displayName: "Threshold Co.",       tier: SellerTier.SILVER   },
  { username: "halcyon_keys", displayName: "Halcyon Keys",        tier: SellerTier.BRONZE   },
] as const;

const BUYER_HANDLES = [
  "lev_volkov",
  "anya_petrenko",
  "milo_ardent",
  "dasha_kovaleva",
  "ostap_belyaev",
  "yura_klein",
  "ksenia_lobanova",
  "egor_sasha",
  "polina_rasch",
  "nikolas_bek",
  "asya_renato",
  "alex_morinov",
] as const;

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("→ resetting database…");
  await reset();

  // ── Users ──────────────────────────────────────────────────────────
  console.log("→ creating users…");
  const passwordHash = await argon2.hash("Nexus_Dev_Pass_2026!");

  const superadmin = await prisma.user.create({
    data: {
      email: "admin@nexusmarket.local",
      username: "_root",
      displayName: "Platform Root",
      passwordHash,
      authProvider: AuthProvider.PASSWORD,
      role: UserRole.SUPERADMIN,
      status: AccountStatus.ACTIVE,
      sellerTier: SellerTier.NONE,
      emailVerifiedAt: new Date(),
      kycVerifiedAt: new Date(),
      balance: 0,
      preferredCurrency: Currency.RUB,
      experience: 99999,
      level: 99,
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: "mod.iris@nexusmarket.local",
      username: "iris_mod",
      displayName: "Iris (модерация)",
      passwordHash,
      authProvider: AuthProvider.PASSWORD,
      role: UserRole.MODERATOR,
      status: AccountStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      balance: 0,
      experience: 4720,
      level: 12,
    },
  });

  const sellers = [];
  for (const h of SELLER_HANDLES) {
    const u = await prisma.user.create({
      data: {
        email: `${h.username}@nexusmarket.local`,
        username: h.username,
        displayName: h.displayName,
        passwordHash,
        authProvider: AuthProvider.PASSWORD,
        role: UserRole.SELLER,
        status: AccountStatus.ACTIVE,
        sellerTier: h.tier,
        emailVerifiedAt: new Date(),
        kycVerifiedAt: h.tier === SellerTier.PLATINUM || h.tier === SellerTier.GOLD ? new Date() : null,
        balance: rand(10000, 480000),
        balanceFrozen: rand(0, 25000),
        experience: rand(2400, 28000),
        level: rand(8, 42),
        bio: `Продаю с 2021 года. Специализация: ${pick(["Genshin", "CS2", "WoW", "Valorant", "LoL"])}. Гарантия 30 дней.`,
      },
    });
    sellers.push(u);
  }

  const buyers = [];
  for (const username of BUYER_HANDLES) {
    const u = await prisma.user.create({
      data: {
        email: `${username}@nexusmarket.local`,
        username,
        passwordHash,
        authProvider: AuthProvider.PASSWORD,
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        balance: rand(0, 18000),
        experience: rand(0, 1800),
        level: rand(1, 9),
      },
    });
    buyers.push(u);
  }

  // Notification preferences default for everyone
  for (const u of [superadmin, moderator, ...sellers, ...buyers]) {
    await prisma.notificationPreference.create({
      data: {
        userId: u.id,
        channels: {
          ORDER_NEW:        ["IN_APP", "EMAIL", "TELEGRAM"],
          ORDER_UPDATED:    ["IN_APP", "EMAIL"],
          CHAT_MESSAGE:     ["IN_APP", "PUSH"],
          DISPUTE_OPENED:   ["IN_APP", "EMAIL"],
          PAYOUT_COMPLETED: ["IN_APP", "EMAIL"],
          REVIEW_RECEIVED:  ["IN_APP"],
          RENTAL_EXPIRING:  ["IN_APP", "PUSH", "TELEGRAM"],
          ACCOUNT_LOGIN:    ["IN_APP", "EMAIL"],
          PROMO:            ["IN_APP"],
          SYSTEM:           ["IN_APP", "EMAIL"],
        },
      },
    });
  }

  // ── Catalog ────────────────────────────────────────────────────────
  console.log("→ creating games and categories…");
  const gameRecords = [];
  for (const g of GAMES) {
    const created = await prisma.game.create({
      data: {
        slug: g.slug,
        title: g.title,
        publisher: g.publisher,
        platforms: [...g.platforms],
        popularity: rand(50, 1000),
        coverUrl: `https://cdn.nexusmarket.local/games/${g.slug}/cover.jpg`,
        iconUrl: `https://cdn.nexusmarket.local/games/${g.slug}/icon.png`,
      },
    });
    gameRecords.push(created);
  }

  const rootCats = [];
  for (let i = 0; i < CATEGORIES_ROOT.length; i++) {
    const c = CATEGORIES_ROOT[i]!;
    const created = await prisma.category.create({
      data: {
        slug: c.slug,
        title: c.title,
        iconName: c.iconName,
        position: i,
      },
    });
    rootCats.push(created);
  }
  // 8 children: per-game variants under "accounts"
  const accountsRoot = rootCats.find((c) => c.slug === "accounts")!;
  for (const g of gameRecords) {
    await prisma.category.create({
      data: {
        slug: `accounts-${g.slug}`,
        title: `Аккаунты ${g.title}`,
        parentId: accountsRoot.id,
        iconName: "user-circle",
      },
    });
  }

  // ── Listings ───────────────────────────────────────────────────────
  console.log("→ creating listings…");
  const listingTemplates: Array<{
    type: ListingType;
    titleFor: (gameTitle: string) => string;
    priceMin: number;
    priceMax: number;
    delivery: DeliveryMode;
  }> = [
    { type: ListingType.ACCOUNT,  titleFor: (g) => `${g} · топовый аккаунт со всеми DLC`,        priceMin: 4500,  priceMax: 78000,  delivery: DeliveryMode.MANUAL },
    { type: ListingType.ACCOUNT,  titleFor: (g) => `${g} · фарм-аккаунт, чистый старт`,           priceMin: 990,   priceMax: 7800,   delivery: DeliveryMode.MANUAL },
    { type: ListingType.KEY,      titleFor: (g) => `${g} · ключ активации (Steam, RU)`,           priceMin: 1290,  priceMax: 4290,   delivery: DeliveryMode.AUTO   },
    { type: ListingType.ITEM,     titleFor: (g) => `${g} · редкий предмет (FN)`,                  priceMin: 8400,  priceMax: 245000, delivery: DeliveryMode.MANUAL },
    { type: ListingType.SERVICE,  titleFor: (g) => `${g} · услуга по ускоренной прокачке`,        priceMin: 2400,  priceMax: 18900,  delivery: DeliveryMode.SCHEDULED },
    { type: ListingType.CURRENCY, titleFor: (g) => `${g} · игровая валюта, 100 000 ед.`,          priceMin: 3200,  priceMax: 12400,  delivery: DeliveryMode.MANUAL },
    { type: ListingType.BOOST,    titleFor: (g) => `${g} · буст ранга, гарантия 24 часа`,         priceMin: 1900,  priceMax: 9700,   delivery: DeliveryMode.SCHEDULED },
  ];

  const listings = [];
  for (let i = 0; i < 24; i++) {
    const seller = pick(sellers);
    const game = pick(gameRecords);
    const tpl = pick(listingTemplates);
    const cat = pick(rootCats);
    const baseSlug = `${tpl.type.toLowerCase()}-${game.slug}-${i + 1}`;

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        gameId: game.id,
        categoryId: cat.id,
        type: tpl.type,
        status: ListingStatus.ACTIVE,
        title: tpl.titleFor(game.title),
        slug: baseSlug,
        description:
          "Доставка после оплаты. Полная поддержка: подскажу как войти, помогу со сменой почты, отвечу на любые вопросы. Гарантия 30 дней — если что-то пойдёт не так, верну средства.",
        tags: pickN(["popular", "fresh", "verified", "fast", "auto", "discount"], rand(2, 4)),
        platform: pick(game.platforms),
        currency: Currency.RUB,
        price: rand(tpl.priceMin, tpl.priceMax),
        compareAtPrice: Math.random() > 0.6 ? rand(tpl.priceMin, tpl.priceMax) * 1.4 : null,
        stockQty: tpl.delivery === DeliveryMode.AUTO ? rand(10, 80) : rand(1, 5),
        unlimited: false,
        deliveryMode: tpl.delivery,
        deliveryPayload:
          tpl.delivery === DeliveryMode.AUTO
            ? { codes: Array.from({ length: rand(5, 12) }, () => `KEY-${cuidlite()}-${cuidlite()}`) }
            : null,
        boostedUntil: Math.random() > 0.85 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        viewCount: rand(40, 6400),
        salesCount: rand(0, 240),
        reviewCount: rand(0, 60),
        ratingAvg: Number((rand(420, 500) / 100).toFixed(2)), // 4.20..5.00
      },
    });

    // 1-3 images
    const imgCount = rand(1, 3);
    for (let j = 0; j < imgCount; j++) {
      await prisma.listingImage.create({
        data: {
          listingId: listing.id,
          url: `https://cdn.nexusmarket.local/listings/${listing.id}/img-${j}.jpg`,
          width: 1280,
          height: 960,
          position: j,
          isCover: j === 0,
        },
      });
    }

    listings.push(listing);
  }

  // ── Promos ─────────────────────────────────────────────────────────
  console.log("→ creating promos…");
  const promos = await Promise.all([
    prisma.promo.create({
      data: { code: "WELCOME10",  kind: PromoKind.PERCENT, value: 10, currency: Currency.RUB, isActive: true, maxRedemptions: 5000 },
    }),
    prisma.promo.create({
      data: { code: "SUMMER300",  kind: PromoKind.FIXED,   value: 300, currency: Currency.RUB, minOrderTotal: 1500, isActive: true },
    }),
    prisma.promo.create({
      data: { code: "BONUS500",   kind: PromoKind.BONUS_BALANCE, value: 500, currency: Currency.RUB, isActive: true, maxRedemptions: 200 },
    }),
  ]);

  // ── Orders ─────────────────────────────────────────────────────────
  console.log("→ creating orders, transactions, reviews…");
  const completedListings = pickN(listings, 18);
  let orderSeq = 1;

  for (let i = 0; i < 30; i++) {
    const listing = pick(completedListings);
    const buyer = pick(buyers);
    if (buyer.id === listing.sellerId) continue;

    const subtotal = Number(listing.price);
    const commission = Math.round(subtotal * 0.07 * 100) / 100;
    const total = subtotal;

    const status =
      i < 22 ? OrderStatus.COMPLETED :
      i < 26 ? OrderStatus.DELIVERING :
      i < 28 ? OrderStatus.DISPUTED :
      OrderStatus.CANCELLED;

    const paidAt = randomPastDate(45);
    const order = await prisma.order.create({
      data: {
        number: orderNumber(orderSeq++),
        buyerId: buyer.id,
        sellerId: listing.sellerId,
        status,
        currency: Currency.RUB,
        subtotal,
        commission,
        total,
        paidAt: status !== OrderStatus.CANCELLED ? paidAt : null,
        deliveredAt: status === OrderStatus.COMPLETED || status === OrderStatus.DELIVERING ? new Date(paidAt.getTime() + 10 * 60 * 1000) : null,
        confirmedAt: status === OrderStatus.COMPLETED ? new Date(paidAt.getTime() + 2 * 60 * 60 * 1000) : null,
        autoConfirmAt: status === OrderStatus.DELIVERING ? new Date(Date.now() + 36 * 60 * 60 * 1000) : null,
        disputedAt: status === OrderStatus.DISPUTED ? new Date(paidAt.getTime() + 4 * 60 * 60 * 1000) : null,
        cancelledAt: status === OrderStatus.CANCELLED ? new Date() : null,
        items: {
          create: {
            listingId: listing.id,
            titleSnapshot: listing.title,
            priceSnapshot: listing.price,
            currency: Currency.RUB,
            quantity: 1,
          },
        },
      },
    });

    // Buyer's payment in
    await prisma.transaction.create({
      data: {
        userId: buyer.id,
        orderId: order.id,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.COMPLETED,
        currency: Currency.RUB,
        amount: -total,
        provider: PaymentProvider.YOOKASSA,
        providerTxnId: `yk_${cuidlite()}${cuidlite()}`,
        description: `Оплата заказа ${order.number}`,
      },
    });

    // Escrow hold + release on completion
    await prisma.transaction.create({
      data: {
        userId: listing.sellerId,
        orderId: order.id,
        type: TransactionType.ESCROW_HOLD,
        status: TransactionStatus.COMPLETED,
        currency: Currency.RUB,
        amount: total - commission,
        description: `Эскроу удержан по ${order.number}`,
      },
    });

    if (status === OrderStatus.COMPLETED) {
      await prisma.transaction.create({
        data: {
          userId: listing.sellerId,
          orderId: order.id,
          type: TransactionType.ESCROW_RELEASE,
          status: TransactionStatus.COMPLETED,
          currency: Currency.RUB,
          amount: total - commission,
          description: `Выплата по ${order.number}`,
        },
      });

      // Review (1 in 2 orders)
      if (Math.random() > 0.5) {
        await prisma.review.create({
          data: {
            authorId: buyer.id,
            subjectId: listing.sellerId,
            orderId: order.id,
            listingId: listing.id,
            rating: pick([4, 5, 5, 5, 5]),
            body: pick([
              "Доставка за 4 минуты, всё работает. Беру не первый раз.",
              "Связь по делу, без воды. Спасибо.",
              "Ожидал дольше — пришло мгновенно. Рекомендую.",
              "Всё чётко, поддержка адекватная.",
              "Качественно. Чуть-чуть инструкция запутанная, но разобрался.",
            ]),
            isPublished: true,
          },
        });
      }
    }
  }

  // ── Tickets ────────────────────────────────────────────────────────
  console.log("→ creating support tickets…");
  for (let i = 1; i <= 8; i++) {
    const author = pick(buyers);
    const t = await prisma.ticket.create({
      data: {
        number: ticketNumber(i),
        authorId: author.id,
        category: pick([TicketCategory.ORDER_DISPUTE, TicketCategory.PAYMENT, TicketCategory.TECHNICAL, TicketCategory.GENERAL]),
        priority: pick([TicketPriority.LOW, TicketPriority.NORMAL, TicketPriority.NORMAL, TicketPriority.HIGH]),
        status: i <= 4 ? TicketStatus.RESOLVED : TicketStatus.IN_PROGRESS,
        subject: pick([
          "Не пришёл код после оплаты",
          "Продавец не отвечает 12 часов",
          "Возврат средств за невалидный ключ",
          "Двойная оплата — нужно разобраться",
          "Не открывается страница маркета",
        ]),
        assignedToId: i <= 4 ? moderator.id : null,
        firstResponseDueAt: new Date(Date.now() + 60 * 60 * 1000),
        firstResponseAt: i <= 4 ? new Date() : null,
        closedAt: i <= 4 ? new Date() : null,
        satisfactionScore: i <= 4 ? rand(4, 5) : null,
      },
    });

    await prisma.ticketMessage.create({
      data: {
        ticketId: t.id,
        authorId: author.id,
        body: "Помогите пожалуйста, оплата прошла, но код так и не пришёл. Заказ — NM-2026-00010.",
      },
    });

    if (i <= 4) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: t.id,
          authorId: moderator.id,
          body: "Здравствуйте. Проверил — код доставлен в личные сообщения. Подтвердите получение.",
        },
      });
    }
  }

  // ── Notifications ──────────────────────────────────────────────────
  console.log("→ creating notifications…");
  for (const u of [...buyers, ...sellers]) {
    const n = rand(1, 4);
    for (let i = 0; i < n; i++) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: pick([
            NotificationType.ORDER_NEW,
            NotificationType.CHAT_MESSAGE,
            NotificationType.PAYOUT_COMPLETED,
            NotificationType.REVIEW_RECEIVED,
          ]),
          channel: NotificationChannel.IN_APP,
          title: pick([
            "Новый заказ",
            "Сообщение от продавца",
            "Выплата завершена",
            "Получен отзыв",
          ]),
          body: "Откройте, чтобы посмотреть подробности.",
          deliveredAt: new Date(),
          readAt: Math.random() > 0.5 ? new Date() : null,
        },
      });
    }
  }

  // ── Automation: integrations + bots + logs ────────────────────────
  console.log("→ creating bots and integrations…");
  const integrations = [];
  for (const seller of sellers.slice(0, 3)) {
    for (const platform of [BotPlatform.FUNPAY, BotPlatform.STARVELL, BotPlatform.PLAYEROK]) {
      const integration = await prisma.integration.create({
        data: {
          userId: seller.id,
          platform,
          label: `${platform.toLowerCase()} primary`,
          credentials: { token: `enc::${cuidlite()}${cuidlite()}${cuidlite()}` },
          isActive: true,
          lastSyncAt: new Date(Date.now() - rand(60, 7200) * 1000),
        },
      });
      integrations.push(integration);
    }
  }

  const bots = [];
  for (const seller of sellers.slice(0, 3)) {
    const integ = integrations.find((i) => i.userId === seller.id && i.platform === BotPlatform.FUNPAY);
    const b1 = await prisma.bot.create({
      data: {
        userId: seller.id,
        integrationId: integ?.id ?? null,
        name: "Auto-bump · FunPay",
        kind: "auto-bump",
        status: BotStatus.RUNNING,
        config: { interval: 240, lots: "all" },
        schedule: "*/4 * * * *",
        lastRunAt: new Date(Date.now() - rand(60, 600) * 1000),
      },
    });
    const b2 = await prisma.bot.create({
      data: {
        userId: seller.id,
        integrationId: integ?.id ?? null,
        name: "Price-sync · multi-platform",
        kind: "price-sync",
        status: BotStatus.RUNNING,
        config: { sources: ["funpay", "starvell", "playerok"], strategy: "min-1%" },
        schedule: "*/15 * * * *",
        lastRunAt: new Date(Date.now() - rand(60, 900) * 1000),
      },
    });
    bots.push(b1, b2);
  }

  const logMessages = [
    "auto-bump: подняли 47 лотов",
    "price-sync: средняя цена -1.2%, обновлено 23 лота",
    "auto-reply: ответили на 3 сообщения",
    "конкурент снизил цену → подстраиваемся",
    "получен новый заказ от покупателя",
    "лот скрыт по условию (out of stock)",
    "playerok API вернул 429, ждём 30s",
    "starvell sync завершён за 2.4s",
  ];
  for (const bot of bots) {
    for (let i = 0; i < 8; i++) {
      await prisma.botLog.create({
        data: {
          botId: bot.id,
          level: i === 5 ? BotLogLevel.WARN : BotLogLevel.INFO,
          message: pick(logMessages),
          context: { iteration: i },
          createdAt: new Date(Date.now() - i * 60 * 1000),
        },
      });
    }
  }

  // ── Rentals ────────────────────────────────────────────────────────
  console.log("→ creating rental units and rentals…");
  const rentalUnits = [];
  for (const g of pickN(gameRecords, 4)) {
    const unit = await prisma.rentalUnit.create({
      data: {
        gameId: g.id,
        label: `${g.title} · pool A`,
        credentials: { login: `acc_${cuidlite()}`, password: `enc::${cuidlite()}${cuidlite()}` },
        isShared: false,
        plans: { "1h": 80, "1d": 290, "3d": 690, "7d": 1290, "30d": 3990 },
      },
    });
    rentalUnits.push(unit);
  }
  for (let i = 0; i < 4; i++) {
    const buyer = pick(buyers);
    const unit = pick(rentalUnits);
    const startsAt = new Date(Date.now() - rand(1, 4) * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    await prisma.rental.create({
      data: {
        userId: buyer.id,
        unitId: unit.id,
        status: RentalStatus.ACTIVE,
        planLabel: "7d",
        startsAt,
        endsAt,
        autoRenew: false,
        totalCost: 1290,
        currency: Currency.RUB,
        sessions: {
          create: {
            startedAt: startsAt,
            ip: `203.0.113.${rand(1, 254)}`,
          },
        },
      },
    });
  }

  // ── Achievements ───────────────────────────────────────────────────
  console.log("→ creating achievements…");
  const ACHIEVEMENTS = [
    { slug: "first-purchase", title: "Первая покупка",        description: "Совершить первую сделку",       reward: 50,  iconName: "shopping-bag" },
    { slug: "five-star",      title: "Пятизвёздочный",        description: "10 пятизвёздочных отзывов",     reward: 200, iconName: "star" },
    { slug: "trader-100",     title: "Сотня сделок",          description: "Завершить 100 заказов",         reward: 500, iconName: "trending-up" },
    { slug: "fast-deliver",   title: "Молниеносная доставка", description: "Средняя доставка < 1 мин",      reward: 300, iconName: "zap" },
    { slug: "verified-pro",   title: "Верифицирован",         description: "Пройти KYC",                    reward: 100, iconName: "shield-check" },
    { slug: "bot-master",     title: "Повелитель ботов",      description: "Запустить 5+ автоматизаций",    reward: 250, iconName: "bot" },
    { slug: "loyal-7",        title: "Семь дней подряд",      description: "Заходить 7 дней подряд",        reward: 75,  iconName: "calendar" },
    { slug: "early-bird",     title: "Бета-тестер",           description: "Зарегистрироваться в первые 30 дней", reward: 1000, iconName: "rocket", isHidden: false },
  ];
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.create({ data: a });
  }

  // Award some to top sellers
  const allAchievements = await prisma.achievement.findMany();
  for (const seller of sellers.slice(0, 3)) {
    const granted = pickN(allAchievements, rand(2, 5));
    for (const a of granted) {
      await prisma.userAchievement.create({
        data: { userId: seller.id, achievementId: a.id, progress: 100 },
      });
    }
  }

  // ── Analytics + audit log ──────────────────────────────────────────
  console.log("→ creating analytics events and audit log…");
  const eventNames = [
    "page.viewed",
    "listing.viewed",
    "listing.favorited",
    "checkout.started",
    "checkout.completed",
    "filter.applied",
    "search.executed",
    "wallet.deposit.started",
  ];
  for (let i = 0; i < 200; i++) {
    await prisma.analyticsEvent.create({
      data: {
        userId: Math.random() > 0.4 ? pick(buyers).id : null,
        sessionId: `sess_${cuidlite()}`,
        name: pick(eventNames),
        properties: { ts: Date.now() - i * 1000 },
        country: pick(["RU", "BY", "KZ", "UA", "DE", "PL"]),
        device: pick(["desktop", "mobile", "tablet"]),
      },
    });
  }

  for (let i = 0; i < 40; i++) {
    await prisma.auditLog.create({
      data: {
        actorId: pick([superadmin, moderator]).id,
        action: pick([
          "listing.approved",
          "listing.rejected",
          "user.warned",
          "ticket.assigned",
          "withdrawal.approved",
          "promo.created",
        ]),
        targetType: pick(["Listing", "User", "Ticket", "Withdrawal", "Promo"]),
        targetId: `seed_${cuidlite()}`,
        ip: `10.0.${rand(0, 255)}.${rand(0, 255)}`,
      },
    });
  }

  // ── Done ───────────────────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
    orders: await prisma.order.count(),
    transactions: await prisma.transaction.count(),
    bots: await prisma.bot.count(),
    rentals: await prisma.rental.count(),
    notifications: await prisma.notification.count(),
    analytics: await prisma.analyticsEvent.count(),
  };
  console.log("\n✓ seed complete:");
  console.table(counts);
}

// Lightweight, low-collision random suffix; used only for non-PK string fillers.
function cuidlite(): string {
  return Math.random().toString(36).slice(2, 10);
}

main()
  .catch((e) => {
    console.error("✗ seed failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
