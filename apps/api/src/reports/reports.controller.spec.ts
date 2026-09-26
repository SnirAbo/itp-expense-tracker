import { ReportsController } from './reports.controller.js';

describe('ReportsController', () => {
  let prisma: any;
  let controller: ReportsController;

  beforeEach(() => {
    prisma = {
      category: { findMany: jest.fn() },
      expense: { groupBy: jest.fn() },
    };
    controller = new ReportsController(prisma);
  });

  describe('categoryTotals', () => {
    it('defaults to the "dev-user" id and an all-time range when nothing is provided', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      prisma.expense.groupBy.mockResolvedValue([]);

      await controller.categoryTotals({});

      expect(prisma.category.findMany).toHaveBeenCalledWith({ where: { userId: 'dev-user' } });
      expect(prisma.expense.groupBy).toHaveBeenCalledWith({
        by: ['categoryId'],
        where: {
          userId: 'dev-user',
          expenseDate: { gte: new Date('1970-01-01'), lte: new Date('2999-12-31') },
        },
        _sum: { amount: true },
      });
    });

    it('scopes queries to the authenticated user and requested date range', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      prisma.expense.groupBy.mockResolvedValue([]);

      await controller.categoryTotals({ userId: 'user-1' }, '2024-01-01', '2024-01-31');

      expect(prisma.category.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.expense.groupBy).toHaveBeenCalledWith({
        by: ['categoryId'],
        where: {
          userId: 'user-1',
          expenseDate: { gte: new Date('2024-01-01'), lte: new Date('2024-01-31') },
        },
        _sum: { amount: true },
      });
    });

    it('maps summed totals onto each category and defaults missing totals to 0', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Food', color: '#fff' },
        { id: 'cat-2', name: 'Transport', color: '#000' },
      ]);
      prisma.expense.groupBy.mockResolvedValue([{ categoryId: 'cat-1', _sum: { amount: 150.5 } }]);

      const result = await controller.categoryTotals({ userId: 'user-1' });

      expect(result).toEqual([
        { categoryId: 'cat-1', name: 'Food', color: '#fff', total: 150.5 },
        { categoryId: 'cat-2', name: 'Transport', color: '#000', total: 0 },
      ]);
    });

    it('treats a null summed amount as 0', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 'cat-1', name: 'Food', color: '#fff' }]);
      prisma.expense.groupBy.mockResolvedValue([{ categoryId: 'cat-1', _sum: { amount: null } }]);

      const result = await controller.categoryTotals({ userId: 'user-1' });

      expect(result).toEqual([{ categoryId: 'cat-1', name: 'Food', color: '#fff', total: 0 }]);
    });
  });
});
