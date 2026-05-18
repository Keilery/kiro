import { PageShell } from "@/components/common/PageShell";

export default function RegisterPage() {
  return (
    <PageShell
      eyebrow="Аккаунт"
      title="Создать аккаунт"
      description="JWT + refresh, OAuth2 (Google, Discord, Steam, VK), 2FA TOTP, верификация email/телефона, Cloudflare Turnstile."
    />
  );
}
