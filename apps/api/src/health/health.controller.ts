import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('/healthz')
  liveness() {
    return { ok: true };
  }

  @Get('/ready')
  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }
}
