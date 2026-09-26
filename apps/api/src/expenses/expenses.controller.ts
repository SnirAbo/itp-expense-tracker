import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { z } from 'zod';
import { ExpensesService } from './expenses.service.js';

const createSchema = z.object({
  amount: z.number().nonnegative().multipleOf(0.01),
  expenseDate: z.string(),
  categoryId: z.string().optional().nullable(),
  note: z.string().max(1024).optional(),
});

@Controller('expenses')
export class ExpensesController {
  constructor(private svc: ExpensesService) {}
  private user(req: any) { return (req as any).userId ?? 'dev-user'; }

  @Post()
  create(@Req() req: any, @Body() body: unknown) {
    const userId = this.user(req);
    const data = createSchema.parse(body);
    return this.svc.create(userId, data);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: unknown) {
    const userId = this.user(req);
    const data = createSchema.partial().parse(body);
    return this.svc.update(userId, id, data);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = this.user(req);
    await this.svc.remove(userId, id);
    return { ok: true };
  }

  @Get()
  list(
    @Req() req: any,
    @Query('start_date') start?: string,
    @Query('end_date') end?: string,
    @Query('category_id') categoryId?: string,
    @Query('q') q?: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    const userId = this.user(req);
    return this.svc.list(userId, { start, end, categoryId, q, limit: Number(limit), offset: Number(offset) });
  }
}
