import { Request, Response } from 'express'
import Stripe from 'stripe'
import db from '../db/db.js'
import { stripe } from '../utils/stripe.js'

function getId(value: string | { id: string }) {
    return typeof value === 'string' ? value : value.id
}


function getPeriodEnd(subscription: Stripe.Subscription) {
    const end = subscription.items.data[0]?.current_period_end
    return end ? new Date(end * 1000) : null
}

export async function createCheckout(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const admin = await db.admin.findUnique({ where: { id: req.user.id } })

        if (!admin) {
            return res.status(401).json({ error: 'User no longer exists' })
        }

        if (admin.plan === 'PRO') {
            return res.status(400).json({ error: 'You are already on the Pro plan.' })
        }

        let customerId = admin.stripeCustomerId

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: admin.email,
                name: admin.name,
                metadata: { adminId: admin.id }
            })

            customerId = customer.id

            await db.admin.update({
                where: { id: admin.id },
                data: { stripeCustomerId: customerId }
            })
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: process.env.STRIPE_PRICE_ID as string, quantity: 1 }],
            success_url: `${process.env.CLIENT_URL}/dashboard?upgraded=true`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard`
        })

        return res.status(200).json({ url: session.url })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}

export async function createPortal(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const admin = await db.admin.findUnique({ where: { id: req.user.id } })

        if (!admin?.stripeCustomerId) {
            return res.status(400).json({ error: 'No billing account found.' })
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: admin.stripeCustomerId,
            return_url: `${process.env.CLIENT_URL}/billing`
        })

        return res.status(200).json({ url: session.url })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}

export async function handleWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature']

    if (!signature) {
        return res.status(400).send('Missing signature')
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        )
    } catch (err) {
        return res.status(400).send('Invalid signature')
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object

                if (session.mode !== 'subscription' || !session.subscription || !session.customer) {
                    break
                }

                const subscription = await stripe.subscriptions.retrieve(getId(session.subscription))

                await db.admin.updateMany({
                    where: { stripeCustomerId: getId(session.customer) },
                    data: {
                        plan: 'PRO',
                        stripeSubscriptionId: subscription.id,
                        currentPeriodEnd: getPeriodEnd(subscription),
                        cancelAtPeriodEnd: false
                    }
                })
                break
            }

            // in case of renewals, cancellations or failed payments
            case 'customer.subscription.updated': {
                const subscription = event.data.object
                const isActive = subscription.status === 'active' || subscription.status === 'trialing'

                await db.admin.updateMany({
                    where: { stripeCustomerId: getId(subscription.customer) },
                    data: {
                        plan: isActive ? 'PRO' : 'FREE',
                        currentPeriodEnd: getPeriodEnd(subscription),
                        cancelAtPeriodEnd: subscription.cancel_at_period_end
                    }
                })
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object

                await db.admin.updateMany({
                    where: { stripeCustomerId: getId(subscription.customer) },
                    data: {
                        plan: 'FREE',
                        stripeSubscriptionId: null,
                        currentPeriodEnd: null,
                        cancelAtPeriodEnd: false
                    }
                })
                break
            }
        }

        return res.status(200).json({ received: true })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Webhook handler failed.' })
    }
}

async function setCancelAtPeriodEnd(req: Request, res: Response, cancel: boolean) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const admin = await db.admin.findUnique({ where: { id: req.user.id } })

        if (!admin?.stripeSubscriptionId) {
            return res.status(400).json({ error: 'No active subscription found.' })
        }

        const subscription = await stripe.subscriptions.update(admin.stripeSubscriptionId, {
            cancel_at_period_end: cancel
        })

        await db.admin.update({
            where: { id: admin.id },
            data: {
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                currentPeriodEnd: getPeriodEnd(subscription)
            }
        })

        return res.status(200).json({ ok: true })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}

export function cancelSubscription(req: Request, res: Response) {
    return setCancelAtPeriodEnd(req, res, true)
}

export function resumeSubscription(req: Request, res: Response) {
    return setCancelAtPeriodEnd(req, res, false)
}