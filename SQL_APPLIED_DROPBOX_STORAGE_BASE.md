# SQL aplicado - Dropbox Storage Base

Fecha de aplicación local: 2026-06-26 09:33:45 America/Guatemala

Backup previo:

`backups/techkepper_before_dropbox_storage_base_20260626_093315.sql`

## Alcance

Fase 6.2A agrega soporte base para almacenamiento externo documental en Dropbox.

No se migraron documentos existentes. No se tocaron tablas de WhatsApp, tickets ni Contacts.

## SQL aplicado

```sql
CREATE TABLE IF NOT EXISTS `ExternalStorageConnections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'not_connected',
  `encryptedRefreshToken` text DEFAULT NULL,
  `accountInfo` text DEFAULT NULL,
  `createdById` int(11) DEFAULT NULL,
  `updatedById` int(11) DEFAULT NULL,
  `lastSyncAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `external_storage_provider_unique` (`provider`),
  KEY `ExternalStorageConnections_createdById_idx` (`createdById`),
  KEY `ExternalStorageConnections_updatedById_idx` (`updatedById`),
  CONSTRAINT `ExternalStorageConnections_createdById_fk`
    FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ExternalStorageConnections_updatedById_fk`
    FOREIGN KEY (`updatedById`) REFERENCES `Users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

Columnas agregadas de forma idempotente en `SmartDocuments`:

```sql
ALTER TABLE `SmartDocuments`
  ADD COLUMN `storageProvider` varchar(50) NOT NULL DEFAULT 'local' AFTER `storagePath`;

ALTER TABLE `SmartDocuments`
  ADD COLUMN `storageFileId` varchar(255) DEFAULT NULL AFTER `storageProvider`;

ALTER TABLE `SmartDocuments`
  ADD COLUMN `externalStoragePath` varchar(500) DEFAULT NULL AFTER `storageFileId`;

ALTER TABLE `SmartDocuments`
  ADD COLUMN `storageSyncedAt` datetime DEFAULT NULL AFTER `externalStoragePath`;

ALTER TABLE `SmartDocuments`
  ADD COLUMN `storageStatus` varchar(50) NOT NULL DEFAULT 'pending' AFTER `storageSyncedAt`;
```

La migración versionada equivalente queda en:

`backend/src/database/migrations/20260626000000-dropbox-storage-base.ts`

## Validación de estructura

Se confirmó en la base local:

- Tabla `ExternalStorageConnections` creada.
- Columnas `storageProvider`, `storageFileId`, `externalStoragePath`, `storageSyncedAt`, `storageStatus` presentes en `SmartDocuments`.
