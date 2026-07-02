import test from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import { createGoalSchema } from '../src/modules/goals/goals.schema';
import { errorHandler } from '../src/middleware/error.middleware';
import { Errors } from '../src/lib/errors';

test('createGoalSchema rejects malformed goal payloads early', () => {
  const parsed = createGoalSchema.safeParse({
    title: 'A',
    target_amount: -1,
    category: 'spaceship',
    deadline: '02-07-2026',
  });

  assert.equal(parsed.success, false);
  const fields = parsed.success ? [] : parsed.error.errors.map((error) => error.path.join('.'));
  assert.ok(fields.includes('title'));
  assert.ok(fields.includes('target_amount'));
  assert.ok(fields.includes('category'));
  assert.ok(fields.includes('deadline'));
});

test('errorHandler returns AppError details instead of generic 500', () => {
  const response = mockResponse();
  errorHandler(
    Errors.provider('Provider broke', { providerCode: '400' }),
    { requestId: 'req_123' } as never,
    response as never,
    (() => undefined) as never,
  );

  assert.equal(response.statusCode, 502);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: 'PROVIDER_ERROR',
      message: 'Provider broke',
      details: { providerCode: '400' },
    },
  });
});

test('errorHandler formats Zod validation failures consistently', () => {
  const response = mockResponse();
  errorHandler(
    new ZodError([{ code: 'custom', path: ['email'], message: 'Invalid email' }]),
    { requestId: 'req_123' } as never,
    response as never,
    (() => undefined) as never,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.deepEqual(response.body.error.details, [{ field: 'email', message: 'Invalid email' }]);
});

function mockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}
