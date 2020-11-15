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
