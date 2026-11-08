export type UserSession = {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type GuestSession = {
  id: number;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};
