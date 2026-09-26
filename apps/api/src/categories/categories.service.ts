import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.category.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  async create(userId: string, data: { name: string; color?: string }) {
    try {
      return await this.prisma.category.create({ data: { ...data, userId } });
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException('Duplicate category');
      throw e;
    }
  }

  async update(userId: string, id: string, data: Partial<{ name: string; color?: string }>) {
    const exists = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException();
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const exists = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException();
    await this.prisma.category.delete({ where: { id } });
  }
}
