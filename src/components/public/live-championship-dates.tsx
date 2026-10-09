"use client";

// ==============================================================================
// LIVE DYNAMIC CHAMPIONSHIP DATES HYDRATOR
// Ensures dates updated on the admin portal reflect immediately on the homepage
// ==============================================================================

import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ChampionshipImportantDateDTO } from "@/types/cms";

interface HeroDatesData {
  startDate?: string;
  endDate?: string;
  registrationClose?: string;
  venue?: string;
}

export function LiveHeroDatesStrip({
  initialData,
}: {
  initialData: HeroDatesData;
}) {
  const [data, setData] = useState<HeroDatesData>(initialData);

  useEffect(() => {
    // 1. Instant hydration from client localStorage cache
    try {
      const raw = localStorage.getItem("kukkiwon_championship_dates");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.startDate || parsed.registrationClose) {
          setData((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}

    // 2. Listen to cross-tab and in-tab live mutation events
    const handleUpdate = (e: any) => {
      try {
        const detail = e.detail;
        if (detail) {
          const champ = detail.championship || detail;
          if (champ && (champ.startDate || champ.registrationClose)) {
            setData((prev) => ({ ...prev, ...champ }));
          }
        }
      } catch {}
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "kukkiwon_championship_dates" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setData((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
    };

    window.addEventListener("kukkiwon_dates_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);

    // 3. Background fresh fetch
    fetch("/api/public/championship?package=true", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.championship) {
          const c = json.data.championship;
          const fresh = {
            startDate: c.startDate,
            endDate: c.endDate,
            registrationClose: c.registrationClose,
            venue: c.venue,
          };
          setData((prev) => ({ ...prev, ...fresh }));
          try {
            localStorage.setItem("kukkiwon_championship_dates", JSON.stringify(fresh));
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("kukkiwon_dates_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-y border-slate-200 py-4 max-w-2xl mx-auto text-left bg-slate-50/60 rounded-xl px-4">
      <div className="flex items-start gap-2.5">
        <Calendar className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Dates
          </span>
          <span className="text-xs font-bold text-slate-900">
            {formatDate(data.startDate)} – {formatDate(data.endDate)}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <MapPin className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Venue
          </span>
          <span className="text-xs font-bold text-slate-900 truncate block max-w-[180px]">
            {data.venue}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Deadline
          </span>
          <span className="text-xs font-bold text-slate-900">
            {formatDate(data.registrationClose)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LiveImportantDatesCards({
  initialDates,
  fallbackChampionship,
}: {
  initialDates: ChampionshipImportantDateDTO[];
  fallbackChampionship: {
    registrationOpen?: string;
    registrationClose?: string;
    startDate?: string;
    endDate?: string;
    venue?: string;
    city?: string;
  };
}) {
  const [dates, setDates] = useState<ChampionshipImportantDateDTO[]>(initialDates);
  const [champ, setChamp] = useState(fallbackChampionship);

  useEffect(() => {
    // 1. Instant hydration from client localStorage cache
    try {
      const rawDates = localStorage.getItem("kukkiwon_important_dates");
      if (rawDates) {
        const parsed = JSON.parse(rawDates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDates(parsed);
        }
      }
      const rawChamp = localStorage.getItem("kukkiwon_championship_dates");
      if (rawChamp) {
        const parsed = JSON.parse(rawChamp);
        setChamp((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}

    // 2. Listen to live update events
    const handleUpdate = (e: any) => {
      try {
        const detail = e.detail;
        if (detail) {
          if (Array.isArray(detail.dates) && detail.dates.length > 0) {
            setDates(detail.dates);
          }
          const c = detail.championship || detail;
          if (c && (c.startDate || c.registrationClose)) {
            setChamp((prev) => ({ ...prev, ...c }));
          }
        }
      } catch {}
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "kukkiwon_important_dates" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDates(parsed);
        } catch {}
      }
      if (e.key === "kukkiwon_championship_dates" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setChamp((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
    };

    window.addEventListener("kukkiwon_dates_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);

    // 3. Fetch public dates with no-cache guarantee
    fetch("/api/public/dates", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (Array.isArray(json?.data) && json.data.length > 0) {
          setDates(json.data);
          try {
            localStorage.setItem("kukkiwon_important_dates", JSON.stringify(json.data));
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("kukkiwon_dates_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {dates && dates.length > 0 ? (
        dates.map((d) => (
          <div
            key={d.id}
            className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5 hover:border-blue-400 hover:shadow-xs transition-colors"
          >
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">
              {d.title}
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {formatDate(d.date)}
            </span>
            <span className="text-[11px] text-slate-500 block line-clamp-2">
              {d.description || "Official tournament milestone"}
            </span>
          </div>
        ))
      ) : (
        <>
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">
              Registration Opens
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {formatDate(champ.registrationOpen)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Digital entries portal goes live
            </span>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider block">
              Registration Closes
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {formatDate(champ.registrationClose)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Standard entry deadline
            </span>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">
              Late Registration
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {champ.startDate ? formatDate(champ.startDate) : "N/A"}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Late surcharge applies
            </span>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">
              Championship Dates
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {formatDate(champ.startDate)} – {formatDate(champ.endDate)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {champ.venue}, {champ.city}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
