# Disponibilidad operativa de usuarios

Aplicado: 2026-06-27

Backup previo:

`backups/techkepper_before_user_availability_assignment_20260627_211308.sql`

## Cambio

Se agregó de forma idempotente `Users.availabilityStatus` como
`VARCHAR(20) NOT NULL DEFAULT 'available'`.

Valores admitidos por la aplicación:

- `available`
- `busy`
- `away`
- `unavailable`
- `offline`

La migración normaliza a `available` cualquier valor nulo o desconocido para
mantener compatibilidad con usuarios existentes.

## SQL equivalente

```sql
SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Users'
    AND COLUMN_NAME = 'availabilityStatus'
);

SET @statement := IF(
  @column_exists = 0,
  'ALTER TABLE `Users` ADD COLUMN `availabilityStatus` VARCHAR(20) NOT NULL DEFAULT ''available''',
  'SELECT 1'
);

PREPARE availability_statement FROM @statement;
EXECUTE availability_statement;
DEALLOCATE PREPARE availability_statement;

UPDATE `Users`
SET `availabilityStatus` = 'available'
WHERE `availabilityStatus` IS NULL
   OR `availabilityStatus` NOT IN
      ('available', 'busy', 'away', 'unavailable', 'offline');
```

No se modificaron tablas de WhatsApp, contactos, Dropbox, documentos,
propuestas ni credenciales.
