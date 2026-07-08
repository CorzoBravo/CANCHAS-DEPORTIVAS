import prisma from '../config/db';
import { Prisma } from '@prisma/client';

export class CanchaRepository {
  async create(data: Prisma.CanchaCreateInput) {
    return prisma.cancha.create({ data });
  }

  async findById(id: string) {
    return prisma.cancha.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.CanchaUpdateInput) {
    return prisma.cancha.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.cancha.delete({ where: { id } });
  }

  async findAll(onlyEnabled: boolean = false) {
    if (onlyEnabled) {
      return prisma.cancha.findMany({
        where: { habilitada: true },
      });
    }
    return prisma.cancha.findMany();
  }
}
