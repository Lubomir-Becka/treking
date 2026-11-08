import { createHash, randomBytes } from "node:crypto";
import type { TokenServicePort } from "../../domain/session/TokenServicePort";

export class CryptoTokenService implements TokenServicePort {
  generateToken() {
    return randomBytes(32).toString("base64url");
  }

  hashToken(token: string) {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }
}
