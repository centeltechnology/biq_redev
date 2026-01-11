import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  console.log('Seeding Stripe products...');
  
  const stripe = await getUncachableStripeClient();

  // Seed BakerIQ Basic product ($9.97/month - 15 quotes)
  let basicProduct;
  const existingBasic = await stripe.products.search({ 
    query: "name:'BakerIQ Basic'" 
  });

  if (existingBasic.data.length > 0) {
    basicProduct = existingBasic.data[0];
    console.log('BakerIQ Basic product already exists:', basicProduct.id);
  } else {
    basicProduct = await stripe.products.create({
      name: 'BakerIQ Basic',
      description: '15 quotes per month for your bakery business',
      metadata: {
        quoteLimit: '15',
        plan: 'basic',
      },
    });
    console.log('Created Basic product:', basicProduct.id);
  }

  // Check/create Basic price
  const basicPrices = await stripe.prices.list({
    product: basicProduct.id,
    active: true,
  });
  
  if (basicPrices.data.length === 0) {
    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 997, // $9.97 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      lookup_key: 'bakeriq_basic_monthly',
      metadata: {
        plan: 'basic',
      },
    });
    console.log('Created Basic price:', basicPrice.id, '- $9.97/month');
  } else {
    console.log('Basic price already exists:', basicPrices.data[0].id);
  }

  // Seed BakerIQ Pro product ($29.97/month - unlimited quotes)
  let proProduct;
  const existingPro = await stripe.products.search({ 
    query: "name:'BakerIQ Pro'" 
  });

  if (existingPro.data.length > 0) {
    proProduct = existingPro.data[0];
    console.log('BakerIQ Pro product already exists:', proProduct.id);
  } else {
    proProduct = await stripe.products.create({
      name: 'BakerIQ Pro',
      description: 'Unlimited quotes per month for your bakery business',
      metadata: {
        quoteLimit: 'unlimited',
        plan: 'pro',
      },
    });
    console.log('Created Pro product:', proProduct.id);
  }

  // Check/create Pro price
  const proPrices = await stripe.prices.list({
    product: proProduct.id,
    active: true,
  });
  
  if (proPrices.data.length === 0) {
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2997, // $29.97 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      lookup_key: 'bakeriq_pro_monthly',
      metadata: {
        plan: 'pro',
      },
    });
    console.log('Created Pro price:', proPrice.id, '- $29.97/month');
  } else {
    console.log('Pro price already exists:', proPrices.data[0].id);
  }

  console.log('Stripe products seeded successfully!');
}

seedProducts().catch(console.error);
