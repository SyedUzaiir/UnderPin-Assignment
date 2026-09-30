const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    test('creates a task with defaults when minimal fields provided', () => {
      const task = taskService.create({ title: 'New Task' });
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(typeof task.id).toBe('string');
      expect(task.title).toBe('New Task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.assignee).toBeNull();
      expect(task.createdAt).toBeDefined();
    });

    test('creates a task with custom status, priority, description, and dueDate', () => {
      const dueDate = '2026-12-31T00:00:00.000Z';
      const task = taskService.create({
        title: 'Custom Task',
        description: 'Detailed description',
        status: 'in_progress',
        priority: 'high',
        dueDate,
      });
      expect(task.title).toBe('Custom Task');
      expect(task.description).toBe('Detailed description');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate);
    });
  });

  describe('getAll', () => {
    test('returns empty array when no tasks exist', () => {
      expect(taskService.getAll()).toEqual([]);
    });

    test('returns array of all created tasks', () => {
      const task1 = taskService.create({ title: 'Task 1' });
      const task2 = taskService.create({ title: 'Task 2' });
      const all = taskService.getAll();
      expect(all).toHaveLength(2);
      expect(all).toEqual([task1, task2]);
    });

    test('returns a shallow copy of tasks array so internal state is not mutated', () => {
      taskService.create({ title: 'Task 1' });
      const copy = taskService.getAll();
      copy.pop();
      expect(taskService.getAll()).toHaveLength(1);
    });
  });

  describe('findById', () => {
    test('returns task matching id', () => {
      const task = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(task.id);
      expect(found).toEqual(task);
    });

    test('returns undefined for nonexistent id', () => {
      const found = taskService.findById('non-existent-uuid');
      expect(found).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    test('filters tasks by exact status match', () => {
      const task1 = taskService.create({ title: 'Task 1', status: 'todo' });
      const task2 = taskService.create({ title: 'Task 2', status: 'in_progress' });
      const task3 = taskService.create({ title: 'Task 3', status: 'done' });

      const todoTasks = taskService.getByStatus('todo');
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].id).toBe(task1.id);

      const inProgressTasks = taskService.getByStatus('in_progress');
      expect(inProgressTasks).toHaveLength(1);
      expect(inProgressTasks[0].id).toBe(task2.id);

      const doneTasks = taskService.getByStatus('done');
      expect(doneTasks).toHaveLength(1);
      expect(doneTasks[0].id).toBe(task3.id);
    });

    test('returns empty array when no tasks match status', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      expect(taskService.getByStatus('done')).toEqual([]);
    });
  });

  describe('getPaginated', () => {
    test('returns correct page 1 items given 1-based indexing', () => {
      const task1 = taskService.create({ title: 'Task 1' });
      const task2 = taskService.create({ title: 'Task 2' });
      const task3 = taskService.create({ title: 'Task 3' });

      const page1 = taskService.getPaginated(1, 2);
      expect(page1).toHaveLength(2);
      expect(page1[0].id).toBe(task1.id);
      expect(page1[1].id).toBe(task2.id);
    });

    test('returns correct page 2 items given 1-based indexing', () => {
      const task1 = taskService.create({ title: 'Task 1' });
      const task2 = taskService.create({ title: 'Task 2' });
      const task3 = taskService.create({ title: 'Task 3' });

      const page2 = taskService.getPaginated(2, 2);
      expect(page2).toHaveLength(1);
      expect(page2[0].id).toBe(task3.id);
    });

    test('returns empty array when page is out of bounds', () => {
      taskService.create({ title: 'Task 1' });
      const pageOutOfBounds = taskService.getPaginated(5, 10);
      expect(pageOutOfBounds).toEqual([]);
    });
  });

  describe('getStats', () => {
    test('returns correct counts by status and overdue count', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day in future

      taskService.create({ title: 'Todo 1', status: 'todo' });
      taskService.create({ title: 'Overdue Todo', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'In Progress', status: 'in_progress', dueDate: futureDate });
      taskService.create({ title: 'Done Task Overdue Date', status: 'done', dueDate: pastDate });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(1); // completed tasks should not count as overdue
    });
  });

  describe('update', () => {
    test('updates allowed task fields and returns updated task', () => {
      const task = taskService.create({ title: 'Original' });
      const updated = taskService.update(task.id, {
        title: 'Updated',
        description: 'New desc',
        status: 'in_progress',
        priority: 'high',
      });
      expect(updated).toBeDefined();
      expect(updated.title).toBe('Updated');
      expect(updated.description).toBe('New desc');
      expect(updated.status).toBe('in_progress');
      expect(updated.priority).toBe('high');
    });

    test('returns null when updating nonexistent task id', () => {
      const updated = taskService.update('non-existent-id', { title: 'Updated' });
      expect(updated).toBeNull();
    });
  });

  describe('remove', () => {
    test('removes existing task and returns true', () => {
      const task = taskService.create({ title: 'To Delete' });
      const result = taskService.remove(task.id);
      expect(result).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
      expect(taskService.getAll()).toHaveLength(0);
    });

    test('returns false when deleting nonexistent task id', () => {
      const result = taskService.remove('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('completeTask', () => {
    test('marks task status as done and sets completedAt timestamp', () => {
      const task = taskService.create({ title: 'Finish work', priority: 'high' });
      const completed = taskService.completeTask(task.id);

      expect(completed).toBeDefined();
      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeDefined();
      expect(completed.priority).toBe('high'); // Priority should be preserved
    });

    test('returns null when completing nonexistent task id', () => {
      const completed = taskService.completeTask('non-existent-id');
      expect(completed).toBeNull();
    });
  });

  describe('assignTask', () => {
    test('assigns assignee to task and returns updated task', () => {
      const task = taskService.create({ title: 'Task to assign' });
      const assigned = taskService.assignTask(task.id, 'Alice');

      expect(assigned).toBeDefined();
      expect(assigned.assignee).toBe('Alice');
      expect(taskService.findById(task.id).assignee).toBe('Alice');
    });

    test('allows reassigning task to a new assignee', () => {
      const task = taskService.create({ title: 'Task to reassign' });
      taskService.assignTask(task.id, 'Alice');
      const reassigned = taskService.assignTask(task.id, 'Bob');

      expect(reassigned.assignee).toBe('Bob');
      expect(taskService.findById(task.id).assignee).toBe('Bob');
    });

    test('trims whitespace from assignee name', () => {
      const task = taskService.create({ title: 'Task trim' });
      const assigned = taskService.assignTask(task.id, '   Charlie   ');

      expect(assigned.assignee).toBe('Charlie');
    });

    test('returns null when assigning nonexistent task id', () => {
      const result = taskService.assignTask('non-existent-id', 'Alice');
      expect(result).toBeNull();
    });
  });
});
