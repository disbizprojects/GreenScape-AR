import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key
  ? new Stripe(key, { typescript: true })
  : null;

export function stripeEnabled(): boolean {
  return Boolean(stripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
