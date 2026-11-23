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
| — | Historias adicionales: ver el perfil de un compañero (HU-21) e invitarlo a un grupo sin conocer su correo (HU-22) | Incluido |
| — | Mejoras: invitar por correo al crear o editar un grupo, compartir apuntes por correo, quien crea un grupo puede editarlo, selector con búsqueda, botón «Volver» con migas de pan y formularios rediseñados | Incluido |

### Historias de usuario adicionales

Surgieron después del backlog de Fase 1 (que llega hasta HU-17) y continúan su numeración y formato.

| ID | Rol | Funcionalidad | Criterio de aceptación |
|----|-----|---------------|------------------------|
| HU-18 | Estudiante | Compartir un apunte mediante un vínculo que aparece en un modal | Desde la tarjeta o el detalle del apunte, "Compartir" abre un modal con el vínculo `/apuntes/{id}`, el botón "Copiar vínculo" y la opción de enviarlo por Gmail. Quien abre el vínculo con sesión iniciada ve el apunte y puede descargarlo y valorarlo; sin sesión se le pide iniciarla y luego vuelve al apunte. |
| HU-19 | Creador o administrador del grupo | Editar el grupo de estudio | Quien creó el grupo (mientras siga siendo integrante) y el administrador del grupo ven "Editar" y puede cambiar nombre, descripción, carrera, asignatura, cupo y privacidad. El cupo no puede quedar bajo la cantidad de integrantes actuales y la asignatura debe ser de la carrera elegida. Un miembro sin esos permisos recibe 403. |
| HU-20 | Miembro del grupo | Compartir el grupo mediante una invitación por correo | "Compartir" abre un modal donde se agregan correos `@duocuc.cl`, se ven las personas con acceso (nombre, correo y rol) y "Copiar vínculo". Cada invitado recibe un correo con el vínculo `/grupos/unirse/{código}`; si ya tiene cuenta, también una notificación. Los correos no institucionales se rechazan y los que ya son miembros se omiten, informando el resultado de cada uno. |
| HU-21 | Estudiante | Ver el perfil de un compañero desde "Buscar compañeros" | Al hacer clic en una tarjeta de recomendación o de resultado se abre `/companeros/{id}` con bio, carrera, sede, semestre, asignaturas, habilidades, horarios y la compatibilidad conmigo. Solo se muestra si la persona busca compañero y su visibilidad lo permite; si no, aparece "Perfil no disponible". |
| HU-22 | Estudiante | Invitar a un compañero a mi grupo sin conocer su correo | En su perfil, "Invitar a mi grupo" permite elegir uno de mis grupos y escribir un mensaje opcional. La persona recibe una notificación y en `/invitaciones` acepta (entra al grupo, aunque sea privado, si hay cupo) o rechaza; quien invitó recibe la respuesta. No se puede invitar dos veces al mismo grupo, a quien ya es integrante ni a un grupo lleno, y el correo nunca se muestra. |

## Pruebas e integración continua

Cada push y cada pull request ejecutan automáticamente (GitHub Actions, `.github/workflows/ci.yml`):

- **Backend:** las 135 pruebas unitarias con JUnit 5 y Mockito, más el reporte de cobertura JaCoCo (68,6 % de líneas). El resumen aparece en la pestaña *Actions* y el reporte completo se descarga como artefacto.
- **Frontend:** lint, chequeo de tipos y build.

Las pruebas cubren registro, inicio de sesión y recuperación de contraseña, perfil, grupos, chat, notificaciones, apuntes, foro, compañeros y su cálculo de compatibilidad, las invitaciones directas a grupos, el panel de administración, la seguridad JWT, el manejo de errores y el almacenamiento de archivos. Además de las pruebas unitarias, el informe QA v2.1 documenta 94 pruebas de API, 38 pruebas E2E con Playwright y 8 pruebas de integridad de la base de datos: 268 casos en total, todos aprobados.

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

Solo necesitas **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (y Git para clonar el repo).

No hace falta instalar Java, Maven, Node.js ni PostgreSQL: el backend y el frontend se compilan dentro de sus contenedores y la base de datos corre en otro contenedor.

| Contenedor | Qué es | Puerto |
|------------|--------|--------|
| `duoc-connect-db` | PostgreSQL 16 | `5433` en tu equipo |
| `duoc-connect-api` | Backend Spring Boot (Java 17) | `8080` |
| `duoc-connect-web` | Frontend React servido por nginx | `5173` |

## Levantar el proyecto

1. Abre **Docker Desktop** y espera a que diga que el motor está corriendo.
2. Clona el repo y entra a la carpeta:

   ```bash
   git clone https://github.com/dylannmorales/Proyecto-Duoc-Connect.git
   cd Proyecto-Duoc-Connect
   ```

3. *(Opcional)* Para guardar los PDF de apuntes en AWS S3, crea el archivo `.env.local` (ver [Configuración](#configuración-env-y-envlocal)). Sin él, el proyecto funciona igual y los PDF se guardan en un volumen de Docker.
4. Levanta todo:

   ```bash
   docker compose up -d --build
   ```

   La primera vez tarda unos minutos: descarga las imágenes y compila el backend y el frontend (necesita internet). Flyway crea las tablas y carga los catálogos, y se crea el [usuario administrador de demo](#usuario-administrador-demo).
5. Abre **http://localhost:5173**.

Para comprobar que todo está arriba:

```bash
docker compose ps
```

Los tres contenedores deben aparecer como `running` (la BD además como `healthy`).

### Uso diario

| Acción | Comando |
|--------|---------|
| Levantar (después de la primera vez) | `docker compose up -d` |
| Detener (los datos se conservan) | `docker compose down` |
| Recompilar después de cambiar código o hacer `git pull` | `docker compose up -d --build` |
| Ver los logs del backend | `docker compose logs -f backend` |
| Comprobar que S3 está activo | `docker compose logs backend \| grep S3` |

### Configuración (`.env` y `.env.local`)

La configuración vive en el archivo **`.env` de la raíz, que viene en el repo** con valores que funcionan tal cual: no hay que crear ni exportar nada para empezar.

- La BD se publica en el puerto **5433** de tu equipo, así no choca con un PostgreSQL que ya tengas instalado.
- S3 viene **desactivado** (`AWS_S3_ENABLED=false`).

**Para activar S3** (o cambiar cualquier valor sin tocar el repo) crea un archivo **`.env.local`** en la raíz. Está en `.gitignore`, así que nunca se sube, y sus valores pisan a los del `.env`:

```ini
AWS_S3_ENABLED=true
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret>
```

Pide las claves al equipo y vuelve a ejecutar `docker compose up -d` para que el backend las tome. ⚠️ **No pongas claves reales en `.env`**: ese archivo se sube a GitHub, el repo es público y AWS bloquea automáticamente las claves que encuentra publicadas.

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

Van en el `.env` de la raíz (versionado) y, las secretas, en `.env.local` (no versionado, pisa al `.env`); ver [Configuración](#configuración-env-y-envlocal). Las variables de entorno del sistema tienen prioridad sobre ambos archivos. Las más importantes (valor del `.env`):

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `POSTGRES_PORT` | Puerto del equipo donde Docker publica PostgreSQL | `5433` |
| `POSTGRES_VOLUME` | Volumen de Docker con los datos de la BD | `duoc-connect_postgres_data` |
| `SPRING_DATASOURCE_URL` | URL JDBC de PostgreSQL (modo desarrollo) | `jdbc:postgresql://localhost:5433/duoc_connect` |
| `SPRING_DATASOURCE_USERNAME` | Usuario de la BD | `duoc` |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de la BD | `duoc_secret` |
| `JWT_SECRET` | Clave de firma JWT (mínimo 256 bits). **Cámbiala en producción** | valor de ejemplo |
| `JWT_ACCESS_EXPIRATION_MS` | Vida del access token | `900000` (15 min) |
| `JWT_REFRESH_EXPIRATION_MS` | Vida del refresh token | `604800000` (7 días) |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `UPLOAD_PATH` | Carpeta de archivos subidos (fotos, PDF e imágenes del foro) | `./uploads` |
| `AWS_S3_ENABLED` | `true` guarda los PDF de apuntes en S3 en vez de `UPLOAD_PATH` | `false` (actívalo en `.env.local`) |
| `AWS_S3_BUCKET` | Nombre del bucket | `duoc-connect` |
| `AWS_REGION` | Región del bucket | `us-east-2` |
| `AWS_S3_PREFIX` | Carpeta dentro del bucket | `apuntes/` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credenciales del usuario IAM. **Solo en `.env.local`** (también sirve `~/.aws/credentials`) | vacías |
| `VITE_API_URL` | URL de la API para el frontend | `http://localhost:8080/api/v1` |

## PDF de apuntes en AWS S3 (capa gratuita)

El proyecto usa el bucket privado **`duoc-connect`** en **`us-east-2` (Ohio)**. Para que funcione en tu equipo basta con un `.env.local` con las claves (ver [Configuración](#configuración-env-y-envlocal)); los pasos de esta sección solo hacen falta para crear un bucket propio.

Sin S3, los PDF se guardan en disco. Con S3 activo, los **PDF de apuntes** se suben a un bucket privado; las fotos de perfil y las imágenes del foro siguen en disco. La descarga pasa por el backend (`GET /api/v1/apuntes/{id}/descargar`), así que el bucket nunca queda público y se mantiene el control de acceso de la app. Los apuntes subidos antes de activar S3 se siguen descargando desde disco.

### 1. Crear el bucket

1. Crea una cuenta en <https://aws.amazon.com/free/> (pide tarjeta, pero con este uso no hay cobro dentro de la capa gratuita).
2. En la consola, ve a **S3 → Create bucket**:
   - Nombre único global (el del proyecto es `duoc-connect`).
   - Región: la del proyecto es `us-east-2`; usa la misma en `AWS_REGION`.
   - Deja marcado **Block all public access**.
   - Cifrado por defecto SSE-S3 (viene activado).

### 2. Crear un usuario IAM con permisos mínimos

1. **IAM → Users → Create user**, por ejemplo `duoc-connect-backend`, sin acceso a la consola.
2. **Add permissions → Create inline policy → JSON** y pega (cambia el nombre del bucket):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::duoc-connect/apuntes/*"
     }]
   }
   ```
3. En el usuario: **Security credentials → Create access key → Application running outside AWS**. Copia el *Access key ID* y el *Secret access key* (el secreto solo se muestra una vez).

> Nunca subas estas claves al repositorio: el repo es público y AWS bloquea las claves que detecta en GitHub. Van solo en `.env.local` (ignorado por git), nunca en `.env`.

### 3. Activarlo en el backend

Crea `.env.local` en la raíz (el bucket y la región ya vienen en el `.env`):

```ini
AWS_S3_ENABLED=true
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret>
```

Luego ejecuta `docker compose up -d` para que el backend tome los valores. En `docker compose logs backend` deben aparecer `S3: usando las claves...` y `PDF de apuntes en S3: bucket=duoc-connect`. Sube un apunte y verifícalo en la consola de S3, dentro de `apuntes/`.

### Mantenerse en la capa gratuita

- El plan gratuito de S3 incluye 5 GB de almacenamiento estándar, 20.000 GET y 2.000 PUT al mes. Con PDF de hasta 10 MB alcanza para cientos de apuntes. Las cuentas creadas desde julio de 2025 reciben en cambio créditos del *Free plan*; revisa en **Billing → Free Tier** qué te corresponde.
- Crea una alerta en **Billing → Budgets → Create budget → Zero spend budget** para recibir un correo si aparece cualquier cobro.

## Solución de problemas

### Puerto 5433 ocupado

Si algo más usa el 5433 en tu equipo, cambia el puerto publicado de la BD en `.env.local` (por ejemplo `POSTGRES_PORT=5434`) y vuelve a ejecutar `docker compose up -d`. Dentro de Docker el backend se conecta a la BD por la red interna, así que no hay que cambiar nada más.

### Docker: "failed to connect to the docker API"

Docker Desktop no está iniciado. Ábrelo y espera a que el motor esté activo antes de ejecutar `docker compose`.

### El puerto 8080 o 5173 ya está en uso

Cierra el programa que lo ocupa (por ejemplo, un `mvn spring-boot:run` o `npm run dev` que quedó abierto) o cambia el puerto publicado en la sección `ports` de `docker-compose.yml` (el número de la izquierda).

### Reiniciar la base de datos desde cero

Esto **borra todos los datos**:

```bash
docker compose down -v
docker compose up -d
```

## Estructura del proyecto

```
duoc-connect/
├── .github/workflows/   # CI: pruebas, lint y build en cada push y PR
├── backend/            # API REST Spring Boot
│   ├── src/main/resources/db/migration/  # Flyway V1 a V8
│   ├── src/test/java/   # 135 pruebas unitarias (JUnit 5 + Mockito)
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

| Comando | Qué hace |
|---------|----------|
| `docker compose up -d --build` | Compila y levanta todo |
| `docker compose down` | Detiene todo (conserva los datos) |
| `docker compose logs -f backend` | Muestra los logs del backend |
| `docker run --rm -v "${PWD}/backend:/app" -w /app maven:3.9-eclipse-temurin-17 mvn test` | Ejecuta las 135 pruebas del backend sin instalar Java ni Maven (desde la raíz del repo; el reporte de cobertura queda en `backend/target/site/jacoco/index.html`) |

## Desarrollo sin Docker (opcional)

Solo si quieres ejecutar el backend o el frontend fuera de Docker, por ejemplo para depurar o tener recarga automática del frontend. Necesitas **JDK 17+**, **Maven 3.9+** y **Node.js 20+** instalados. La BD sigue corriendo en Docker:

```bash
docker compose up -d postgres
```

| Comando | Dónde | Qué hace |
|---------|-------|----------|
| `mvn spring-boot:run` | `backend/` | Inicia la API (lee `.env` y `.env.local` de la raíz) |
| `mvn test` | `backend/` | Ejecuta las 135 pruebas unitarias y genera el reporte de cobertura en `target/site/jacoco/index.html` (68,6 % de líneas) |
| `npm install` y `npm run dev` | `frontend/` | Servidor de desarrollo con recarga en http://localhost:5173 |
| `npm run build` | `frontend/` | Chequea tipos y compila |
| `npm run lint` | `frontend/` | Revisa el código con ESLint |

Antes de levantar el backend o el frontend así, detén sus contenedores para liberar los puertos: `docker compose stop backend frontend`.
