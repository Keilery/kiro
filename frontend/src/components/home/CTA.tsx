"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Stripes } from "@/components/ui/Stripes";

export function CTA() {
  return (
    <section className="relative px-6 pb-32 pt-12">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 110, damping: 22 }}
          className="relative overflow-hidden rounded-ios-lg border border-white/10 px-8 py-20 text-center sm:px-16 sm:py-28"
          style={{
            background:
              "radial-gradient(80% 100% at 50% 0%, rgba(255,255,255,0.10), transparent 70%), #0A0A0C"
          }}
        >
          <Stripes drift />
          <div
            aria-hidden
            className="absolute inset-x-0 -top-32 h-64 opacity-50"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(120,180,255,0.15), transparent 70%)"
            }}
          />
          <h2 className="display relative text-[clamp(40px,7vw,96px)] text-white">
            Готов запуститься?
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/60">
            14 дней бесплатно. Подключи FunPay/Starvell/Playerok за 3 минуты —
            и забудь про ручные подъёмы лотов.
          </p>
          <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-medium text-black transition-transform duration-300 ease-out-expo active:scale-[0.97]"
            >
              Создать аккаунт
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
            </Link>
            <Link
              href="/api/docs"
              className="inline-flex h-14 items-center gap-2 rounded-full border border-white/20 px-7 text-[15px] font-medium text-white transition-colors hover:bg-white/5"
            >
              Документация API
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
