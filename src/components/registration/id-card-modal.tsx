// ==============================================================================
// ATHLETE DIGITAL ID CARD MODAL COMPONENT (Phase 6 Requirements 8, 9, 10 & 19)
// Official Kukkiwon Cup accreditation card preview, QR verification, and PDF print
// ==============================================================================

"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AthleteIdCardDetails, IdCardEligibilityResult } from "@/types/id-card";
import {
  X,
  Printer,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  Award,
  Sparkles,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface IdCardModalProps {
  registrationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IdCardModal({ registrationId, isOpen, onClose }: IdCardModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [card, setCard] = React.useState<AthleteIdCardDetails | null>(null);
  const [eligibility, setEligibility] = React.useState<IdCardEligibilityResult | null>(null);

  React.useEffect(() => {
    if (isOpen && registrationId) {
      loadCardDetails(registrationId);
    } else {
      setCard(null);
      setEligibility(null);
      setError(null);
    }
  }, [isOpen, registrationId]);

  const loadCardDetails = async (regId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${regId}/id-card`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load ID card information.");
      }

      setEligibility(data.eligibility);
      if (data.card) {
        setCard(data.card);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ID card.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!registrationId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${registrationId}/id-card`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate athlete ID card.");
      }
      setCard(data.card);
    } catch (err: any) {
      setError(err.message || "Failed to generate ID card.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!registrationId) return;
    window.open(`/api/registrations/${registrationId}/id-card/download?autoprint=1`, "_blank");
  };

  if (!isOpen || !registrationId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0A0F1D] border-2 border-[#D4AF37]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-[#0A192F] shrink-0">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
              Official Athlete Accreditation Card
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
            aria-label="Close accreditation card modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 flex flex-col items-center justify-center">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Retrieving accreditation credential...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3 max-w-md">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Accreditation Unavailable</h4>
              <p className="text-xs text-slate-300">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadCardDetails(registrationId)}
                className="mt-2 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Retry
              </Button>
            </div>
          ) : card ? (
            /* Rendered Accreditation Card */
            <div className="w-full max-w-[340px] sm:max-w-sm space-y-4 mx-auto">
              <div className="w-full rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-2xl bg-white text-slate-900 flex flex-col">
                {/* Badge Top Banner */}
                <div className="bg-[#0A192F] p-4 text-center border-b-2 border-[#D4AF37]">
                  <h4 className="text-xs font-black tracking-widest text-[#D4AF37] uppercase">
                    KUKKIWON CUP CHAMPIONSHIP
                  </h4>
                  <p className="text-[9px] font-semibold text-slate-300 tracking-wider uppercase">
                    Official Athlete Accreditation
                  </p>
                </div>

                {/* Badge Center */}
                <div className="p-4 flex flex-col items-center space-y-3 bg-white">
                  {/* Photo Frame */}
                  <div className="w-24 h-24 rounded-xl border-2 border-[#D4AF37] overflow-hidden bg-slate-50 flex items-center justify-center shadow-md">
                    {card.photoUrl ? (
                      <img
                        src={card.photoUrl}
                        alt={card.athleteName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-400 text-3xl font-black">🥋</div>
                    )}
                  </div>

                  {/* Athlete Identity */}
                  <div className="text-center space-y-0.5">
                    <h5 className="text-base font-black text-[#0A192F] uppercase tracking-tight">
                      {card.athleteName}
                    </h5>
                    <div className="inline-block bg-[#0A192F] text-[#D4AF37] text-[11px] font-mono font-bold px-2.5 py-0.5 rounded tracking-wider">
                      {card.athleteId}
                    </div>
                  </div>

                  {/* Meta Grid */}
                  <div className="w-full grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Category</span>
                      <span className="font-bold text-slate-800 truncate block">{card.categoryName || "Official Entry"}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Discipline</span>
                      <span className="font-bold text-slate-800 truncate block">{card.discipline || "KYORUGI"}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Academy</span>
                      <span className="font-bold text-slate-800 truncate block">{card.academyName || "Independent"}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Nationality</span>
                      <span className="font-bold text-slate-800 truncate block">{card.nationality}</span>
                    </div>
                  </div>

                  {/* Scannable QR Code */}
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-24 h-24 p-1 rounded-lg border border-slate-300 bg-white flex items-center justify-center shadow-sm">
                      {card.qrCodeDataUrl ? (
                        <img
                          src={card.qrCodeDataUrl}
                          alt="Scan to verify"
                          className="w-full h-full"
                        />
                      ) : (
                        <span className="text-[9px] text-slate-400">QR Loading</span>
                      )}
                    </div>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#0A192F] mt-1">
                      Scan to Verify Identity
                    </span>
                  </div>
                </div>

                {/* Badge Bottom Footer */}
                <div className="bg-[#0A192F] px-4 py-2 flex items-center justify-between text-[8px] text-slate-300 border-t border-slate-700">
                  <span>REF: {card.registrationNumber}</span>
                  <span className="text-[#D4AF37] font-bold">STATUS: {card.cardStatus} • V{card.version}</span>
                </div>
              </div>
            </div>
          ) : eligibility?.isEligible ? (
            /* Eligible but ID card record not yet created -> Action to Generate */
            <div className="text-center py-8 space-y-4 max-w-sm">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Your ID Card is Ready</h4>
                <p className="text-xs text-slate-400">
                  Your registration fee is confirmed. Generate your official digital ID card with a high-entropy scannable QR verification code.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full font-bold uppercase text-xs tracking-wider"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating ID Card...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Generate Athlete ID Card
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Not eligible */
            <div className="text-center py-8 space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">ID Card Locked</h4>
              <p className="text-xs text-slate-400">
                {eligibility?.reason || "ID card generation requires a verified registration and completed fee payment."}
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        {card && (
          <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-[#0A192F] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <a
              href={card.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center justify-center sm:justify-start gap-1 py-1"
            >
              <span>Public Verification Link</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 sm:flex-initial text-xs border-slate-700 text-slate-300"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial text-xs font-bold uppercase"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                <span>Print / PDF</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
