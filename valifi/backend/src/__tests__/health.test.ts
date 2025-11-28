import express from 'express';
import supertest from 'supertest';
import { registerRoutes } from '../routes';
import http from 'http';

let app: express.Express;
let server: http.Server;

beforeAll((done) => {
  console.log('--- beforeAll ---');
  app = express();
  app.use(express.json());
  registerRoutes(app);
  server = http.createServer(app);
  server.listen(done);
});

afterAll((done) => {
  console.log('--- afterAll ---');
  server.close(done);
});

describe('Health Check', () => {
  it('should return 200 and a healthy status', (done) => {
    supertest(server)
      .get('/api/health')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.status).toBe('healthy');
        done();
      });
  });
});
