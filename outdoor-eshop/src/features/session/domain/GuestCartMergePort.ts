export interface GuestCartMergePort {
  mergeGuestCart(guestTokenHash: string, userId: number): Promise<void>;
}
