# Techkepper Command Center

Centro multiagente para ventas, soporte y operaciones mediante la API oficial
de WhatsApp Business Platform (Cloud API) de Meta.

## Funciones principales

- Bandeja multiagente con estados pendiente, en atención y resuelto.
- Búsqueda por cliente, número y contenido de mensajes.
- Historial por agente con acceso a la conversación completa.
- Consulta histórica en modo solo lectura para evitar cambios en tickets ajenos.
- Roles de administrador, supervisor y agente.
- Departamentos, ecosistemas, respuestas rápidas y auditoría de asignaciones.
- React 16, Vite, Material UI, Node.js, TypeScript, Express y Sequelize.
- MySQL/MariaDB y actualizaciones mediante Socket.IO.
- WhatsApp Cloud API oficial, sin QR, WhatsApp Web ni credenciales de sesión local.

## Requisitos

- Node.js 24.18.0 LTS.
- npm 10 o superior (incluido con Node 24).
- MySQL 8 o MariaDB 10.11+.
- Una cuenta empresarial de Meta, WABA y número registrado en Cloud API.
- Docker Engine y Docker Compose para despliegue en contenedores.

## Configuración local

1. Copie `backend/.env.example` como `backend/.env`.
2. Copie `frontend/.env.example` como `frontend/.env`.
3. Configure la base de datos, URLs y secretos JWT.
4. Defina `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`. La contraseña debe
   tener al menos 12 caracteres.
5. Configure las variables de WhatsApp Cloud API descritas más adelante.
6. Prepare el backend:

```bash
cd backend
npm install
npm run build
npx sequelize db:migrate
npx sequelize db:seed:all
npm run dev
```

7. En otra terminal, prepare el frontend:

```bash
cd frontend
npm install
npm run dev
```

8. Abra `http://localhost:3000`.

No se crea un usuario con credenciales públicas. El seed inicial solo crea el
administrador cuando se proporcionan sus variables seguras.

## Docker

1. Copie `.env.example` como `.env`.
2. Elija el modo de base de datos:
   - **MySQL local en Docker (desarrollo):** deje `COMPOSE_PROFILES=local-db` y
     configure `MYSQL_ROOT_PASSWORD`.
   - **MySQL remoto (MySQL 8.x, Site4Now, etc.):** elimine o comente
     `COMPOSE_PROFILES=local-db` y configure `DATABASE_URL` o `DB_HOST`,
     `DB_NAME`, `DB_USER` y `DB_PASS`.
3. Cambie obligatoriamente `JWT_SECRET`, `JWT_REFRESH_SECRET` e
   `INITIAL_ADMIN_PASSWORD`.
4. Configure las credenciales de Meta.
5. Ejecute:

```bash
docker compose build
docker compose up -d
docker compose logs -f backend
```

El backend ejecuta migraciones y seeds al iniciar (ver `backend/Dockerfile`).

### MySQL remoto (MySQL 8.x)

La app usa Sequelize + `mysql2` y es compatible con **MySQL 8.x** y MariaDB.

Ejemplo para Site4Now — connection string Node:

```env
COMPOSE_PROFILES=
DATABASE_URL=mysql://aa7e7f_command:YOUR_DB_PASSWORD@MYSQL5044.site4now.net:3306/db_aa7e7f_command
DB_SSL=true
# Site4Now usa certificado autofirmado; no verificar la CA del hosting:
DB_SSL_REJECT_UNAUTHORIZED=false
```

Equivalente con variables separadas:

```env
DB_HOST=MYSQL5044.site4now.net
DB_PORT=3306
DB_NAME=db_aa7e7f_command
DB_USER=aa7e7f_command
DB_PASS=YOUR_DB_PASSWORD
DB_SSL=true
```

Si la contraseña tiene caracteres especiales en `DATABASE_URL`, codifíquelos
en URL (por ejemplo `@` → `%40`, `!` → `%21`).

Con MySQL remoto **no se levanta** el contenedor `mysql`. Con
`COMPOSE_PROFILES=local-db` se usa la base local como hasta ahora.

### Reset desde cero (desarrollo)

El esquema completo vive en una sola migración baseline:
`backend/src/database/migrations/20200717000000-initial-schema.ts`

Para borrar la base de datos y volver a levantar todo:

```bash
./scripts/db-reset-dev.sh
```

O manualmente:

```bash
docker compose down -v
docker compose up -d --build
```

Eso recrea MySQL vacío, aplica la migración baseline y ejecuta los seeds.

## WhatsApp Cloud API

La integración usa la API oficial alojada por Meta. No se escanea un QR y el
backend no almacena credenciales de WhatsApp Web.

Variables requeridas:

- `WHATSAPP_PROVIDER=cloudapi`
- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_GRAPH_API_VERSION`
- `META_WHATSAPP_VERIFY_TOKEN`
- `META_WHATSAPP_APP_SECRET`

Para varias conexiones pueden definirse variables por ID de conexión, por
ejemplo `META_WHATSAPP_2_ACCESS_TOKEN` y
`META_WHATSAPP_2_PHONE_NUMBER_ID`.

En la aplicación de Meta configure:

- Callback URL: `https://SU-BACKEND/webhooks/whatsapp`
- Verify token: el mismo valor de `META_WHATSAPP_VERIFY_TOKEN`
- Campo de webhook: `messages`
- Permisos del token: `whatsapp_business_management` y
  `whatsapp_business_messaging`

Después cree una conexión en **Conexión WhatsApp** y pulse
**Verificar API oficial**. El estado cambiará a `CONNECTED` cuando Meta valide
el token y el Phone Number ID.

WhatsApp Business Platform no es completamente gratuita. Meta no cobra los
mensajes de servicio enviados dentro de la ventana de atención de 24 horas;
plantillas y otras categorías pueden generar cargos según mercado y categoría.

## Historial y permisos

- **Administrador:** acceso a todas las conversaciones y configuraciones.
- **Supervisor:** acceso a las conversaciones de sus departamentos.
- **Agente:** acceso operativo a tickets asignados o pendientes de sus
  departamentos.
- **Histórico del agente:** los tickets cerrados atendidos anteriormente
  aparecen en **Resueltos**, **Buscar** e **Historial por agente**. Si ya no son
  responsabilidad del agente, se abren en modo solo lectura.

La tabla **Historial por agente** incluye un botón **Abrir** para cargar todos
los mensajes de la última conversación del cliente.

## Seguridad

- Use secretos JWT diferentes y de al menos 32 caracteres.
- Mantenga los tokens de Meta únicamente en variables de entorno o un gestor de
  secretos; nunca los envíe al frontend ni los guarde en Git.
- Configure `COOKIE_SECURE=true` en HTTPS.
- Mantenga `TRUST_PROXY=false` salvo detrás de un proxy controlado.
- Limite `FRONTEND_URL` a orígenes autorizados.
- El webhook valida `X-Hub-Signature-256` con `META_WHATSAPP_APP_SECRET`.
- Las cargas se limitan a 16 MB, diez archivos y tipos multimedia/documentales
  permitidos. HTML, SVG y ejecutables se rechazan.
- Los nombres de archivos son aleatorios y no conservan rutas del remitente.
- MySQL se publica únicamente en `127.0.0.1` en Docker.
- No versionar `.env`, respaldos ni datos de base de datos.
- Rote cualquier secreto que haya aparecido previamente en un respaldo o dump.

## Validación

```bash
cd backend
npm run build
npm audit --omit=dev

cd ../frontend
npm run build
npm audit --omit=dev
```

Los `package-lock.json` se versionan para conservar instalaciones
reproducibles y evitar que un despliegue resuelva dependencias diferentes.

## Licencia

El proyecto conserva la licencia MIT de su base comunitaria. WhatsApp y Meta
son marcas de sus respectivos propietarios; este software no está afiliado a
Meta.
