import prisma from '../config/db';
import { Prisma } from '@prisma/client';

export class PagoRepository {
  async create(data: Prisma.PagoUncheckedCreateInput) {
    return prisma.pago.create({
      data,
      include: { reserva: true },
    });
  }

  async findById(id: string) {
    return prisma.pago.findUnique({
      where: { id },
      include: { reserva: true },
    });
  }

  async findByReservaId(reservaId: string) {
    return prisma.pago.findMany({
      where: { reservaId },
    });
  }

  async findAll() {
    return prisma.pago.findMany({
      include: { reserva: { include: { cliente: true, cancha: true } } },
      orderBy: { fechaPago: 'desc' },
    });
  }
}
