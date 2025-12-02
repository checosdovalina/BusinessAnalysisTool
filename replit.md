# OTS Energy - Sistema de Evaluación para Operadores

## Descripción General
Plataforma integral de evaluación y entrenamiento para operadores de redes eléctricas (OTS - Operator Training System). El sistema soporta gestión multi-empresa, ciclos de evaluación, sesiones de simulador para operaciones de red, y reportes detallados.

## Estado Actual del Proyecto
- **Última actualización**: Diciembre 2024
- **Estado**: En desarrollo activo - MVP funcional
- **Estética visual**: "High-Tech Energy" con fondos navy oscuro (#0b0f19) y acentos cyan (#00F0FF)

## Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Shadcn/UI
- **Backend**: Express.js, Node.js
- **Base de Datos**: PostgreSQL (Neon) con Drizzle ORM
- **Autenticación**: Sistema de sesiones con localStorage (demo)
- **Routing**: Wouter
- **Estado**: TanStack Query

### Estructura del Proyecto
```
├── client/src/
│   ├── components/     # Componentes reutilizables
│   │   ├── ui/         # Componentes Shadcn/UI
│   │   └── layout/     # DashboardShell, navegación
│   ├── hooks/          # Custom hooks (use-auth, use-toast)
│   ├── lib/            # Utilidades, API client
│   └── pages/          # Páginas de la aplicación
├── server/
│   ├── routes.ts       # Endpoints de la API REST
│   ├── storage.ts      # Capa de acceso a datos
│   ├── db.ts           # Conexión a PostgreSQL
│   └── seed.ts         # Datos de prueba
└── shared/
    └── schema.ts       # Modelos de Drizzle y tipos
```

## Modelo de Datos

### Entidades Principales
1. **Companies** - Empresas/organizaciones
2. **Users** - Usuarios con roles (super_admin, admin, trainer, student)
3. **Cycles** - Ciclos de entrenamiento (Registro de Ciclo de Sesiones)
4. **Events** - Eventos de evaluación (Registro de Eventos de Entrenamiento)
5. **SimulatorScenarios** - Escenarios de simulación
6. **SimulatorSessions** - Sesiones de simulador

### Temas de Evaluación
- Control de voltaje
- Conocimiento de procedimientos operativos
- Ejecución de procedimientos operativos
- Control de frecuencia
- Topología
- Comunicación operativa
- Conceptos de protecciones eléctricas
- Opción personalizada

## Credenciales de Prueba
| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@red-electrica.com | admin123 |
| Trainer | roberto@red-electrica.com | trainer123 |
| Student | juan@red-electrica.com | student123 |
| Student 2 | maria@red-electrica.com | student123 |
| SuperAdmin | ana@ots-system.com | super123 |

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Empresas
- `GET /api/companies` - Listar empresas
- `GET /api/companies/:id` - Obtener empresa

### Usuarios
- `GET /api/users/company/:companyId` - Usuarios por empresa

### Ciclos
- `GET /api/cycles/company/:companyId` - Ciclos por empresa
- `GET /api/cycles/student/:studentId` - Ciclos por estudiante
- `GET /api/cycles/trainer/:trainerId` - Ciclos por entrenador
- `POST /api/cycles` - Crear ciclo
- `PATCH /api/cycles/:id` - Actualizar ciclo

### Eventos
- `GET /api/events/cycle/:cycleId` - Eventos de un ciclo
- `POST /api/events` - Crear evento
- `PATCH /api/events/:id` - Actualizar evento

### Simulador
- `GET /api/simulator-scenarios` - Listar escenarios
- `GET /api/simulator-sessions/company/:companyId` - Sesiones por empresa

## Comandos Útiles
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run db:push      # Sincronizar esquema con BD
npx tsx server/seed.ts  # Poblar base de datos con datos de prueba
```

## Preferencias de Usuario
- **Idioma UI**: Español (México)
- **Tipografía**: Outfit para títulos, Inter para texto UI
- **Tema**: Oscuro con acentos cyan eléctrico
- **Estilo**: SCADA/Centro de control de energía

## Próximos Pasos Sugeridos
1. Implementar gráficas de radar para reportes individuales
2. Agregar generación de PDF para reportes
3. Sistema de notificaciones en tiempo real
4. Gestión de anexos (reportes de fallas, solicitudes de entrenamiento)
5. Dashboard de avance de programa anual
