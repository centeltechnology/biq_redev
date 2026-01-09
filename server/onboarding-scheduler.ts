import { storage } from "./storage";
import { sendOnboardingEmail } from "./email";

const ONBOARDING_DAYS = [0, 1, 2, 3, 4, 5, 6, 7];

export async function processOnboardingEmails(baseUrl: string): Promise<void> {
  console.log("[Onboarding] Starting onboarding email check...");

  for (const day of ONBOARDING_DAYS) {
    try {
      const bakers = await storage.getBakersForOnboardingEmails(day);
      
      if (bakers.length === 0) {
        continue;
      }

      console.log(`[Onboarding] Found ${bakers.length} baker(s) eligible for day ${day} email`);

      for (const baker of bakers) {
        try {
          const success = await sendOnboardingEmail(
            baker.email,
            baker.businessName,
            day,
            baseUrl
          );

          if (success) {
            await storage.recordOnboardingEmail(baker.id, day, "sent");
            console.log(`[Onboarding] Sent day ${day} email to ${baker.email}`);
          } else {
            await storage.recordOnboardingEmail(baker.id, day, "failed", "Email send returned false");
            console.error(`[Onboarding] Failed to send day ${day} email to ${baker.email}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await storage.recordOnboardingEmail(baker.id, day, "failed", errorMessage);
          console.error(`[Onboarding] Error sending day ${day} email to ${baker.email}:`, errorMessage);
        }
      }
    } catch (error) {
      console.error(`[Onboarding] Error processing day ${day}:`, error);
    }
  }

  console.log("[Onboarding] Onboarding email check completed");
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
