import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ReportsController } from './reports.controller.js';

@Module({ imports: [PrismaModule], controllers: [ReportsController] })
export class ReportsModule {}
