import { createCartUseCases } from "../application/CartUseCases";
import { DrizzleCartRepository } from "../infrastructure/DrizzleCartRepository";

export const cartUseCases = createCartUseCases(new DrizzleCartRepository());
