import { storage } from "./storage";
import { sendOnboardingEmail } from "./email";

const ONBOARDING_DAYS = [0, 1, 2, 3, 4, 5, 6];

function isFeatureEnabled(): boolean {
  return process.env.ONBOARDING_CONDITIONALS_ENABLED === "true";
}

function getOnboardingDay(createdAt: Date): number {
  const hoursSinceSignup = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceSignup < 0) return -1;
  return Math.floor(hoursSinceSignup / 24);
}

export async function processOnboardingEmails(baseUrl: string): Promise<void> {
  if (!isFeatureEnabled()) {
    console.log("[Onboarding] Conditional onboarding emails disabled (ONBOARDING_CONDITIONALS_ENABLED !== 'true')");
    return;
  }

  console.log("[Onboarding] Starting conditional onboarding email check...");

  for (const day of ONBOARDING_DAYS) {
    try {
      const bakers = await storage.getBakersForOnboardingEmails(day);

      if (bakers.length === 0) {
        continue;
      }

      console.log(`[Onboarding] Found ${bakers.length} baker(s) eligible for day ${day} email`);

      for (const baker of bakers) {
        try {
          if (baker.role === "super_admin") {
            console.log(`[Onboarding] Skipping admin account: ${baker.email}`);
            continue;
          }

          const onboardingDay = getOnboardingDay(baker.createdAt);
          if (onboardingDay < day || onboardingDay > day) {
            console.log(`[Onboarding] Skipping ${baker.email}: current day ${onboardingDay} doesn't match target day ${day}`);
            continue;
          }

          const stripeConnected = !!(baker.stripeConnectAccountId && baker.stripeConnectOnboarded && baker.stripeConnectPayoutsEnabled);

          console.log(`[Onboarding] Sending day ${day} email to ${baker.email} | stripeConnected=${stripeConnected}`);

          const result = await sendOnboardingEmail(
            baker.email,
            baker.businessName,
            day,
            baseUrl,
            stripeConnected
          );

          if (result.success) {
            await storage.recordOnboardingEmail(baker.id, day, "sent", undefined, result.emailKey, stripeConnected);
            console.log(`[Onboarding] SENT day=${day} key=${result.emailKey} to=${baker.email} stripe=${stripeConnected}`);
          } else {
            await storage.recordOnboardingEmail(baker.id, day, "failed", "Email send returned false", result.emailKey, stripeConnected);
            console.error(`[Onboarding] FAILED day=${day} key=${result.emailKey} to=${baker.email} reason=send_returned_false`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await storage.recordOnboardingEmail(baker.id, day, "failed", errorMessage);
          console.error(`[Onboarding] ERROR day=${day} to=${baker.email} error=${errorMessage}`);
        }
      }
    } catch (error) {
      console.error(`[Onboarding] Error processing day ${day}:`, error);
    }
  }

  console.log("[Onboarding] Conditional onboarding email check completed");
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startOnboardingScheduler(baseUrl: string): void {
  if (schedulerInterval) {
    console.log("[Onboarding] Scheduler already running");
    return;
  }

  console.log("[Onboarding] Starting onboarding email scheduler");

  processOnboardingEmails(baseUrl).catch(console.error);

  schedulerInterval = setInterval(() => {
    processOnboardingEmails(baseUrl).catch(console.error);
  }, 60 * 60 * 1000);
}

export function stopOnboardingScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Onboarding] Scheduler stopped");
  }
}
