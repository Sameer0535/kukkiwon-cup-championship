// ==============================================================================
// AUDIT LOG SERVICE (Requirement 16)
// Immutable logging of administrative actions
// ==============================================================================

import prisma from "@/lib/db";

export interface LogAuditParams {
  adminUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Records an administrative action in the immutable audit log table
   */
  static async logAction(params: LogAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          admin_user_id: params.adminUserId,
          action: params.action,
          entity_type: params.entityType,
          entity_id: params.entityId,
          old_value: params.oldValue ? JSON.stringify(params.oldValue) : null,
          new_value: params.newValue ? JSON.stringify(params.newValue) : null,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
        },
      });
    } catch (error) {
      // In production, log to stderr without breaking the underlying operation
      console.error("[AuditService] Failed to record audit log:", error);
      return null;
    }
  }

  /**
   * Retrieves audit history with pagination
   */
  static async getLogs(limit = 50, offset = 0) {
    try {
      return await prisma.auditLog.findMany({
        take: limit,
        skip: offset,
        orderBy: { created_at: "desc" },
        include: {
          admin_user: {
            select: {
              email: true,
              full_name: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("[AuditService] Failed to retrieve logs:", error);
      return [];
    }
  }
}
