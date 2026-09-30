const { validateCreateTask, validateUpdateTask, validateAssignTask } = require('../src/utils/validators');

describe('validators', () => {
  describe('validateCreateTask', () => {
    test('returns null for valid minimal input', () => {
      const result = validateCreateTask({ title: 'Task Title' });
      expect(result).toBeNull();
    });

    test('returns null for valid full input', () => {
      const result = validateCreateTask({
        title: 'Task Title',
        description: 'Task description',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-12-31T23:59:59.000Z',
      });
      expect(result).toBeNull();
    });

    test('returns error for missing title', () => {
      const result = validateCreateTask({});
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error for empty string title', () => {
      const result = validateCreateTask({ title: '' });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error for whitespace-only string title', () => {
      const result = validateCreateTask({ title: '   ' });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error for non-string title (number)', () => {
      const result = validateCreateTask({ title: 12345 });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error for non-string title (boolean)', () => {
      const result = validateCreateTask({ title: true });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error for non-string title (object)', () => {
      const result = validateCreateTask({ title: {} });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('returns error for invalid status value', () => {
      const result = validateCreateTask({ title: 'Test', status: 'invalid_status' });
      expect(result).toBe('status must be one of: todo, in_progress, done');
    });

    test('returns error for invalid priority value', () => {
      const result = validateCreateTask({ title: 'Test', priority: 'urgent' });
      expect(result).toBe('priority must be one of: low, medium, high');
    });

    test('returns error for invalid ISO dueDate', () => {
      const result = validateCreateTask({ title: 'Test', dueDate: 'invalid-date' });
      expect(result).toBe('dueDate must be a valid ISO date string');
    });
  });

  describe('validateUpdateTask', () => {
    test('returns null for empty body (no fields updated)', () => {
      const result = validateUpdateTask({});
      expect(result).toBeNull();
    });

    test('returns null for valid title update', () => {
      const result = validateUpdateTask({ title: 'New Title' });
      expect(result).toBeNull();
    });

    test('returns error for empty string title', () => {
      const result = validateUpdateTask({ title: '' });
      expect(result).toBe('title must be a non-empty string');
    });

    test('returns error for whitespace-only string title', () => {
      const result = validateUpdateTask({ title: '   ' });
      expect(result).toBe('title must be a non-empty string');
    });

    test('returns error for non-string title', () => {
      const result = validateUpdateTask({ title: 999 });
      expect(result).toBe('title must be a non-empty string');
    });

    test('returns error for invalid status', () => {
      const result = validateUpdateTask({ status: 'completed' });
      expect(result).toBe('status must be one of: todo, in_progress, done');
    });

    test('returns error for invalid priority', () => {
      const result = validateUpdateTask({ priority: 'super' });
      expect(result).toBe('priority must be one of: low, medium, high');
    });

    test('returns error for invalid dueDate', () => {
      const result = validateUpdateTask({ dueDate: 'bad-date' });
      expect(result).toBe('dueDate must be a valid ISO date string');
    });
  });

  describe('validateAssignTask', () => {
    test('returns null for valid string assignee', () => {
      const result = validateAssignTask({ assignee: 'Alice' });
      expect(result).toBeNull();
    });

    test('returns error for missing body or non-object body', () => {
      expect(validateAssignTask(null)).toBe('request body must be an object');
      expect(validateAssignTask(undefined)).toBe('request body must be an object');
    });

    test('returns error for missing assignee property', () => {
      const result = validateAssignTask({});
      expect(result).toBe('assignee is required');
    });

    test('returns error for empty string assignee', () => {
      const result = validateAssignTask({ assignee: '' });
      expect(result).toBe('assignee must be a non-empty string');
    });

    test('returns error for whitespace-only assignee', () => {
      const result = validateAssignTask({ assignee: '   ' });
      expect(result).toBe('assignee must be a non-empty string');
    });

    test('returns error for non-string assignee (number)', () => {
      const result = validateAssignTask({ assignee: 123 });
      expect(result).toBe('assignee must be a string');
    });

    test('returns error for non-string assignee (null)', () => {
      const result = validateAssignTask({ assignee: null });
      expect(result).toBe('assignee must be a string');
    });

    test('returns error for non-string assignee (boolean)', () => {
      const result = validateAssignTask({ assignee: false });
      expect(result).toBe('assignee must be a string');
    });
  });
});
