import prisma from '../config/db';
import { Prisma } from '@prisma/client';

export class ClienteRepository {
  async create(data: Prisma.ClienteCreateInput) {
    return prisma.cliente.create({ data });
  }

  async findById(id: string) {
    return prisma.cliente.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.cliente.findUnique({ where: { email } });
  }

  async update(id: string, data: Prisma.ClienteUpdateInput) {
    return prisma.cliente.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.cliente.delete({ where: { id } });
  }

  async findAll(search?: string) {
    if (search) {
      return prisma.cliente.findMany({
        where: {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      });
    }
    return prisma.cliente.findMany();
  }
}
