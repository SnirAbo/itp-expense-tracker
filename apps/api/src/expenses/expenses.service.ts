import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, data: { amount: number; expenseDate: string; categoryId?: string | null; note?: string }) {
    return this.prisma.expense.create({ data: { ...data, userId } });
  }

  async update(userId: string, id: string, data: Partial<{ amount: number; expenseDate: string; categoryId?: string | null; note?: string }>) {
    const exists = await this.prisma.expense.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException();
    return this.prisma.expense.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const exists = await this.prisma.expense.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException();
    await this.prisma.expense.delete({ where: { id } });
  }

  async list(
    userId: string,
    opts: { start?: string; end?: string; categoryId?: string; q?: string; limit: number; offset: number },
  ) {
    const where: any = { userId };
    if (opts.categoryId) where.categoryId = opts.categoryId;
    if (opts.start || opts.end) {
      where.expenseDate = {} as any;
      if (opts.start) where.expenseDate.gte = new Date(opts.start);
      if (opts.end) where.expenseDate.lte = new Date(opts.end);
    }
    if (opts.q) where.note = { contains: opts.q, mode: 'insensitive' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { expenseDate: 'desc' } }),
      this.prisma.expense.count({ where }),
    ]);
    return { items, total, nextOffset: opts.offset + items.length };
  }
}
