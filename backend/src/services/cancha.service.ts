import { CanchaRepository } from '../repositories/cancha.repository';
import prisma from '../config/db';

export class CanchaService {
  private canchaRepository = new CanchaRepository();

  async createCancha(data: { nombre: string; tipo: string; precioHora: number; habilitada?: boolean }) {
    return this.canchaRepository.create({
      nombre: data.nombre,
      tipo: data.tipo,
      precioHora: data.precioHora,
      habilitada: data.habilitada ?? true,
    });
  }

  async getCanchaById(id: string) {
    const court = await this.canchaRepository.findById(id);
    if (!court) {
      throw new Error('Cancha no encontrada.');
    }
    return court;
  }

  async updateCancha(id: string, data: { nombre?: string; tipo?: string; precioHora?: number; habilitada?: boolean }) {
    await this.getCanchaById(id);
    return this.canchaRepository.update(id, data);
  }

  async deleteCancha(id: string) {
    await this.getCanchaById(id);
    return this.canchaRepository.delete(id);
  }

  async getAllCanchas(onlyEnabled?: boolean) {
    return this.canchaRepository.findAll(onlyEnabled);
  }

  async getAvailability(canchaId: string, fechaStr: string) {
    const court = await this.getCanchaById(canchaId);
    if (!court.habilitada) {
      throw new Error('La cancha se encuentra deshabilitada.');
    }

    // Parse YYYY-MM-DD and create a date object normalized to UTC/Local midnight depending on DB interpretation
    const targetDate = new Date(fechaStr + 'T00:00:00');

    // Query active (non-cancelled) bookings for this court and date
    const reservations = await prisma.reserva.findMany({
      where: {
        canchaId,
        fecha: targetDate,
        estado: { in: ['pendiente', 'confirmada'] },
      },
      orderBy: { horaInicio: 'asc' },
    });

    const openingTime = '07:00';
    const closingTime = '23:00';

    const ocupados = reservations.map(r => ({
      reservaId: r.id,
      horaInicio: r.horaInicio,
      horaFin: r.horaFin,
      estado: r.estado,
    }));

    // Calculate free blocks dynamically
    const libres: { horaInicio: string; horaFin: string }[] = [];
    let currentStart = openingTime;

    for (const res of reservations) {
      if (res.horaInicio > currentStart) {
        libres.push({
          horaInicio: currentStart,
          horaFin: res.horaInicio,
        });
      }
      if (res.horaFin > currentStart) {
        currentStart = res.horaFin;
      }
    }

    if (closingTime > currentStart) {
      libres.push({
        horaInicio: currentStart,
        horaFin: closingTime,
      });
    }

    return {
      cancha: court,
      fecha: fechaStr,
      horarios: {
        apertura: openingTime,
        cierre: closingTime,
      },
      ocupados,
      libres,
    };
  }
}
