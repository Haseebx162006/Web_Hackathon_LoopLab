const request = require('supertest');
const app = require('../app');
require('./setup');

let sellerToken;

describe('Seller Dashboard & Products', () => {
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        role: 'seller',
        email: 'topseller@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        storeName: 'Top Store',
        ownerName: 'Top Owner',
        phoneNumber: '+1999999999',
        businessAddress: '123 Main St',
        bankDetails: 'Bank'
      });
    sellerToken = res.body.token;
  });

  it('should get seller dashboard', async () => {
    const res = await request(app)
      .get('/api/seller/dashboard')
      .set('Authorization', `Bearer ${sellerToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data).toHaveProperty('totalSales');
  });

  it('should list products empty', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toEqual(0);
  });
});