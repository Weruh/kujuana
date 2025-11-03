import { getDb, persistDb } from '../utils/database.js';
import { listPlans, createCheckoutSession } from '../services/payment.service.js';

export const getPlans = (_req, res) => {
  res.json({
    status: 'success',
    data: listPlans(),
  });
};

export const startCheckout = async (req, res, next) => {
  try {
    const { planId, channel } = req.body;
    if (!planId || !channel) {
      return res.status(400).json({ status: 'error', message: 'planId and channel are required' });
    }

    const checkout = await createCheckoutSession({ user: req.user, planId, channel });

    const db = await getDb();
    db.data.subscriptions.push({
      id: `${req.user.id}-${planId}-${Date.now()}`,
      userId: req.user.id,
      planId,
      provider: checkout.provider,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await persistDb();

    res.json({
      status: 'success',
      data: checkout,
    });
  } catch (error) {
    return next(error);
  }
};

export const activatePlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ status: 'error', message: 'planId is required' });
    }
    const db = await getDb();
    const subscription = db.data.subscriptions
      .reverse()
      .find((sub) => sub.userId === req.user.id && sub.planId === planId);

    if (!subscription) {
      return res.status(404).json({ status: 'error', message: 'Subscription not found' });
    }

    subscription.status = 'active';
    subscription.activatedAt = new Date().toISOString();

    const user = db.data.users.find((u) => u.id === req.user.id);
    if (user) {
      user.plan = planId;
      user.updatedAt = new Date().toISOString();
    }

    await persistDb();

    res.json({
      status: 'success',
      data: {
        planId,
        status: 'active',
      },
    });
  } catch (error) {
    return next(error);
  }
};
