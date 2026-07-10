import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error.middleware';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';

// Import routes
import clienteRoutes from './routes/cliente.routes';
import canchaRoutes from './routes/cancha.routes';
import reservaRoutes from './routes/reserva.routes';
import pagoRoutes from './routes/pago.routes';
import reporteRoutes from './routes/reporte.routes';

// Load environment variables
dotenv.config();

// Enforce JWT_SECRET definition in production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined in production!');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET environment variable is not defined. Defaulting to development secret.');
    process.env.JWT_SECRET = 'temporary-development-jwt-secret-key-2026';
  }
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes mounting
app.use('/api/clientes', clienteRoutes);
app.use('/api/canchas', canchaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/reportes', reporteRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global error handling middleware
app.use(errorHandler);

// Start server (only if file is run directly, not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Sports Court Reservation System listening on port ${PORT}`);
  });
}

export default app;
