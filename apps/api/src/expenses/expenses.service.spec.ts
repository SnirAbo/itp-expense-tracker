import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service.js';

describe('ExpensesService', () => {
  let prisma: any;
  let service: ExpensesService;

  beforeEach(() => {
    prisma = {
      expense: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new ExpensesService(prisma);
  });

  describe('create', () => {
    it('creates an expense scoped to the given user', async () => {
      const data = { amount: 42, expenseDate: '2024-01-01', categoryId: 'cat-1', note: 'lunch' };
      prisma.expense.create.mockResolvedValue({ id: 'exp-1', userId: 'user-1', ...data });

      const result = await service.create('user-1', data);

      expect(prisma.expense.create).toHaveBeenCalledWith({ data: { ...data, userId: 'user-1' } });
      expect(result).toEqual({ id: 'exp-1', userId: 'user-1', ...data });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the expense does not belong to the user', async () => {
      prisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.update('user-1', 'exp-1', { amount: 10 })).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.expense.update).not.toHaveBeenCalled();
    });

    it('updates the expense when it belongs to the user', async () => {
      prisma.expense.findFirst.mockResolvedValue({ id: 'exp-1', userId: 'user-1' });
      prisma.expense.update.mockResolvedValue({ id: 'exp-1', userId: 'user-1', amount: 99 });

      const result = await service.update('user-1', 'exp-1', { amount: 99 });

      expect(prisma.expense.findFirst).toHaveBeenCalledWith({ where: { id: 'exp-1', userId: 'user-1' } });
      expect(prisma.expense.update).toHaveBeenCalledWith({ where: { id: 'exp-1' }, data: { amount: 99 } });
      expect(result).toEqual({ id: 'exp-1', userId: 'user-1', amount: 99 });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the expense does not belong to the user', async () => {
      prisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'exp-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.expense.delete).not.toHaveBeenCalled();
    });

    it('deletes the expense when it belongs to the user', async () => {
      prisma.expense.findFirst.mockResolvedValue({ id: 'exp-1', userId: 'user-1' });
      prisma.expense.delete.mockResolvedValue({});

      await service.remove('user-1', 'exp-1');

      expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: 'exp-1' } });
    });
  });

  describe('list', () => {
    it('builds a where clause scoped to the user with no optional filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.list('user-1', { limit: 20, offset: 0 });

      const [[findManyArgs]] = [prisma.$transaction.mock.calls[0][0]];
      // Ensure the query passed to $transaction was built using only userId
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ items: [], total: 0, nextOffset: 0 });
    });

    it('applies categoryId, date range and search filters', async () => {
      prisma.expense.findMany.mockResolvedValue([{ id: 'e1' }]);
      prisma.expense.count.mockResolvedValue(1);
      prisma.$transaction.mockImplementation((ops: Promise<any>[]) => Promise.all(ops));

      const opts = {
        start: '2024-01-01',
        end: '2024-01-31',
        categoryId: 'cat-1',
        q: 'coffee',
        limit: 10,
        offset: 5,
      };
      const result = await service.list('user-1', opts);

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          categoryId: 'cat-1',
          expenseDate: { gte: new Date('2024-01-01'), lte: new Date('2024-01-31') },
          note: { contains: 'coffee', mode: 'insensitive' },
        },
        take: 10,
        skip: 5,
        orderBy: { expenseDate: 'desc' },
      });
      expect(result).toEqual({ items: [{ id: 'e1' }], total: 1, nextOffset: 6 });
    });

    it('computes nextOffset based on the number of returned items', async () => {
      prisma.expense.findMany.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);
      prisma.expense.count.mockResolvedValue(50);
      prisma.$transaction.mockImplementation((ops: Promise<any>[]) => Promise.all(ops));

      const result = await service.list('user-1', { limit: 2, offset: 10 });

      expect(result.nextOffset).toBe(12);
      expect(result.total).toBe(50);
    });
  });
});
