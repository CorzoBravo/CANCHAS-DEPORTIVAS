import request from 'supertest';
import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcrypt';

let clientToken: string = '';
let clientId: string = '';
let adminToken: string = '';
let canchaId: string = '';
let reservaId: string = '';

beforeAll(async () => {
  // Normalise database state before running tests
  await prisma.pago.deleteMany({});
  await prisma.reserva.deleteMany({});
  await prisma.cancha.deleteMany({});
  await prisma.cliente.deleteMany({});

  // Seed a default admin directly in the database
  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  await prisma.cliente.create({
    data: {
      nombre: 'Admin Tester',
      email: 'admintest@canchas.com',
      telefono: '999999999',
      passwordHash: passwordHashAdmin,
      rol: 'admin',
    },
  });
});

afterAll(async () => {
  // Close database connections so Jest exits cleanly
  await prisma.$disconnect();
});

describe('Sports Court Reservation System - Integration Tests', () => {
  
  describe('Authentication & Security Gaps Verification', () => {
    
    it('should successfully register a standard client', async () => {
      const res = await request(app)
        .post('/api/clientes/register')
        .send({
          nombre: 'Cliente Tester',
          email: 'clientetest@canchas.com',
          password: 'password123',
          telefono: '888888888',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.client.email).toBe('clientetest@canchas.com');
      expect(res.body.data.client.rol).toBe('cliente');
      clientId = res.body.data.client.id;
    });

    it('should successfully login and return JWT token', async () => {
      const res = await request(app)
        .post('/api/clientes/login')
        .send({
          email: 'clientetest@canchas.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      clientToken = res.body.data.token;
    });

    it('should login as admin and obtain admin token', async () => {
      const res = await request(app)
        .post('/api/clientes/login')
        .send({
          email: 'admintest@canchas.com',
          password: 'admin123',
        });

      expect(res.status).toBe(200);
      adminToken = res.body.data.token;
    });

    it('should prevent standard client from querying details of another client (Vulnerability Fix)', async () => {
      // Trying to fetch the Admin profile using the Client token
      const adminUser = await prisma.cliente.findFirst({ where: { email: 'admintest@canchas.com' } });
      
      const res = await request(app)
        .get(`/api/clientes/${adminUser!.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No tienes autorización');
    });

    it('should strip out "rol" parameter when sent to public register endpoint (Vulnerability Fix)', async () => {
      // Trying to register a new user as 'admin' via public registration
      const res = await request(app)
        .post('/api/clientes/register')
        .send({
          nombre: 'Hacker User',
          email: 'hacker@canchas.com',
          password: 'hackpassword',
          rol: 'admin', // Under validation middleware assignment, this is stripped
        });

      expect(res.status).toBe(201);
      expect(res.body.data.client.rol).toBe('cliente'); // Must be demoted to client
    });

  });

  describe('Courts & Booking Management', () => {

    it('should allow admin to create a court', async () => {
      const res = await request(app)
        .post('/api/canchas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Cancha Central de Fútbol',
          tipo: 'Fútbol 5',
          precioHora: 45.00,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.court.nombre).toBe('Cancha Central de Fútbol');
      canchaId = res.body.data.court.id;
    });

    it('should fetch court availability lists for a given date', async () => {
      const res = await request(app)
        .get(`/api/canchas/${canchaId}/disponibilidad?fecha=2026-08-10`);

      expect(res.status).toBe(200);
      expect(res.body.data.libres).toBeDefined();
      expect(res.body.data.ocupados.length).toBe(0); // Brand new court, no bookings yet
    });

    it('should allow client to book a court with custom variable duration', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          clienteId: clientId,
          canchaId: canchaId,
          fecha: '2026-08-10',
          horaInicio: '09:00',
          horaFin: '11:00', // 2 hour duration (variable)
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reservation.estado).toBe('pendiente');
      reservaId = res.body.data.reservation.id;
    });

    it('should reject a reservation that overlaps with the existing booking (Consistency Check)', async () => {
      // Current booking is 09:00 - 11:00. This attempt is 10:00 - 12:00 (overlaps by 1 hour)
      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          clienteId: clientId,
          canchaId: canchaId,
          fecha: '2026-08-10',
          horaInicio: '10:00',
          horaFin: '12:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ya se encuentra reservada');
    });

    it('should allow client to cancel their own booking', async () => {
      const res = await request(app)
        .delete(`/api/reservas/${reservaId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('cancelada correctamente');
    });

  });

});
