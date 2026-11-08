import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import type { RateLimiterPort } from "@/features/session/domain/RateLimiterPort";

const WINDOW_SECONDS = 15 * 60;

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export class LoginRateLimiter implements RateLimiterPort {
  async assertAllowed(email: string, ipAddress?: string) {
    const ip = ipAddress || "unknown";
    const keys = [
      { key: hashKey(`ip:${ip}`), limit: 50 },
      { key: hashKey(`account:${ip}:${email}`), limit: 10 },
    ];

    await db.execute(sql`DELETE FROM login_rate_limits WHERE expires_at <= now()`);
    const exceeded = await db.transaction(async (tx) => {
      let blocked = false;
      for (const { key, limit } of keys) {
        const rows = await tx.execute<{ count: number }>(sql`
          INSERT INTO login_rate_limits (key, count, expires_at)
          VALUES (${key}, 1, now() + ${WINDOW_SECONDS} * interval '1 second')
          ON CONFLICT (key) DO UPDATE SET
            count = CASE WHEN login_rate_limits.expires_at <= now()
              THEN 1 ELSE login_rate_limits.count + 1 END,
            expires_at = CASE WHEN login_rate_limits.expires_at <= now()
              THEN now() + ${WINDOW_SECONDS} * interval '1 second'
              ELSE login_rate_limits.expires_at END
          RETURNING count
        `);
        if (!rows[0]) throw new Error("RATE_LIMIT_UPDATE_FAILED");
        if (rows[0].count > limit) blocked = true;
      }
      return blocked;
    });
    if (exceeded) throw new Error("RATE_LIMITED");
  }
}
