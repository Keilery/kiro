import { buildStubRouter } from "../_stub.js";

export const paymentsRouter = buildStubRouter("payments", [
  { method: "get",   path: "/wallet",                 description: "Current balance, frozen amount, currency",                    plannedIn: "PR#10", requiresAuth: true },
  { method: "get",   path: "/transactions",           description: "Paginated transaction history with filters",                  plannedIn: "PR#10", requiresAuth: true },
  { method: "get",   path: "/transactions/export",    description: "CSV export of transactions",                                  plannedIn: "PR#10", requiresAuth: true },
  { method: "post",  path: "/deposit",                description: "Initiate a deposit (card / SBP / crypto / YooMoney)",         plannedIn: "PR#10", requiresAuth: true },
  { method: "post",  path: "/withdraw",               description: "Request a withdrawal to card / crypto / SBP / YooMoney",      plannedIn: "PR#10", requiresAuth: true },
  { method: "get",   path: "/withdrawals",            description: "List own withdrawal requests",                                plannedIn: "PR#10", requiresAuth: true },
  { method: "post",  path: "/promo/apply",            description: "Apply a promo code (returns the discount preview)",           plannedIn: "PR#3", requiresAuth: true },
  { method: "post",  path: "/webhooks/yookassa",      description: "YooKassa payment provider webhook (HMAC verified)",           plannedIn: "PR#10" },
  { method: "post",  path: "/webhooks/cryptocloud",   description: "CryptoCloud webhook (HMAC verified)",                         plannedIn: "PR#10" },
  { method: "post",  path: "/webhooks/freekassa",     description: "FreeKassa webhook (HMAC verified)",                           plannedIn: "PR#10" },
]);
