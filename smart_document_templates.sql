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