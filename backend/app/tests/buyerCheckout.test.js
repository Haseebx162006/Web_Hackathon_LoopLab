const request = require('supertest');
const app = require('../app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
require('./setup');

let buyerToken;
let sellerId;
let productId;

describe('Buyer Checkout Flow', () => {
  beforeAll(async () => {
    // 1. Create Seller
    const sellerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        role: 'seller',
        email: 'seller@test.com',
        password: 'password',
        confirmPassword: 'password',
        storeName: 'Test Store',
        ownerName: 'Owner',
        phoneNumber: '+11111111111',
        businessAddress: 'Address'
      });
    const sellerToken = sellerRes.body.token;

    // 2. Create Product as Seller
    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        productName: 'Test Product',
        description: 'Desc',
        category: 'Test',
        price: 100,
        skuCode: 'TEST-SKU-1',
        stockQuantity: 10
      });
    productId = productRes.body.data._id;
    sellerId = sellerRes.body.user._id;

    // 3. Create Buyer
    const buyerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        role: 'buyer',
        email: 'buyer@test.com',
        password: 'password',
        confirmPassword: 'password',
        name: 'Buyer Name'
      });
    buyerToken = buyerRes.body.token;
  });

  it('should fetch public product details', async () => {
    const res = await request(app).get(`/api/public/products/${productId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.product.productName).toEqual('Test Product');
  });

  it('should add item to cart', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId, quantity: 2 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.items[0].product.toString()).toEqual(productId);
    expect(res.body.data.items[0].quantity).toEqual(2);
  });

  it('should successfully checkout processing cart and generating orders', async () => {
    const res = await request(app)
      .post('/api/checkout/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        shippingAddress: {
          street: '123 Test',
          city: 'Test City',
          state: 'TEST',
          country: 'TestLand',
          zipCode: '12345'
        },
        paymentMethod: 'cod'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.message).toEqual('Order(s) placed successfully');
    expect(res.body.data.orders.length).toEqual(1);
    
    // Check if cart is clear
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(cartRes.body.data.cart.items.length).toEqual(0);
  });

  it('should allow buyer to retrieve their orders', async () => {
    const res = await request(app)
      .get('/api/buyer/orders')
      .set('Authorization', `Bearer ${buyerToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toEqual(1);
    expect(res.body.data[0].status).toEqual('pending');
    expect(res.body.data[0].totalAmount).toEqual(200); // 2 * 100
  });
});