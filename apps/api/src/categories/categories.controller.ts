import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { z } from 'zod';
import { CategoriesService } from './categories.service.js';

const upsertSchema = z.object({ name: z.string().min(1).max(64), color: z.string().optional() });

@Controller('categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  private requireUser(req: any): string {
    // In real app, use auth guard; here assume userId from cookie access token parsed upstream
    return (req as any).userId ?? 'dev-user';
  }

  @Get()
  async list(@Req() req: any) {
    const userId = this.requireUser(req);
    return this.svc.list(userId);
  }

  @Post()
  async create(@Req() req: any, @Body() body: unknown) {
    const userId = this.requireUser(req);
    const data = upsertSchema.parse(body);
    return this.svc.create(userId, data);
  }

  @Patch(':id')
  async patch(@Req() req: any, @Param('id') id: string, @Body() body: unknown) {
    const userId = this.requireUser(req);
    const data = upsertSchema.partial().parse(body);
    return this.svc.update(userId, id, data);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = this.requireUser(req);
    await this.svc.remove(userId, id);
    return { ok: true };
  }
}
