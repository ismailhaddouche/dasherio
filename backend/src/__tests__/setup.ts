process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/disherio_test';
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
