import type { StepExecutorContext, StepExecutionResult, WorkflowStepType, WorkflowAssertionResult } from './types';
import { MQTTTopicMatcher } from '../mqtt/MQTTTopicMatcher';

export class StepExecutors {
  static async execute(stepType: WorkflowStepType, ctx: StepExecutorContext): Promise<StepExecutionResult> {
    switch (stepType) {
      case 'start_label':
        return StepExecutors.executeStartLabel(ctx);
      case 'mqtt_trigger':
        return StepExecutors.executeMqttTrigger(ctx);
      case 'publish':
        return StepExecutors.executePublish(ctx);
      case 'subscribe':
        return StepExecutors.executeSubscribe(ctx);
      case 'unsubscribe':
        return StepExecutors.executeUnsubscribe(ctx);
      case 'delay':
        return StepExecutors.executeDelay(ctx);
      case 'wait_for_message':
        return StepExecutors.executeWaitForMessage(ctx);
      case 'validate_payload':
        return StepExecutors.executeValidatePayload(ctx);
      case 'validate_schema':
        return StepExecutors.executeValidateSchema(ctx);
      case 'run_script':
        return StepExecutors.executeRunScript(ctx);
      case 'set_variable':
        return StepExecutors.executeSetVariable(ctx);
      case 'extract_variable':
        return StepExecutors.executeExtractVariable(ctx);
      case 'condition':
        return StepExecutors.executeCondition(ctx);
      case 'loop':
        return StepExecutors.executeLoop(ctx);
      case 'log':
        return StepExecutors.executeLog(ctx);
      case 'stop':
        return StepExecutors.executeStop(ctx);
      case 'fail':
        return StepExecutors.executeFail(ctx);
      case 'switch_connection':
        return StepExecutors.executeSwitchConnection(ctx);
      default:
        return { success: false, error: `Unknown step type: ${stepType}` };
    }
  }

  // 1. Publish Message
  private static async executePublish(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const topic = ctx.interpolate(ctx.stepConfig.topic || '');
    const rawPayload = ctx.interpolate(ctx.stepConfig.payload || '');
    const qos = ctx.stepConfig.qos ?? 0;
    const retain = !!ctx.stepConfig.retain;

    if (!topic) {
      return { success: false, error: 'Publish step requires a non-empty topic.' };
    }

    await ctx.connectionManager.publish(ctx.context.activeConnectionId, topic, rawPayload, {
      qos,
      retain,
    });

    return {
      success: true,
      output: { topic, payload: rawPayload, qos, retain },
    };
  }

  // 2. Subscribe Topic
  private static async executeSubscribe(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const topic = ctx.interpolate(ctx.stepConfig.topic || '');
    const qos = ctx.stepConfig.qos ?? 0;

    if (!topic) {
      return { success: false, error: 'Subscribe step requires a non-empty topic.' };
    }

    const adapter = ctx.connectionManager.getConnection(ctx.context.activeConnectionId);
    if (!adapter) {
      return { success: false, error: `Connection ${ctx.context.activeConnectionId} not found.` };
    }

    await adapter.subscribe(topic, qos);
    return { success: true, output: { topic, qos } };
  }

  // 3. Unsubscribe Topic
  private static async executeUnsubscribe(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const topic = ctx.interpolate(ctx.stepConfig.topic || '');
    if (!topic) {
      return { success: false, error: 'Unsubscribe step requires a topic.' };
    }

    const adapter = ctx.connectionManager.getConnection(ctx.context.activeConnectionId);
    if (adapter) {
      await adapter.unsubscribe(topic);
    }
    return { success: true, output: { topic } };
  }

  // 4. Delay / Wait
  private static async executeDelay(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const delayMs = Number(ctx.stepConfig.delayMs) || 1000;
    const interval = 100;
    let elapsed = 0;

    while (elapsed < delayMs) {
      if (ctx.isAborted()) {
        return { success: false, error: 'Workflow was aborted during delay.' };
      }
      await new Promise((r) => setTimeout(r, Math.min(interval, delayMs - elapsed)));
      elapsed += interval;
    }

    return { success: true, output: { delayMs } };
  }

  // 5. Wait for Message (with correlation & timeout)
  private static async executeWaitForMessage(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const topicFilter = ctx.interpolate(ctx.stepConfig.topic || '');
    const timeoutMs = Number(ctx.stepConfig.timeoutMs) || 5000;
    const correlationField = ctx.stepConfig.correlationField;
    const correlationValue = ctx.stepConfig.correlationValue ? ctx.interpolate(ctx.stepConfig.correlationValue) : undefined;

    const adapter = ctx.connectionManager.getConnection(ctx.context.activeConnectionId);
    if (!adapter) {
      return { success: false, error: `Connection not found: ${ctx.context.activeConnectionId}` };
    }

    return new Promise((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsub();
          resolve({
            success: false,
            error: `Timeout (${timeoutMs}ms) waiting for message on topic ${topicFilter}`,
          });
        }
      }, timeoutMs);

      const unsub = adapter.onMessage((msg: any) => {
        if (resolved) return;

        // Check topic match
        if (!MQTTTopicMatcher.matches(topicFilter, msg.topic)) {
          return;
        }

        let parsedPayload: any = msg.payload;
        try {
          parsedPayload = JSON.parse(msg.payload);
        } catch {
          // Keep string
        }

        // Check correlation criteria if specified
        if (correlationField && correlationValue !== undefined) {
          let fieldVal = parsedPayload;
          if (typeof parsedPayload === 'object' && parsedPayload !== null) {
            fieldVal = parsedPayload[correlationField];
          }
          if (String(fieldVal) !== String(correlationValue)) {
            return; // Correlation mismatch, keep waiting
          }
        }

        // Matched!
        resolved = true;
        clearTimeout(timer);
        unsub();

        ctx.context.lastReceivedPayload = parsedPayload;
        ctx.context.lastReceivedTopic = msg.topic;

        resolve({
          success: true,
          output: { topic: msg.topic, payload: parsedPayload },
        });
      });
    });
  }

  // 6. Validate Payload
  private static async executeValidatePayload(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const field = ctx.stepConfig.assertionField || '';
    const operator = ctx.stepConfig.operator || 'equals';
    const expectedRaw = ctx.interpolate(String(ctx.stepConfig.expectedValue ?? ''));

    // Retrieve actual value from context.variables or lastReceivedPayload
    let actualValue: any = undefined;
    if (ctx.context.variables && field in ctx.context.variables) {
      actualValue = ctx.context.variables[field];
    } else if (ctx.context.lastReceivedPayload && typeof ctx.context.lastReceivedPayload === 'object') {
      actualValue = ctx.context.lastReceivedPayload[field];
    } else {
      actualValue = ctx.context.lastReceivedPayload;
    }

    let passed = false;
    const actualStr = String(actualValue ?? '');

    switch (operator) {
      case 'equals':
        passed = actualStr === expectedRaw;
        break;
      case 'not_equals':
        passed = actualStr !== expectedRaw;
        break;
      case 'contains':
        passed = actualStr.includes(expectedRaw);
        break;
      case 'regex':
        passed = new RegExp(expectedRaw).test(actualStr);
        break;
      case 'gt':
        passed = Number(actualValue) > Number(expectedRaw);
        break;
      case 'lt':
        passed = Number(actualValue) < Number(expectedRaw);
        break;
      case 'is_null':
        passed = actualValue === null || actualValue === undefined;
        break;
      case 'not_null':
        passed = actualValue !== null && actualValue !== undefined;
        break;
      default:
        passed = actualStr === expectedRaw;
    }

    const assertion: WorkflowAssertionResult = {
      stepId: ctx.nodeId,
      stepName: ctx.stepName,
      stepType: 'validate_payload',
      passed,
      expected: `${operator} '${expectedRaw}'`,
      actual: actualStr,
      message: passed
        ? `Field '${field}' (${actualStr}) satisfied ${operator} '${expectedRaw}'`
        : `Field '${field}' (${actualStr}) did not satisfy ${operator} '${expectedRaw}'`,
      timestamp: Date.now(),
    };

    if (!passed) {
      return {
        success: false,
        error: `Assertion failed: field '${field}' (${actualStr}) did not satisfy ${operator} '${expectedRaw}'`,
        assertions: [assertion],
        output: { field, actualValue, operator, expected: expectedRaw, passed: false },
      };
    }

    return {
      success: true,
      output: { field, actualValue, operator, expected: expectedRaw, passed: true },
      assertions: [assertion],
    };
  }

  // 7. Set Variable
  private static async executeSetVariable(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const varName = ctx.stepConfig.varName;
    const rawVal = ctx.stepConfig.varValue ?? '';
    const resolvedVal = ctx.interpolate(String(rawVal));

    if (!varName) {
      return { success: false, error: 'Set Variable requires variable name.' };
    }

    ctx.context.variables[varName] = resolvedVal;
    return { success: true, output: { [varName]: resolvedVal } };
  }

  // 8. Extract Variable
  private static async executeExtractVariable(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const varName = ctx.stepConfig.varName;
    const jsonPath = (ctx.stepConfig.jsonPath || '').replace(/^\$\.?/, ''); // remove leading $.

    if (!varName) {
      return { success: false, error: 'Extract Variable requires variable name.' };
    }

    let source = ctx.context.lastReceivedPayload;
    if (typeof source === 'string') {
      try {
        source = JSON.parse(source);
      } catch {
        // String
      }
    }

    let extracted: any = source;
    if (jsonPath) {
      const parts = jsonPath.split('.');
      for (const part of parts) {
        if (extracted && typeof extracted === 'object') {
          extracted = extracted[part];
        } else {
          extracted = undefined;
          break;
        }
      }
    }

    ctx.context.variables[varName] = extracted;
    return { success: true, output: { [varName]: extracted } };
  }

  // 9. Conditional Branch (IF / ELSE)
  private static async executeCondition(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const rawExpr = ctx.stepConfig.expression || 'true';
    const expr = ctx.interpolate(rawExpr);

    let isTrue = false;
    try {
      // Evaluate within context scope
      const scope = { ...ctx.context.variables, ...ctx.context };
      const func = new Function(...Object.keys(scope), `return Boolean(${expr});`);
      isTrue = func(...Object.values(scope));
    } catch {
      // Fallback simple comparison
      isTrue = Boolean(expr && expr !== 'false' && expr !== '0');
    }

    return {
      success: true,
      nextHandle: isTrue ? 'true' : 'false',
      output: { evaluated: isTrue, expression: expr },
    };
  }

  // 10. Repeat / Loop
  private static async executeLoop(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const loopKey = `__loop_${ctx.nodeId}`;
    const maxIterations = Number(ctx.stepConfig.count) || 1;
    const current = (ctx.context[loopKey] || 0) + 1;
    ctx.context[loopKey] = current;

    if (current <= maxIterations) {
      return {
        success: true,
        nextHandle: 'loop_body',
        output: { iteration: current, max: maxIterations },
      };
    } else {
      ctx.context[loopKey] = 0; // reset
      return {
        success: true,
        nextHandle: 'loop_end',
        output: { completed: true },
      };
    }
  }

  // 11. Log Message
  private static async executeLog(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const msg = ctx.interpolate(ctx.stepConfig.message || '');
    return { success: true, output: { message: msg } };
  }

  // 12. Stop Workflow
  private static async executeStop(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const reason = ctx.interpolate(ctx.stepConfig.reason || 'Normal completion');
    return { success: true, output: { stopped: true, reason } };
  }

  // 13. Fail Workflow
  private static async executeFail(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const reason = ctx.interpolate(ctx.stepConfig.reason || 'Workflow marked failed');
    return { success: false, error: reason };
  }

  // 14. Switch Connection
  private static async executeSwitchConnection(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const targetId = ctx.stepConfig.connectionId;
    if (!targetId) {
      return { success: false, error: 'Switch Connection requires target connectionId' };
    }
    ctx.context.activeConnectionId = targetId;
    return { success: true, output: { activeConnectionId: targetId } };
  }

  // 15. JSON Schema Validator
  private static async executeValidateSchema(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const targetVar = ctx.stepConfig.targetVariable;
    let targetData: any = undefined;

    if (targetVar) {
      targetData = ctx.context.variables?.[targetVar];
    } else if (ctx.context.lastReceivedPayload !== undefined) {
      targetData = ctx.context.lastReceivedPayload;
    } else if (ctx.context.variables?.payload !== undefined) {
      targetData = ctx.context.variables.payload;
    }

    if (targetData === undefined) {
      return {
        success: false,
        error: 'JSON Schema Validation failed: No payload or variable found to validate.',
      };
    }

    // Parse JSON string if needed
    if (typeof targetData === 'string') {
      try {
        targetData = JSON.parse(targetData);
      } catch (err: any) {
        return {
          success: false,
          error: `JSON Schema Validation failed: Target payload is not valid JSON (${err.message})`,
          output: { raw: targetData, error: err.message },
        };
      }
    }

    // Parse Schema
    let rawSchema = ctx.stepConfig.schema;
    if (!rawSchema) {
      return {
        success: false,
        error: 'JSON Schema Validator node requires a schema definition.',
      };
    }

    let schemaObj: any;
    if (typeof rawSchema === 'string') {
      try {
        schemaObj = JSON.parse(ctx.interpolate(rawSchema));
      } catch (err: any) {
        return {
          success: false,
          error: `Invalid JSON Schema format: ${err.message}`,
        };
      }
    } else {
      schemaObj = rawSchema;
    }

    // Validate
    const errors = StepExecutors.validateJsonAgainstSchema(targetData, schemaObj);

    const passed = errors.length === 0;
    const assertion: WorkflowAssertionResult = {
      stepId: ctx.nodeId,
      stepName: ctx.stepName,
      stepType: 'validate_schema',
      passed,
      expected: 'Valid JSON matching schema',
      actual: passed ? 'Valid' : `${errors.length} schema error(s)`,
      message: passed
        ? 'Schema validation passed successfully'
        : `Schema validation failed (${errors.length} errors): ${errors.slice(0, 2).join('; ')}`,
      timestamp: Date.now(),
    };

    if (errors.length > 0) {
      return {
        success: false,
        error: `Schema validation failed (${errors.length} errors):\n- ${errors.join('\n- ')}`,
        output: {
          valid: false,
          errors,
          payload: targetData,
        },
        assertions: [assertion],
      };
    }

    return {
      success: true,
      output: {
        valid: true,
        errors: [],
        payload: targetData,
      },
      assertions: [assertion],
    };
  }

  /**
   * Recursive JSON Schema validator supporting type, required, properties, minimum, maximum, enum, and pattern.
   */
  private static validateJsonAgainstSchema(data: any, schema: any, path: string = '$'): string[] {
    const errors: string[] = [];
    if (!schema || typeof schema !== 'object') return errors;

    // 1. Type validation
    if (schema.type) {
      const expectedType = schema.type;
      const actualType = Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data;

      if (expectedType === 'integer') {
        if (typeof data !== 'number' || !Number.isInteger(data)) {
          errors.push(`${path}: expected integer, received ${actualType} (${data})`);
        }
      } else if (expectedType === 'number') {
        if (typeof data !== 'number' || Number.isNaN(data)) {
          errors.push(`${path}: expected number, received ${actualType}`);
        }
      } else if (expectedType !== actualType) {
        errors.push(`${path}: expected type "${expectedType}", received "${actualType}"`);
      }
    }

    // 2. Enum validation
    if (Array.isArray(schema.enum)) {
      if (!schema.enum.includes(data)) {
        errors.push(`${path}: value ${JSON.stringify(data)} is not in allowed enum [${schema.enum.map((e: any) => JSON.stringify(e)).join(', ')}]`);
      }
    }

    // 3. Number constraints: minimum, maximum
    if (typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push(`${path}: value ${data} is less than minimum ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push(`${path}: value ${data} exceeds maximum ${schema.maximum}`);
      }
    }

    // 4. String constraints: minLength, maxLength, pattern
    if (typeof data === 'string') {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        errors.push(`${path}: length ${data.length} is shorter than minLength ${schema.minLength}`);
      }
      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        errors.push(`${path}: length ${data.length} exceeds maxLength ${schema.maxLength}`);
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push(`${path}: string does not match regex pattern "${schema.pattern}"`);
        }
      }
    }

    // 5. Object validation: required & properties
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (Array.isArray(schema.required)) {
        for (const reqKey of schema.required) {
          if (data[reqKey] === undefined || data[reqKey] === null) {
            errors.push(`${path}.${reqKey}: missing required property "${reqKey}"`);
          }
        }
      }

      if (schema.properties && typeof schema.properties === 'object') {
        for (const [propKey, propSchema] of Object.entries(schema.properties)) {
          if (data[propKey] !== undefined) {
            const subErrors = StepExecutors.validateJsonAgainstSchema(data[propKey], propSchema, `${path}.${propKey}`);
            errors.push(...subErrors);
          }
        }
      }
    }

    // 6. Array validation: items
    if (Array.isArray(data) && schema.items && typeof schema.items === 'object') {
      data.forEach((item, index) => {
        const itemErrors = StepExecutors.validateJsonAgainstSchema(item, schema.items, `${path}[${index}]`);
        errors.push(...itemErrors);
      });
    }

    return errors;
  }

  // 0. Start Flow Label (Entry point)
  private static async executeStartLabel(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const label = ctx.stepConfig.label || ctx.stepName || 'Start Flow';
    return {
      success: true,
      output: {
        flowLabel: label,
        color: ctx.stepConfig.color,
        startedAt: Date.now(),
      },
    };
  }

  // 17. MQTT Event Trigger (Entry point triggered by incoming message)
  private static async executeMqttTrigger(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const topic = ctx.stepConfig.topic || '';
    const variableName = ctx.stepConfig.variableName;
    const payload = ctx.context.lastReceivedPayload;

    if (variableName && payload !== undefined) {
      ctx.context.variables[variableName] = payload;
    }

    return {
      success: true,
      output: {
        triggerTopic: ctx.context.lastReceivedTopic || topic,
        payload,
        triggeredAt: Date.now(),
      },
    };
  }

  // 18. Custom JavaScript Script Execution
  private static async executeRunScript(ctx: StepExecutorContext): Promise<StepExecutionResult> {
    const code = ctx.stepConfig.code || '';
    const timeoutMs = Number(ctx.stepConfig.timeoutMs) || 5000;

    if (!code.trim()) {
      return { success: true, output: 'No script code provided' };
    }

    const payload = ctx.context.lastReceivedPayload;
    const context = ctx.context;
    const variables = ctx.context.variables;
    const topic = ctx.context.lastReceivedTopic || '';
    const qos = ctx.stepConfig.qos ?? 0;

    const assertions: WorkflowAssertionResult[] = [];

    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction('payload', 'context', 'variables', 'topic', 'qos', code);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Script execution timed out after ${timeoutMs}ms`)), timeoutMs);
      });

      const rawResult = await Promise.race([
        fn(payload, context, variables, topic, qos),
        timeoutPromise,
      ]);

      // If returned value is an object, merge into variables
      if (rawResult && typeof rawResult === 'object' && !Array.isArray(rawResult)) {
        // Check for custom assertions
        if ('assert' in rawResult) {
          const passed = Boolean(rawResult.assert);
          assertions.push({
            stepId: ctx.nodeId,
            stepName: ctx.stepName,
            stepType: 'run_script',
            passed,
            message: String(rawResult.message || (passed ? 'Custom script assertion passed' : 'Custom script assertion failed')),
            expected: 'true',
            actual: String(passed),
            timestamp: Date.now(),
          });
        }

        Object.assign(ctx.context.variables, rawResult);
      }

      return {
        success: true,
        output: rawResult,
        assertions: assertions.length > 0 ? assertions : undefined,
      };
    } catch (err: any) {
      const errMsg = err.message || String(err);
      return {
        success: false,
        error: `Script error: ${errMsg}`,
        assertions: [
          {
            stepId: ctx.nodeId,
            stepName: ctx.stepName,
            stepType: 'run_script',
            passed: false,
            message: `Script error: ${errMsg}`,
            timestamp: Date.now(),
          },
        ],
      };
    }
  }
}
