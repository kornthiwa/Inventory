import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ตั้งค่า ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ลบ properties ที่ไม่มีใน DTO
      forbidNonWhitelisted: true, // ปฏิเสธ request ที่มี properties ที่ไม่มีใน DTO
      transform: true, // แปลง type อัตโนมัติ
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ตั้งค่า CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*', // อนุญาตทุก origin หรือระบุเฉพาะ origin ที่ต้องการ
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // อนุญาตให้ส่ง cookies และ credentials
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
