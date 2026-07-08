import prisma from '../config/db';

export class ReporteService {
  async getReservasReport(desdeStr: string, hastaStr: string) {
    const desde = new Date(desdeStr + 'T00:00:00');
    const hasta = new Date(hastaStr + 'T23:59:59');

    const total = await prisma.reserva.count({
      where: {
        fecha: { gte: desde, lte: hasta },
      },
    });

    const agrupado = await prisma.reserva.groupBy({
      by: ['estado'],
      where: {
        fecha: { gte: desde, lte: hasta },
      },
      _count: {
        id: true,
      },
    });

    const porEstado = agrupado.map((item) => ({
      estado: item.estado,
      cantidad: item._count.id,
    }));

    return {
      periodo: { desde: desdeStr, hasta: hastaStr },
      total,
      porEstado,
    };
  }

  async getIngresosReport(desdeStr: string, hastaStr: string) {
    const desde = new Date(desdeStr + 'T00:00:00');
    const hasta = new Date(hastaStr + 'T23:59:59');

    const sumResult = await prisma.pago.aggregate({
      where: {
        estado: 'pagado',
        fechaPago: { gte: desde, lte: hasta },
      },
      _sum: {
        monto: true,
      },
    });

    const total = Number(sumResult._sum.monto || 0);

    const payments = await prisma.pago.findMany({
      where: {
        estado: 'pagado',
        fechaPago: { gte: desde, lte: hasta },
      },
      select: {
        monto: true,
        fechaPago: true,
      },
    });

    const dailyMap: { [key: string]: number } = {};
    for (const p of payments) {
      const dateKey = p.fechaPago.toISOString().split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Number(p.monto);
    }

    const detalleDiario = Object.entries(dailyMap)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return {
      periodo: { desde: desdeStr, hasta: hastaStr },
      total,
      detalleDiario,
    };
  }

  async getCanchasMasUsadas() {
    const agrupado = await prisma.reserva.groupBy({
      by: ['canchaId'],
      where: {
        estado: { in: ['pendiente', 'confirmada'] }, // Count active reservations
      },
      _count: {
        id: true,
      },
    });

    const canchas = await prisma.cancha.findMany({
      select: { id: true, nombre: true, tipo: true },
    });

    const canchasMap = new Map(canchas.map((c) => [c.id, c]));

    const ranking = agrupado
      .map((item) => {
        const cancha = canchasMap.get(item.canchaId);
        return {
          canchaId: item.canchaId,
          nombre: cancha?.nombre || 'Desconocida',
          tipo: cancha?.tipo || 'N/A',
          reservas: item._count.id,
        };
      })
      .sort((a, b) => b.reservas - a.reservas);

    return ranking;
  }
}
