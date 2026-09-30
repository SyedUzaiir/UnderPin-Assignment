const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API Routes', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('returns 200 and empty list when no tasks exist', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual([]);
    });

    test('returns 200 and list of all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');
    });

    test('filters tasks by status query parameter', async () => {
      taskService.create({ title: 'Task Todo', status: 'todo' });
      taskService.create({ title: 'Task Done', status: 'done' });

      const res = await request(app).get('/tasks?status=todo');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Task Todo');
    });

    test('paginates tasks with page and default limit when limit is omitted', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks?page=1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('paginates tasks with page and limit query parameters', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');
    });

  });

  describe('POST /tasks', () => {
    test('creates a task and returns 201 with task body', async () => {
      const payload = {
        title: 'New Integration Task',
        description: 'Testing POST endpoint',
        priority: 'high',
      };

      const res = await request(app)
        .post('/tasks')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(payload.title);
      expect(res.body.description).toBe(payload.description);
      expect(res.body.priority).toBe('high');
      expect(res.body.status).toBe('todo');
      expect(res.body.assignee).toBeNull();
    });

    test('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when title is empty string', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when title is whitespace-only string', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: '    ' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when status is invalid', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Task', status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when priority is invalid', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Task', priority: 'extreme' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when dueDate is invalid ISO string', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Task', dueDate: 'invalid-date' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('updates an existing task and returns 200', async () => {
      const task = taskService.create({ title: 'Original Task' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'Updated Title', status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('in_progress');
    });

    test('returns 404 for nonexistent task ID', async () => {
      const res = await request(app)
        .put('/tasks/non-existent-id')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });

    test('returns 400 when update payload contains invalid values', async () => {
      const task = taskService.create({ title: 'Task' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('deletes an existing task and returns 204 with empty body', async () => {
      const task = taskService.create({ title: 'Delete me' });

      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);
      expect(res.text).toBe('');

      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test('returns 404 for nonexistent task ID', async () => {
      const res = await request(app).delete('/tasks/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('marks task as completed and returns 200 with updated task', async () => {
      const task = taskService.create({ title: 'Complete me', priority: 'high' });

      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).not.toBeNull();
      expect(res.body.priority).toBe('high');
    });

    test('returns 404 for nonexistent task ID', async () => {
      const res = await request(app).patch('/tasks/non-existent-id/complete');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });
  });

  describe('GET /tasks/stats', () => {
    test('returns 200 and stats summary', async () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      taskService.create({ title: 'Task 3', status: 'done' });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        todo: 1,
        in_progress: 1,
        done: 1,
        overdue: 0,
      });
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    test('assigns task to a user and returns 200 with updated task', async () => {
      const task = taskService.create({ title: 'Task to assign' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Jane Doe' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
      expect(res.body.assignee).toBe('Jane Doe');
    });

    test('allows reassigning an already-assigned task', async () => {
      const task = taskService.create({ title: 'Task to reassign' });
      taskService.assignTask(task.id, 'Jane Doe');

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'John Smith' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('John Smith');
    });

    test('returns 400 when assignee is missing from request body', async () => {
      const task = taskService.create({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when assignee is empty string', async () => {
      const task = taskService.create({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when assignee is whitespace-only string', async () => {
      const task = taskService.create({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '   ' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when assignee is non-string type (number)', async () => {
      const task = taskService.create({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 12345 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 404 for nonexistent task ID', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'Jane Doe' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });
  });
});
