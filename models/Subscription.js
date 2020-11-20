"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionInfo = exports.Subscription = exports.SubscriptionStatus = exports.SubscriptionSource = exports.PaymentEnvironment = exports.GRACE_TIME_SANDBOX = exports.GRACE_TIME_PRODUCTION = void 0;
const moment_1 = __importDefault(require("moment"));
exports.GRACE_TIME_PRODUCTION = 3 * 24 * 60 * 60; // 3 days, seconds
exports.GRACE_TIME_SANDBOX = 2 * 60; // 2 minutes, seconds
var PaymentEnvironment;
(function (PaymentEnvironment) {
    PaymentEnvironment[PaymentEnvironment["Sandbox"] = 0] = "Sandbox";
    PaymentEnvironment[PaymentEnvironment["Production"] = 1] = "Production";
})(PaymentEnvironment = exports.PaymentEnvironment || (exports.PaymentEnvironment = {}));
var SubscriptionSource;
(function (SubscriptionSource) {
    SubscriptionSource["stripe"] = "stripe";
    SubscriptionSource["apple"] = "apple";
})(SubscriptionSource = exports.SubscriptionSource || (exports.SubscriptionSource = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["trial"] = "trial";
    SubscriptionStatus["paying"] = "paying";
    SubscriptionStatus["cancelled"] = "cancelled";
    SubscriptionStatus["transferred"] = "transferred";
})(SubscriptionStatus = exports.SubscriptionStatus || (exports.SubscriptionStatus = {}));
class Subscription {
    constructor({ userId, environment = PaymentEnvironment.Production, source = SubscriptionSource.apple, rawData, }) {
        this.userId = userId;
        if (rawData) {
            return Object.assign(Object.assign({}, rawData), { userId });
        }
        this.resource = {
            wordsLeft: 0,
            decrementedAt: 0,
        };
        this.productId = '';
        this.expiresAt = 0;
        this.currentBatchExpiresAt = 0;
        this.environment = environment;
        source = source || SubscriptionSource.apple;
        this.updatedAt = moment_1.default().unix();
        this.status = SubscriptionStatus.cancelled;
    }
    serialize() {
        // @ts-ignore
        const result = {
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
exports.Subscription = Subscription;
class SubscriptionInfo {
    constructor(info, id) {
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
    }
    static create(userId, id, is_trial_period, source) {
        const subscriptionInfo = new SubscriptionInfo({
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
        }, id);
        return subscriptionInfo;
    }
    static deserialize(info, id) {
        return new SubscriptionInfo(info, id);
    }
    isProd() {
        return this.environment === PaymentEnvironment.Production;
    }
    onUpdate() {
        this.updatedAt = moment_1.default().unix();
    }
    getSubscriptionValue() {
        // stop processing the request if backend cannot handle this subscription type
        if (!this.subscriptionPlan) {
            // tslint:disable-next-line:no-console
            console.warn(`Unknown subscription ${this.productId} requested for subscription ${this.id}`);
            const errorMessage = `Cannot handle subscription type: ${this.productId}`;
            throw new Error(errorMessage);
        }
        return this.subscriptionPlan;
    }
    getCheckInterval() {
        const prodCheckInterval = 60 * 60 * 24; // 1 day, seconds
        const sandboxCheckInterval = 60 * 4; // 4 minutes, seconds
        return this.isProd() ? prodCheckInterval : sandboxCheckInterval;
    }
    // set `nextApplicationAt` to -1 so its never occurs
    // set limitsCountLeft to 0 so no new limits can be applied
    cancel() {
        this.onUpdate();
        this.nextApplicationAt = -1;
        this.limitsCountLeft = 0;
        this.latestApplicationAt = this.updatedAt;
        this.expiresAt = Math.min(this.getGraceMin(), moment_1.default().unix());
    }
    getGracePeriod() {
        return this.isProd() ? exports.GRACE_TIME_PRODUCTION : exports.GRACE_TIME_SANDBOX;
    }
    getGraceMin() {
        return this.expiresAt - this.getGracePeriod();
    }
    getGraceMax() {
        return this.expiresAt + this.getGracePeriod();
    }
    isValid() {
        return this.is_refunded !== true && moment_1.default().unix() < this.getGraceMax();
    }
    isPremium() {
        return (this.productId.includes('premium') ||
            this.productId === 'stripe.annual' ||
            this.productId === 'stripe.annual.discount');
    }
    isUnlimited() {
        return this.productId.includes('unlimited');
    }
    serialize() {
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
        };
    }
    applySubscriptionLimit() {
        const subscription = this.subscriptionPlan;
        console.info('Successfully pass findSubscription');
        if (!subscription) {
            throw new Error(`Subscription value of product ${this.productId} is not found`);
        }
        // if subscription has expired, but nextApplication is assigned or subscription still has available limits
        // they should be revoked
        if (!this.isValid() &&
            (this.nextApplicationAt > -1 || this.limitsCountLeft > 0)) {
            this.cancel();
            return true;
        }
        console.info('Successfully pass isValid check');
        const now = moment_1.default();
        // do not process the subscription if there are no limits left
        // or the time hasn't come yet
        if (this.limitsCountLeft <= 0 ||
            moment_1.default.unix(this.nextApplicationAt) > now) {
            return false;
        }
        console.info('Successfully pass limitsCountLeft');
        this.onUpdate();
        this.latestApplicationAt = this.updatedAt;
        this.limitsCountLeft -= 1;
        if (this.limitsCountLeft <= 0) {
            this.nextApplicationAt = -1;
        }
        else if (this.isProd()) {
            console.info('Successfully entered in Prod');
            this.nextApplicationAt =
                this.is_trial_period === 'false'
                    ? moment_1.default
                        .unix(this.expiresAt)
                        .subtract(this.limitsCountLeft * subscription.renewPeriod, subscription.renewPeriodUnit)
                        .unix()
                    : moment_1.default.unix(this.expiresAt).unix();
            console.info('Successfully assigned nextApplicationAt in Prod');
        }
        else {
            console.info('Successfully entered in Dev');
            this.nextApplicationAt =
                this.is_trial_period === 'false'
                    ? moment_1.default
                        .unix(this.expiresAt)
                        .subtract(this.limitsCountLeft * subscription.sandboxPeriod, 'minutes')
                        .unix()
                    : moment_1.default.unix(this.expiresAt).unix();
            console.info('Successfully assigned nextApplicationAt in Prod');
        }
        return true;
    }
    applyTransaction(transaction, isProduction, subscriptionPlan) {
        // stop processing the request if backend cannot handle this subscription type
        if (!subscriptionPlan) {
            // tslint:disable-next-line:no-console
            console.warn(`Unknown subscription ${transaction.product_id} requested for subscription ${this.id}`);
            const errorMessage = `Cannot handle subscription type: ${this.productId}`;
            throw new Error(errorMessage);
        }
        // do not change subscription if the latest transaction has been already processed
        if (this.latestTransactionId === transaction.transaction_id &&
            this.productId === subscriptionPlan.name) {
            return false;
        }
        // convert string values into number
        const expiresDate = +transaction.expires_date_ms || +transaction.expires_date;
        if (isNaN(expiresDate)) {
            throw new Error(`Cannot extract expiration time from receipt info: ${JSON.stringify(transaction)}`);
        }
        this.environment = isProduction
            ? PaymentEnvironment.Production
            : PaymentEnvironment.Sandbox;
        this.productId = transaction.product_id;
        this.latestTransactionId = transaction.transaction_id;
        this.is_trial_period = transaction.is_trial_period;
        this.expiresAt = moment_1.default(+expiresDate).unix();
        this.is_refunded = transaction.cancellation_date ? true : false;
        this.limitsCountLeft = subscriptionPlan.renewLimit;
        this.nextCheckAt = this.getGraceMin();
        this.nextApplicationAt = moment_1.default().unix();
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
    applyStripe(periodEnd, isProduction, stripeCustomerId, stripeSubscriptionId, subscriptionPlan) {
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
        this.nextApplicationAt = moment_1.default().unix();
        this.stripeCustomerId = stripeCustomerId;
        this.stripeSubscriptionId = stripeSubscriptionId;
        this.subscriptionPlan = subscriptionPlan;
        this.onUpdate();
        return true;
    }
    // prepare a user's subscription object
    createUserSubscription(source = SubscriptionSource.apple) {
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
                updatedAt: moment_1.default().unix(),
                // specify resource that is equal to brand new subscription's resource
                resource: { decrementedAt: 0, wordsLeft: subscriptionValue.wordsLimit },
                productId: subscriptionValue.name,
                source: source || this.source,
                environment: this.environment,
                status: this.is_trial_period === 'false'
                    ? SubscriptionStatus.paying
                    : SubscriptionStatus.trial,
            },
        });
    }
    // next check is scheduled 1 day since the previous check if nothing has changed
    scheduleNextCheck() {
        const now = moment_1.default().unix();
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
exports.SubscriptionInfo = SubscriptionInfo;
