import type { WorkflowRunRecord, WorkflowAssertionResult } from '@/core/db/types';

/**
 * Export workflow test run assertions and metrics as a formatted JSON download.
 */
export function exportTestReportToJson(run: WorkflowRunRecord): void {
  const exportData = {
    reportType: 'mqtt-studio-workflow-test-report',
    version: '1.0',
    generatedAt: new Date().toISOString(),
    workflowId: run.workflowId,
    workflowName: run.workflowName,
    runId: run.id,
    status: run.status,
    triggerType: run.triggerType || 'manual',
    triggerTopic: run.triggerTopic,
    startedAt: new Date(run.startedAt).toISOString(),
    completedAt: run.completedAt ? new Date(run.completedAt).toISOString() : undefined,
    durationMs: run.completedAt ? run.completedAt - run.startedAt : 0,
    assertionSummary: run.assertionSummary || {
      total: run.assertions?.length || 0,
      passed: run.assertions?.filter((a) => a.passed).length || 0,
      failed: run.assertions?.filter((a) => !a.passed).length || 0,
    },
    assertions: run.assertions || [],
    stepsLog: run.stepsLog || [],
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanName = (run.workflowName || 'workflow')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `test-report-${cleanName}-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a standalone, self-contained modern HTML test report.
 */
export function exportTestReportToHtml(run: WorkflowRunRecord): void {
  const summary = run.assertionSummary || {
    total: run.assertions?.length || 0,
    passed: run.assertions?.filter((a) => a.passed).length || 0,
    failed: run.assertions?.filter((a) => !a.passed).length || 0,
  };

  const durationMs = run.completedAt ? run.completedAt - run.startedAt : 0;
  const isAllPassed = summary.total > 0 ? summary.failed === 0 : run.status === 'completed';
  const passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 100;

  const assertionsRows = (run.assertions || [])
    .map(
      (a: WorkflowAssertionResult, idx: number) => `
      <tr class="${a.passed ? 'passed-row' : 'failed-row'}">
        <td class="num">${idx + 1}</td>
        <td class="badge-col">
          <span class="badge ${a.passed ? 'badge-pass' : 'badge-fail'}">
            ${a.passed ? 'PASS' : 'FAIL'}
          </span>
        </td>
        <td class="step-name"><strong>${escapeHtml(a.stepName)}</strong><br/><small class="text-muted">${escapeHtml(a.stepType)}</small></td>
        <td class="msg-col">${escapeHtml(a.message)}</td>
        <td class="code-col"><code>${escapeHtml(a.expected || '-')}</code></td>
        <td class="code-col"><code>${escapeHtml(a.actual || '-')}</code></td>
        <td class="time-col">${new Date(a.timestamp).toLocaleTimeString()}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report - ${escapeHtml(run.workflowName)}</title>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #18181b;
      --border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --primary: #06b6d4;
      --pass: #10b981;
      --fail: #f43f5e;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    body {
      margin: 0;
      padding: 32px 20px;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.5;
    }
    .container {
      max-width: 1080px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    h1 {
      margin: 0 0 6px 0;
      font-size: 24px;
      color: #fff;
    }
    .meta {
      font-size: 13px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
    .overall-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .overall-pass { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid #059669; }
    .overall-fail { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid #e11d48; }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 20px;
    }
    .metric-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 800;
      font-family: var(--font-mono);
    }
    .text-pass { color: #34d399; }
    .text-fail { color: #fb7185; }
    .text-primary { color: #22d3ee; }

    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    th {
      background: rgba(39, 39, 42, 0.5);
      padding: 12px 16px;
      color: var(--text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(39, 39, 42, 0.4);
    }
    tr:last-child td { border-bottom: none; }
    .passed-row:hover { background: rgba(16, 185, 129, 0.04); }
    .failed-row { background: rgba(244, 63, 94, 0.05); }
    .failed-row:hover { background: rgba(244, 63, 94, 0.08); }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      font-family: var(--font-mono);
    }
    .badge-pass { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-fail { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    code {
      font-family: var(--font-mono);
      background: rgba(0,0,0,0.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Test Report: ${escapeHtml(run.workflowName)}</h1>
        <div class="meta">
          Run ID: ${escapeHtml(run.id)} &bull; Trigger: ${escapeHtml(run.triggerType || 'manual')}
          ${run.triggerTopic ? ` &bull; Topic: ${escapeHtml(run.triggerTopic)}` : ''}
        </div>
      </div>
      <div>
        <span class="overall-badge ${isAllPassed ? 'overall-pass' : 'overall-fail'}">
          ${isAllPassed ? '✔ All Tests Passed' : '✖ Tests Failed'}
        </span>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Pass Rate</div>
        <div class="metric-value ${isAllPassed ? 'text-pass' : 'text-fail'}">${passRate}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Assertions</div>
        <div class="metric-value text-primary">${summary.total}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Passed</div>
        <div class="metric-value text-pass">${summary.passed}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Failed</div>
        <div class="metric-value text-fail">${summary.failed}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Duration</div>
        <div class="metric-value">${durationMs} ms</div>
      </div>
    </div>

    <h2 style="font-size: 16px; margin-bottom: 12px; font-weight: 600;">Assertion Verification Details</h2>
    <div class="table-container">
      ${
        run.assertions && run.assertions.length > 0
          ? `
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 80px;">Status</th>
              <th>Step Name</th>
              <th>Condition / Message</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${assertionsRows}
          </tbody>
        </table>
      `
          : `
        <div style="padding: 32px; text-align: center; color: var(--text-muted); font-size: 13px;">
          No validation assertions were recorded during this execution run.
        </div>
      `
      }
    </div>

    <div class="footer">
      Generated automatically by <strong>MQTT Developer Studio</strong> &bull; ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const cleanName = (run.workflowName || 'workflow')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `test-report-${cleanName}-${dateStr}.html`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
