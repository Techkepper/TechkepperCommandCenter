# Notificaciones internas de documentos

Aplicado el 24 de junio de 2026 sobre la base de Techkepper Command Center.

## Respaldo previo

`backups/techkepper_before_internal_document_notifications_20260624_182131.sql`

El respaldo fue verificado como un volcado MariaDB válido antes de modificar el
esquema.

## Migración aplicada

`backend/src/database/migrations/20260624213000-add-internal-document-notifications.ts`

La migración es idempotente:

- Verifica la existencia de `Users` y `SmartDocuments`.
- Crea `InternalNotifications` solo si no existe.
- Agrega índices solo cuando todavía no existen.
- No incluye un `down` destructivo.

## Estructura

La tabla registra destinatario, creador, documento, tipo, título, mensaje,
estado documental, comentario, fecha de lectura y marcas de tiempo.

Índices verificados:

- `idx_internal_notifications_user`
- `idx_internal_notifications_creator`
- `idx_internal_notifications_document`
- `idx_internal_notifications_type`
- `idx_internal_notifications_read`
- `idx_internal_notifications_created`

Claves foráneas verificadas:

- `userId -> Users.id`, eliminación en cascada.
- `createdById -> Users.id`, al eliminar el creador se conserva el aviso con
  valor nulo.
- `documentId -> SmartDocuments.id`, eliminación en cascada.

No se modificaron tablas de WhatsApp, tickets ni contactos.
