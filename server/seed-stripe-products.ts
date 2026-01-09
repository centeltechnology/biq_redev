import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  console.log('Seeding Stripe products...');
  
  const stripe = await getUncachableStripeClient();

  // Check if BakerIQ Pro product already exists
  const existingProducts = await stripe.products.search({ 
    query: "name:'BakerIQ Pro'" 
  });

  if (existingProducts.data.length > 0) {
    console.log('BakerIQ Pro product already exists:', existingProducts.data[0].id);
    
    // Get prices for this product
    const prices = await stripe.prices.list({
      product: existingProducts.data[0].id,
      active: true,
    });
    
    if (prices.data.length > 0) {
      console.log('Price already exists:', prices.data[0].id);
      return;
    }
  }

  // Create the BakerIQ Pro product
  const product = await stripe.products.create({
    name: 'BakerIQ Pro',
    description: 'Unlimited leads per month for your bakery business',
    metadata: {
      leadLimit: 'unlimited',
    },
  });
  console.log('Created product:', product.id);

  // Create the $9.97/month price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 997, // $9.97 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      plan: 'pro',
    },
  });
  console.log('Created price:', price.id, '- $9.97/month');

  console.log('Stripe products seeded successfully!');
  console.log('Product ID:', product.id);
  console.log('Price ID:', price.id);
}

seedProducts().catch(console.error);
