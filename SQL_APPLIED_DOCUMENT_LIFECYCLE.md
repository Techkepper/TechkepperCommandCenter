# SQL aplicado: ciclo de vida documental

Fecha de aplicación: 24 de junio de 2026.

Respaldo previo:

`backups/techkepper_before_document_lifecycle_20260624_144824.sql`

Migración idempotente:

`backend/src/database/migrations/20260624194500-add-smart-document-lifecycle.ts`

## Cambios

1. Se agregó `SmartDocuments.status` como `VARCHAR(50)`, obligatorio y con
   valor predeterminado `generated`.
2. Los documentos existentes con estado vacío o nulo se normalizaron a
   `generated`.
3. Se creó `SmartDocumentEvents` con:
   - `documentId`
   - `userId`
   - `eventType`
   - `previousStatus`
   - `newStatus`
   - `comment`
   - `metadata`
   - `createdAt`
   - `updatedAt`
4. Se agregaron índices por documento, usuario, tipo de evento, fecha, estado
   nuevo y estado actual del documento.
5. Se agregaron claves foráneas:
   - `documentId -> SmartDocuments.id`, con actualización en cascada.
   - `userId -> Users.id`, con eliminación `SET NULL`.

La migración valida la existencia de columnas, tablas e índices antes de
crearlos. Su reversión es deliberadamente no destructiva para preservar la
trazabilidad.

## Verificación

```sql
SHOW TABLES LIKE 'SmartDocument%';
DESCRIBE SmartDocuments;
DESCRIBE SmartDocumentEvents;
SHOW INDEX FROM SmartDocuments;
SHOW INDEX FROM SmartDocumentEvents;
SHOW CREATE TABLE SmartDocumentEvents;
```

No se modificaron tablas de WhatsApp, tickets ni Contacts.
