const request = require('supertest');
const app = require('../app');
const User = require('../src/models/User');
require('./setup');

describe('Authentication & Roles', () => {
  it('should register a new buyer safely', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        role: 'buyer',
        email: 'buyer@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'Test Buyer'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should register a new seller safely', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        role: 'seller',
        email: 'seller@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        storeName: 'Test Store',
        ownerName: 'Test Owner',
        phoneNumber: '+1234567890',
        businessAddress: '123 Test St'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should prevent buyer from accessing seller routes', async () => {
    // Register buyer
    const buyerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        role: 'buyer',
        email: 'buyer2@test.com',
        password: 'password',
        confirmPassword: 'password',
        name: 'Buyer 2'
      });
    const token = buyerRes.body.token;

    // Access seller dashboard
    const res = await request(app)
      .get('/api/seller/dashboard')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(403);
  });
});