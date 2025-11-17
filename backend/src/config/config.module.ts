import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // ทำให้ใช้ได้ทั่วทั้งแอป
      envFilePath: '../.env', // อ่านไฟล์ .env จาก root ของโปรเจค
      expandVariables: true, // รองรับการ expand variables
    }),
  ],
})
export class ConfigModule {}
