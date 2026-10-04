// ==============================================================================
// REGISTRATION STEPPER COMPONENT
// Professional institutional progress indicator for multi-step intake wizards
// ==============================================================================

"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: number;
  title: string;
  shortTitle?: string;
  description?: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  const currentStepObj = steps.find((s) => s.id === currentStep) || steps[0];

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Mobile Stepper (Condensed) */}
      <div className="md:hidden flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
            Step {currentStep} of {steps.length}
          </span>
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            {currentStepObj.title}
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                step.id === currentStep
                  ? "w-6 bg-blue-600"
                  : step.id < currentStep
                  ? "w-3 bg-emerald-500"
                  : "w-2 bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-5 left-8 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
          style={{
            width: `${((Math.min(currentStep, steps.length) - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <div
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              className={cn(
                "flex flex-col items-center relative z-10 group select-none",
                isClickable ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200 border-2",
                  isCompleted
                    ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                    : isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-white border-slate-300 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : `0${step.id}`}
              </div>

              <div className="text-center mt-2.5 space-y-0.5 max-w-[120px]">
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider block",
                    isActive
                      ? "text-blue-600 font-extrabold"
                      : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                  )}
                >
                  {step.shortTitle || step.title}
                </span>
                {step.description && (
                  <span className="text-[10px] text-slate-500 hidden lg:block leading-tight">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
