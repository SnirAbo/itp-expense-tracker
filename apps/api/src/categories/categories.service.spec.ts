import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  let prisma: any;
  let service: CategoriesService;

  beforeEach(() => {
    prisma = {
      category: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new CategoriesService(prisma);
  });

  describe('list', () => {
    it('returns categories scoped to the user ordered by createdAt ascending', () => {
      const rows = [{ id: 'c1' }];
      prisma.category.findMany.mockReturnValue(rows);

      const result = service.list('user-1');

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toBe(rows);
    });
  });

  describe('create', () => {
    it('creates a category for the user', async () => {
      prisma.category.create.mockResolvedValue({ id: 'c1', name: 'Food', userId: 'user-1' });

      const result = await service.create('user-1', { name: 'Food' });

      expect(prisma.category.create).toHaveBeenCalledWith({ data: { name: 'Food', userId: 'user-1' } });
      expect(result).toEqual({ id: 'c1', name: 'Food', userId: 'user-1' });
    });

    it('translates a Prisma unique constraint violation into a BadRequestException', async () => {
      prisma.category.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create('user-1', { name: 'Food' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rethrows unexpected errors', async () => {
      const err = new Error('boom');
      prisma.category.create.mockRejectedValue(err);

      await expect(service.create('user-1', { name: 'Food' })).rejects.toBe(err);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the category does not belong to the user', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.update('user-1', 'c1', { name: 'New' })).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it('updates the category when it belongs to the user', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1', userId: 'user-1' });
      prisma.category.update.mockResolvedValue({ id: 'c1', name: 'New' });

      const result = await service.update('user-1', 'c1', { name: 'New' });

      expect(prisma.category.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { name: 'New' } });
      expect(result).toEqual({ id: 'c1', name: 'New' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the category does not belong to the user', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'c1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('deletes the category when it belongs to the user', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1', userId: 'user-1' });
      prisma.category.delete.mockResolvedValue({});

      await service.remove('user-1', 'c1');

      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });
});
