import Stripe from 'stripe';
import { NextResponse } from 'next/server';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

export async function POST(request: Request) {
  const body = await request.json();
  const num = parseInt(body.amount, 10);

  if (isNaN(num) || num < 1 || num > 999) {
    return NextResponse.json({ error: 'Amount must be $1-$999' }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Verg Tip — $${num}` },
        unit_amount: num * 100,
      },
      quantity: 1,
    }],
    success_url: `${origin}/tip/success`,
    cancel_url: `${origin}/tip`,
  });

  return NextResponse.json({ url: session.url });
}
