import { Controller, Get, Query, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}
  private user(req: any) { return (req as any).userId ?? 'dev-user'; }

  @Get('category-totals')
  async categoryTotals(@Req() req: any, @Query('start') start?: string, @Query('end') end?: string) {
    const userId = this.user(req);
    const startDate = start ? new Date(start) : new Date('1970-01-01');
    const endDate = end ? new Date(end) : new Date('2999-12-31');

    const categories = await this.prisma.category.findMany({ where: { userId } });
    const rows = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, expenseDate: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    });
    const map = new Map(rows.map((r) => [r.categoryId, Number(r._sum.amount || 0)]));
    return categories.map((c) => ({ categoryId: c.id, name: c.name, color: c.color, total: map.get(c.id) || 0 }));
  }
}
