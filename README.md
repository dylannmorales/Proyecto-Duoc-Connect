# Duoc Connect

Plataforma web para estudiantes de Duoc UC. Esta versión llega hasta el **Sprint 5**:

| Sprint | Alcance | Estado |
|--------|---------|--------|
| 1 | Registro de usuarios | Incluido |
| 2 | Restablecer contraseña y perfil de usuario | Incluido |
| 3 | Gestionar usuarios y roles (administrador) | Incluido |
| 4 | Unirse a grupos y chat en tiempo real | Incluido |
| 5 | Notificaciones y subir apuntes | Incluido |
| 6 en adelante | Descargar y valorar apuntes, foro, buscar compañeros, moderación, panel de administración completo | Pendiente |

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, TailwindCSS, Vite |
| Backend | Spring Boot 3.3, Java 17+ |
| Base de datos | PostgreSQL 16 (migraciones con Flyway) |
| Seguridad | Spring Security, JWT |

## Requisitos

| Herramienta | Versión | Para qué |
|-------------|---------|----------|
| JDK | 17 o superior | Backend |
| Maven | 3.9+ | Backend (no hay wrapper completo en el repo) |
| Node.js | 20+ | Frontend |
| Docker Desktop | reciente | PostgreSQL (recomendado) |

Verifica las versiones:

```bash
java -version
mvn -v
node -v
docker --version
```

## Levantar el proyecto

Necesitas **tres pasos**, cada uno en su propia terminal: base de datos, backend y frontend.

### 1. Base de datos

Abre Docker Desktop y espera a que el motor esté activo. Luego, desde la raíz del repo:

```bash
docker compose up -d postgres
```

Comprueba que esté sano:

```bash
docker ps
```

Debe aparecer `duoc-connect-db` con estado `healthy`.

> **¿Ya tienes PostgreSQL instalado en tu máquina?** Si algo más ocupa el puerto 5432, el backend se conectará a ese servidor y fallará con `la autentificación password falló para el usuario "duoc"`. Revisa el puerto:
>
> ```powershell
> Get-NetTCPConnection -LocalPort 5432 -State Listen
> ```
>
> Si está ocupado, ve a [Puerto 5432 ocupado](#puerto-5432-ocupado).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Está listo cuando responde:

```bash
curl http://localhost:8080/api/v1/status
```

En el primer arranque Flyway crea las tablas y carga los catálogos (carreras y sedes).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173.

## URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080/api/v1 |
| Swagger | http://localhost:8080/swagger-ui.html |
| Health check | http://localhost:8080/actuator/health |
| Estado de la app | http://localhost:8080/api/v1/status |

## Rutas del frontend

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Inicio y estado del sistema |
| `/registro` | Invitado | Crear cuenta |
| `/login` | Invitado | Iniciar sesión |
| `/olvide-contrasena` | Invitado | Solicitar recuperación |
| `/recuperar-contrasena` | Invitado | Definir nueva contraseña |
| `/perfil` | Autenticado | Ver y editar perfil, subir foto |
| `/grupos` | Autenticado | Listar, crear y unirse a grupos (también por código) |
| `/grupos/:id` | Autenticado | Detalle del grupo, miembros y chat en tiempo real |
| `/apuntes` | Autenticado | Listar, filtrar y subir apuntes en PDF |
| `/admin` | Administrador | Resumen, usuarios y roles |

La campana de notificaciones aparece en la barra superior cuando hay sesión iniciada.

## API

Base: `/api/v1`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/auth/form-token` | Token de seguridad para los formularios |
| POST | `/auth/register` | Registro |
| POST | `/auth/login` | Login (devuelve access y refresh token) |
| POST | `/auth/refresh` | Renovar token |
| POST | `/auth/forgot-password` | Solicitar recuperación |
| POST | `/auth/reset-password` | Restablecer contraseña |
| GET | `/usuarios/me` | Mi perfil |
| PUT | `/usuarios/me` | Actualizar mi perfil |
| POST | `/usuarios/me/foto` | Subir foto (JPG, PNG o WebP, máx. 2 MB) |
| GET | `/usuarios/{id}` | Perfil público |
| GET | `/catalogos/carreras`, `/catalogos/sedes`, `/catalogos/asignaturas?carreraId=` | Catálogos |
| GET | `/status` | Estado de la aplicación |
| GET / POST | `/grupos` | Listar (con filtros) / crear grupo |
| GET | `/grupos/{id}`, `/grupos/codigo/{codigo}` | Detalle / buscar por código |
| POST | `/grupos/{id}/unirse`, `/grupos/unirse-por-codigo` | Unirse (el `POST` requiere `Content-Type: application/json`) |
| DELETE | `/grupos/{id}/salir` | Salir del grupo |
| GET | `/grupos/{id}/miembros` | Miembros |
| GET / POST | `/grupos/{id}/mensajes` | Historial / enviar mensaje |
| GET | `/notificaciones`, `/notificaciones/no-leidas` | Notificaciones y contador |
| PATCH | `/notificaciones/{id}/leida`, `/notificaciones/leer-todas` | Marcar como leídas |
| GET | `/apuntes`, `/apuntes/{id}` | Listar con filtros / detalle |
| POST | `/apuntes` | Subir apunte (multipart, PDF de hasta 10 MB) |
| GET | `/admin/stats`, `/admin/usuarios` | Solo administrador: estadísticas y usuarios |
| PATCH | `/admin/usuarios/{id}/rol`, `/admin/usuarios/{id}/estado` | Solo administrador: cambiar rol y activar o desactivar |

Las rutas fuera de `/auth/**`, `/catalogos/**` y `/status` requieren el header `Authorization: Bearer <accessToken>`. Las `/admin/**` requieren además el rol `ADMINISTRADOR`.

### Chat en tiempo real (WebSocket)

STOMP sobre SockJS. El JWT se envía en el header `Authorization` al conectar y solo los miembros del grupo pueden suscribirse.

| Recurso | Ruta |
|---------|------|
| Endpoint | `/ws` |
| Suscribirse | `/topic/grupos/{grupoId}` |
| Enviar mensaje | `/app/grupos/{grupoId}/mensajes` |

El correo de recuperación de contraseña no se envía: en desarrollo el enlace se imprime en la consola del backend.

## Usuario administrador (demo)

Al arrancar por primera vez, el backend crea un administrador si no existe (clase `AdminBootstrap`):

| Campo | Valor |
|-------|-------|
| Email | `admin@duocuc.cl` |
| Contraseña | `Admin1234` |

**Cambia estas credenciales antes de desplegar a producción.**

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores. Las más importantes:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `SPRING_DATASOURCE_URL` | URL JDBC de PostgreSQL | `jdbc:postgresql://localhost:5432/duoc_connect` |
| `SPRING_DATASOURCE_USERNAME` | Usuario de la BD | `duoc` |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de la BD | `duoc_secret` |
| `JWT_SECRET` | Clave de firma JWT (mínimo 256 bits). **Cámbiala en producción** | valor de ejemplo |
| `JWT_ACCESS_EXPIRATION_MS` | Vida del access token | `900000` (15 min) |
| `JWT_REFRESH_EXPIRATION_MS` | Vida del refresh token | `604800000` (7 días) |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `UPLOAD_PATH` | Carpeta de fotos subidas | `./uploads` |
| `VITE_API_URL` | URL de la API para el frontend | `http://localhost:8080/api/v1` |

## Solución de problemas

### Puerto 5432 ocupado

Levanta PostgreSQL en otro puerto y apunta el backend ahí, sin modificar archivos del repo.

```bash
docker run -d --name duoc-connect-db -p 5433:5432 \
  -e POSTGRES_DB=duoc_connect -e POSTGRES_USER=duoc -e POSTGRES_PASSWORD=duoc_secret \
  -v duoc-connect_postgres_data:/var/lib/postgresql/data postgres:16-alpine
```

Arranca el backend con la URL del nuevo puerto:

```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5433/duoc_connect'
mvn spring-boot:run
```

En Git Bash / Linux / macOS:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/duoc_connect mvn spring-boot:run
```

Las siguientes veces solo necesitas `docker start duoc-connect-db`. No uses `docker compose up` mientras el 5432 siga ocupado.

### Docker: "failed to connect to the docker API"

Docker Desktop no está iniciado. Ábrelo y espera a que el motor esté activo antes de ejecutar `docker compose`.

### El puerto 8080 o 5173 ya está en uso

Cierra el proceso que lo ocupa o cambia el puerto: `server.port` en `backend/src/main/resources/application.yml` y `server.port` en `frontend/vite.config.ts`.

### Reiniciar la base de datos desde cero

Esto **borra todos los datos**:

```bash
docker compose down -v
docker compose up -d postgres
```

## Ejecutar todo con Docker

```bash
docker compose up -d --build
```

Levanta PostgreSQL, el backend (puerto 8080) y el frontend servido por nginx (puerto 5173).

## Estructura del proyecto

```
duoc-connect/
├── backend/            # API REST Spring Boot
│   └── src/main/java/cl/duoc/connect/
│       ├── presentation/    # controladores, configuración, manejo de errores
│       ├── application/     # servicios, DTOs, mappers, puertos
│       ├── domain/          # enums, excepciones
│       └── infrastructure/  # JPA, seguridad JWT, email, almacenamiento
├── frontend/           # SPA React
│   └── src/
│       ├── app/             # rutas y providers
│       ├── features/        # auth, profile, home, groups, notes, notifications, admin
│       └── shared/          # layout, hooks, utilidades
├── docker-compose.yml
└── README.md
```

## Comandos útiles

| Comando | Dónde | Qué hace |
|---------|-------|----------|
| `mvn spring-boot:run` | `backend/` | Inicia la API |
| `mvn test` | `backend/` | Ejecuta los tests |
| `mvn -DskipTests package` | `backend/` | Genera el JAR |
| `npm run dev` | `frontend/` | Servidor de desarrollo |
| `npm run build` | `frontend/` | Chequea tipos y compila |
