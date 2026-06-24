# Instalación manual del módulo Documentos inteligentes

Estas instrucciones preparan la base MariaDB/MySQL de Techkepper Command Center
para el módulo interno **Documentos inteligentes**.

No se ejecutó SQL automáticamente. Revise y ejecute estas sentencias únicamente
en la base correcta del Command Center.

## 1. Crear tabla principal de documentos

```sql
CREATE TABLE IF NOT EXISTS `SmartDocuments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `originalName` VARCHAR(255) NOT NULL,
  `storedName` VARCHAR(255) NOT NULL,
  `storagePath` VARCHAR(500) NOT NULL,
  `mimeType` VARCHAR(150) NOT NULL,
  `size` INT NOT NULL,
  `category` VARCHAR(120) NULL,
  `tags` TEXT NULL,
  `uploadedById` INT NOT NULL,
  `contactId` INT NULL,
  `ticketId` INT NULL,
  `queueId` INT NULL,
  `ecosystemId` INT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_smart_documents_uploaded_by` (`uploadedById`),
  INDEX `idx_smart_documents_contact` (`contactId`),
  INDEX `idx_smart_documents_ticket` (`ticketId`),
  INDEX `idx_smart_documents_queue` (`queueId`),
  INDEX `idx_smart_documents_ecosystem` (`ecosystemId`),
  INDEX `idx_smart_documents_created_at` (`createdAt`),
  CONSTRAINT `fk_smart_documents_uploaded_by`
    FOREIGN KEY (`uploadedById`) REFERENCES `Users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_smart_documents_contact`
    FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_smart_documents_ticket`
    FOREIGN KEY (`ticketId`) REFERENCES `Tickets` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_smart_documents_queue`
    FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_smart_documents_ecosystem`
    FOREIGN KEY (`ecosystemId`) REFERENCES `Ecosystems` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2. Crear tablas de plantillas DOCX

```sql
CREATE TABLE IF NOT EXISTS `SmartDocumentTemplates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(120) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdById` INT NOT NULL,
  `queueId` INT NULL,
  `ecosystemId` INT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_smart_document_templates_created_by` (`createdById`),
  INDEX `idx_smart_document_templates_queue` (`queueId`),
  INDEX `idx_smart_document_templates_ecosystem` (`ecosystemId`),
  INDEX `idx_smart_document_templates_updated_at` (`updatedAt`),
  CONSTRAINT `fk_smart_document_templates_created_by`
    FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_smart_document_templates_queue`
    FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_smart_document_templates_ecosystem`
    FOREIGN KEY (`ecosystemId`) REFERENCES `Ecosystems` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SmartDocumentTemplateVersions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `templateId` INT NOT NULL,
  `version` INT NOT NULL,
  `originalName` VARCHAR(255) NOT NULL,
  `storedName` VARCHAR(255) NOT NULL,
  `storagePath` VARCHAR(500) NOT NULL,
  `mimeType` VARCHAR(150) NOT NULL,
  `size` INT NOT NULL,
  `detectedVariables` TEXT NOT NULL,
  `requiredVariables` TEXT NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `uploadedById` INT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_smart_document_template_version` (`templateId`, `version`),
  INDEX `idx_smart_document_template_versions_template` (`templateId`),
  INDEX `idx_smart_document_template_versions_uploaded_by` (`uploadedById`),
  CONSTRAINT `fk_smart_document_template_versions_template`
    FOREIGN KEY (`templateId`) REFERENCES `SmartDocumentTemplates` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_smart_document_template_versions_uploaded_by`
    FOREIGN KEY (`uploadedById`) REFERENCES `Users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 3. Validar instalación

```sql
SHOW TABLES LIKE 'SmartDocument%';
DESCRIBE `SmartDocuments`;
DESCRIBE `SmartDocumentTemplates`;
DESCRIBE `SmartDocumentTemplateVersions`;
```

## 4. Almacenamiento de archivos

Por defecto, los archivos se guardan fuera de `/public` en:

```text
backend/storage/smart-documents
```

El módulo separa internamente:

```text
documents/
templates/
generated/
```

Opcionalmente puede definir `SMART_DOCUMENTS_STORAGE_PATH` en el entorno del
backend para cambiar la ubicación. No es obligatorio para desarrollo local.

## 5. Reversión manual

Ejecute la reversión solo si confirma que no hay documentos necesarios:

```sql
DROP TABLE IF EXISTS `SmartDocumentTemplateVersions`;
DROP TABLE IF EXISTS `SmartDocumentTemplates`;
DROP TABLE IF EXISTS `SmartDocuments`;
```

## 6. Modulo Clientes comerciales

La tabla `BusinessClients` es independiente de `Contacts`. No reemplaza ni
modifica los contactos creados por WhatsApp.

```sql
CREATE TABLE IF NOT EXISTS `BusinessClients` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` ENUM('physical', 'legal') NOT NULL,
  `displayName` VARCHAR(255) NOT NULL,
  `legalName` VARCHAR(255) NULL,
  `tradeName` VARCHAR(255) NULL,
  `identificationType` VARCHAR(80) NOT NULL,
  `identificationNumber` VARCHAR(80) NOT NULL,
  `normalizedIdentificationNumber` VARCHAR(80) NOT NULL,
  `legalRepresentativeName` VARCHAR(255) NULL,
  `legalRepresentativeId` VARCHAR(80) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(80) NULL,
  `address` VARCHAR(500) NULL,
  `country` VARCHAR(120) NULL,
  `province` VARCHAR(120) NULL,
  `canton` VARCHAR(120) NULL,
  `district` VARCHAR(120) NULL,
  `notes` TEXT NULL,
  `queueId` INT NULL,
  `createdById` INT NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_clients_identification`
    (`normalizedIdentificationNumber`),
  INDEX `idx_business_clients_display_name` (`displayName`),
  INDEX `idx_business_clients_queue` (`queueId`),
  INDEX `idx_business_clients_active` (`isActive`),
  INDEX `idx_business_clients_created_by` (`createdById`),
  CONSTRAINT `fk_business_clients_queue`
    FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_business_clients_created_by`
    FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Validacion manual:

```sql
SHOW TABLES LIKE 'BusinessClients';
DESCRIBE `BusinessClients`;
SHOW INDEX FROM `BusinessClients`;
```

La aplicacion no elimina fisicamente clientes. La desactivacion utiliza
`isActive = 0`; `deletedAt` queda reservado para mantenimiento controlado.

Reversion manual, unicamente si confirma que no existe informacion necesaria:

```sql
DROP TABLE IF EXISTS `BusinessClients`;
```

## 7. Asociacion manual entre clientes y documentos

Esta tabla vincula un documento con un cliente comercial sin modificar
`SmartDocuments` ni `Contacts`. Un documento puede pertenecer como maximo a un
cliente comercial.

```sql
CREATE TABLE IF NOT EXISTS `BusinessClientDocuments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `businessClientId` INT NOT NULL,
  `documentId` INT NOT NULL,
  `linkedById` INT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_client_documents_document` (`documentId`),
  INDEX `idx_business_client_documents_client` (`businessClientId`),
  INDEX `idx_business_client_documents_linked_by` (`linkedById`),
  CONSTRAINT `fk_business_client_documents_client`
    FOREIGN KEY (`businessClientId`) REFERENCES `BusinessClients` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_business_client_documents_document`
    FOREIGN KEY (`documentId`) REFERENCES `SmartDocuments` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_business_client_documents_linked_by`
    FOREIGN KEY (`linkedById`) REFERENCES `Users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Validacion manual:

```sql
SHOW TABLES LIKE 'BusinessClientDocuments';
DESCRIBE `BusinessClientDocuments`;
```

## 8. Clasificacion de documentos y plantillas por uso

Este ajuste permite organizar documentos y machotes por proposito, tipo de
documento y ecosistema. Es aditivo y conserva los registros existentes.

```sql
ALTER TABLE `SmartDocuments`
  ADD COLUMN IF NOT EXISTS `purpose` VARCHAR(80) NULL AFTER `category`;

ALTER TABLE `SmartDocumentTemplates`
  ADD COLUMN IF NOT EXISTS `documentType` VARCHAR(120) NULL AFTER `category`,
  ADD COLUMN IF NOT EXISTS `purpose` VARCHAR(80) NULL AFTER `documentType`,
  ADD COLUMN IF NOT EXISTS `requiresClient` TINYINT(1) NOT NULL DEFAULT 0
    AFTER `purpose`,
  ADD COLUMN IF NOT EXISTS `allowGenericRecipient` TINYINT(1) NOT NULL DEFAULT 0
    AFTER `requiresClient`;

UPDATE `SmartDocuments`
SET `purpose` = 'other'
WHERE `purpose` IS NULL OR `purpose` = '';

UPDATE `SmartDocumentTemplates`
SET
  `purpose` = COALESCE(NULLIF(`purpose`, ''), 'other'),
  `documentType` = COALESCE(NULLIF(`documentType`, ''), 'other');

CREATE INDEX IF NOT EXISTS `idx_smart_documents_purpose`
  ON `SmartDocuments` (`purpose`);

CREATE INDEX IF NOT EXISTS `idx_smart_document_templates_purpose`
  ON `SmartDocumentTemplates` (`purpose`);

CREATE INDEX IF NOT EXISTS `idx_smart_document_templates_document_type`
  ON `SmartDocumentTemplates` (`documentType`);
```

Validacion manual:

```sql
SHOW COLUMNS FROM `SmartDocuments` LIKE 'purpose';
SHOW COLUMNS FROM `SmartDocumentTemplates`
  WHERE `Field` IN (
    'documentType',
    'purpose',
    'requiresClient',
    'allowGenericRecipient'
  );
SHOW INDEX FROM `SmartDocuments`
  WHERE `Key_name` = 'idx_smart_documents_purpose';
SHOW INDEX FROM `SmartDocumentTemplates`
  WHERE `Key_name` IN (
    'idx_smart_document_templates_purpose',
    'idx_smart_document_templates_document_type'
  );
```

## 9. Cargo del representante legal

Este campo permite autocompletar `CLIENTE_CARGO_REPRESENTANTE` al generar
contratos y NDA desde un cliente jurídico.

```sql
ALTER TABLE `BusinessClients`
  ADD COLUMN IF NOT EXISTS `legalRepresentativePosition` VARCHAR(255) NULL
  AFTER `legalRepresentativeId`;
```

Validacion manual:

```sql
SHOW COLUMNS FROM `BusinessClients`
  LIKE 'legalRepresentativePosition';
```
