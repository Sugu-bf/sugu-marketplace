import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface StepperStep {
  id: string;
  label: string;
  /** Optional sub-label (e.g. a date like "20 Fév, 10:30") */
  subLabel?: string | null;
}

interface StepperProps {
  steps: StepperStep[];
  currentStepId: string;
  completedStepIds: string[];
  className?: string;
}

/**
 * Horizontal step indicator — reusable across checkout, onboarding, order tracking, multi-step forms.
 * Server Component — purely presentational.
 *
 * @example
 * <Stepper
 *   steps={[{ id: "cart", label: "Panier" }, { id: "address", label: "Adresse" }]}
 *   currentStepId="address"
 *   completedStepIds={["cart"]}
 * />
 */
function Stepper({ steps, currentStepId, completedStepIds, className }: StepperProps) {
  return (
    <nav aria-label="Étapes du processus" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedStepIds.includes(step.id);
          const isCurrent = step.id === currentStepId;
          const isUpcoming = !isCompleted && !isCurrent;
          const isLastStep = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", !isLastStep && "flex-1")}
            >
              <div className="flex flex-col items-center gap-1.5">
                {/* Step circle */}
                <div
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                    isCompleted &&
                      "bg-primary text-white shadow-sm",
                    isCurrent &&
                      "border-2 border-primary bg-white text-primary shadow-md shadow-primary/20 ring-4 ring-primary/10",
                    isUpcoming &&
                      "border-2 border-border bg-muted text-muted-foreground"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-200 whitespace-nowrap",
                    isCompleted && "text-primary",
                    isCurrent && "text-foreground font-semibold",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>

                {/* Sub-label (date) */}
                {step.subLabel && (
                  <span
                    className={cn(
                      "text-[10px] whitespace-nowrap -mt-0.5",
                      isCurrent
                        ? "text-foreground/70 font-medium"
                        : "text-muted-foreground/70"
                    )}
                  >
                    {step.subLabel}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLastStep && (
                <div className="relative mx-2 flex-1 self-start mt-[18px] sm:mx-3">
                  <div className="h-0.5 w-full rounded-full bg-border" />
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 h-0.5 rounded-full bg-primary transition-all duration-500",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Stepper };
