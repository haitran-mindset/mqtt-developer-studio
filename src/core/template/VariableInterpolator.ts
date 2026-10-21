import { v4 as uuidv4 } from 'uuid';
import type { VariableContext } from './types';

export class VariableInterpolator {
  private sequenceCounter: number = 0;

  resetSequence(initialValue: number = 0): void {
    this.sequenceCounter = initialValue;
  }

  getCurrentSequence(): number {
    return this.sequenceCounter;
  }

  interpolate(template: string, context: VariableContext = {}): string {
    if (!template) return '';

    // Regex to match {{ ... }}
    const tokenRegex = /\{\{\s*([a-zA-Z0-9_]+(?:\s*\([^)]*\))?)\s*\}\}/g;

    return template.replace(tokenRegex, (match, rawExpr) => {
      const expr = rawExpr.trim();

      // Built-in token: timestamp
      if (expr === 'timestamp') {
        return Math.floor(Date.now() / 1000).toString();
      }

      // Built-in token: timestamp_ms
      if (expr === 'timestamp_ms') {
        return Date.now().toString();
      }

      // Built-in token: iso_date
      if (expr === 'iso_date') {
        return new Date().toISOString();
      }

      // Built-in token: uuid
      if (expr === 'uuid') {
        return uuidv4();
      }

      // Built-in token: sequence
      if (expr === 'sequence') {
        this.sequenceCounter += 1;
        return this.sequenceCounter.toString();
      }

      // Built-in token: client_id
      if (expr === 'client_id') {
        return context.client_id !== undefined ? String(context.client_id) : '';
      }

      // Built-in function: random_int or random_int(min, max)
      if (expr.startsWith('random_int')) {
        const paramMatch = expr.match(/^random_int(?:\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\))?$/);
        let min = 0;
        let max = 100;
        if (paramMatch && paramMatch[1] !== undefined && paramMatch[2] !== undefined) {
          min = parseInt(paramMatch[1], 10);
          max = parseInt(paramMatch[2], 10);
        }
        if (min > max) {
          const temp = min;
          min = max;
          max = temp;
        }
        const val = Math.floor(Math.random() * (max - min + 1)) + min;
        return val.toString();
      }

      // Check user context variables
      if (Object.prototype.hasOwnProperty.call(context, expr)) {
        const val = context[expr];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
          return JSON.stringify(val);
        }
        return String(val);
      }

      // If unresolved, leave as match or return empty?
      // Leaving unchanged allows template variables intended for downstream or unchanged strings
      return match;
    });
  }
}

export const variableInterpolator = new VariableInterpolator();
