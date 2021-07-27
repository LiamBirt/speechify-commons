import moment from 'moment';

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

  // paypal subscription specific
  paypalSubscriptionId?: string;
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

export class Subscription implements ISubscription {
  resource: {
    wordsLeft?: number;
    decrementedAt: number;
    lastRefillAt?: number;
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

  constructor({
    userId,
    environment = PaymentEnvironment.Production,
    source = SubscriptionSource.apple,
    rawData,
  }: {
    userId: string;
    environment?: PaymentEnvironment;
    source?: SubscriptionSource;
    rawData?: any;
  }) {
    this.userId = userId;
    if (rawData) {
      return {
        ...rawData,
        userId,
      };
    }
    this.resource = {
      wordsLeft: 0,
      decrementedAt: 0,
    };
    this.productId = '';
    this.expiresAt = 0;
    this.currentBatchExpiresAt = 0;
    this.environment = environment;
    this.source = source;
    this.updatedAt = moment().unix();
    this.status = SubscriptionStatus.cancelled;
  }

  serialize(): ISubscription {
    // @ts-ignore
    const result: IUserSubscriptionAttr = {
      resource: this.resource,
      expiresAt: this.expiresAt,
      currentBatchExpiresAt: this.currentBatchExpiresAt,
      updatedAt: this.updatedAt,
      productId: this.productId,
      source: this.source || SubscriptionSource.apple,
    };

    if (this.status) {
      result.status = this.status;
    }

    if (this.promoCodeId) {
      result.promoCodeId = this.promoCodeId;
    }

    if (this.discountOfferId) {
      result.discountOfferId = this.discountOfferId;
    }

    if (this.environment !== undefined) {
      result.environment = this.environment;
    }

    return result;
  }
}

export class SubscriptionInfo implements ISubscriptionInfo {
  static create(
    userId: string,
    id: string,
    is_trial_period: string,
    source?: SubscriptionSource
  ): SubscriptionInfo {
    const subscriptionInfo = new SubscriptionInfo(
      {
        userId,
        productId: '',
        latestTransactionId: '',
        is_trial_period,
        is_refunded: false,
        expiresAt: 0,
        updatedAt: Math.round(Date.now() / 1000),
        limitsCountLeft: 0,
        latestApplicationAt: 0,
        nextCheckAt: -1,
        nextApplicationAt: -1,
        // environment is production by default
        environment: PaymentEnvironment.Production,
        source: source || SubscriptionSource.apple,
      },
      id
    );

    return subscriptionInfo;
  }

  static deserialize(info: ISubscriptionInfo, id: string): SubscriptionInfo {
    return new SubscriptionInfo(info, id);
  }

  id: string;
  environment: PaymentEnvironment;
  productId: string;
  userId: string;
  is_trial_period: string;
  is_refunded: boolean;
  expiresAt: number;
  updatedAt: number;
  limitsCountLeft: number;
  latestApplicationAt: number;
  nextCheckAt: number;
  nextApplicationAt: number;
  subscriptionPlan?: ISubscriptionPlan;
  source: SubscriptionSource;

  // Apple specific
  latestTransactionId?: string;
  // Stripe specific
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // Paypal specific
  paypalSubscriptionId?: string;

  constructor(info: ISubscriptionInfo, id: string) {
    this.id = id;
    this.productId = info.productId;
    this.userId = info.userId;
    this.latestTransactionId = info.latestTransactionId;
    this.is_trial_period = info.is_trial_period;
    this.is_refunded = info.is_refunded;
    this.expiresAt = info.expiresAt;
    this.updatedAt = info.updatedAt;
    this.limitsCountLeft = info.limitsCountLeft;
    this.latestApplicationAt = info.latestApplicationAt;
    this.nextCheckAt = info.nextCheckAt;
    this.nextApplicationAt = info.nextApplicationAt;
    this.environment = info.environment;
    this.source = info.source || SubscriptionSource.apple;
    this.stripeCustomerId = info.stripeCustomerId;
    this.stripeSubscriptionId = info.stripeSubscriptionId;
    this.paypalSubscriptionId = info.paypalSubscriptionId;
  }

  private isProd(): boolean {
    return this.environment === PaymentEnvironment.Production;
  }

  private onUpdate(): void {
    this.updatedAt = moment().unix();
  }

  private getSubscriptionValue(): ISubscriptionPlan {
    // stop processing the request if backend cannot handle this subscription type
    if (!this.subscriptionPlan) {
      // tslint:disable-next-line:no-console
      console.warn(
        `Unknown subscription ${this.productId} requested for subscription ${this.id}`
      );
      const errorMessage = `Cannot handle subscription type: ${this.productId}`;
      throw new Error(errorMessage);
    }
    return this.subscriptionPlan;
  }

  private getCheckInterval(): number {
    const prodCheckInterval = 60 * 60 * 24; // 1 day, seconds
    const sandboxCheckInterval = 60 * 4; // 4 minutes, seconds
    return this.isProd() ? prodCheckInterval : sandboxCheckInterval;
  }

  // set `nextApplicationAt` to -1 so its never occurs
  // set limitsCountLeft to 0 so no new limits can be applied
  cancel(): void {
    this.onUpdate();
    this.nextApplicationAt = -1;
    this.limitsCountLeft = 0;
    this.latestApplicationAt = this.updatedAt;
    this.expiresAt = Math.min(this.getGraceMin(), moment().unix());
  }

  getGracePeriod(): number {
    return this.isProd() ? GRACE_TIME_PRODUCTION : GRACE_TIME_SANDBOX;
  }

  getGraceMin(): number {
    return this.expiresAt - this.getGracePeriod();
  }

  getGraceMax(): number {
    return this.expiresAt + this.getGracePeriod();
  }

  isValid(): boolean {
    return this.is_refunded !== true && moment().unix() < this.getGraceMax();
  }

  isPremium(): boolean {
    return (
      this.productId.includes('premium') ||
      this.productId === 'stripe.annual' ||
      this.productId === 'stripe.annual.discount'
    );
  }

  isUnlimited(): boolean {
    return this.productId.includes('unlimited');
  }

  serialize(): ISubscriptionInfo {
    return {
      productId: this.productId,
      userId: this.userId,
      latestTransactionId: this.latestTransactionId,
      is_trial_period: this.is_trial_period || '',
      is_refunded: this.is_refunded || false,
      expiresAt: this.expiresAt,
      updatedAt: this.updatedAt,
      limitsCountLeft: this.limitsCountLeft,
      latestApplicationAt: this.latestApplicationAt,
      nextCheckAt: this.nextCheckAt,
      nextApplicationAt: this.nextApplicationAt,
      environment: this.environment,
      source: this.source,
      stripeSubscriptionId: this.stripeSubscriptionId || '',
      stripeCustomerId: this.stripeCustomerId || '',
      paypalSubscriptionId: this.paypalSubscriptionId || '',
    };
  }

  applySubscriptionLimit(): boolean {
    const subscription = this.subscriptionPlan;

    console.info('Successfully pass findSubscription');

    if (!subscription) {
      throw new Error(
        `Subscription value of product ${this.productId} is not found`
      );
    }

    // if subscription has expired, but nextApplication is assigned or subscription still has available limits
    // they should be revoked
    if (
      !this.isValid() &&
      (this.nextApplicationAt > -1 || this.limitsCountLeft > 0)
    ) {
      this.cancel();
      return true;
    }

    console.info('Successfully pass isValid check');

    const now = moment();

    // do not process the subscription if there are no limits left
    // or the time hasn't come yet
    if (
      this.limitsCountLeft <= 0 ||
      moment.unix(this.nextApplicationAt) > now
    ) {
      return false;
    }

    console.info('Successfully pass limitsCountLeft');

    this.onUpdate();
    this.latestApplicationAt = this.updatedAt;
    this.limitsCountLeft -= 1;
    if (this.limitsCountLeft <= 0) {
      this.nextApplicationAt = -1;
    } else if (this.isProd()) {
      console.info('Successfully entered in Prod');

      this.nextApplicationAt =
        this.is_trial_period === 'false'
          ? moment
              .unix(this.expiresAt)
              .subtract(
                this.limitsCountLeft * subscription.renewPeriod,
                subscription.renewPeriodUnit
              )
              .unix()
          : moment.unix(this.expiresAt).unix();

      console.info('Successfully assigned nextApplicationAt in Prod');
    } else {
      console.info('Successfully entered in Dev');

      this.nextApplicationAt =
        this.is_trial_period === 'false'
          ? moment
              .unix(this.expiresAt)
              .subtract(
                this.limitsCountLeft * subscription.sandboxPeriod,
                'minutes'
              )
              .unix()
          : moment.unix(this.expiresAt).unix();

      console.info('Successfully assigned nextApplicationAt in Prod');
    }

    return true;
  }

  applyTransaction(
    transaction: IInAppPurchaseReceipt,
    isProduction: boolean,
    subscriptionPlan?: ISubscriptionPlan
  ): boolean {
    // stop processing the request if backend cannot handle this subscription type
    if (!subscriptionPlan) {
      // tslint:disable-next-line:no-console
      console.warn(
        `Unknown subscription ${transaction.product_id} requested for subscription ${this.id}`
      );
      const errorMessage = `Cannot handle subscription type: ${this.productId}`;
      throw new Error(errorMessage);
    }

    // do not change subscription if the latest transaction has been already processed
    if (
      this.latestTransactionId === transaction.transaction_id &&
      this.productId === subscriptionPlan.name
    ) {
      return false;
    }

    // convert string values into number
    const expiresDate =
      +transaction.expires_date_ms || +transaction.expires_date;
    if (isNaN(expiresDate)) {
      throw new Error(
        `Cannot extract expiration time from receipt info: ${JSON.stringify(
          transaction
        )}`
      );
    }

    this.environment = isProduction
      ? PaymentEnvironment.Production
      : PaymentEnvironment.Sandbox;
    this.productId = transaction.product_id;
    this.latestTransactionId = transaction.transaction_id;
    this.is_trial_period = transaction.is_trial_period;
    this.expiresAt = moment(+expiresDate).unix();
    this.is_refunded = transaction.cancellation_date ? true : false;
    this.limitsCountLeft = subscriptionPlan.renewLimit;
    this.nextCheckAt = this.getGraceMin();
    this.nextApplicationAt = moment().unix();

    if (subscriptionPlan) {
      this.subscriptionPlan = subscriptionPlan;
    }
    this.onUpdate();
    return true;
  }

  calculateCurrentBatchExpiresAt() {
    return this.nextApplicationAt > 0
      ? this.nextApplicationAt
      : this.getGraceMax();
  }

  applyPaypal(
    periodEnd: number,
    isProduction: boolean,
    paypalSubscriptionId: string,
    subscriptionPlan?: ISubscriptionPlan
  ): boolean {
    // stop processing the request if backend cannot handle this subscription type
    if (!subscriptionPlan) {
      // tslint:disable-next-line:no-console
      const errorMessage = `Cannot handle subscription type: ${this.productId}`;
      throw new Error(errorMessage);
    }

    this.environment = isProduction
      ? PaymentEnvironment.Production
      : PaymentEnvironment.Sandbox;
    this.productId = subscriptionPlan.name;
    this.latestTransactionId = '';
    this.source = SubscriptionSource.paypal;
    this.is_trial_period = 'false';
    this.expiresAt = periodEnd;
    this.is_refunded = false;
    this.limitsCountLeft = subscriptionPlan.renewLimit;
    this.nextCheckAt = -1;
    this.nextApplicationAt = moment().unix();
    this.paypalSubscriptionId = paypalSubscriptionId;
    this.subscriptionPlan = subscriptionPlan;
    this.onUpdate();
    return true;
  }

  applyStripe(
    periodEnd: number,
    isProduction: boolean,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    subscriptionPlan?: ISubscriptionPlan
  ): boolean {
    // stop processing the request if backend cannot handle this subscription type
    if (!subscriptionPlan) {
      // tslint:disable-next-line:no-console
      const errorMessage = `Cannot handle subscription type: ${this.productId}`;
      throw new Error(errorMessage);
    }

    this.environment = isProduction
      ? PaymentEnvironment.Production
      : PaymentEnvironment.Sandbox;
    this.productId = subscriptionPlan.name;
    this.latestTransactionId = '';
    this.source = SubscriptionSource.stripe;
    this.is_trial_period = 'false';
    this.expiresAt = periodEnd;
    this.is_refunded = false;
    this.limitsCountLeft = subscriptionPlan.renewLimit;
    this.nextCheckAt = -1;
    this.nextApplicationAt = moment().unix();
    this.stripeCustomerId = stripeCustomerId;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.subscriptionPlan = subscriptionPlan;
    this.onUpdate();
    return true;
  }

  // prepare a user's subscription object
  createUserSubscription(
    source: SubscriptionSource = SubscriptionSource.apple
  ): Subscription {
    if (!this.isValid()) {
      // create an empty UserSubscription if the subscription is no longer valid
      return new Subscription({
        userId: this.userId,
        environment: this.environment,
        source,
      });
    }

    // find an appropriate subscription plan
    const subscriptionValue = this.getSubscriptionValue();
    const currentBatchExpiresAt = this.calculateCurrentBatchExpiresAt();

    return new Subscription({
      userId: this.userId,
      rawData: {
        expiresAt: this.expiresAt,
        currentBatchExpiresAt,
        // the latest update is now
        updatedAt: moment().unix(),
        // specify resource that is equal to brand new subscription's resource
        resource: { decrementedAt: 0, wordsLeft: subscriptionValue.wordsLimit },
        productId: subscriptionValue.name,
        source: source || this.source,
        environment: this.environment,
        status:
          this.is_trial_period === 'false'
            ? SubscriptionStatus.paying
            : SubscriptionStatus.trial,
      },
    });
  }

  // next check is scheduled 1 day since the previous check if nothing has changed
  scheduleNextCheck(): number {
    const now = moment().unix();

    // next check has not happened yet, so nothing changes
    if (now < this.nextCheckAt) {
      return this.nextCheckAt;
    }

    this.onUpdate();
    const checkInterval = this.getCheckInterval(); // 1 day interval for production

    this.nextCheckAt = this.nextCheckAt + checkInterval;
    // if subscription exceeds grace period limit, app should stop checking them
    if (this.nextCheckAt > this.getGraceMax()) {
      this.nextCheckAt = -1;
    }

    return this.nextCheckAt;
  }
}
