import Stripe from 'stripe';

let credentialsSource: string = 'unknown';

async function getCredentials() {
  const envSecretKey = process.env.STRIPE_SECRET_KEY;
  const envPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (envSecretKey && envPublishableKey) {
    credentialsSource = 'environment variables (STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY)';
    return {
      publishableKey: envPublishableKey,
      secretKey: envSecretKey,
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Stripe keys not found. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables.');
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  let conn = await fetchConnectionForEnvironment(hostname, xReplitToken, targetEnvironment);

  if (!conn && isProduction) {
    console.warn('Stripe production connection not found, falling back to development connection');
    conn = await fetchConnectionForEnvironment(hostname, xReplitToken, 'development');
  }

  if (!conn) {
    throw new Error(`Stripe connection not found. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables.`);
  }

  credentialsSource = `Replit connector (${targetEnvironment})`;
  return {
    publishableKey: conn.settings.publishable,
    secretKey: conn.settings.secret,
  };
}

async function fetchConnectionForEnvironment(hostname: string, xReplitToken: string, environment: string) {
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', environment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const conn = data.items?.[0];

  if (conn?.settings?.publishable && conn?.settings?.secret) {
    return conn;
  }
  return null;
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover' as any,
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

export async function verifyStripeAccount() {
  try {
    const { secretKey } = await getCredentials();
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover' as any,
    });
    const account = await stripe.accounts.retrieve();
    const keyPrefix = secretKey.substring(0, 7) + '...';
    console.log(`Stripe credentials source: ${credentialsSource}`);
    console.log(`Stripe account: ${account.id} (${account.business_profile?.name || account.email || 'no name'})`);
    console.log(`Stripe key prefix: ${keyPrefix}`);
    return account.id;
  } catch (error: any) {
    console.error(`Stripe verification failed (source: ${credentialsSource}):`, error.message);
    return null;
  }
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
