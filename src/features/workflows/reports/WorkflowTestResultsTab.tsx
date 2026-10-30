import React from 'react';
import type { WorkflowRunRecord } from '@/core/db/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  FileText,
  FileCode,
  Download,
  Clock,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import {
  exportTestReportToHtml,
  exportTestReportToJson,
} from './testReportExporter';

interface WorkflowTestResultsTabProps {
  lastRun: WorkflowRunRecord | null;
}

export const WorkflowTestResultsTab: React.FC<WorkflowTestResultsTabProps> = ({
  lastRun,
}) => {
  if (!lastRun) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 font-sans text-xs">
        <Layers className="h-6 w-6 text-zinc-600 mb-2 opacity-50" />
        <p className="font-medium text-zinc-400">No test execution recorded yet</p>
        <p className="text-[11px] text-zinc-600 mt-1 max-w-sm">
          Run the workflow or arm Listen Mode with validation steps (<code className="text-zinc-400">validate_payload</code>, <code className="text-zinc-400">validate_schema</code>, or custom script assertions) to generate test results.
        </p>
      </div>
    );
  }

  const assertions = lastRun.assertions || [];
  const summary = lastRun.assertionSummary || {
    total: assertions.length,
    passed: assertions.filter((a) => a.passed).length,
    failed: assertions.filter((a) => !a.passed).length,
  };

  const isAllPassed = summary.total > 0 ? summary.failed === 0 : lastRun.status === 'completed';
  const durationMs = lastRun.completedAt
    ? lastRun.completedAt - lastRun.startedAt
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 space-y-3 font-sans text-xs text-zinc-200">
      {/* Top Action Bar & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <Badge
            variant={isAllPassed ? 'emerald' : 'rose'}
            className="text-xs px-2.5 py-0.5 font-bold tracking-wide flex items-center gap-1.5 shadow-sm"
          >
            {isAllPassed ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>PASSED</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>FAILED ({summary.failed})</span>
              </>
            )}
          </Badge>

          <span className="text-zinc-400 text-xs font-medium">
            Run ID: <span className="font-mono text-zinc-300">{lastRun.id.slice(0, 8)}</span>
          </span>

          <span className="text-zinc-500 text-[11px] font-mono flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {durationMs}ms
          </span>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportTestReportToHtml(lastRun)}
            className="h-7 text-xs flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 border-zinc-800 bg-zinc-900/60"
            title="Download Standalone HTML Test Report"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Export HTML</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => exportTestReportToJson(lastRun)}
            className="h-7 text-xs flex items-center gap-1.5 text-zinc-300 hover:text-white border-zinc-800 bg-zinc-900/60"
            title="Download Raw JSON Test Report"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
            Total Assertions
          </span>
          <span className="text-lg font-bold font-mono text-zinc-100">
            {summary.total}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
            Passed Checks
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {summary.passed}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
            Failed Checks
          </span>
          <span className="text-lg font-bold font-mono text-rose-400">
            {summary.failed}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
            Pass Rate
          </span>
          <span
            className={`text-lg font-bold font-mono ${
              isAllPassed ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.total > 0
              ? `${Math.round((summary.passed / summary.total) * 100)}%`
              : '100%'}
          </span>
        </div>
      </div>

      {/* Assertion Table */}
      <div className="flex-1 overflow-y-auto border border-zinc-800/80 rounded-lg bg-zinc-950/80">
        {assertions.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No step assertions were configured in this workflow.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-900/80 sticky top-0 border-b border-zinc-800 text-[11px] text-zinc-400">
              <tr>
                <th className="py-2 px-3 w-10 font-medium">#</th>
                <th className="py-2 px-3 w-20 font-medium">Status</th>
                <th className="py-2 px-3 w-40 font-medium">Step</th>
                <th className="py-2 px-3 font-medium">Verification / Message</th>
                <th className="py-2 px-3 font-medium">Expected</th>
                <th className="py-2 px-3 font-medium">Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
              {assertions.map((a, idx) => (
                <tr
                  key={`${a.stepId}-${idx}`}
                  className={`hover:bg-zinc-900/40 transition-colors ${
                    a.passed ? '' : 'bg-rose-950/20'
                  }`}
                >
                  <td className="py-2 px-3 text-zinc-500">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        a.passed ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {a.passed ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>PASS</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          <span>FAIL</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-sans font-semibold text-zinc-200 truncate">
                    {a.stepName}
                  </td>
                  <td className="py-2 px-3 text-zinc-300 font-sans break-words">
                    {a.message}
                  </td>
                  <td className="py-2 px-3 text-zinc-400 truncate max-w-[120px]">
                    {a.expected || '-'}
                  </td>
                  <td className="py-2 px-3 text-zinc-300 truncate max-w-[120px]">
                    {a.actual || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
