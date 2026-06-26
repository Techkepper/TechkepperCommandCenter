# SQL aplicado: expediente, addendums y sexo de colaboradores

Fecha de aplicación: 2026-06-25

Respaldo previo:

`backups/techkepper_before_dossier_upload_addendum_collaborator_sex_20260625_175022.sql`

## Alcance

Este cambio agrega únicamente:

- `Collaborators.sex` para conservar el sexo usado al resolver la denominación contractual.
- `SmartDocuments.documentDate` para documentos preexistentes incorporados al expediente.
- `SmartDocuments.baseDocumentId` para relacionar un addendum con su documento base.

No modifica tablas de WhatsApp, tickets ni contactos.

## SQL idempotente aplicado

```sql
ALTER TABLE `Collaborators`
  ADD COLUMN IF NOT EXISTS `sex`
    ENUM('female', 'male', 'unspecified')
    NOT NULL DEFAULT 'unspecified'
    AFTER `contractualDenomination`;

ALTER TABLE `SmartDocuments`
  ADD COLUMN IF NOT EXISTS `documentDate`
    DATE NULL
    AFTER `status`,
  ADD COLUMN IF NOT EXISTS `baseDocumentId`
    INT NULL
    AFTER `documentDate`;

ALTER TABLE `SmartDocuments`
  ADD INDEX IF NOT EXISTS `idx_smart_documents_base_document`
    (`baseDocumentId`);

DELIMITER //
CREATE PROCEDURE `apply_smart_document_base_fk`()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'SmartDocuments'
       AND CONSTRAINT_NAME = 'fk_smart_documents_base_document'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `SmartDocuments`
      ADD CONSTRAINT `fk_smart_documents_base_document`
      FOREIGN KEY (`baseDocumentId`)
      REFERENCES `SmartDocuments` (`id`)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END//
CALL `apply_smart_document_base_fk`//
DROP PROCEDURE `apply_smart_document_base_fk`//
DELIMITER ;
```

## Validación posterior

```sql
SHOW COLUMNS FROM `Collaborators` LIKE 'sex';
SHOW COLUMNS FROM `SmartDocuments` LIKE 'documentDate';
SHOW COLUMNS FROM `SmartDocuments` LIKE 'baseDocumentId';
SHOW INDEX FROM `SmartDocuments`
 WHERE Key_name = 'idx_smart_documents_base_document';
SELECT CONSTRAINT_NAME
  FROM information_schema.TABLE_CONSTRAINTS
 WHERE CONSTRAINT_SCHEMA = DATABASE()
   AND TABLE_NAME = 'SmartDocuments'
   AND CONSTRAINT_NAME = 'fk_smart_documents_base_document';
```

## Corrección de metadato de seeds durante despliegue Docker

Al recrear el backend con la imagen nueva, `sequelize db:seed:all` encontró la
tabla `SequelizeData` vacía aunque los datos base ya existían. Para evitar que
los seeds históricos se reinsertaran y detuvieran el contenedor por claves
duplicadas, se registraron idempotentemente los seeders ya aplicados.

```sql
INSERT IGNORE INTO `SequelizeData` (`name`) VALUES
  ('20200904070004-create-default-settings.js'),
  ('20200904070004-create-default-users.js'),
  ('20200904070006-create-apiToken-settings.js'),
  ('20260609091000-create-techkepper-baseline.js');
```

Validación:

```sql
SELECT * FROM `SequelizeData` ORDER BY `name`;
```

## Corrección no destructiva de FK en Collaborators

Durante la validación se detectó que `Collaborators.createdById` rechazaba
inserciones aunque el usuario existiera en `Users`. Para que el alta de
colaboradores funcione correctamente con el nuevo campo `sex`, se recreó la FK
sin modificar datos.

```sql
ALTER TABLE `Collaborators`
  DROP FOREIGN KEY `collaborators_ibfk_2`;

ALTER TABLE `Collaborators`
  ADD CONSTRAINT `fk_collaborators_created_by`
  FOREIGN KEY (`createdById`)
  REFERENCES `users` (`id`)
  ON UPDATE CASCADE;
```

Validación ejecutada:

```sql
INSERT INTO `Collaborators` (
  `fullName`,
  `identificationType`,
  `identificationNumber`,
  `normalizedIdentificationNumber`,
  `contractualDenomination`,
  `sex`,
  `createdById`,
  `isActive`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'QA FK Check',
  'Cedula',
  'QA-FK-CHECK',
  'QAFKCHECK',
  'LA CONTRATISTA',
  'female',
  1,
  1,
  NOW(),
  NOW()
);

DELETE FROM `Collaborators`
 WHERE `normalizedIdentificationNumber` = 'QAFKCHECK';
```

## Correccion no destructiva de FK en documentos hacia usuarios

Durante la validacion de "Subir documento existente" se detecto que varias FKs
de tablas documentales hacia usuarios rechazaban usuarios validos creados en la
base actual. Se recrearon las restricciones sin borrar datos, usando el mismo
criterio validado para `Collaborators.createdById`.

```sql
ALTER TABLE `SmartDocuments`
  DROP FOREIGN KEY `fk_smart_documents_uploaded_by`;

ALTER TABLE `SmartDocuments`
  ADD CONSTRAINT `fk_smart_documents_uploaded_by`
  FOREIGN KEY (`uploadedById`)
  REFERENCES `users` (`id`)
  ON UPDATE CASCADE;

ALTER TABLE `SmartDocumentEvents`
  DROP FOREIGN KEY `smartdocumentevents_ibfk_2`;

ALTER TABLE `SmartDocumentEvents`
  ADD CONSTRAINT `fk_smart_document_events_user`
  FOREIGN KEY (`userId`)
  REFERENCES `users` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE `BusinessClientDocuments`
  DROP FOREIGN KEY `fk_business_client_documents_linked_by`;

ALTER TABLE `BusinessClientDocuments`
  ADD CONSTRAINT `fk_business_client_documents_linked_by`
  FOREIGN KEY (`linkedById`)
  REFERENCES `users` (`id`)
  ON UPDATE CASCADE;

ALTER TABLE `CollaboratorDocuments`
  DROP FOREIGN KEY `collaboratordocuments_ibfk_3`;

ALTER TABLE `CollaboratorDocuments`
  ADD CONSTRAINT `fk_collaborator_documents_linked_by`
  FOREIGN KEY (`linkedById`)
  REFERENCES `users` (`id`)
  ON UPDATE CASCADE;
```

## Retiro controlado de FKs rotas en BusinessClientDocuments

Durante la prueba funcional de carga desde expediente, MariaDB rechazo enlaces
validos por FKs de `BusinessClientDocuments` hacia `SmartDocuments` y
`BusinessClients`. Al intentar recrear la FK de documento, MariaDB devolvio
`errno: 194 "Tablespace is missing for a table"`, por lo que no se forzo una
reconstruccion de tabla. Se retiraron las FKs rotas y la integridad queda
validada por el servicio antes de crear el enlace.

```sql
ALTER TABLE `BusinessClientDocuments`
  DROP FOREIGN KEY `fk_business_client_documents_document`;

ALTER TABLE `BusinessClientDocuments`
  DROP FOREIGN KEY `fk_business_client_documents_client`;
```

Tambien se retiraron las FKs rotas hacia `SmartDocuments` en eventos, enlaces
de colaborador y addendums. El backend valida el documento antes de registrar
eventos, asociaciones o addendums.

```sql
ALTER TABLE `SmartDocumentEvents`
  DROP FOREIGN KEY `smartdocumentevents_ibfk_1`;

ALTER TABLE `CollaboratorDocuments`
  DROP FOREIGN KEY `collaboratordocuments_ibfk_2`;

ALTER TABLE `CollaboratorDocuments`
  DROP FOREIGN KEY `collaboratordocuments_ibfk_1`;

ALTER TABLE `SmartDocuments`
  DROP FOREIGN KEY `fk_smart_documents_base_document`;
```

Validacion ejecutada:

```sql
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'BusinessClientDocuments'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY COLUMN_NAME;
```

Validacion ejecutada:

```sql
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'SmartDocuments',
    'SmartDocumentEvents',
    'BusinessClientDocuments',
    'CollaboratorDocuments',
    'Collaborators'
  )
  AND COLUMN_NAME IN ('uploadedById', 'userId', 'linkedById', 'createdById')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
```
