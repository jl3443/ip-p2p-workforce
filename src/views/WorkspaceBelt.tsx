/**
 * The belt run — the seven specialist agents working one procure-to-pay
 * transaction end to end, rebuilt on the OTM interaction model.
 *
 * Three columns: the agent steps (left, a gated timeline), the source files the
 * active agent read (center, each clickable into a full-document modal), and the
 * AI workspace (right, wide: streamed reasoning · the produced SAP artifact ·
 * the inline supplier email round-trip · the approve / pending / escalate /
 * reject decision). Approving hands the output to the next agent and advances
 * the run; the others mark the output without dead-ending the demo.
 */

import * as React from "react";
import { beltFlow } from "@/data/flows";
import { useApp } from "@/state";
import type { AgentOutputStatus } from "@/state";
import { agentsById } from "@/data/agents";
import { runSteps, type SourceArtifact } from "@/data/runSteps";
import { WorkspaceTopbar } from "@/components/workspace/WorkspaceTopbar";
import { RunStepsRail } from "@/components/workspace/RunStepsRail";
import { SourceFilesPanel } from "@/components/workspace/SourceFilesPanel";
import { AiWorkspacePanel } from "@/components/workspace/AiWorkspacePanel";
import { SourceArtifactModal } from "@/components/workspace/SourceArtifactModal";
import { Toast } from "@/components/workspace/Toast";

const LAST = runSteps.length - 1;

type Decision = Exclude<AgentOutputStatus, "none">;
type ToastState = { id: number; title: string; body: string } | null;

export function WorkspaceBelt() {
  const { flowProgress, setFlowProgress, agentOutputs, setAgentOutput } = useApp();
  const activeStep = flowProgress.belt.activeStep;

  const [selectedStep, setSelectedStep] = React.useState(Math.min(activeStep, LAST));
  const [openSource, setOpenSource] = React.useState<SourceArtifact | null>(null);
  const [replies, setReplies] = React.useState<Record<number, boolean>>({});
  const [toast, setToast] = React.useState<ToastState>(null);

  const step = runSteps[selectedStep];
  const finished = agentOutputs["invoice"] === "approved";
  const replied = !!replies[selectedStep];

  const sources =
    step.email && replied ? [...step.sources, step.email.reply.source] : step.sources;

  const fireToast = (title: string, body: string) =>
    setToast((t) => ({ id: (t?.id ?? 0) + 1, title, body }));

  const onDecision = (status: Decision) => {
    setAgentOutput(step.id, status);
    if (status !== "approved") return;

    const agent = agentsById[step.id];
    if (selectedStep < LAST) {
      const next = selectedStep + 1;
      setFlowProgress("belt", { activeStep: Math.max(activeStep, next) });
      setSelectedStep(next);
      fireToast("Output approved", `${agent.name} handed off to ${agentsById[runSteps[next].id].menuLabel}.`);
    } else {
      setFlowProgress("belt", { activeStep: runSteps.length, approved: true });
      fireToast("Run complete", "Invoice released to AP · the audit envelope is closed.");
    }
  };

  const onReplyReceived = () => {
    if (!step.email) return;
    setReplies((r) => ({ ...r, [selectedStep]: true }));
    fireToast(step.email.toastTitle, step.email.toastBody);
  };

  return (
    <div className="h-screen flex flex-col bg-[color-mix(in_srgb,var(--surface-mint)_14%,var(--surface-fog))]">
      <WorkspaceTopbar
        title={beltFlow.contextTitle}
        sub={beltFlow.contextSub}
        statusPill={finished ? "Paid · audit closed" : "Agent run · in review"}
        statusKind={finished ? "ready" : "progress"}
      />

      <div className="flex-1 min-h-0 px-5 py-4">
        <div className="h-full grid grid-cols-[300px_minmax(0,1fr)] gap-3">
          <div className="min-h-0 overflow-y-auto flex flex-col gap-3">
            <RunStepsRail
              steps={runSteps}
              activeStep={activeStep}
              selectedStep={selectedStep}
              outputs={agentOutputs}
              onSelect={setSelectedStep}
            />
            <SourceFilesPanel sources={sources} onOpen={setOpenSource} />
          </div>

          <div className="min-h-0 overflow-y-auto">
            <AiWorkspacePanel
              key={selectedStep}
              step={step}
              status={agentOutputs[step.id]}
              replied={replied}
              isLast={selectedStep === LAST}
              onReplyReceived={onReplyReceived}
              onDecision={onDecision}
            />
          </div>
        </div>
      </div>

      <SourceArtifactModal source={openSource} onClose={() => setOpenSource(null)} />

      {toast && (
        <Toast
          key={toast.id}
          show
          title={toast.title}
          body={toast.body}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
