import { ReservaRepository } from '../repositories/reserva.repository';
import { CanchaService } from './cancha.service';
import { ClienteService } from './cliente.service';
import prisma from '../config/db';
import { NotificacionService } from './notificacion.service';

export class ReservaService {
  private reservaRepository = new ReservaRepository();
  private canchaService = new CanchaService();
  private clienteService = new ClienteService();
  private notificacionService = new NotificacionService();

  async createReserva(data: { clienteId: string; canchaId: string; fecha: string; horaInicio: string; horaFin: string }) {
    // 1. Basic formatting checks
    if (data.horaInicio >= data.horaFin) {
      throw new Error('La hora de inicio debe ser menor que la hora de fin.');
    }

    const openingTime = '07:00';
    const closingTime = '23:00';

    if (data.horaInicio < openingTime || data.horaFin > closingTime) {
      throw new Error(`Los horarios de reserva deben estar dentro del horario de apertura del complejo (${openingTime} - ${closingTime}).`);
    }

    const targetDate = new Date(data.fecha + 'T00:00:00');

    // 2. Validate client existence
    await this.clienteService.getClientById(data.clienteId);

    // 3. Execute inside a serializable transaction to prevent race conditions
    const reservation = await prisma.$transaction(async (tx) => {
      // Row-level lock the court to prevent concurrent bookings on the same court from overlapping
      await tx.$executeRawUnsafe(
        'SELECT * FROM "Cancha" WHERE id = $1 FOR UPDATE',
        data.canchaId
      );

      // Verify court exists and is enabled
      const court = await tx.cancha.findUnique({ where: { id: data.canchaId } });
      if (!court) {
        throw new Error('La cancha especificada no existe.');
      }
      if (!court.habilitada) {
        throw new Error('La cancha seleccionada se encuentra deshabilitada.');
      }

      // Check for overlaps under lock
      const overlaps = await tx.reserva.findMany({
        where: {
          canchaId: data.canchaId,
          fecha: targetDate,
          estado: { in: ['pendiente', 'confirmada'] },
          horaInicio: { lt: data.horaFin },
          horaFin: { gt: data.horaInicio },
        },
      });

      if (overlaps.length > 0) {
        throw new Error('La cancha ya se encuentra reservada en el horario seleccionado.');
      }

      // Create the reservation
      return tx.reserva.create({
        data: {
          clienteId: data.clienteId,
          canchaId: data.canchaId,
          fecha: targetDate,
          horaInicio: data.horaInicio,
          horaFin: data.horaFin,
          estado: 'pendiente', // starts as pending, changes to confirmed upon payment
        },
        include: { cancha: true, cliente: true },
      });
    });

    // Notify client asynchronously
    this.notificacionService.enviarCorreo(
      reservation.cliente.email,
      'Pre-Reserva Registrada - CanchaMaster',
      `Hola ${reservation.cliente.nombre},\n\nTu pre-reserva para la cancha "${reservation.cancha.nombre}" el día ${data.fecha} de ${data.horaInicio} a ${data.horaFin} ha sido creada correctamente.\n\nTienes un balance pendiente para confirmar tu turno. Por favor accede al sistema para procesar el pago.\n\nSaludos,\nCanchaMaster.`
    ).catch(err => console.error('Error enviando notificación:', err));

    return reservation;
  }

  async cancelReserva(id: string, loggedUser: { id: string; rol: string }) {
    const reservation = await this.reservaRepository.findById(id);
    if (!reservation) {
      throw new Error('La reserva no existe.');
    }

    if (reservation.estado === 'cancelada') {
      throw new Error('La reserva ya ha sido cancelada.');
    }

    // Only allow admin or the reserving client to cancel
    if (loggedUser.rol !== 'admin' && loggedUser.id !== reservation.clienteId) {
      throw new Error('No tienes autorización para cancelar esta reserva.');
    }

    const updated = await this.reservaRepository.update(id, { estado: 'cancelada' });

    // Notify client asynchronously
    this.notificacionService.enviarCorreo(
      reservation.cliente.email,
      'Reserva Cancelada - CanchaMaster',
      `Hola ${reservation.cliente.nombre},\n\nTu reserva para la cancha "${reservation.cancha.nombre}" el día ${reservation.fecha.toLocaleDateString()} a las ${reservation.horaInicio} ha sido cancelada correctamente.\n\nSaludos,\nCanchaMaster.`
    ).catch(err => console.error('Error enviando notificación:', err));

    return updated;
  }

  async getReservaById(id: string) {
    const reservation = await this.reservaRepository.findById(id);
    if (!reservation) {
      throw new Error('Reserva no encontrada.');
    }
    return reservation;
  }

  async listReservas(filters: { clienteId?: string; canchaId?: string; fecha?: string }) {
    return this.reservaRepository.findAll(filters);
  }
}
