// ==============================================================================
// DOCUMENT SERVICE (Requirement 11)
// Private storage handling, secure verification workflow, and signed URL delivery
// ==============================================================================

import prisma from "@/lib/db";
import storage from "@/lib/storage";
import { DocumentVerificationStatus } from "@prisma/client";

export interface RegisterDocumentParams {
  participantId: string;
  registrationId?: string | null;
  documentType: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}

export class DocumentService {
  /**
   * Uploads a document to the strictly private bucket and creates a database record
   */
  static async uploadDocument(params: RegisterDocumentParams) {
    // Save to strictly private storage bucket
    const uploadResult = await storage.upload(
      "participant-documents",
      params.fileName,
      params.fileBuffer,
      params.mimeType
    );

    return prisma.document.create({
      data: {
        participant_id: params.participantId,
        registration_id: params.registrationId,
        document_type: params.documentType,
        file_path: uploadResult.filePath,
        file_name: params.fileName,
        mime_type: params.mimeType,
        file_size: uploadResult.sizeBytes,
        verification_status: "UPLOADED",
      },
    });
  }

  /**
   * Generates a time-limited signed URL for authorized administrator review
   */
  static async getSecureReviewUrl(documentId: string, expiresInSeconds = 300) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    return storage.getSignedUrl(
      "participant-documents",
      document.file_path,
      expiresInSeconds
    );
  }

  /**
   * Updates verification status (VERIFIED or REJECTED)
   */
  static async reviewDocument(
    documentId: string,
    status: DocumentVerificationStatus,
    adminUserId: string,
    rejectionReason?: string | null
  ) {
    return prisma.document.update({
      where: { id: documentId },
      data: {
        verification_status: status,
        rejection_reason: rejectionReason,
        verified_at: new Date(),
        verified_by: adminUserId,
      },
    });
  }

  /**
   * Lists pending documents awaiting administrator verification
   */
  static async listPending(limit = 20) {
    return prisma.document.findMany({
      where: {
        verification_status: { in: ["PENDING", "UPLOADED"] },
      },
      take: limit,
      orderBy: { uploaded_at: "asc" },
      include: {
        participant: {
          select: {
            public_id: true,
            full_name: true,
            designation: true,
          },
        },
      },
    });
  }
}
