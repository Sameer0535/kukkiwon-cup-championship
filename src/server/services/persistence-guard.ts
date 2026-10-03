// ==============================================================================
// PERSISTENCE GUARD (Phase 13 Production Hardening)
// Enforces fail-closed database persistence in production to prevent silent data loss.
// In development/test mode, allows fallback stores for offline testing.
// ==============================================================================

export class PersistenceGuard {
  /**
   * Asserts that database write operations must fail closed if the database is unreachable
   * in production, rather than silently writing to volatile memory.
   */
  static assertWritePersistence(isOnline: boolean, operationName: string): void {
    if (!isOnline && process.env.NODE_ENV === "production") {
      throw new Error(
        `[CRITICAL PERSISTENCE ERROR] Database is unreachable during '${operationName}'. In-memory fallback is strictly prohibited in production to prevent silent data loss.`
      );
    }
  }

  /**
   * Checks whether fallback in-memory operation is permissible in current runtime.
   */
  static isFallbackPermitted(): boolean {
    return process.env.NODE_ENV !== "production";
  }
}
