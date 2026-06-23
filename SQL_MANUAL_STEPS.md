# Instalación manual del módulo Documentos inteligentes

Estas instrucciones preparan la base MariaDB/MySQL de Techkepper Command Center
para el módulo interno **Documentos inteligentes**.

No se ejecutó SQL automáticamente. Revise y ejecute estas sentencias únicamente
en la base correcta del Command Center.

## 1. Crear tabla principal

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

## 2. Validar instalación

```sql
SHOW TABLES LIKE 'SmartDocuments';
DESCRIBE `SmartDocuments`;
```

## 3. Almacenamiento de archivos

Por defecto, los archivos se guardan fuera de `/public` en:

```text
backend/storage/smart-documents
```

Opcionalmente puede definir `SMART_DOCUMENTS_STORAGE_PATH` en el entorno del
backend para cambiar la ubicación. No es obligatorio para desarrollo local.

## 4. Reversión manual

Si necesita retirar el módulo antes de usarlo:

```sql
DROP TABLE IF EXISTS `SmartDocuments`;
```

Ejecute la reversión solo si confirma que no hay documentos necesarios.
