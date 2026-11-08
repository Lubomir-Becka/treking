import bcrypt from "bcryptjs";
import type { PasswordServicePort } from "../../domain/session/PasswordServicePort";

const SALT_ROUNDS = 12;

export class BcryptPasswordService implements PasswordServicePort {
  hash(password: string) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  verify(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
  }
}
