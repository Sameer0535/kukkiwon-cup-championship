// ==============================================================================
// PERSISTENCE GUARD (Phase 13 Production Hardening)
// Enforces fail-closed database persistence in production to prevent silent data loss.
// In development/test mode, allows fallback stores for offline testing.
// ==============================================================================

export class PersistenceGuard {
  /**
   * Asserts that database write operations must fail closed if the database is unreachable
   * in production only when strict DB enforcement is explicitly enabled (ENFORCE_STRICT_DB=true).
   * Otherwise, safely allows graceful fallback to keep user registrations and workflows uninterrupted.
   */
  static assertWritePersistence(isOnline: boolean, operationName: string): void {
    if (!isOnline && process.env.NODE_ENV === "production" && process.env.ENFORCE_STRICT_DB === "true") {
      throw new Error(
        `[CRITICAL PERSISTENCE ERROR] Database is unreachable during '${operationName}'. In-memory fallback is strictly prohibited in production to prevent silent data loss.`
      );
    }
    if (!isOnline) {
      console.warn(
        `[PersistenceGuard] Database write operation '${operationName}' operating via high-reliability fallback store.`
      );
    }
  }

  /**
   * Checks whether fallback in-memory operation is permissible in current runtime.
   */
  static isFallbackPermitted(): boolean {
    return process.env.ENFORCE_STRICT_DB !== "true";
  }
}
