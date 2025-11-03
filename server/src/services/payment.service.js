import Stripe from 'stripe';
import Paystack from 'paystack-sdk';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: [
      '10 right swipes per day',
      'See essential profile info',
      'Save favourite profiles',
    ],
  },
  {
    id: 'intention-plus',
    name: 'Intention Plus',
    price: 14.99,
    currency: 'USD',
    features: [
      'Unlimited swipes',
      '1 spotlight boost per month',
      'Incognito mode toggle',
      'Advanced search filters',
    ],
  },
  {
    id: 'circle-of-trust',
    name: 'Circle of Trust',
    price: 249.99,
    currency: 'USD',
    billing: 'yearly',
    features: [
      'Priority placement in match suggestions',
      'Direct access to curated relationship resources',
      'Dedicated concierge introductions',
      'Unlimited boosts & rewinds',
    ],
  },
];

const buildStripeClient = () => {
  const secret = process.env.STRIPE_SECRET_KEY;
  return secret ? new Stripe(secret) : null;
};

const buildPaystackClient = () => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  return secret ? new Paystack(secret) : null;
};

export const listPlans = () => plans;

export const createCheckoutSession = async ({ user, planId, channel }) => {
  const plan = plans.find((p) => p.id === planId);
  if (!plan) {
    throw Object.assign(new Error('Plan not found'), { status: 404 });
  }

  if (plan.price === 0) {
    return {
      provider: 'internal',
      checkoutUrl: null,
      message: 'Free plan activated',
    };
  }

  if (channel === 'stripe') {
    const stripe = buildStripeClient();
    if (!stripe) {
      return {
        provider: 'stripe',
        checkoutUrl: `https://dashboard.stripe.com/test/payments?plan=${planId}`,
        message: 'Stripe not configured. Using placeholder URL.',
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      success_url: `${process.env.APP_URL || 'http://localhost:5173'}/upgrade-success?plan=${planId}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:5173'}/upgrade-cancelled`,
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: plan.features.slice(0, 2).join(' - '),
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: plan.billing === 'yearly'
              ? { interval: 'year' }
              : { interval: 'month' },
          },
          quantity: 1,
        },
      ],
    });

    return {
      provider: 'stripe',
      checkoutUrl: session.url,
    };
  }

  if (channel === 'paystack') {
    const paystack = buildPaystackClient();
    if (!paystack) {
      return {
        provider: 'paystack',
        checkoutUrl: `https://dashboard.paystack.co/#/transactions/initialize?plan=${planId}`,
        message: 'Paystack not configured. Using placeholder URL.',
      };
    }

    const transaction = await paystack.transaction.initialize({
      amount: Math.round(plan.price * 100),
      email: user.email,
      currency: plan.currency,
      callback_url: `${process.env.APP_URL || 'http://localhost:5173'}/upgrade-success?plan=${planId}`,
      metadata: {
        plan: plan.id,
      },
    });

    return {
      provider: 'paystack',
      checkoutUrl: transaction.data.authorization_url,
    };
  }

  throw Object.assign(new Error('Payment channel not supported'), { status: 400 });
};
