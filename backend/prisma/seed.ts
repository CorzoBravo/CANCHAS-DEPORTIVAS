import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos de prueba (seeding)...');

  // 1. Limpieza de registros previos
  await prisma.pago.deleteMany({});
  await prisma.reserva.deleteMany({});
  await prisma.cancha.deleteMany({});
  await prisma.cliente.deleteMany({});

  // 2. Crear Usuarios (Administrador y Cliente estándar)
  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const admin = await prisma.cliente.create({
    data: {
      nombre: 'Administrador del Complejo',
      email: 'admin@canchas.com',
      telefono: '999888777',
      passwordHash: passwordHashAdmin,
      rol: 'admin',
    },
  });

  const passwordHashClient = await bcrypt.hash('cliente123', 10);
  const cliente = await prisma.cliente.create({
    data: {
      nombre: 'Juan Pérez',
      email: 'cliente@canchas.com',
      telefono: '999111222',
      passwordHash: passwordHashClient,
      rol: 'cliente',
    },
  });

  console.log('Usuarios de prueba creados.');

  // 3. Crear Canchas Deportivas de prueba
  const canchaFutbol = await prisma.cancha.create({
    data: {
      nombre: 'Cancha de Fútbol Sintético 1',
      tipo: 'Fútbol 5',
      precioHora: 50.00,
      habilitada: true,
    },
  });

  const canchaTenis = await prisma.cancha.create({
    data: {
      nombre: 'Cancha de Tenis Arcilla 1',
      tipo: 'Tenis',
      precioHora: 30.00,
      habilitada: true,
    },
  });

  const canchaBasket = await prisma.cancha.create({
    data: {
      nombre: 'Cancha de Básquetbol Principal',
      tipo: 'Básquetbol',
      precioHora: 40.00,
      habilitada: true,
    },
  });

  const canchaDeshabilitada = await prisma.cancha.create({
    data: {
      nombre: 'Cancha de Squash Auxiliar (En Mantenimiento)',
      tipo: 'Squash',
      precioHora: 25.00,
      habilitada: false,
    },
  });

  console.log('Canchas deportivas de prueba creadas.');
  console.log('Seeding finalizado correctamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
