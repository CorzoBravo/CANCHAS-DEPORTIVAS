import { PagoRepository } from '../repositories/pago.repository';
import prisma from '../config/db';
import { NotificacionService } from './notificacion.service';

export class PagoService {
  private pagoRepository = new PagoRepository();
  private notificacionService = new NotificacionService();

  private calculateDurationInHours(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;
    return (endTotalMinutes - startTotalMinutes) / 60;
  }

  async processPayment(data: {
    reservaId: string;
    numeroTarjeta: string;
    nombreTitular: string;
    cvv: string;
    expiracion: string;
  }) {
    // 1. Fetch reservation
    const reservation = await prisma.reserva.findUnique({
      where: { id: data.reservaId },
      include: { cancha: true, cliente: true },
    });

    if (!reservation) {
      throw new Error('La reserva especificada no existe.');
    }

    if (reservation.estado === 'cancelada') {
      throw new Error('No se puede realizar el pago de una reserva cancelada.');
    }

    if (reservation.estado === 'confirmada') {
      throw new Error('La reserva ya ha sido pagada y confirmada anteriormente.');
    }

    // 2. Calculate amount based on hours and court rate
    const hours = this.calculateDurationInHours(reservation.horaInicio, reservation.horaFin);
    const hourlyRate = Number(reservation.cancha.precioHora);
    const totalAmount = hourlyRate * hours;

    // 3. Simulate External Payment Gateway
    // If the card ends in '4444', we simulate a declinement
    const cleanCard = data.numeroTarjeta.replace(/\s+/g, '');
    const isApproved = !cleanCard.endsWith('4444');

    if (!isApproved) {
      // Log failed attempt in DB but do not confirm reservation
      await this.pagoRepository.create({
        reservaId: data.reservaId,
        monto: totalAmount,
        estado: 'rechazado',
        referenciaPasarela: 'REF-RECHAZADO-' + Date.now(),
      });
      throw new Error('El pago fue rechazado por la entidad bancaria (Simulación).');
    }

    // 4. Successful transaction inside a Prisma transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Re-fetch and lock booking to prevent parallel confirmations
      const booking = await tx.reserva.findUnique({
        where: { id: data.reservaId },
      });

      if (booking?.estado === 'confirmada') {
        throw new Error('La reserva ya fue confirmada en una operación paralela.');
      }

      // Create Payment
      const payment = await tx.pago.create({
        data: {
          reservaId: data.reservaId,
          monto: totalAmount,
          estado: 'pagado',
          referenciaPasarela: 'REF-APROBADO-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        },
      });

      // Confirm Booking
      await tx.reserva.update({
        where: { id: data.reservaId },
        data: { estado: 'confirmada' },
      });

      return payment;
    });

    // Notify client asynchronously
    this.notificacionService.enviarCorreo(
      reservation.cliente.email,
      'Pago Aprobado y Reserva Confirmada - CanchaMaster',
      `¡Pago Exitoso!\n\nHola ${reservation.cliente.nombre},\n\nConfirmamos que hemos recibido tu pago de $${totalAmount.toFixed(2)} por tu reserva en la cancha "${reservation.cancha.nombre}" para el día ${reservation.fecha.toLocaleDateString()} de ${reservation.horaInicio} a ${reservation.horaFin}.\n\nTu turno ha sido CONFIRMADO. ¡Disfruta el juego!\n\nSaludos,\nCanchaMaster.`
    ).catch(err => console.error('Error al enviar correo:', err));

    if (reservation.cliente.telefono) {
      this.notificacionService.enviarSMS(
        reservation.cliente.telefono,
        `CanchaMaster: ¡Pago aprobado! Tu reserva para la cancha "${reservation.cancha.nombre}" el ${reservation.fecha.toLocaleDateString()} a las ${reservation.horaInicio} está CONFIRMADA.`
      ).catch(err => console.error('Error al enviar SMS:', err));
    }

    return payment;
  }

  async getPaymentsByReserva(reservaId: string) {
    return this.pagoRepository.findByReservaId(reservaId);
  }

  async listAllPayments() {
    return this.pagoRepository.findAll();
  }
}
