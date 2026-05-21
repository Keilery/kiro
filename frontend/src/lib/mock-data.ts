export type Game = {
  slug: string;
  name: string;
  short: string;
  lots: number;
  trend: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  game: string;
  category: string;
  price: number;
  currency: "RUB" | "USD" | "EUR" | "USDT";
  delivery: "AUTO" | "MANUAL";
  region: string;
  sellerName: string;
  sellerRating: number;
  sellerSales: number;
  sellerKyc: boolean;
  online: boolean;
  views: number;
  badges?: ("hot" | "new" | "discount" | "verified")[];
};

export type LiveDeal = {
  buyer: string;
  product: string;
  amount: string;
  timeAgo: string;
  game?: string;
};

export type Review = {
  author: string;
  rating: number;
  body: string;
  date: string;
  verified: boolean;
};

export const games: Game[] = [
  { slug: "cs2", name: "Counter-Strike 2", short: "CS2", lots: 12_478, trend: 0.18 },
  { slug: "dota2", name: "Dota 2", short: "Dota 2", lots: 8_921, trend: 0.04 },
  { slug: "valorant", name: "Valorant", short: "VAL", lots: 6_402, trend: 0.31 },
  { slug: "fortnite", name: "Fortnite", short: "FN", lots: 5_801, trend: 0.12 },
  { slug: "lol", name: "League of Legends", short: "LoL", lots: 4_973, trend: -0.02 },
  { slug: "wow", name: "World of Warcraft", short: "WoW", lots: 4_211, trend: 0.07 },
  { slug: "roblox", name: "Roblox", short: "RBX", lots: 3_872, trend: 0.22 },
  { slug: "genshin", name: "Genshin Impact", short: "GI", lots: 3_540, trend: 0.09 },
  { slug: "pubg", name: "PUBG", short: "PUBG", lots: 3_103, trend: -0.04 },
  { slug: "minecraft", name: "Minecraft", short: "MC", lots: 2_921, trend: 0.15 },
  { slug: "apex", name: "Apex Legends", short: "APEX", lots: 2_741, trend: 0.05 },
  { slug: "honkai", name: "Honkai: Star Rail", short: "HSR", lots: 2_410, trend: 0.27 }
];

export const products: Product[] = [
  {
    id: "p1",
    slug: "cs2-prime-faceit-2200",
    title: "Prime аккаунт CS2 · FACEIT 2200 elo · Soldier",
    game: "Counter-Strike 2",
    category: "accounts",
    price: 14_900,
    currency: "RUB",
    delivery: "AUTO",
    region: "EU",
    sellerName: "Nova_Carry",
    sellerRating: 4.97,
    sellerSales: 1_842,
    sellerKyc: true,
    online: true,
    views: 312,
    badges: ["hot", "verified"]
  },
  {
    id: "p2",
    slug: "valorant-radiant-ranked",
    title: "Valorant · Radiant rank · все агенты + 28 скинов",
    game: "Valorant",
    category: "accounts",
    price: 22_400,
    currency: "RUB",
    delivery: "MANUAL",
    region: "EU",
    sellerName: "Halo_Trader",
    sellerRating: 4.93,
    sellerSales: 612,
    sellerKyc: true,
    online: true,
    views: 188,
    badges: ["verified"]
  },
  {
    id: "p3",
    slug: "genshin-genesis-6480",
    title: "6480 Genesis Crystals · авто-выдача мгновенно",
    game: "Genshin Impact",
    category: "currency",
    price: 6_290,
    currency: "RUB",
    delivery: "AUTO",
    region: "GLB",
    sellerName: "MoonStar_GI",
    sellerRating: 4.99,
    sellerSales: 4_188,
    sellerKyc: true,
    online: true,
    views: 511,
    badges: ["hot"]
  },
  {
    id: "p4",
    slug: "spotify-family-12m",
    title: "Spotify Family · 12 месяцев · приватный аккаунт",
    game: "Spotify",
    category: "subscriptions",
    price: 1_490,
    currency: "RUB",
    delivery: "AUTO",
    region: "GLB",
    sellerName: "OrbitMedia",
    sellerRating: 4.95,
    sellerSales: 2_201,
    sellerKyc: true,
    online: false,
    views: 1_842,
    badges: ["discount"]
  },
  {
    id: "p5",
    slug: "chatgpt-plus-1m",
    title: "ChatGPT Plus · 1 месяц · аккаунт с гарантией",
    game: "OpenAI",
    category: "subscriptions",
    price: 1_790,
    currency: "RUB",
    delivery: "AUTO",
    region: "GLB",
    sellerName: "OrbitMedia",
    sellerRating: 4.95,
    sellerSales: 2_201,
    sellerKyc: true,
    online: false,
    views: 982,
    badges: ["new"]
  },
  {
    id: "p6",
    slug: "dota2-mmr-boost-5k",
    title: "Dota 2 · буст MMR с 4000 до 5000 · соло",
    game: "Dota 2",
    category: "services",
    price: 8_800,
    currency: "RUB",
    delivery: "MANUAL",
    region: "EU",
    sellerName: "Cosmo_Carry",
    sellerRating: 4.91,
    sellerSales: 327,
    sellerKyc: true,
    online: true,
    views: 144,
    badges: ["verified"]
  },
  {
    id: "p7",
    slug: "fortnite-og-rare-skins",
    title: "Fortnite · OG-аккаунт · 412 скинов · OG-сборка",
    game: "Fortnite",
    category: "accounts",
    price: 38_900,
    currency: "RUB",
    delivery: "MANUAL",
    region: "GLB",
    sellerName: "Apex_Pilot",
    sellerRating: 4.88,
    sellerSales: 91,
    sellerKyc: false,
    online: true,
    views: 78,
    badges: ["hot"]
  },
  {
    id: "p8",
    slug: "youtube-premium-12m",
    title: "YouTube Premium · 12 месяцев · персональный",
    game: "YouTube",
    category: "subscriptions",
    price: 990,
    currency: "RUB",
    delivery: "AUTO",
    region: "GLB",
    sellerName: "PixelMoon",
    sellerRating: 4.94,
    sellerSales: 1_104,
    sellerKyc: true,
    online: true,
    views: 2_312,
    badges: ["discount"]
  },
  {
    id: "p9",
    slug: "telegram-premium-3m",
    title: "Telegram Premium · 3 месяца · подарком",
    game: "Telegram",
    category: "subscriptions",
    price: 690,
    currency: "RUB",
    delivery: "AUTO",
    region: "GLB",
    sellerName: "PixelMoon",
    sellerRating: 4.94,
    sellerSales: 1_104,
    sellerKyc: true,
    online: true,
    views: 1_201
  },
  {
    id: "p10",
    slug: "wow-gold-100k",
    title: "WoW · 100k золота · Silvermoon EU · авто-выдача",
    game: "World of Warcraft",
    category: "currency",
    price: 4_280,
    currency: "RUB",
    delivery: "AUTO",
    region: "EU",
    sellerName: "Halo_Trader",
    sellerRating: 4.93,
    sellerSales: 612,
    sellerKyc: true,
    online: true,
    views: 401
  },
  {
    id: "p11",
    slug: "roblox-robux-2200",
    title: "Roblox · 2200 Robux · мгновенно на аккаунт",
    game: "Roblox",
    category: "currency",
    price: 1_690,
    currency: "RUB",
    delivery: "AUTO",
    region: "GLB",
    sellerName: "Nova_Carry",
    sellerRating: 4.97,
    sellerSales: 1_842,
    sellerKyc: true,
    online: true,
    views: 822,
    badges: ["new"]
  },
  {
    id: "p12",
    slug: "discord-nitro-12m",
    title: "Discord Nitro · 12 месяцев · оригинальная подписка",
    game: "Discord",
    category: "subscriptions",
    price: 2_690,
    currency: "RUB",
    delivery: "AUTO",
    region: "GLB",
    sellerName: "OrbitMedia",
    sellerRating: 4.95,
    sellerSales: 2_201,
    sellerKyc: true,
    online: false,
    views: 1_433
  }
];

export const liveDeals: LiveDeal[] = [
  { buyer: "Ivan_K", product: "Prime CS2 + FACEIT", amount: "14 900 ₽", timeAgo: "2 мин", game: "CS2" },
  { buyer: "Maria_S", product: "Spotify Family 12м", amount: "1 490 ₽", timeAgo: "4 мин", game: "Spotify" },
  { buyer: "Nikita_99", product: "Genshin 6480 Genesis", amount: "6 290 ₽", timeAgo: "5 мин", game: "GI" },
  { buyer: "Alexey_M", product: "ChatGPT Plus 1м", amount: "1 790 ₽", timeAgo: "7 мин", game: "OpenAI" },
  { buyer: "Olga_V", product: "WoW 100k золота EU", amount: "4 280 ₽", timeAgo: "9 мин", game: "WoW" },
  { buyer: "Dmitry_P", product: "Valorant Radiant", amount: "22 400 ₽", timeAgo: "11 мин", game: "VAL" },
  { buyer: "Sergey_X", product: "Roblox 2200 Robux", amount: "1 690 ₽", timeAgo: "13 мин", game: "RBX" },
  { buyer: "Anna_R", product: "YouTube Premium 12м", amount: "990 ₽", timeAgo: "14 мин", game: "YT" }
];

export const productReviews: Review[] = [
  {
    author: "ArtemR_",
    rating: 5,
    body: "Аккаунт пришёл за 9 секунд после оплаты. Всё ровно как в описании, FACEIT уровень совпадает. Эскроу выдал деньги после моего подтверждения.",
    date: "2 дня назад",
    verified: true
  },
  {
    author: "Mihail_K",
    rating: 5,
    body: "Третий раз беру у этого продавца — всегда быстро, всегда честно. KYC-бейдж, спор открывать не пришлось ни разу.",
    date: "5 дней назад",
    verified: true
  },
  {
    author: "Polina_V",
    rating: 4,
    body: "Хорошо, но пришлось чуть подождать передачи через Steam. Продавец отвечал в чате за минуту, объяснил, всё подтвердил скриншотами.",
    date: "неделю назад",
    verified: true
  }
];

export type AdminUser = {
  username: string;
  email: string;
  role: "USER" | "SELLER" | "MODERATOR" | "ADMIN";
  kyc: "PENDING" | "APPROVED" | "REJECTED" | "NONE";
  rating: number;
  sales: number;
  joined: string;
  status: "active" | "banned" | "frozen";
};

export const adminUsers: AdminUser[] = [
  { username: "Nova_Carry", email: "nova@orbit.io", role: "SELLER", kyc: "APPROVED", rating: 4.97, sales: 1842, joined: "12.03.25", status: "active" },
  { username: "Halo_Trader", email: "halo@orbit.io", role: "SELLER", kyc: "APPROVED", rating: 4.93, sales: 612, joined: "01.02.25", status: "active" },
  { username: "ShadowFox", email: "shadow@x.io", role: "USER", kyc: "PENDING", rating: 0, sales: 0, joined: "vchera", status: "active" },
  { username: "Cosmo_Carry", email: "cosmo@orbit.io", role: "SELLER", kyc: "APPROVED", rating: 4.91, sales: 327, joined: "21.11.24", status: "active" },
  { username: "FraudGhost", email: "?@?", role: "USER", kyc: "REJECTED", rating: 1.2, sales: 0, joined: "8 дней назад", status: "banned" },
  { username: "MoonStar_GI", email: "moon@orbit.io", role: "SELLER", kyc: "APPROVED", rating: 4.99, sales: 4188, joined: "04.07.24", status: "active" },
  { username: "Apex_Pilot", email: "apex@x.io", role: "SELLER", kyc: "PENDING", rating: 4.88, sales: 91, joined: "месяц назад", status: "frozen" }
];

export const platformStats = {
  sellers: 12_847,
  products: 89_231,
  ordersToday: 4_122,
  gmvMonth: "₽ 142.8M",
  onlineNow: 8_412,
  avgDispute: "6 мин",
  satisfactionPct: 99.4
};
