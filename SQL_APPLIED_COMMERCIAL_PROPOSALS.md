# SQL aplicado - Propuestas comerciales

Fecha de aplicación: 24 de junio de 2026

## Respaldo previo

`backups/techkepper_before_commercial_proposals_20260624_190412.sql`

Tamaño verificado: 119476 bytes.

## Migraciones aplicadas

1. `20260625003000-add-commercial-proposals`
   - Crea `CommercialProposals`.
   - Crea `CommercialProposalItems`.
   - Crea `CommercialProposalPaymentMilestones`.
   - Crea `CommercialProposalEvents`.
   - Agrega `proposalId` a las notificaciones internas.
   - Agrega índices para estado, cliente, departamento, fecha y relaciones.

2. `20260625003100-create-internal-notifications-v2`
   - Crea `InternalNotificationsV2` con `documentId` nullable.
   - Permite notificaciones de propuestas antes de generar un documento.
   - Copia con `INSERT IGNORE` el historial existente.
   - Conserva `InternalNotifications` intacta para reversión.

## Nota sobre InternalNotifications

MariaDB detectó una diferencia preexistente de casing físico entre
`InternalNotifications.frm` e `internalnotifications.ibd` en el volumen de
Windows. Un `ALTER TABLE` convencional no era seguro porque InnoDB rechazaba el
rename interno con error de tablespace.

Para no reparar archivos InnoDB manualmente ni arriesgar las notificaciones
existentes, se creó la tabla compatible `InternalNotificationsV2`, se copiaron
los dos registros existentes y el modelo Sequelize se dirige a la tabla V2.

## Validación posterior

- Ambas migraciones aparecen con estado `up`.
- Las cuatro tablas de propuestas existen.
- `InternalNotificationsV2.documentId` permite `NULL`.
- `InternalNotificationsV2.proposalId` permite `NULL` y está indexado.
- Historial copiado: 2 registros en origen y 2 registros en V2.
- Backend, frontend y MariaDB quedaron en estado `Up`.
- No se modificaron tablas de WhatsApp, tickets ni Contacts.
