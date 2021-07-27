export const GRACE_TIME_PRODUCTION = 3 * 24 * 60 * 60; // 3 days, seconds
export const GRACE_TIME_SANDBOX = 2 * 60; // 2 minutes, seconds

export enum PaymentEnvironment {
  Sandbox,
  Production,
}

export enum SubscriptionSource {
  stripe = 'stripe',
  apple = 'apple',
  paypal = 'paypal',
  google = 'google'
}

export enum PlanRenewalFrequency {
  Monthly = 'monthly',
  Annually = 'annually',
}

export enum SubscriptionStatus {
  paying = 'paying',
  cancelled = 'cancelled',
  expired = 'expired',
}
export enum SubscriptionType {
  trial = 'trial',
  premium = 'premium',
}

export interface ISubscription {
  resource: {
    wordsLeft?: number; // amount of words left to use
    decrementedAt: number; // date (unix timestamp) when wordsLeft was decremented the last time

    // Date (unix timestamp) when wordsLeft was refilled the last time. Only exists for premium users.
    // If the user hasn't had a refill yet, this is the date their most recent subscription started.
    lastRefillAt?: number;
  };
  subscriptions: {
    expiresAt: number; // unix timestamp
    createdAt: number; // unix timestamp
    productId: string;
    source: SubscriptionSource;
    environment?: PaymentEnvironment;
    promoCodeId?: string;
    status: SubscriptionStatus;
    type: SubscriptionType;
    discountOfferId?: string;
  }[];
}
export interface ISubscriptionPlan {
  name: string;
  wordsLimit: number;
  renewPeriod: number;
  renewPeriodUnit: 'months' | 'weeks';
  renewLimit: number;
  sandboxPeriod: number; // minutes
  price: number; // USD
  introOfferPrice?: number; // USD

  // This is currently used only for stripe
  trialPeriod?: number; // days
}

export interface IInAppPurchaseReceipt {
  quantity: string; // string representation of a number
  product_id: string;
  transaction_id: string;
  original_transaction_id: string;
  purchase_date: string; // string representation of an RFC 3339 date
  purchase_date_ms: string; // milliseconds, string representation a number
  original_purchase_date: string; // string representation of an RFC 3339 date
  original_purchase_date_ms: string; // milliseconds, string representation a number
  expires_date: string; // string representation of an RFC 3339 date
  expires_date_ms: string; // milliseconds, string representation a number
  web_order_line_item_id: string;
  is_trial_period: 'true' | 'false'; // string representation of boolean
  is_in_intro_offer_period: 'true' | 'false'; // string representation of boolean

  // date when subscriontion was canceled; treat as if the purchase had never been made
  cancellation_date?: string; // string representation of an RFC 3339 date
  promotional_offer_id?: string;
}
