export enum PaymentEnvironment {
  Sandbox,
  Production,
}

export enum SubscriptionSource {
  stripe = 'stripe',
  apple = 'apple',
}

export enum SubscriptionStatus {
  trial = 'trial',
  paying = 'paying',
  cancelled = 'cancelled',
  transferred = 'transferred',
}

export interface ISubscription {
  resource: {
    wordsLeft?: number; // amount of words left to use
    decrementedAt: number; // date when symbolsLeft was decremented the last time
  };
  expiresAt: number;
  currentBatchExpiresAt: number;
  updatedAt: number;
  productId: string;
  source: SubscriptionSource;
  environment?: PaymentEnvironment;
  promoCodeId?: string;
  status: SubscriptionStatus;
  discountOfferId?: string;
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

export interface ISubscriptionInfo {
  // the product id the subscription belongs to
  productId: string;

  // shows if subscription is in production mode
  environment: PaymentEnvironment;

  // the user the subscription is assigned to
  userId: string;

  is_trial_period: string;

  is_refunded: boolean;

  // the date when subscription expires
  expiresAt: number;

  // the latest update datetime, seconds
  updatedAt: number;

  // amount of month limits that left to be applied
  limitsCountLeft: number;

  // the latest application of subscription, seconds
  latestApplicationAt: number;

  // the date when subscription have to be checked, seconds
  // check the subscritpion 1 time per day within 3 days before and after expiresAt date range - for PROD
  // should be equal to "-1" for subscriptions that has expired or has been cancelled
  nextCheckAt: number;

  // if limitsCountLeft > 0, this field specifies the date when next application should happen
  // should be equal to "-1" if never happens
  nextApplicationAt: number;

  source: SubscriptionSource;

  // Apple subscription specific
  // the latest processed transaction id
  latestTransactionId?: string;

  // stripe subscription specific
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export class Subscription implements ISubscription {
  resource: {
    wordsLeft?: number; // amount of words left to use
    // amount of words left to use
    decrementedAt: number; // date when symbolsLeft was decremented the last time
  };
  expiresAt: number;
  currentBatchExpiresAt: number;
  updatedAt: number;
  productId: string;
  source: SubscriptionSource;
  environment?: PaymentEnvironment;
  promoCodeId?: string;
  status: SubscriptionStatus;
  discountOfferId?: string;
  userId: string;

  constructor(
    userId: string,
    environment: PaymentEnvironment = PaymentEnvironment.Production,
    source: SubscriptionSource = SubscriptionSource.apple
  ) {
    this.userId = userId;
    (this.resource = {
      wordsLeft: 0,
      decrementedAt: 0,
    }),
      (this.productId = ''),
      (this.expiresAt = 0),
      (this.currentBatchExpiresAt = 0),
      (this.environment = environment),
      (source = source || SubscriptionSource.apple),
      (this.updatedAt = new Date().valueOf()),
      (this.status = SubscriptionStatus.cancelled);
  }
}
