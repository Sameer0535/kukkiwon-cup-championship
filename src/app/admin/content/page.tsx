// ==============================================================================
// ADMIN CONTENT & TERMS MANAGER (Requirements 17 & 18)
// Site settings and auditable terms & conditions versioning
// ==============================================================================

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Shield, CheckCircle2 } from "lucide-react";

export default function AdminContentPage() {
  const termsVersions = [
    {
      version: "v1.0",
      title: "Official Kukkiwon Cup 2026 Participation & Accreditation Agreement",
      publishedAt: "02 Oct 2026",
      acceptedCount: "Active version",
      isActive: true,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-sky-400" />
          <span>Website Content & Terms Versioning</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Content model and auditable legal agreement versions. When a participant accepts terms, the exact version number is permanently recorded.
        </p>
      </div>

      {/* Terms & Conditions Versioning */}
      <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span>Legal Terms & Conditions Versions</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ensure compliance traceability across regulatory revisions.
            </p>
          </div>

          <Button variant="secondary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Publish New Version</span>
          </Button>
        </div>

        <div className="space-y-3">
          {termsVersions.map((t) => (
            <div
              key={t.version}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    {t.version}
                  </span>
                  <Badge variant="success">Current Active Version</Badge>
                </div>
                <div className="font-semibold text-slate-200">{t.title}</div>
                <div className="text-[11px] text-slate-500">Published: {t.publishedAt}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs text-sky-400">
                  Inspect Content
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Site Settings Preview Form */}
      <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Championship Metadata & Headline Settings
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <Input
            label="Tournament Title"
            defaultValue="Kukkiwon Cup Championship 2026"
            disabled
          />
          <Input
            label="Subtitle"
            defaultValue="Presented by Kukkiwon North India & Kyorix Sports Technology"
            disabled
          />
          <Input
            label="Support Email"
            defaultValue="contact@kukkiwoncup.org"
            disabled
          />
          <Input
            label="Support Phone"
            defaultValue="+91 98765 43210"
            disabled
          />
        </div>
      </Card>
    </div>
  );
}
