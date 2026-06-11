# Techkepper Command Center

Centro interno multiagente de Techkepper Company S.A. para ventas, soporte
técnico, desarrollo web, ciberseguridad y administración mediante WhatsApp
Business vinculado por código QR.

## Alcance del MVP

- Frontend React 16 + Vite + Material UI 4.
- Backend Node.js + TypeScript + Express + Sequelize.
- MySQL o MariaDB.
- Socket.io para actualizaciones en tiempo real.
- Proveedor QR `wwebjs` por defecto y `whaileys` como alternativa.
- Redis opcional en local e incluido en Docker.
- Roles: administrador, supervisor y agente.
- Registro público deshabilitado.
- Tema oscuro predeterminado con preferencia guardada en `localStorage`.
- Departamentos, ecosistemas y respuestas rápidas iniciales de Techkepper.
- Auditoría de asignaciones y aviso automático configurable al cliente.
- Dashboard e historial por agente exportable a CSV.

## Requisitos

- Node.js 20 LTS.
- npm 10 o superior.
- MySQL 8 o MariaDB 10.6+.
- Redis 7 recomendado para `whaileys`.
- Chrome o Chromium para `wwebjs`.
- Docker Engine y Docker Compose para el despliegue en contenedores.

## Ejecución local

1. Copie `backend/.env.example` como `backend/.env`.
2. Copie `frontend/.env.example` como `frontend/.env`.
3. Configure base de datos, secretos JWT y URLs.
4. Defina `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` antes del primer
   seed. La contraseña debe tener al menos 12 caracteres.
5. Instale y prepare el backend:

```bash
cd backend
PUPPETEER_SKIP_DOWNLOAD=true npm install
npm run build
npx sequelize db:migrate
npx sequelize db:seed:all
npm run dev
```

6. En otra terminal, levante el frontend:

```bash
cd frontend
npm install
npm run dev
```

7. Abra `http://localhost:3000`.

No se crea ningún usuario con credenciales públicas. Si el seed inicial se
ejecutó sin `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD`, deshaga el último
seed o inserte un administrador mediante un proceso controlado antes de usar el
sistema.

## Docker

1. Copie `.env.example` como `.env`.
2. Cambie obligatoriamente `MYSQL_ROOT_PASSWORD`, `JWT_SECRET`,
   `JWT_REFRESH_SECRET` e `INITIAL_ADMIN_PASSWORD`.
3. Ejecute:

```bash
docker compose build
docker compose up -d
docker compose exec backend npx sequelize db:seed:all
docker compose logs -f backend
```

El backend ejecuta migraciones al iniciar. El seed se ejecuta manualmente para
evitar recrear datos iniciales por accidente.

La imagen del backend instala Chromium y configura
`PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`. Para comprobarlo:

```bash
docker compose exec backend sh -lc "command -v chromium"
docker compose exec backend chromium --version
```

## Conectar WhatsApp Business

1. Ingrese como administrador.
2. Abra **Conexión WhatsApp**.
3. Cree una conexión y márquela como predeterminada si corresponde.
4. Pulse **Ver código QR**.
5. En WhatsApp Business, abra **Dispositivos vinculados**.
6. Escanee el QR y espere el estado `CONNECTED`.

Para regenerar la sesión use **Nuevo QR**. Para cerrar la sesión use
**Desconectar**. No se utiliza WhatsApp Cloud API en esta fase.

## Agentes y permisos

- **Administrador:** usuarios, conexiones, configuración, departamentos,
  reportes y todas las conversaciones.
- **Supervisor:** conversaciones de sus departamentos, reasignaciones, respuestas
  rápidas e historial operativo.
- **Agente:** conversaciones asignadas o pendientes de sus departamentos, toma de
  conversaciones y respuestas.

Los agentes se crean desde **Agentes y usuarios**. Asigne rol, departamentos,
conexión y estado activo. El botón **Generar temporal** crea una contraseña
provisional que debe entregarse por un canal seguro.

## Asignación y mensaje automático

Desde el menú de una conversación use **Transferir** para seleccionar agente,
departamento, conexión y ecosistema. Cuando cambia realmente el responsable:

1. Se guarda la asignación.
2. Se registra agente anterior, agente nuevo, usuario ejecutor y tipo de acción.
3. Se valida usuario activo, contacto válido y conexión `CONNECTED`.
4. Se envía la plantilla configurada.
5. El resultado de envío aparece en la auditoría de la conversación.

Un fallo de WhatsApp no revierte la asignación. La plantilla y sus variables se
administran en **Configuración**.

## Historial por agente

Administradores y supervisores abren **Historial por agente** para filtrar por
agente, cliente, fechas, departamento, estado y ecosistema. El botón
**Exportar CSV** descarga la vista filtrada. Los agentes solo acceden a su
propio historial cuando `allowAgentHistory` está habilitado.

## Variables principales

Backend:

- `BACKEND_URL`, `FRONTEND_URL`, `PROXY_PORT`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_DIALECT`
- `REDIS_URL`, `REDIS_DB`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`
- `COOKIE_SECURE`, `TRUST_PROXY`
- `WHATSAPP_PROVIDER`
- `PUPPETEER_EXECUTABLE_PATH`, `CHROME_BIN`, `CHROME_ARGS`
- `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`
- `COMPANY_NAME`, `COMPANY_EMAIL`, `COMPANY_PHONE`
- `DEFAULT_THEME`, `ENABLE_ASSIGNMENT_AUTO_MESSAGE`

Frontend:

- `VITE_BACKEND_URL`

## Solución de problemas de WhatsApp QR

### `Browser was not found at the configured executablePath`

Este error indica que Puppeteer recibió una ruta que no existe dentro del
contenedor. El backend Docker usa Chromium en `/usr/bin/chromium`; verifique que
`PUPPETEER_EXECUTABLE_PATH` y `CHROME_BIN` apunten a esa ruta y reconstruya:

```bash
docker compose build --no-cache backend
docker compose up -d backend
docker compose exec backend sh -lc "command -v chromium && chromium --version"
docker compose logs --tail=200 backend
```

No configure solamente `google-chrome-stable` como nombre de comando en
`executablePath`: Puppeteer requiere una ruta ejecutable real. Si utiliza otra
imagen base, instale Chrome o Chromium y ajuste la variable a la ruta disponible
dentro de ese contenedor.

## Producción y seguridad

- Use secretos aleatorios de 32 caracteres o más y valores diferentes.
- Configure `COOKIE_SECURE=true` cuando el backend se publique exclusivamente
  mediante HTTPS.
- Mantenga `TRUST_PROXY=false` salvo que el backend esté detrás de un proxy
  propio y controlado.
- Limite `FRONTEND_URL` a los orígenes autorizados, separados por coma.
- Los tokens de acceso se conservan únicamente en memoria; el refresh token
  utiliza una cookie `HttpOnly`, `SameSite=Strict` y alcance `/auth`.
- El QR y la sesión interna de WhatsApp solo se entregan a administradores; las
  respuestas relacionadas se marcan como `no-store`.
- Ejecute detrás de Nginx, Cloudflare o un proxy TLS equivalente.
- Proteja `.env`, `backend/.wwebjs_auth`, respaldos y volúmenes de base de datos.
- No publique Redis ni MySQL en Internet.
- Revise `npm audit` antes de cada despliegue. La base heredada contiene
  dependencias antiguas que requieren una fase de actualización controlada.
- Realice respaldos antes de migrar una instalación existente.

## Validación

```bash
cd backend && npm run build
cd frontend && npm run build
```

Las migraciones son reversibles y compatibles con MySQL/MariaDB. Las métricas de
tiempo promedio solo se calculan para conversaciones que ya tienen
`firstResponseAt`; los datos históricos anteriores mostrarán **Sin datos**.

## Licencia y proveedor

Este proyecto conserva la licencia MIT de su base comunitaria. WhatsApp es una
marca de sus respectivos propietarios y este software no está afiliado a Meta.
