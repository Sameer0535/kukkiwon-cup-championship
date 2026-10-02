// ==============================================================================
// ACADEMY SELECTOR & REQUEST COMPONENT (Requirements 3, 7, 8, 9)
// Academy search, selection, duplicate detection, and new academy registration
// ==============================================================================

"use client";

import * as React from "react";
import { Academy } from "@/types/registration";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Search,
  Building2,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  MapPin,
  X,
} from "lucide-react";

interface AcademySelectorProps {
  selectedAcademyId?: string;
  selectedAcademyName?: string;
  selectedAcademyCode?: string;
  isNewAcademy?: boolean;
  newAcademyData?: {
    name: string;
    country: string;
    state: string;
    city: string;
    head_coach: string;
  };
  onChange: (data: {
    academy_id?: string;
    academy_name?: string;
    academy_code?: string;
    is_new_academy?: boolean;
    new_academy_data?: {
      name: string;
      country: string;
      state: string;
      city: string;
      head_coach: string;
    };
  }) => void;
}

export function AcademySelector({
  selectedAcademyId,
  selectedAcademyName,
  selectedAcademyCode,
  isNewAcademy,
  newAcademyData,
  onChange,
}: AcademySelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Academy[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [mode, setMode] = React.useState<"select" | "create">(
    isNewAcademy ? "create" : "select"
  );

  // New Academy Form State
  const [newName, setNewName] = React.useState(newAcademyData?.name || "");
  const [newCountry, setNewCountry] = React.useState(newAcademyData?.country || "India");
  const [newState, setNewState] = React.useState(newAcademyData?.state || "");
  const [newCity, setNewCity] = React.useState(newAcademyData?.city || "");
  const [newHeadCoach, setNewHeadCoach] = React.useState(newAcademyData?.head_coach || "");

  // Duplicate warning state
  const [duplicateMatches, setDuplicateMatches] = React.useState<Academy[]>([]);
  const [duplicateWarning, setDuplicateWarning] = React.useState(false);

  // Load initial search on mount
  React.useEffect(() => {
    handleSearch("");
  }, []);

  const handleSearch = async (query: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/academies?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.academies) {
        setSearchResults(data.academies);
      }
    } catch {
      // Ignore
    } finally {
      setSearching(false);
    }
  };

  const handleSelectAcademy = (academy: Academy) => {
    onChange({
      academy_id: academy.id,
      academy_name: academy.name,
      academy_code: academy.code,
      is_new_academy: false,
    });
    setMode("select");
    setDuplicateWarning(false);
  };

  const handleClearSelection = () => {
    onChange({
      academy_id: undefined,
      academy_name: undefined,
      academy_code: undefined,
      is_new_academy: false,
    });
  };

  // Check duplicate when typing new academy name & city
  const checkDuplicateAcademy = async (name: string, city: string) => {
    if (name.length < 3 || city.length < 2) {
      setDuplicateWarning(false);
      setDuplicateMatches([]);
      return;
    }

    try {
      const res = await fetch("/api/academies/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, country: newCountry }),
      });
      const data = await res.json();
      if (data.isDuplicate && data.matches?.length > 0) {
        setDuplicateMatches(data.matches);
        setDuplicateWarning(true);
      } else {
        setDuplicateWarning(false);
        setDuplicateMatches([]);
      }
    } catch {
      // Ignore
    }
  };

  const handleNewAcademyChange = (
    field: string,
    val: string
  ) => {
    let updatedName = newName;
    let updatedCity = newCity;
    let updatedState = newState;
    let updatedCountry = newCountry;
    let updatedCoach = newHeadCoach;

    if (field === "name") {
      setNewName(val);
      updatedName = val;
      checkDuplicateAcademy(val, updatedCity);
    } else if (field === "city") {
      setNewCity(val);
      updatedCity = val;
      checkDuplicateAcademy(updatedName, val);
    } else if (field === "state") {
      setNewState(val);
      updatedState = val;
    } else if (field === "country") {
      setNewCountry(val);
      updatedCountry = val;
    } else if (field === "head_coach") {
      setNewHeadCoach(val);
      updatedCoach = val;
    }

    onChange({
      academy_id: undefined,
      academy_name: updatedName,
      is_new_academy: true,
      new_academy_data: {
        name: updatedName,
        country: updatedCountry,
        state: updatedState,
        city: updatedCity,
        head_coach: updatedCoach,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Selected Academy Banner */}
      {selectedAcademyName && !isNewAcademy && (
        <div className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase">
                  {selectedAcademyName}
                </span>
                {selectedAcademyCode && (
                  <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-[#D4AF37] px-2 py-0.5 rounded">
                    {selectedAcademyCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Officially recognized tournament dojang affiliation
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="text-xs text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4 mr-1" />
            <span>Change</span>
          </Button>
        </div>
      )}

      {/* Mode Toggle: Existing vs Register New */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-white uppercase">
            Academy / Dojang Affiliation
          </h4>
          <p className="text-xs text-slate-400">
            Select your accredited academy or register a new club profile
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={mode === "select" ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setMode("select");
              onChange({
                academy_id: selectedAcademyId,
                academy_name: selectedAcademyName,
                academy_code: selectedAcademyCode,
                is_new_academy: false,
              });
            }}
            className="text-xs uppercase font-bold"
          >
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Search Existing</span>
          </Button>

          <Button
            type="button"
            variant={mode === "create" ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setMode("create");
              onChange({
                academy_id: undefined,
                is_new_academy: true,
                new_academy_data: {
                  name: newName,
                  country: newCountry,
                  state: newState,
                  city: newCity,
                  head_coach: newHeadCoach,
                },
              });
            }}
            className="text-xs uppercase font-bold"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            <span>Register New Academy</span>
          </Button>
        </div>
      </div>

      {/* MODE 1: SEARCH EXISTING ACADEMIES */}
      {mode === "select" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search academy by name, city, or code (e.g. Delhi, KKC26)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-slate-800 bg-[#090D16] space-y-2">
                <p className="text-xs text-slate-400">
                  No registered academy found matching &quot;{searchQuery}&quot;.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("create")}
                  className="text-xs font-bold uppercase text-[#D4AF37] border-slate-700"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  <span>Register &quot;{searchQuery}&quot; as New Academy</span>
                </Button>
              </div>
            ) : (
              searchResults.map((academy) => {
                const isSelected = selectedAcademyId === academy.id;
                return (
                  <div
                    key={academy.id}
                    onClick={() => handleSelectAcademy(academy)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? "border-[#D4AF37] bg-slate-900 shadow-md"
                        : "border-slate-800 bg-[#0A0F1D] hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {academy.name}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-800 text-[#00E5FF] px-1.5 py-0.5 rounded">
                          {academy.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {academy.city}, {academy.state}
                        </span>
                        {academy.head_coach_name && (
                          <span>• Head: {academy.head_coach_name}</span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      className="text-xs uppercase font-bold shrink-0"
                    >
                      {isSelected ? "Selected" : "Select"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODE 2: REGISTER NEW ACADEMY WITH DUPLICATE PROTECTION */}
      {mode === "create" && (
        <div className="space-y-4 p-5 rounded-2xl border border-slate-800 bg-[#0A0F1D]">
          <div className="space-y-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              New Academy Intake Form
            </h5>
            <p className="text-[11px] text-slate-400">
              Provide official club credentials. A unique academy identifier will be provisioned.
            </p>
          </div>

          {/* DUPLICATE WARNING BOX */}
          {duplicateWarning && duplicateMatches.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/20 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h6 className="text-xs font-bold text-amber-200 uppercase">
                    An academy with similar information already exists.
                  </h6>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    We found an existing recognized academy in our directory. To avoid duplicate accreditation records, please confirm:
                  </p>
                </div>
              </div>

              <div className="space-y-2 pl-7">
                {duplicateMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{m.name}</span>
                      <span className="text-slate-400 ml-2">({m.city}, {m.state})</span>
                      <span className="text-amber-400 font-mono ml-2">[{m.code}]</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => handleSelectAcademy(m)}
                      className="text-[10px] uppercase font-bold py-1 h-7"
                    >
                      Select Existing
                    </Button>
                  </div>
                ))}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(false)}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Continue with new academy request anyway
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Official Academy / Team Name *"
                placeholder="e.g. Haryana Dynamic Taekwondo Club"
                value={newName}
                onChange={(e) => handleNewAcademyChange("name", e.target.value)}
                required
              />
            </div>

            <Input
              label="City *"
              placeholder="e.g. Gurugram"
              value={newCity}
              onChange={(e) => handleNewAcademyChange("city", e.target.value)}
              required
            />

            <Input
              label="State / Province *"
              placeholder="e.g. Haryana"
              value={newState}
              onChange={(e) => handleNewAcademyChange("state", e.target.value)}
              required
            />

            <Input
              label="Country *"
              value={newCountry}
              onChange={(e) => handleNewAcademyChange("country", e.target.value)}
              required
            />

            <Input
              label="Head Coach / Master Name"
              placeholder="e.g. Master Rajesh Sharma"
              value={newHeadCoach}
              onChange={(e) => handleNewAcademyChange("head_coach", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
