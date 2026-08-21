import Stripe from "stripe";
import { env } from "../config/env";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Payments are not configured (missing STRIPE_SECRET_KEY)");
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return client;
}

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}
