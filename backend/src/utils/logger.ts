import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

/**
 * Application logger.
 *
 * - Pretty-printed in dev, JSON in prod (for log aggregators).
 * - Redacts common secret fields automatically.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.refreshToken",
      "*.accessToken",
      "*.totpSecret",
      "*.credentials",
      "*.secret",
      "*.apiKey",
    ],
    censor: "[redacted]",
  },
  base: { service: "nexusmarket-api" },
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname,service",
        },
      },
});
