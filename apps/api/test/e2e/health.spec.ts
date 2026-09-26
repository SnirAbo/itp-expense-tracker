import request from 'supertest';

const BASE = process.env.API_BASE_URL || 'http://localhost:3000';

describe('health', () => {
  it('GET /healthz ok', async () => {
    const res = await request(BASE).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
