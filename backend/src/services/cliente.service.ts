import { ClienteRepository } from '../repositories/cliente.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = 10;

export class ClienteService {
  private clienteRepository = new ClienteRepository();

  async register(data: { nombre: string; email: string; password?: string; telefono?: string; rol?: string }) {
    const existing = await this.clienteRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    // Default password if none provided, although registration requires one.
    const rawPassword = data.password || '123456';
    const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);

    const client = await this.clienteRepository.create({
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      passwordHash,
      rol: data.rol || 'cliente',
    });

    const { passwordHash: _, ...result } = client;
    return result;
  }

  async login(email: string, rawPassword?: string) {
    const client = await this.clienteRepository.findByEmail(email);
    if (!client) {
      throw new Error('Credenciales inválidas.');
    }

    const match = await bcrypt.compare(rawPassword || '', client.passwordHash);
    if (!match) {
      throw new Error('Credenciales inválidas.');
    }

    const token = jwt.sign(
      { id: client.id, email: client.email, rol: client.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { passwordHash: _, ...clientData } = client;
    return { token, client: clientData };
  }

  async getClientById(id: string) {
    const client = await this.clienteRepository.findById(id);
    if (!client) {
      throw new Error('Cliente no encontrado.');
    }
    const { passwordHash: _, ...result } = client;
    return result;
  }

  async updateClient(id: string, data: { nombre?: string; email?: string; telefono?: string; password?: string }) {
    const updateData: any = { ...data };

    if (data.email) {
      const existing = await this.clienteRepository.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new Error('El correo electrónico ya está en uso por otro cliente.');
      }
    }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
      delete updateData.password;
    }

    const client = await this.clienteRepository.update(id, updateData);
    const { passwordHash: _, ...result } = client;
    return result;
  }

  async deleteClient(id: string) {
    await this.getClientById(id);
    return this.clienteRepository.delete(id);
  }

  async getAllClients(search?: string) {
    const clients = await this.clienteRepository.findAll(search);
    return clients.map(({ passwordHash: _, ...rest }) => rest);
  }
}
