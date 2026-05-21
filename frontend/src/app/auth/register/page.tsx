"use client";

import Link from "next/link";
import { Mail, Lock, User, ArrowUpRight, Check } from "lucide-react";
import { useState } from "react";
import { CosmicInput } from "@/components/ui/CosmicInput";
import { SpaceButton } from "@/components/ui/SpaceButton";
import { OrbitCard } from "@/components/ui/OrbitCard";
import { Badge } from "@/components/ui/Badge";

export default function RegisterPage() {
  const [agree, setAgree] = useState(false);

  return (
    <section className="relative flex min-h-[100dvh] items-center pt-24 pb-12">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-12 px-5 lg:grid-cols-[1fr_460px] lg:gap-20 lg:px-8">
        <div className="relative hidden lg:block">
          <Badge dot variant="success">регистрация ~30 секунд</Badge>
          <h1 className="mt-7 headline-mega text-[clamp(56px,7vw,120px)] text-space-white">
            Создай<br />
            <span className="text-space-white/40">учётку.</span>
          </h1>
          <p className="mt-7 max-w-[460px] text-[15.5px] leading-relaxed text-space-lunar/75">
            Первая сделка идёт без комиссии. Эскроу включается автоматически.
            KYC потребуется только если планируешь продавать на сумму больше $500.
          </p>

          <div className="mt-10 space-y-3 border-t border-white/[0.06] pt-7">
            {[
              "Регистрация по email · 30 сек",
              "OAuth: Google, Discord, Telegram",
              "Email-верификация (1 клик)",
              "2FA — опционально, обязательно для KYC"
            ].map((line) => (
              <div key={line} className="flex items-center gap-3 text-[13.5px] text-space-lunar/85">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
                  <Check className="h-3 w-3 text-space-white" />
                </span>
                {line}
              </div>
            ))}
          </div>
        </div>

        <OrbitCard glow inset className="p-8 lg:p-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
            // новый космонавт
          </div>
          <h2 className="mt-3 font-display text-[28px] font-medium tracking-tight text-space-white">
            Регистрация
          </h2>
          <p className="mt-2 text-[13.5px] text-space-lunar/70">
            Эти данные видны только тебе. Username — публичный.
          </p>

          <form className="mt-7 space-y-4">
            <CosmicInput
              label="username"
              iconLeft={<User className="h-4 w-4" />}
              placeholder="cosmonaut42"
              hint="3–24 символа, латиница, цифры, _"
            />
            <CosmicInput
              label="email"
              iconLeft={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="space@kocmoc.space"
            />
            <CosmicInput
              label="пароль"
              iconLeft={<Lock className="h-4 w-4" />}
              type="password"
              placeholder="минимум 8 символов"
              hint="bcrypt 12 rounds · никогда не покидает наш периметр"
            />

            <label className="flex cursor-pointer items-start gap-2.5 pt-2 text-[12.5px] text-space-lunar/85">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="peer sr-only"
              />
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/15 bg-white/[0.025] transition-all peer-checked:border-space-white peer-checked:bg-space-white">
                {agree && <Check className="h-3 w-3 text-space-black" />}
              </span>
              <span>
                Принимаю{" "}
                <Link href="/terms" className="underline-offset-4 hover:underline">
                  правила платформы
                </Link>{" "}
                и{" "}
                <Link href="/privacy" className="underline-offset-4 hover:underline">
                  политику конфиденциальности
                </Link>
                . Согласен на обработку персональных данных.
              </span>
            </label>

            <SpaceButton
              type="submit"
              fullWidth
              size="lg"
              disabled={!agree}
              iconRight={<ArrowUpRight className="h-4 w-4" />}
            >
              Стать космонавтом
            </SpaceButton>
          </form>

          <p className="mt-7 text-center text-[12.5px] text-space-lunar/75">
            Уже в орбите?{" "}
            <Link href="/auth/login" className="text-space-white underline-offset-4 hover:underline">
              Войти
            </Link>
          </p>
        </OrbitCard>
      </div>
    </section>
  );
}
