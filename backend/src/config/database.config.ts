import { registerAs } from '@nestjs/config';

export const getMongoConnectionString = (): string => {
  // รองรับ Railway และ cloud providers ต่างๆ
  // Railway มักใช้ MONGO_URL, MONGODB_URL, หรือ DATABASE_URL
  const mongoUri =
    process.env.MONGO_URL ||
    process.env.MONGODB_URL ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

  if (mongoUri) {
    return mongoUri;
  }

  // Fallback สำหรับ local development
  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'inventory';
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  if (username && password) {
    return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
  }

  // ถ้ามี database name ให้ใส่ ถ้าไม่มีให้ใช้แค่ host:port
  if (database) {
    return `mongodb://${host}:${port}/${database}`;
  }

  return `mongodb://${host}:${port}/`;
};

export default registerAs('database', () => ({
  uri: getMongoConnectionString(),
  host: process.env.MONGODB_HOST || 'localhost',
  port: parseInt(process.env.MONGODB_PORT || '27017', 10),
  database: process.env.MONGODB_DATABASE || 'inventory',
  username: process.env.MONGODB_USERNAME,
  password: process.env.MONGODB_PASSWORD,
}));
