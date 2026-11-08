import { createCartUseCases } from "../../application/cart/CartUseCases";
import { DrizzleCartRepository } from "../../infrastructure/cart/DrizzleCartRepository";

export const cartUseCases = createCartUseCases(new DrizzleCartRepository());
