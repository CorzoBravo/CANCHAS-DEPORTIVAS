# Plan de Desarrollo e Implementación - Sistema de Reserva de Canchas Deportivas

Este documento define el plan de desarrollo e implementación técnica para el **Sistema de Reserva de Canchas Deportivas**, basado en los requerimientos y la arquitectura del modelo C4 detallados en el archivo `Arquitectura_C4_Reservas_Canchas.docx`.

Dado que el repositorio `INVENTORY-MASTER-HERRAMIENTAS` no está disponible públicamente, proponemos una **arquitectura monorepo estándar de producción** utilizando Node.js (Backend) y React (Frontend), que implementa el patrón de diseño por capas (Controlador-Servicio-Repositorio) sugerido en el documento C4.

---

## 1. Arquitectura y Estructura del Proyecto

El proyecto se estructurará como un **Monorepo** con directorios separados para el Backend (`backend/`) y el Frontend (`frontend/`), facilitando la integración de control de versiones y el despliegue independiente.

```
canchas-deportivas/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Esquema de base de datos relacional
│   ├── src/
│   │   ├── config/              # Configuración de base de datos y entorno
│   │   ├── controllers/         # Controladores HTTP (Cliente, Cancha, Reserva, Pago)
│   │   ├── middlewares/         # Middlewares (Autenticación JWT, Validación, Manejo de Errores)
│   │   ├── repositories/        # Consultas e interacción con BD
│   │   ├── routes/              # Ruteadores Express por módulo de negocio
│   │   ├── services/            # Lógica de negocio y validación de reglas
│   │   └── app.js               # Entrada principal del servidor Express
│   ├── .env                     # Variables de entorno locales
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables (Tablas, Formularios, etc.)
│   │   ├── context/             # Estado global de Autenticación
│   │   ├── hooks/               # Custom hooks (useReservas, useDisponibilidad)
│   │   ├── pages/               # Páginas (Login, Registro, Canchas, Reservas, Pagos, Reportes)
│   │   ├── services/            # Cliente HTTP Axios y llamadas a la API
│   │   ├── App.jsx              # Configuración de rutas (React Router)
│   │   └── index.css            # Estilos globales (CSS Vanilla)
│   └── package.json
├── docker-compose.yml           # Levantar PostgreSQL localmente
├── .gitignore
└── README.md
```

---

## 2. Modelo de Datos y Consistencia

El sistema utilizará una base de datos relacional **PostgreSQL** mediante el ORM **Prisma**. El esquema relacional y las entidades principales se definen de la siguiente manera:

*   **Clientes:** `id` (PK), `nombre`, `email` (Unique), `telefono`, `passwordHash`, `createdAt`.
*   **Canchas:** `id` (PK), `nombre`, `tipo`, `precioHora`, `habilitada` (booleano), `createdAt`.
*   **Reservas:** `id` (PK), `clienteId` (FK), `canchaId` (FK), `fecha` (Date), `horaInicio` (String HH:MM), `horaFin` (String HH:MM), `estado` (pendiente | confirmada | cancelada), `createdAt`.
*   **Pagos:** `id` (PK), `reservaId` (FK), `monto`, `fechaPago`, `estado` (pagado | rechazado), `referenciaPasarela`.

### Reglas de Negocio a nivel de Base de Datos y Código
1.  **Doble Reserva:** Para evitar que una misma cancha sea reservada en el mismo horario por dos clientes diferentes (concurrencia), se creará un **índice único compuesto** en la tabla reservas sobre `(cancha_id, fecha, hora_inicio)`. Esto bloquea físicamente la doble reserva en la base de datos mientras `ReservaService` valida y responde de forma limpia al usuario.
2.  **Canchas Deshabilitadas:** La capa `ReservaService` consultará con `CanchaService` el estado `habilitada` de la cancha antes de persistir cualquier reserva.
3.  **Pagos Consistentes:** `PagoService` verificará que la reserva exista, esté en estado `pendiente` y no haya sido cancelada previamente.

---

## 3. Plan de Sprints

El desarrollo se estima en **6 sprints** de una semana cada uno (a excepción del Sprint 3 de 1.5 semanas):

| Sprint | Duración | Alcance Backend | Alcance Frontend |
| :--- | :--- | :--- | :--- |
| **Sprint 0** | 1 semana | Setup inicial, configuración de Express, PostgreSQL, Prisma y Auth JWT. | Setup inicial de React, enrutador (React Router), layouts y Login básico. |
| **Sprint 1** | 1 semana | CRUD completo de Clientes, encriptación de contraseñas. | Pantallas de gestión de clientes e historial de usuario. |
| **Sprint 2** | 1 semana | CRUD de Canchas y endpoint dinámico de consulta de disponibilidad. | Catálogo visual de canchas y calendario interactivo de horarios. |
| **Sprint 3** | 1.5 semanas | Endpoint de creación de reservas con validaciones de negocio transaccionales. | Flujo de reserva (pasos rápidos) y opción de cancelación. |
| **Sprint 4** | 1 semana | Integración con mock de pasarela de pagos y actualización de estados. | Interfaz de pago simulado e impresión de confirmación. |
| **Sprint 5** | 1 semana | Endpoints de agregación para reportes de ingresos y popularidad de canchas. | Dashboard administrativo con gráficos e indicadores de negocio. |
| **Sprint 6** | 1 semana | Documentación interactiva en Swagger, pruebas unitarias y de integración. | Pulido responsive de UI, pruebas E2E manuales y despliegue. |

---

## 4. Plan de Verificación y Pruebas

### Pruebas Automatizadas
*   **Jest + Supertest:** Para probar los endpoints de la API de forma automática. Nos enfocaremos en probar los límites de la lógica de negocio (por ejemplo, validar que el backend rechace reservas en horas idénticas).
*   **Pruebas de Integración de Base de Datos:** Intentar insertar directamente un registro duplicado de reserva para validar que el índice compuesto unique de PostgreSQL lance la excepción correspondiente.

### Verificación Manual
1.  Crear una cuenta de cliente y loguearse.
2.  Deshabilitar una cancha como administrador y verificar que el cliente ya no la vea como disponible.
3.  Crear una reserva en una cancha libre.
4.  Realizar el pago de la reserva y confirmar que el estado cambie a "confirmada".
5.  Intentar realizar otra reserva en el mismo bloque horario con otro cliente diferente y asegurar que el sistema lo rechace.
6.  Acceder al Dashboard administrativo y revisar la actualización del volumen de reservas e ingresos del periodo.
