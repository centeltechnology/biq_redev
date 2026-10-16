import { billingAccess, effective, isTestAccount, type Billing, type Subject } from "./policy";
import { SyncError, type Snapshot } from "./provider";

export interface LockedAccount {
  subject: Subject;
  previous: Billing | null;
  save(snapshot: Snapshot, localPlan: string, source: string, now: number): Promise<void>;
}
export interface SyncRepository {
  locked(id: string, work: (account: LockedAccount) => Promise<void>): Promise<boolean>;
  failure(id: string, code: string, now: number): Promise<void>;
}
export async function synchronize(
  id: string, repo: SyncRepository,
  fetchCurrent: (s: Subject, p: Billing | null, now: number) => Promise<Snapshot>,
  now = Date.now(),
) {
  try {
    const acquired = await repo.locked(id, async account => {
      // No provider reads or billing ownership transitions for test/admin access.
      if (isTestAccount(account.subject.id) ||
        !account.subject.customerId && account.subject.plan !== "free") return;
      if (!account.subject.customerId) throw new SyncError("MISSING_CUSTOMER");
      const snapshot = await fetchCurrent(account.subject, account.previous, now);
      const access = billingAccess(snapshot.billing, now);
      const entitlement = effective(account.subject, access, now);
      // Persist the billing tier, not a temporary trial/gift overlay, so an
      // expired overlay cannot become a permanent paid assignment.
      await account.save(snapshot, access, entitlement.source, now);
    });
    return acquired ? "synced" : "busy";
  } catch (error) {
    const code = error instanceof SyncError ? error.code : "PROVIDER_OR_STORAGE_UNAVAILABLE";
    // This occurs after rollback; never overwrite a plan in the error path.
    await repo.failure(id, code, now);
    return "failed";
  }
}
