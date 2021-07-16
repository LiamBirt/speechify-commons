export declare const GRACE_TIME_PRODUCTION: number;
export declare const GRACE_TIME_SANDBOX: number;
export declare enum PaymentEnvironment {
    Sandbox = 0,
    Production = 1
}
export declare enum SubscriptionSource {
    stripe = "stripe",
    apple = "apple",
    paypal = "paypal"
}
export declare enum PlanRenewalFrequency {
    Monthly = "monthly",
    Annually = "annually"
}
export declare enum SubscriptionStatus {
    trial = "trial",
    paying = "paying",
    cancelled = "cancelled",
    transferred = "transferred"
}
export interface ISubscription {
    resource: {
        wordsLeft?: number;
        decrementedAt: number;
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
    sandboxPeriod: number;
    price: number;
    introOfferPrice?: number;
    trialPeriod?: number;
}
export interface ISubscriptionInfo {
    productId: string;
    environment: PaymentEnvironment;
    userId: string;
    is_trial_period: string;
    is_refunded: boolean;
    expiresAt: number;
    updatedAt: number;
    limitsCountLeft: number;
    latestApplicationAt: number;
    nextCheckAt: number;
    nextApplicationAt: number;
    source: SubscriptionSource;
    latestTransactionId?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
}
export interface IInAppPurchaseReceipt {
    quantity: string;
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date: string;
    purchase_date_ms: string;
    original_purchase_date: string;
    original_purchase_date_ms: string;
    expires_date: string;
    expires_date_ms: string;
    web_order_line_item_id: string;
    is_trial_period: 'true' | 'false';
    is_in_intro_offer_period: 'true' | 'false';
    cancellation_date?: string;
    promotional_offer_id?: string;
}
export declare class Subscription implements ISubscription {
    resource: {
        wordsLeft?: number;
        decrementedAt: number;
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
    constructor({ userId, environment, source, rawData, }: {
        userId: string;
        environment?: PaymentEnvironment;
        source?: SubscriptionSource;
        rawData?: any;
    });
    serialize(): ISubscription;
}
export declare class SubscriptionInfo implements ISubscriptionInfo {
    static create(userId: string, id: string, is_trial_period: string, source?: SubscriptionSource): SubscriptionInfo;
    static deserialize(info: ISubscriptionInfo, id: string): SubscriptionInfo;
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
    latestTransactionId?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
    constructor(info: ISubscriptionInfo, id: string);
    private isProd;
    private onUpdate;
    private getSubscriptionValue;
    private getCheckInterval;
    cancel(): void;
    getGracePeriod(): number;
    getGraceMin(): number;
    getGraceMax(): number;
    isValid(): boolean;
    isPremium(): boolean;
    isUnlimited(): boolean;
    serialize(): ISubscriptionInfo;
    applySubscriptionLimit(): boolean;
    applyTransaction(transaction: IInAppPurchaseReceipt, isProduction: boolean, subscriptionPlan?: ISubscriptionPlan): boolean;
    calculateCurrentBatchExpiresAt(): number;
    applyPaypal(periodEnd: number, isProduction: boolean, paypalSubscriptionId: string, subscriptionPlan?: ISubscriptionPlan): boolean;
    applyStripe(periodEnd: number, isProduction: boolean, stripeCustomerId: string, stripeSubscriptionId: string, subscriptionPlan?: ISubscriptionPlan): boolean;
    createUserSubscription(source?: SubscriptionSource): Subscription;
    scheduleNextCheck(): number;
}
