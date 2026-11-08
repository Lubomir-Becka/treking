export interface TokenServicePort {
  generateToken(): string;
  hashToken(token: string): string;
}
