import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const AMOUNTS: Record<string, number> = { '5': 500, '10': 1000, '25': 2500 };

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

export async function POST(request: Request) {
  const body = await request.json();
  const amount = AMOUNTS[body.amount];
  if (!amount) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const stripe = getStripe();

  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Verg Tip — $${body.amount}` },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    success_url: `${origin}/tip/success`,
    cancel_url: `${origin}/tip`,
  });

  return NextResponse.json({ url: session.url });
}
