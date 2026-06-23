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
  UNIQUE KEY `uk_business_clients_identification` (`normalizedIdentificationNumber`),
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