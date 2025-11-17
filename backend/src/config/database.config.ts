import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: getMongoConnectionString(),
}));

export const getMongoConnectionString = (): string => {
  // รองรับ Railway และ cloud providers ต่างๆ
  // Railway มักใช้ MONGO_URL, MONGODB_URL, หรือ DATABASE_URL
  const mongoUri =
    process.env.MONGODB_URL || 'mongodb://localhost:27017/inventory';
  return mongoUri;
};
