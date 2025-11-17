import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

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
    origin: configService.get<string>('app.corsOrigin') || '*', // อนุญาตทุก origin หรือระบุเฉพาะ origin ที่ต้องการ
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // อนุญาตให้ส่ง cookies และ credentials
  });

  const port = configService.get<number>('app.port') || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
