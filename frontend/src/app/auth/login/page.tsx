"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { CosmicInput } from "@/components/ui/CosmicInput";
import { SpaceButton } from "@/components/ui/SpaceButton";
import { OrbitCard } from "@/components/ui/OrbitCard";
import { Badge } from "@/components/ui/Badge";

export default function LoginPage() {
  const [show, setShow] = useState(false);

  return (
    <section className="relative flex min-h-[100dvh] items-center pt-24">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-12 px-5 lg:grid-cols-[1fr_440px] lg:gap-20 lg:px-8">
        {/* Левая — атмосфера */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 cosmic-grid opacity-50 mask-radial-fade" />
          <div className="relative">
            <Badge dot variant="success">protocol kocmoc/1.0</Badge>
            <h1 className="mt-7 headline-mega text-[clamp(56px,7vw,120px)] text-space-white">
              Вход в<br />
              <span className="text-space-white/40">орбиту.</span>
            </h1>
            <p className="mt-7 max-w-[460px] text-[15.5px] leading-relaxed text-space-lunar/75">
              Сессии защищены JWT с обновлением через refresh-токен. 2FA включается
              в личном кабинете. Ни один админ не имеет доступа к твоему паролю.
            </p>
            <div className="mt-10 space-y-2 border-t border-white/[0.06] pt-7 text-[13px]">
              {[
                ["AES-256", "шифрование сессий"],
                ["TOTP / WebAuthn", "двухфакторная аутентификация"],
                ["IP-fingerprint", "обнаружение подозрительных входов"]
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-white/[0.04] py-2">
                  <span className="font-mono text-space-dust uppercase tracking-wider text-[11px]">
                    {v}
                  </span>
                  <span className="font-mono text-space-white">{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Форма */}
        <OrbitCard glow inset className="relative overflow-hidden p-8 lg:p-10">
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-white/[0.06]"
          />
          <div className="relative">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
              // авторизация
            </div>
            <h2 className="mt-3 font-display text-[28px] font-medium tracking-tight text-space-white">
              С возвращением.
            </h2>
            <p className="mt-2 text-[13.5px] text-space-lunar/70">
              Введи email или username — мы запомним устройство.
            </p>

            <form className="mt-7 space-y-4">
              <CosmicInput
                label="email · username"
                iconLeft={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="cosmonaut@kocmoc.space"
                autoComplete="email"
              />
              <CosmicInput
                label="пароль"
                iconLeft={<Lock className="h-4 w-4" />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Скрыть" : "Показать"}
                    className="transition-colors hover:text-space-white"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                type={show ? "text" : "password"}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between text-[12.5px]">
                <label className="flex cursor-pointer items-center gap-2 text-space-lunar/85">
                  <input type="checkbox" className="peer sr-only" />
                  <span className="block h-4 w-4 rounded border border-white/15 bg-white/[0.025] transition-all peer-checked:border-space-white peer-checked:bg-space-white" />
                  Запомнить устройство
                </label>
                <Link href="/auth/forgot" className="text-space-lunar hover:text-space-white">
                  Забыли пароль?
                </Link>
              </div>

              <SpaceButton
                type="submit"
                fullWidth
                size="lg"
                iconRight={<ArrowUpRight className="h-4 w-4" />}
              >
                Запустить сессию
              </SpaceButton>
            </form>

            {/* OAuth */}
            <div className="my-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.06]" />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
                или через
              </span>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["Google", "Discord", "Telegram"].map((p) => (
                <button
                  key={p}
                  className="h-11 rounded-full border border-white/10 bg-white/[0.025] font-medium text-[12.5px] text-space-lunar transition-colors hover:border-white/25 hover:text-space-white"
                >
                  {p}
                </button>
              ))}
            </div>

            <p className="mt-7 text-center text-[12.5px] text-space-lunar/75">
              Нет аккаунта?{" "}
              <Link href="/auth/register" className="text-space-white underline-offset-4 hover:underline">
                Создать новый
              </Link>
            </p>
          </div>
        </OrbitCard>
      </div>
    </section>
  );
}
