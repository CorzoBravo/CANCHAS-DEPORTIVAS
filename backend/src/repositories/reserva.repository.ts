import prisma from '../config/db';
import { Prisma } from '@prisma/client';

export class ReservaRepository {
  async create(data: Prisma.ReservaUncheckedCreateInput) {
    return prisma.reserva.create({ data });
  }

  async findById(id: string) {
    return prisma.reserva.findUnique({
      where: { id },
      include: { cliente: true, cancha: true, pagos: true },
    });
  }

  async update(id: string, data: Prisma.ReservaUpdateInput) {
    return prisma.reserva.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.reserva.delete({ where: { id } });
  }

  async findOverlapping(canchaId: string, fecha: Date, horaInicio: string, horaFin: string) {
    return prisma.reserva.findMany({
      where: {
        canchaId,
        fecha,
        estado: { in: ['pendiente', 'confirmada'] },
        horaInicio: { lt: horaFin },
        horaFin: { gt: horaInicio },
      },
    });
  }

  async findAll(filters: { clienteId?: string; canchaId?: string; fecha?: string }) {
    const whereClause: any = {};

    if (filters.clienteId) {
      whereClause.clienteId = filters.clienteId;
    }
    if (filters.canchaId) {
      whereClause.canchaId = filters.canchaId;
    }
    if (filters.fecha) {
      whereClause.fecha = new Date(filters.fecha + 'T00:00:00');
    }

    return prisma.reserva.findMany({
      where: whereClause,
      include: { cliente: true, cancha: true },
      orderBy: [{ fecha: 'desc' }, { horaInicio: 'asc' }],
    });
  }
}
