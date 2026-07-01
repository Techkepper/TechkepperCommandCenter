# Horario laboral y respuestas automaticas

## Backup previo

`backups/techkepper_before_business_hours_auto_replies_20260628_000706.sql`

## Migracion

Archivo: `backend/src/database/migrations/20260627130000-business-hours-auto-replies.ts`

Complemento idempotente para instalaciones que hayan quedado parcialmente
creadas por un indice largo de MariaDB:
`backend/src/database/migrations/20260627131000-business-hours-cooldown-index.ts`.

La migracion es idempotente: consulta las tablas existentes antes de crear
`BusinessHoursSpecialDates` y `AfterHoursAutoReplyEvents`. El metodo `down` es
conservador y no elimina historial operativo.

SQL equivalente de referencia:

```sql
CREATE TABLE IF NOT EXISTS BusinessHoursSpecialDates (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  type VARCHAR(30) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  message TEXT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  deletedAt DATETIME NULL,
  INDEX business_hours_special_dates_range (active, startDate, endDate)
);

CREATE TABLE IF NOT EXISTS AfterHoursAutoReplyEvents (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  contactId INT NOT NULL,
  ticketId INT NOT NULL,
  replyType VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL,
  detail VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL,
  INDEX after_hours_cooldown (contactId, replyType, status, createdAt)
);
```

No se modifican tablas de configuracion Meta, credenciales, Dropbox,
documentos, propuestas, calculadora, contactos ni disponibilidad de usuarios.
