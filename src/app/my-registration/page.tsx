// ==============================================================================
// MY CHAMPIONSHIP REGISTRATION DASHBOARD (Requirements 11, 12, 16)
// Private user dashboard for tracking drafts, submitted entries, and statuses
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { RegistrationWithDetails, RegistrationStatus } from "@/types/registration";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Shield,
  FileCheck,
  Award,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  ArrowRight,
  Plus,
  LogIn,
  LogOut,
  X,
  FileText,
  CreditCard,
  Receipt,
  Printer,
} from "lucide-react";
import { IdCardModal } from "@/components/registration/id-card-modal";

export default function MyRegistrationDashboardPage() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = React.useState<{
    id: string;
    email: string;
    fullName: string;
    role?: string;
  } | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  // Sign In Form for Unauthenticated View
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Registrations Data
  const [registrations, setRegistrations] = React.useState<RegistrationWithDetails[]>([]);
  const [loadingRegs, setLoadingRegs] = React.useState(false);

  // View Details Modal
  const [selectedReg, setSelectedReg] = React.useState<RegistrationWithDetails | null>(null);

  // Phase 6 Athlete ID Card Modal State
  const [cardModalRegId, setCardModalRegId] = React.useState<string | null>(null);
  const [cardModalOpen, setCardModalOpen] = React.useState(false);

  React.useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        loadRegistrations();
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadRegistrations = async () => {
    setLoadingRegs(true);
    try {
      const res = await fetch("/api/registrations/my");
      const data = await res.json();
      if (data.registrations) {
        setRegistrations(data.registrations);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");

      setCurrentUser(data.user);
      loadRegistrations();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setRegistrations([]);
    } catch {
      // Ignore
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Draft Incomplete</Badge>;
      case "SUBMITTED":
        return <Badge variant="cyan">Submitted For Review</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="gold">Under Verification</Badge>;
      case "APPROVED":
      case "CONFIRMED":
        return <Badge variant="gold">Accreditation Approved</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocReadinessBadge = (readiness?: any) => {
    if (!readiness) return null;
    switch (readiness.readinessStatus) {
      case "DOCUMENTS_VERIFIED":
        return <Badge variant="gold">{readiness.verified}/{readiness.required} Verified</Badge>;
      case "ACTION_REQUIRED":
        return <Badge variant="danger">Action Required ({readiness.rejected} Rejected)</Badge>;
      case "DOCUMENTS_IN_REVIEW":
        return <Badge variant="cyan">{readiness.uploaded}/{readiness.required} In Review</Badge>;
      default:
        return <Badge variant="outline">{readiness.uploaded}/{readiness.required} Uploaded</Badge>;
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="gold">Paid & Verified</Badge>;
      case "REFUNDED":
        return <Badge variant="outline">Fee Refunded</Badge>;
      case "PARTIALLY_REFUNDED":
        return <Badge variant="outline">Partially Refunded</Badge>;
      case "FAILED":
        return <Badge variant="danger">Payment Failed</Badge>;
      default:
        return <Badge variant="cyan">Unpaid / Pending</Badge>;
    }
  };

  const getIdCardBadge = (status?: string, athleteId?: string | null, isPaid?: boolean) => {
    if (status === "REVOKED") {
      return <Badge variant="danger">ID Card Revoked</Badge>;
    }
    if (isPaid || status === "GENERATED" || status === "READY") {
      return (
        <Badge variant="gold">
          {athleteId ? `✓ ${athleteId}` : "✓ ID Ready"}
        </Badge>
      );
    }
    return <Badge variant="outline">🔒 Pending Payment</Badge>;
  };

  // ----------------------------------------------------------------------------
  // UNAUTHENTICATED STATE: Clean Sign-In Form (Requirement 12)
  // ----------------------------------------------------------------------------
  if (!authLoading && !currentUser) {
    return (
      <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 font-sans">
        <PublicHeader />

        <main className="flex-1 py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-md space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Participant Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                Registrant Sign In
              </h1>
              <p className="text-xs text-slate-400">
                Sign in to view your incomplete drafts, submitted profiles, and accreditation badges.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-6 sm:p-8 shadow-xl space-y-5">
              {authError && (
                <Alert variant="danger" title="Notice">
                  {authError}
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Registered Email *"
                  type="email"
                  placeholder="participant@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password *"
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loginLoading}
                  className="w-full text-xs font-bold uppercase tracking-wider mt-2"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  <span>Authenticate Session</span>
                </Button>
              </form>

              <div className="border-t border-slate-800/80 pt-4 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Don&apos;t have an account yet?
                </p>
                <Link href="/register">
                  <Button variant="outline" size="sm" className="text-xs uppercase font-bold border-slate-700">
                    <span>Start New Championship Registration</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // AUTHENTICATED DASHBOARD (Requirement 12)
  // ----------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 font-sans">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Accreditation Center
              </span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                MY CHAMPIONSHIP REGISTRATIONS
              </h1>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-white font-bold">{currentUser?.fullName}</span> ({currentUser?.email})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/register">
                <Button variant="primary" size="md" className="text-xs uppercase font-bold">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span>New Registration</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                onClick={handleLogout}
                className="text-xs uppercase font-bold border-slate-700 text-slate-400 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>

          {/* Registrations List */}
          {loadingRegs ? (
            <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0A0F1D]">
              <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading registrations...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0A0F1D] space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <FileCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold uppercase text-white">
                  No Registrations Found
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You do not have any active drafts or submitted participant registrations under this account.
                </p>
              </div>
              <Link href="/register">
                <Button variant="primary" size="md" className="text-xs uppercase font-bold mt-2">
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>Start Championship Registration</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden lg:block rounded-2xl border border-slate-800 bg-[#0A0F1D] overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">Reference</th>
                      <th className="py-4 px-4">Participant</th>
                      <th className="py-4 px-4">Type</th>
                      <th className="py-4 px-4">Discipline / Category</th>
                      <th className="py-4 px-4">Registration</th>
                      <th className="py-4 px-4">Document Readiness</th>
                      <th className="py-4 px-4">Payment Status</th>
                      <th className="py-4 px-4">Accreditation ID</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {registrations.map((reg) => {
                      const isDraft = reg.status === "DRAFT";
                      const isPaid = reg.paymentStatus === "PAID" || reg.status === "PAID" || reg.status === "CONFIRMED";
                      const continueUrl =
                        reg.participant_type === "COACH"
                          ? `/register/coach?draftId=${reg.id}`
                          : `/register/athlete?draftId=${reg.id}`;

                      return (
                        <tr key={reg.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-[#D4AF37]">
                            {reg.registration_number}
                          </td>
                          <td className="py-4 px-4 font-bold text-white">
                            {reg.participant?.full_name || "Draft Participant"}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {reg.participant_type}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <span className="text-white block font-medium">
                                {reg.discipline || "Not Selected"}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                                {reg.category?.name || "General Group"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(reg.status)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              {getDocReadinessBadge(reg.documentReadiness)}
                              <Link
                                href={`/my-registration/${reg.id}/documents`}
                                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Upload / View</span>
                              </Link>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              {getPaymentStatusBadge(reg.paymentStatus)}
                              <Link
                                href={`/my-registration/${reg.id}/payment`}
                                className="text-[11px] text-[#D4AF37] hover:text-[#E5BF42] font-semibold flex items-center gap-1 transition-colors"
                              >
                                {reg.paymentStatus === "PAID" ? (
                                  <>
                                    <Receipt className="w-3 h-3" />
                                    <span>Receipt</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="w-3 h-3" />
                                    <span>Pay Fee</span>
                                  </>
                                )}
                              </Link>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              {getIdCardBadge(
                                (reg as any).idCardStatus,
                                reg.athlete_id,
                                isPaid
                              )}
                              {isPaid ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setCardModalRegId(reg.id);
                                      setCardModalOpen(true);
                                    }}
                                    className="text-[11px] text-[#D4AF37] hover:text-[#E5BF42] font-semibold flex items-center gap-1 transition-colors"
                                  >
                                    <Award className="w-3 h-3" />
                                    <span>View Card</span>
                                  </button>
                                  <a
                                    href={`/api/registrations/${reg.id}/id-card/download?autoprint=1`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-0.5"
                                    title="Print or Save PDF"
                                  >
                                    <Printer className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500">Unlocks upon payment</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPaid && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCardModalRegId(reg.id);
                                    setCardModalOpen(true);
                                  }}
                                  className="text-[11px] uppercase font-bold py-1 h-8 border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                >
                                  <Award className="h-3.5 w-3.5 mr-1" />
                                  <span>ID Card</span>
                                </Button>
                              )}
                              {!isDraft && !isPaid && (
                                <Link href={`/my-registration/${reg.id}/payment`}>
                                  <Button
                                    variant={reg.paymentStatus === "PAID" ? "outline" : "primary"}
                                    size="sm"
                                    className="text-[11px] uppercase font-bold py-1 h-8"
                                  >
                                    {reg.paymentStatus === "PAID" ? (
                                      <>
                                        <Receipt className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
                                        <span>Receipt</span>
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard className="h-3.5 w-3.5 mr-1" />
                                        <span>Pay Fee</span>
                                      </>
                                    )}
                                  </Button>
                                </Link>
                              )}
                              <Link href={`/my-registration/${reg.id}/documents`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[11px] uppercase font-bold py-1 h-8 border-slate-700 hover:border-amber-500/50"
                                >
                                  <FileText className="h-3.5 w-3.5 mr-1 text-amber-400" />
                                  <span>Documents</span>
                                </Button>
                              </Link>
                              {isDraft ? (
                                <Link href={continueUrl}>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="text-[11px] uppercase font-bold py-1 h-8"
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1" />
                                    <span>Continue Draft</span>
                                  </Button>
                                </Link>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedReg(reg)}
                                  className="text-[11px] uppercase font-bold py-1 h-8 border-slate-700"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  <span>Details</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Cards View */}
              <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {registrations.map((reg) => {
                  const isDraft = reg.status === "DRAFT";
                  const continueUrl =
                    reg.participant_type === "COACH"
                      ? `/register/coach?draftId=${reg.id}`
                      : `/register/athlete?draftId=${reg.id}`;

                  return (
                    <div
                      key={reg.id}
                      className="p-5 rounded-2xl border border-slate-800 bg-[#0A0F1D] space-y-4 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#D4AF37]">
                          {reg.registration_number}
                        </span>
                        {getStatusBadge(reg.status)}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {reg.participant_type}
                        </span>
                        <h4 className="text-base font-bold text-white">
                          {reg.participant?.full_name || "Draft Participant"}
                        </h4>
                        <div className="text-xs text-slate-400 space-y-0.5">
                          <div>Discipline: <span className="text-white">{reg.discipline || "N/A"}</span></div>
                          {reg.category?.name && (
                            <div>Category: <span className="text-slate-300">{reg.category.name}</span></div>
                          )}
                          <div>Last Updated: {formatDate(reg.updated_at)}</div>
                        </div>
                      </div>

                      {/* Document Readiness on Mobile */}
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                            Accreditation Media
                          </span>
                          <div className="mt-1">
                            {getDocReadinessBadge(reg.documentReadiness)}
                          </div>
                        </div>
                        <Link href={`/my-registration/${reg.id}/documents`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] h-7 px-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold uppercase"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Manage
                          </Button>
                        </Link>
                      </div>

                      {/* Phase 6 ID Card Accreditation on Mobile */}
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                            Accreditation Card
                          </span>
                          <div className="mt-1">
                            {getIdCardBadge(
                              (reg as any).idCardStatus,
                              reg.athlete_id,
                              reg.paymentStatus === "PAID" || reg.status === "PAID" || reg.status === "CONFIRMED"
                            )}
                          </div>
                        </div>
                        {(reg.paymentStatus === "PAID" || reg.status === "PAID" || reg.status === "CONFIRMED") && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCardModalRegId(reg.id);
                                setCardModalOpen(true);
                              }}
                              className="text-[11px] h-7 px-3 border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold uppercase"
                            >
                              <Award className="w-3 h-3 mr-1" />
                              Card
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/registrations/${reg.id}/id-card/download?autoprint=1`, "_blank")}
                              className="text-[11px] h-7 px-2 border-slate-700 text-slate-300"
                              title="Print / Save PDF"
                            >
                              <Printer className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex justify-end">
                        {isDraft ? (
                          <Link href={continueUrl} className="w-full">
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full text-xs uppercase font-bold"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              <span>Continue Incomplete Draft</span>
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReg(reg)}
                            className="w-full text-xs uppercase font-bold border-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>View Registration Record</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />

      {/* VIEW DETAILS MODAL */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-8 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedReg(null)}
              className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1 pr-8">
              <Badge variant="gold">Official Accreditation Record</Badge>
              <h3 className="text-xl font-black uppercase text-white">
                Registration Overview
              </h3>
              <p className="text-xs font-mono text-[#D4AF37]">
                Reference: {selectedReg.registration_number}
              </p>
            </div>

            <div className="space-y-3 text-xs bg-slate-900 p-4 rounded-xl border border-slate-800 divide-y divide-slate-800/80">
              <div className="pb-2 flex justify-between">
                <span className="text-slate-400">Participant Name:</span>
                <span className="font-bold text-white">{selectedReg.participant?.full_name}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Participant Role:</span>
                <span className="font-bold text-white">{selectedReg.participant_type}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Discipline:</span>
                <span className="text-[#00E5FF] font-bold">{selectedReg.discipline}</span>
              </div>
              {selectedReg.category?.name && (
                <div className="py-2 flex justify-between">
                  <span className="text-slate-400">Division:</span>
                  <span className="text-white">{selectedReg.category.name}</span>
                </div>
              )}
              {selectedReg.academy?.name && (
                <div className="py-2 flex justify-between">
                  <span className="text-slate-400">Academy / Club:</span>
                  <span className="text-white">{selectedReg.academy.name}</span>
                </div>
              )}
              <div className="py-2 flex justify-between items-center">
                <span className="text-slate-400">Accreditation Status:</span>
                {getStatusBadge(selectedReg.status)}
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-slate-400">Document Readiness:</span>
                <div>{getDocReadinessBadge(selectedReg.documentReadiness)}</div>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-slate-400">Payment Status:</span>
                <div>{getPaymentStatusBadge(selectedReg.paymentStatus)}</div>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-slate-400">Accreditation Card:</span>
                <div>
                  {getIdCardBadge(
                    (selectedReg as any).idCardStatus,
                    selectedReg.athlete_id,
                    selectedReg.paymentStatus === "PAID" || selectedReg.status === "PAID" || selectedReg.status === "CONFIRMED"
                  )}
                </div>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Registered At:</span>
                <span className="text-slate-300">{formatDateTime(selectedReg.registered_at)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {(selectedReg.paymentStatus === "PAID" || selectedReg.status === "PAID" || selectedReg.status === "CONFIRMED") && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setCardModalRegId(selectedReg.id);
                      setCardModalOpen(true);
                    }}
                    className="text-xs uppercase font-bold border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 w-full sm:w-auto"
                  >
                    <Award className="h-4 w-4 mr-1.5" />
                    <span>View ID Card</span>
                  </Button>
                )}
                <Link href={`/my-registration/${selectedReg.id}/payment`} className="w-full sm:w-auto">
                  <Button
                    variant={selectedReg.paymentStatus === "PAID" ? "outline" : "primary"}
                    size="md"
                    className="text-xs uppercase font-bold w-full sm:w-auto"
                  >
                    {selectedReg.paymentStatus === "PAID" ? (
                      <>
                        <Receipt className="h-4 w-4 mr-1.5 text-[#D4AF37]" />
                        <span>View Receipt</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-1.5" />
                        <span>Pay Registration Fee</span>
                      </>
                    )}
                  </Button>
                </Link>
                <Link href={`/my-registration/${selectedReg.id}/documents`} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="md"
                    className="text-xs uppercase font-bold border-slate-700 w-full sm:w-auto"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    <span>Documents</span>
                  </Button>
                </Link>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedReg(null)}
                className="text-xs uppercase font-bold border-slate-700 w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 6 DIGITAL ID CARD MODAL */}
      <IdCardModal
        registrationId={cardModalRegId}
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
      />
    </div>
  );
}
