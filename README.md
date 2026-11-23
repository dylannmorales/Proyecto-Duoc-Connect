# Duoc Connect

Plataforma web para estudiantes de Duoc UC: grupos de estudio con chat en tiempo real, banco de apuntes, foro académico, búsqueda de compañeros para proyectos y panel de administración. Esta versión llega hasta el **Sprint 8**:

| Sprint | Alcance | Estado |
|--------|---------|--------|
| 1 | Registro de usuarios | Incluido |
| 2 | Restablecer contraseña y perfil de usuario | Incluido |
| 3 | Gestionar usuarios y roles (administrador) | Incluido |
| 4 | Unirse a grupos y chat en tiempo real | Incluido |
| 5 | Notificaciones y subir apuntes | Incluido |
| 6 | Buscar, descargar y valorar apuntes (HU-10) | Incluido |
| 7 | Foro: publicar preguntas con imagen opcional (HU-11); responder, votar y aceptar solución (HU-12) | Incluido |
| — | Historias adicionales: compartir apuntes por vínculo (HU-18), editar grupo (HU-19), invitar al grupo por correo (HU-20) | Incluido |
| 8 | Panel de administración completo y moderación de contenido (HU-16, HU-17) | Incluido |
| 8 | Perfil de compañero y recomendación por compatibilidad (HU-13, HU-14) | Incluido |
| — | Mejoras: invitar por correo al crear o editar un grupo, compartir apuntes por correo, quien crea un grupo puede editarlo, selector con búsqueda, botón «Volver» con migas de pan y formularios rediseñados | Incluido |

### Historias de usuario adicionales

Surgieron después del backlog de Fase 1 (que llega hasta HU-17) y continúan su numeración y formato.

| ID | Rol | Funcionalidad | Criterio de aceptación |
|----|-----|---------------|------------------------|
| HU-18 | Estudiante | Compartir un apunte mediante un vínculo que aparece en un modal | Desde la tarjeta o el detalle del apunte, "Compartir" abre un modal con el vínculo `/apuntes/{id}`, el botón "Copiar vínculo" y la opción de enviarlo por Gmail. Quien abre el vínculo con sesión iniciada ve el apunte y puede descargarlo y valorarlo; sin sesión se le pide iniciarla y luego vuelve al apunte. |
| HU-19 | Creador o administrador del grupo | Editar el grupo de estudio | Quien creó el grupo (mientras siga siendo integrante) y el administrador del grupo ven "Editar" y puede cambiar nombre, descripción, carrera, asignatura, cupo y privacidad. El cupo no puede quedar bajo la cantidad de integrantes actuales y la asignatura debe ser de la carrera elegida. Un miembro sin esos permisos recibe 403. |
| HU-20 | Miembro del grupo | Compartir el grupo mediante una invitación por correo | "Compartir" abre un modal donde se agregan correos `@duocuc.cl`, se ven las personas con acceso (nombre, correo y rol) y "Copiar vínculo". Cada invitado recibe un correo con el vínculo `/grupos/unirse/{código}`; si ya tiene cuenta, también una notificación. Los correos no institucionales se rechazan y los que ya son miembros se omiten, informando el resultado de cada uno. |

## Pruebas e integración continua

Cada push y cada pull request ejecutan automáticamente (GitHub Actions, `.github/workflows/ci.yml`):

- **Backend:** las 111 pruebas unitarias con JUnit 5 y Mockito, más el reporte de cobertura JaCoCo (67,7 % de líneas). El resumen aparece en la pestaña *Actions* y el reporte completo se descarga como artefacto.
- **Frontend:** lint, chequeo de tipos y build.

Las pruebas cubren registro, inicio de sesión y recuperación de contraseña, perfil, grupos, chat, notificaciones, apuntes, foro, compañeros y su cálculo de compatibilidad, el panel de administración, la seguridad JWT, el manejo de errores y el almacenamiento de archivos. Además de las pruebas unitarias, el informe QA v2.1 documenta 94 pruebas de API, 38 pruebas E2E con Playwright y 8 pruebas de integridad de la base de datos: 268 casos en total, todos aprobados.

## Modelo de datos

El diagrama entidad-relación, el detalle de las tablas y la justificación de la normalización (3FN) están en [docs/modelo-datos.md](docs/modelo-datos.md) (diagrama también en [docs/modelo-er.svg](docs/modelo-er.svg)).

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
| `/` | Público | Inicio (el estado del sistema solo lo ve el administrador) |
| `/registro` | Invitado | Crear cuenta |
| `/login` | Invitado | Iniciar sesión |
| `/olvide-contrasena` | Invitado | Solicitar recuperación |
| `/recuperar-contrasena` | Invitado | Definir nueva contraseña |
| `/perfil` | Autenticado | Ver y editar perfil, subir foto |
| `/grupos` | Autenticado | Listar, crear y unirse a grupos (también por código) |
| `/grupos/:id` | Autenticado | Detalle del grupo, miembros y chat en tiempo real; compartir, invitar por correo y editar (creador o administrador del grupo) |
| `/grupos/unirse/:codigo` | Autenticado | Vínculo de invitación: muestra el grupo y permite unirse |
| `/apuntes` | Autenticado | Listar, filtrar, subir, descargar, valorar y compartir apuntes en PDF |
| `/apuntes/:id` | Autenticado | Vínculo compartido de un apunte: detalle, descarga y valoración |
| `/foro` | Autenticado | Listar y filtrar preguntas, hacer una pregunta |
| `/foro/:id` | Autenticado | Detalle: responder, votar y aceptar solución |
| `/companeros` | Autenticado | Perfil de compañero (habilidades, asignaturas y horarios) y compañeros recomendados por compatibilidad |
| `/companeros/:usuarioId` | Autenticado | Perfil de un compañero con su compatibilidad y el botón «Invitar a mi grupo» (sin necesitar su correo) |
| `/invitaciones` | Autenticado | Invitaciones a grupos recibidas desde el perfil de compañero: aceptar (entra al grupo) o rechazar |
| `/admin` | Administrador | Resumen, usuarios y roles, y moderación de apuntes, preguntas, respuestas, grupos, mensajes, fotos y perfiles de compañero (ver, editar, eliminar) |

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
| GET | `/catalogos/carreras`, `/catalogos/sedes`, `/catalogos/asignaturas?carreraId=`, `/catalogos/habilidades` | Catálogos |
| GET | `/status` | Estado de la aplicación |
| GET / POST | `/grupos` | Listar (con filtros) / crear grupo (puede incluir correos a invitar) |
| GET | `/grupos/{id}`, `/grupos/codigo/{codigo}` | Detalle / buscar por código |
| POST | `/grupos/{id}/unirse`, `/grupos/unirse-por-codigo` | Unirse (el `POST` requiere `Content-Type: application/json`) |
| DELETE | `/grupos/{id}/salir` | Salir del grupo. Si sale el administrador, la administración pasa al integrante más antiguo; si sale el último integrante, el grupo se elimina con su chat. Devuelve `grupoEliminado` y `nuevoAdministrador` |
| PUT | `/grupos/{id}` | Editar grupo (creador o administrador del grupo) |
| POST | `/grupos/{id}/invitaciones` | Invitar por correo: `{ "emails": [...] }` (hasta 20, solo `@duocuc.cl`; devuelve el resultado por correo) |
| GET | `/grupos/{id}/miembros` | Miembros (con su correo) |
| GET / POST | `/grupos/{id}/mensajes` | Historial / enviar mensaje |
| GET | `/notificaciones`, `/notificaciones/no-leidas` | Notificaciones y contador |
| PATCH | `/notificaciones/{id}/leida`, `/notificaciones/leer-todas` | Marcar como leídas |
| GET | `/apuntes`, `/apuntes/{id}` | Listar con filtros / detalle |
| POST | `/apuntes` | Subir apunte (multipart, PDF de hasta 10 MB) |
| GET | `/apuntes/{id}/descargar` | Descargar el PDF (suma una descarga) |
| PUT | `/apuntes/{id}/valoracion` | Valorar de 1 a 5 (no el propio; se puede cambiar) |
| POST | `/apuntes/{id}/compartir` | Compartir por correo: `{ "emails": [...], "mensaje": "..." }` (solo `@duocuc.cl`; notifica a quien ya tiene cuenta) |
| GET / PUT | `/companeros/perfil` | Mi perfil de compañero: bio, visibilidad, asignaturas, habilidades y horarios |
| GET | `/companeros/recomendaciones`, `/companeros/buscar?asignaturaId=&habilidadId=` | Compañeros ordenados por compatibilidad (carrera 25, asignaturas 30, horario 25, habilidades complementarias 20) |
| GET | `/companeros/{usuarioId}/perfil` | Perfil de compañero de otro estudiante (respeta su visibilidad) |
| GET | `/companeros/{usuarioId}/grupos-invitables` | Mis grupos, indicando a cuáles puedo invitar a ese compañero |
| POST | `/companeros/{usuarioId}/invitaciones` | Invitar a un compañero a uno de mis grupos: `{ "grupoId": "...", "mensaje": "..." }`. Le llega una notificación; no se usa ni se muestra su correo |
| GET | `/invitaciones` | Invitaciones pendientes que recibí |
| POST | `/invitaciones/{id}/aceptar`, `/invitaciones/{id}/rechazar` | Responder: aceptar une al grupo (aunque sea privado, si hay cupo); en ambos casos se avisa a quien invitó |
| GET | `/foro/preguntas` | Listar con filtros: `carreraId`, `asignaturaId`, `q`, `estado` (`TODAS`, `ABIERTAS`, `RESUELTAS`), `orden` (`recientes`, `votos`) |
| POST | `/foro/preguntas` | Publicar pregunta (multipart: `titulo`, `contenido`, `carreraId`, `asignaturaId` o `tematicaGeneral=true`, `imagen` opcional JPG/PNG/WebP de hasta 2 MB) |
| GET | `/foro/preguntas/{id}` | Detalle con respuestas |
| POST | `/foro/preguntas/{id}/respuestas` | Responder (notifica al autor) |
| POST | `/foro/preguntas/{id}/votos`, `/foro/respuestas/{id}/votos` | Votar / quitar voto (no el propio) |
| POST | `/foro/respuestas/{id}/aceptar` | Aceptar o quitar la solución (solo el autor de la pregunta) |
| GET | `/admin/stats`, `/admin/usuarios` | Solo administrador: estadísticas y usuarios |
| PATCH | `/admin/usuarios/{id}/rol`, `/admin/usuarios/{id}/estado` | Solo administrador: cambiar rol y activar o desactivar |
| GET, PATCH, DELETE | `/admin/apuntes`, `/admin/foro/preguntas`, `/admin/foro/respuestas`, `/admin/grupos`, `/admin/mensajes` (y `/{id}`) | Solo administrador: listar, editar y eliminar contenido |
| GET | `/admin/apuntes/{id}/descargar` | Solo administrador: descargar un PDF para revisarlo (no suma descargas) |
| GET, DELETE | `/admin/fotos-perfil`, `/admin/fotos-perfil/{usuarioId}` | Solo administrador: revisar y eliminar fotos de perfil |
| GET, PATCH, DELETE | `/admin/perfiles-proyecto`, `/admin/perfiles-proyecto/{usuarioId}` | Solo administrador: moderar perfiles de compañero |

Las rutas fuera de `/auth/**`, `/catalogos/**` y `/status` requieren el header `Authorization: Bearer <accessToken>`. Las `/admin/**` requieren además el rol `ADMINISTRADOR`.

### Chat en tiempo real (WebSocket)

STOMP sobre SockJS. El JWT se envía en el header `Authorization` al conectar y solo los miembros del grupo pueden suscribirse.

| Recurso | Ruta |
|---------|------|
| Endpoint | `/ws` |
| Suscribirse | `/topic/grupos/{grupoId}` |
| Enviar mensaje | `/app/grupos/{grupoId}/mensajes` |

Los correos (recuperación de contraseña, invitaciones a grupos y apuntes compartidos) no se envían todavía: en desarrollo se imprimen en la consola del backend con su enlace. Para entregarlos de verdad hay que implementar `EmailPort` con un servidor SMTP.

## Usuario administrador (demo)

Al arrancar por primera vez, el backend crea un administrador si no existe (clase `AdminBootstrap`). Las credenciales salen de las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Solo el perfil `dev` trae una contraseña por defecto:

| Campo | Valor en dev |
|-------|-------|
| Email | `admin@duocuc.cl` |
| Contraseña | `Admin1234` |

En `prod` no hay valores por defecto: si falta `ADMIN_PASSWORD` no se crea el administrador, y si falta `JWT_SECRET` el backend no arranca.

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
| `UPLOAD_PATH` | Carpeta de archivos subidos (fotos, PDF e imágenes del foro) | `./uploads` |
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
├── .github/workflows/   # CI: pruebas, lint y build en cada push y PR
├── backend/            # API REST Spring Boot
│   ├── src/main/resources/db/migration/  # Flyway V1 a V7
│   ├── src/test/java/   # 111 pruebas unitarias (JUnit 5 + Mockito)
│   └── src/main/java/cl/duoc/connect/
│       ├── presentation/    # controladores, configuración, manejo de errores
│       ├── application/     # servicios, DTOs, mappers, puertos
│       ├── domain/          # enums, excepciones, cálculo de compatibilidad
│       └── infrastructure/  # JPA, seguridad JWT, email, almacenamiento
├── frontend/           # SPA React
│   └── src/
│       ├── app/             # rutas y providers
│       ├── features/        # auth, profile, home, groups, notes, forum, companions, notifications, admin
│       └── shared/          # layout, hooks, utilidades
├── docs/               # modelo de datos (3FN) y diagrama entidad-relación
├── Fase 1/             # evidencias de la Fase 1 (plan de pruebas, diagramas)
├── docker-compose.yml
└── README.md
```

## Comandos útiles

| Comando | Dónde | Qué hace |
|---------|-------|----------|
| `mvn spring-boot:run` | `backend/` | Inicia la API |
| `mvn test` | `backend/` | Ejecuta las 111 pruebas unitarias y genera el reporte de cobertura en `target/site/jacoco/index.html` (67,7 % de líneas) |
| `mvn -DskipTests package` | `backend/` | Genera el JAR |
| `npm run dev` | `frontend/` | Servidor de desarrollo |
| `npm run build` | `frontend/` | Chequea tipos y compila |
| `npm run lint` | `frontend/` | Revisa el código con ESLint |
