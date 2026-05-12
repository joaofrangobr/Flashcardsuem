export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";

export function isActiveSubscription(subscription?: { status?: string | null; ends_at?: string | null } | null) {
  if (!subscription) return false;
  if (!subscription.status || !["active", "trialing"].includes(subscription.status)) return false;
  if (!subscription.ends_at) return true;
  return new Date(subscription.ends_at).getTime() > Date.now();
}
