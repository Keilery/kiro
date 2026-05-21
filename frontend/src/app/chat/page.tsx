"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  ShieldCheck,
  Check,
  CheckCheck,
  CircleAlert
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OrbitCard } from "@/components/ui/OrbitCard";
import { CosmicInput } from "@/components/ui/CosmicInput";
import { SpaceButton } from "@/components/ui/SpaceButton";

type Msg = {
  id: string;
  who: "buyer" | "seller" | "system";
  text: string;
  time: string;
  read?: boolean;
};

const messages: Msg[] = [
  { id: "1", who: "system", text: "Сделка K2026-0421 открыта. Эскроу заморозил ₽ 14 900.", time: "13:32" },
  { id: "2", who: "seller", text: "Привет! Сейчас отправлю данные для входа. Подожди 30 секунд, готовлю креды.", time: "13:33", read: true },
  { id: "3", who: "buyer", text: "Привет, ок, спасибо.", time: "13:33", read: true },
  { id: "4", who: "seller", text: "Логин: kocmoc_acc_0421\nПароль: ********\nКод 2FA пришёл в SMS", time: "13:34", read: true },
  { id: "5", who: "buyer", text: "Зашёл, всё работает. FACEIT правда 2200 — красавчик 🔥", time: "13:36", read: true },
  { id: "6", who: "system", text: "Покупатель подтвердил получение. Эскроу выпустил ₽ 14 218 продавцу (за вычетом комиссии 4.5%).", time: "13:37" },
  { id: "7", who: "buyer", text: "Спасибо! Оставлю 5⭐ отзыв.", time: "13:37", read: true }
];

const chatList = [
  { id: "K2026-0421", name: "Nova_Carry", last: "Спасибо! Оставлю 5⭐", time: "13:37", unread: 0, kyc: true, online: true },
  { id: "K2026-0420", name: "OrbitMedia", last: "Авто-выдача сработала", time: "11:52", unread: 0, kyc: true, online: false },
  { id: "K2026-0419", name: "MoonStar_GI", last: "Готов выдать через 5 мин", time: "вчера", unread: 2, kyc: true, online: true },
  { id: "K2026-0418", name: "Cosmo_Carry", last: "ETA 1 час, начну буст", time: "пн", unread: 0, kyc: true, online: false },
  { id: "K2026-0417", name: "Halo_Trader", last: "Скинь скрин TT", time: "пн", unread: 0, kyc: true, online: true }
];

export default function ChatPage() {
  const [activeId, setActiveId] = useState(chatList[0].id);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setTyping(true), 2400);
    const id2 = setTimeout(() => setTyping(false), 6800);
    return () => {
      clearTimeout(id);
      clearTimeout(id2);
    };
  }, []);

  return (
    <section className="relative pt-24 pb-12">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <div className="mb-6 flex items-end justify-between border-b border-white/[0.07] pb-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
              // канал связи · сделки
            </div>
            <h1 className="mt-3 headline-hero text-[clamp(28px,3.5vw,44px)] text-space-white">
              Сообщения
            </h1>
          </div>
          <Badge dot variant="success">7 активных каналов</Badge>
        </div>

        <OrbitCard className="overflow-hidden">
          <div className="grid h-[680px] grid-cols-[280px_1fr_320px] divide-x divide-white/[0.06]">
            {/* Chat list */}
            <div className="flex flex-col">
              <div className="border-b border-white/[0.06] p-4">
                <CosmicInput
                  iconLeft={<Search className="h-4 w-4" />}
                  placeholder="Поиск чатов…"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {chatList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-4 text-left transition-colors hover:bg-white/[0.02] ${
                      activeId === c.id ? "bg-white/[0.04]" : ""
                    }`}
                  >
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] font-mono text-[12px] text-space-white">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      {c.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-nova-green ring-2 ring-space-deep" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 truncate text-[13.5px] text-space-white">
                          {c.name}
                          {c.kyc && <ShieldCheck className="h-3 w-3 shrink-0 text-nova-green" />}
                        </div>
                        <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                          {c.time}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-[12px] text-space-lunar/75">
                          {c.last}
                        </span>
                        {c.unread > 0 && (
                          <span className="shrink-0 rounded-full bg-space-white px-1.5 font-mono text-[10px] tabular text-space-black">
                            {c.unread}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-space-dust">
                        {c.id}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] font-mono text-[12px] text-space-white">
                      NC
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-nova-green ring-2 ring-space-deep" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-display text-[15px] font-medium text-space-white">
                      Nova_Carry
                      <ShieldCheck className="h-3.5 w-3.5 text-nova-green" />
                    </div>
                    <div className="font-mono text-[11px] text-space-dust">
                      онлайн · отклик ~2 мин
                    </div>
                  </div>
                </div>
                <Badge variant="success">сделка завершена</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
                {typing && (
                  <div className="ml-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-space-dust">
                    Nova_Carry печатает
                    <span className="ml-1 flex gap-0.5">
                      <span className="h-1 w-1 animate-pulse-dot rounded-full bg-current" />
                      <span
                        className="h-1 w-1 animate-pulse-dot rounded-full bg-current"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="h-1 w-1 animate-pulse-dot rounded-full bg-current"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.06] p-4">
                <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1">
                  <button className="text-space-dust hover:text-space-lunar">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button className="text-space-dust hover:text-space-lunar">
                    <ImageIcon className="h-4 w-4" />
                  </button>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Напиши сообщение…"
                    className="flex-1 bg-transparent px-2 py-2 text-[13.5px] text-space-white placeholder:text-space-dust outline-none"
                  />
                  <button className="text-space-dust hover:text-space-lunar">
                    <Smile className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Отправить"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-space-white text-space-black hover:shadow-halo-strong"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Order side panel */}
            <div className="flex flex-col p-5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-space-dust">
                // сделка
              </div>
              <div className="mt-2 font-display text-[18px] font-medium text-space-white">
                K2026-0421
              </div>

              <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-space-lunar/75">Товар</span>
                  <span className="text-space-white">Prime CS2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-lunar/75">Сумма</span>
                  <span className="font-mono tabular text-space-white">₽ 14 900</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-lunar/75">Эскроу</span>
                  <Badge variant="success">Released</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-lunar/75">Способ</span>
                  <span className="font-mono text-space-white">СБП</span>
                </div>
              </div>

              <div className="mt-6 rounded-orbit-sm border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
                  таймлайн
                </div>
                <ul className="mt-3 space-y-2.5 text-[12px]">
                  {[
                    ["13:32", "Заказ создан"],
                    ["13:32", "Эскроу: hold"],
                    ["13:34", "Креды отправлены"],
                    ["13:37", "Покупатель подтвердил"],
                    ["13:37", "Эскроу: released"]
                  ].map(([t, e]) => (
                    <li key={t + e} className="flex items-start gap-3">
                      <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-nova-green" />
                      <span className="font-mono text-space-dust tabular">{t}</span>
                      <span className="text-space-lunar">{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 space-y-2">
                <SpaceButton fullWidth>Оставить отзыв</SpaceButton>
                <SpaceButton fullWidth variant="ghost" iconLeft={<CircleAlert className="h-4 w-4" />}>
                  Открыть спор
                </SpaceButton>
              </div>
            </div>
          </div>
        </OrbitCard>
      </div>
    </section>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.who === "system") {
    return (
      <div className="my-3 flex justify-center">
        <div className="rounded-full border border-nova-green/15 bg-nova-green/[0.04] px-3 py-1.5 font-mono text-[11px] text-nova-green/90">
          ◇ {msg.text} · {msg.time}
        </div>
      </div>
    );
  }
  const isMine = msg.who === "buyer";
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
          isMine
            ? "rounded-br-md bg-space-white text-space-black"
            : "rounded-bl-md border border-white/[0.07] bg-white/[0.04] text-space-lunar"
        }`}
      >
        <div className="whitespace-pre-wrap text-[13.5px] leading-snug">{msg.text}</div>
        <div
          className={`mt-1 flex items-center justify-end gap-1 font-mono text-[10.5px] ${
            isMine ? "text-space-black/60" : "text-space-dust"
          }`}
        >
          {msg.time}
          {isMine && (msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  );
}
