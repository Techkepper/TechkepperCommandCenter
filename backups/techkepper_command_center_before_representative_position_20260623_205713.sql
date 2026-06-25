/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.18-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: techkepper_command_center
-- ------------------------------------------------------
-- Server version	10.11.18-MariaDB-ubu2204

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `BusinessClientDocuments`
--

DROP TABLE IF EXISTS `BusinessClientDocuments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `BusinessClientDocuments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessClientId` int(11) NOT NULL,
  `documentId` int(11) NOT NULL,
  `linkedById` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_client_documents_document` (`documentId`),
  KEY `idx_business_client_documents_client` (`businessClientId`),
  KEY `idx_business_client_documents_linked_by` (`linkedById`),
  CONSTRAINT `fk_business_client_documents_client` FOREIGN KEY (`businessClientId`) REFERENCES `BusinessClients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_client_documents_document` FOREIGN KEY (`documentId`) REFERENCES `SmartDocuments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_business_client_documents_linked_by` FOREIGN KEY (`linkedById`) REFERENCES `Users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BusinessClientDocuments`
--

LOCK TABLES `BusinessClientDocuments` WRITE;
/*!40000 ALTER TABLE `BusinessClientDocuments` DISABLE KEYS */;
/*!40000 ALTER TABLE `BusinessClientDocuments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `BusinessClients`
--

DROP TABLE IF EXISTS `BusinessClients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `BusinessClients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('physical','legal') NOT NULL,
  `displayName` varchar(255) NOT NULL,
  `legalName` varchar(255) DEFAULT NULL,
  `tradeName` varchar(255) DEFAULT NULL,
  `identificationType` varchar(80) NOT NULL,
  `identificationNumber` varchar(80) NOT NULL,
  `normalizedIdentificationNumber` varchar(80) NOT NULL,
  `legalRepresentativeName` varchar(255) DEFAULT NULL,
  `legalRepresentativeId` varchar(80) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `country` varchar(120) DEFAULT NULL,
  `province` varchar(120) DEFAULT NULL,
  `canton` varchar(120) DEFAULT NULL,
  `district` varchar(120) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `queueId` int(11) DEFAULT NULL,
  `createdById` int(11) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_clients_identification` (`normalizedIdentificationNumber`),
  KEY `idx_business_clients_display_name` (`displayName`),
  KEY `idx_business_clients_queue` (`queueId`),
  KEY `idx_business_clients_active` (`isActive`),
  KEY `idx_business_clients_created_by` (`createdById`),
  CONSTRAINT `fk_business_clients_created_by` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_business_clients_queue` FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BusinessClients`
--

LOCK TABLES `BusinessClients` WRITE;
/*!40000 ALTER TABLE `BusinessClients` DISABLE KEYS */;
INSERT INTO `BusinessClients` VALUES
(1,'physical','Luis perez solozano',NULL,NULL,'Cédula física','112340567','112340567',NULL,NULL,'aaa@tech.com','88888888','casitaa','Costa Rica','alajuela','poas','carrillos','Nota de prueba',NULL,1,1,'2026-06-23 18:51:11','2026-06-23 18:51:11',NULL),
(2,'legal','Casita S,A,','Casita lux','Casita lux','Cédula jurídica','3101888888','3101888888','Pablico corrales','112340567','asd@tfs.com','88888888','Casita linda','Costa Rica','San Jose','San pedro','lindora','Prueba 2',NULL,1,1,'2026-06-23 18:52:42','2026-06-23 19:41:45',NULL);
/*!40000 ALTER TABLE `BusinessClients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ContactCustomFields`
--

DROP TABLE IF EXISTS `ContactCustomFields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ContactCustomFields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `contactId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contactId` (`contactId`),
  CONSTRAINT `contactcustomfields_ibfk_1` FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ContactCustomFields`
--

LOCK TABLES `ContactCustomFields` WRITE;
/*!40000 ALTER TABLE `ContactCustomFields` DISABLE KEYS */;
/*!40000 ALTER TABLE `ContactCustomFields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Contacts`
--

DROP TABLE IF EXISTS `Contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `number` varchar(255) DEFAULT NULL,
  `profilePicUrl` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `isGroup` tinyint(1) NOT NULL DEFAULT 0,
  `lid` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `number` (`number`),
  UNIQUE KEY `lid` (`lid`),
  UNIQUE KEY `number_2` (`number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Contacts`
--

LOCK TABLES `Contacts` WRITE;
/*!40000 ALTER TABLE `Contacts` DISABLE KEYS */;
INSERT INTO `Contacts` VALUES
(1,'Tech Movistar','50660689491','https://pps.whatsapp.net/v/t61.24694-24/462393867_831563395804245_7460625878200580707_n.jpg?ccb=11-4&oh=01_Q5Aa4wFirSlAx5pgoRait73hH6natbGPehrunHBxerWxnaQv0A&oe=6A36E766&_nc_sid=5e03e0&_nc_cat=110','2026-06-10 20:09:04','2026-06-10 20:09:04','',0,NULL);
/*!40000 ALTER TABLE `Contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Ecosystems`
--

DROP TABLE IF EXISTS `Ecosystems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ecosystems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `color` varchar(255) NOT NULL DEFAULT '#8ee63f',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Ecosystems`
--

LOCK TABLES `Ecosystems` WRITE;
/*!40000 ALTER TABLE `Ecosystems` DISABLE KEYS */;
INSERT INTO `Ecosystems` VALUES
(1,'Techkepper Web','#7c4dff',1,'2026-06-09 18:44:28','2026-06-09 18:44:28'),
(2,'Techkepper Secure','#ff7043',1,'2026-06-09 18:44:28','2026-06-09 18:44:28'),
(3,'Techkepper Growth','#8ee63f',1,'2026-06-09 18:44:28','2026-06-09 18:44:28'),
(4,'Techkepper Automate','#29b6f6',1,'2026-06-09 18:44:28','2026-06-09 18:44:28'),
(5,'Techkepper Green','#43a047',1,'2026-06-09 18:44:28','2026-06-09 18:44:28');
/*!40000 ALTER TABLE `Ecosystems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Messages`
--

DROP TABLE IF EXISTS `Messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Messages` (
  `id` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `ack` int(11) NOT NULL DEFAULT 0,
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `mediaType` varchar(255) DEFAULT NULL,
  `mediaUrl` varchar(255) DEFAULT NULL,
  `ticketId` int(11) NOT NULL,
  `createdAt` datetime(6) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `fromMe` tinyint(1) NOT NULL DEFAULT 0,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `contactId` int(11) DEFAULT NULL,
  `quotedMsgId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ticketId` (`ticketId`),
  KEY `Messages_contactId_foreign_idx` (`contactId`),
  KEY `Messages_quotedMsgId_foreign_idx` (`quotedMsgId`),
  CONSTRAINT `Messages_contactId_foreign_idx` FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Messages_quotedMsgId_foreign_idx` FOREIGN KEY (`quotedMsgId`) REFERENCES `Messages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`ticketId`) REFERENCES `Tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Messages`
--

LOCK TABLES `Messages` WRITE;
/*!40000 ALTER TABLE `Messages` DISABLE KEYS */;
INSERT INTO `Messages` VALUES
('3EB04F0A7D2260A2B6C2CF','Hola, le saluda Techkepper Company S.A.. Su solicitud ha sido asignada a Aarón Cortés, quien estará a cargo de brindarle seguimiento. Con gusto le atenderemos por este medio.',2,1,'chat',NULL,1,'2026-06-10 20:09:16.372000','2026-06-10 20:09:17.472000',1,0,NULL,NULL),
('3EB06322E2978AA7F546BC','hola',0,1,'chat',NULL,1,'2026-06-10 20:09:04.736000','2026-06-10 20:09:16.097000',0,0,1,NULL),
('3EB09A45771BD43E4159F8','prueba de whatsapp',0,1,'chat',NULL,1,'2026-06-10 20:13:27.556000','2026-06-10 20:13:48.611000',0,0,1,NULL),
('3EB0F2FF3A3F074A8C70A0','*Aarón Cortés:*\nBuenas tardes en que puedo ayudarñe',2,1,'chat',NULL,1,'2026-06-10 20:13:09.097000','2026-06-10 20:13:09.996000',1,0,NULL,NULL);
/*!40000 ALTER TABLE `Messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Queues`
--

DROP TABLE IF EXISTS `Queues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Queues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `color` varchar(255) NOT NULL,
  `greetingMessage` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `color` (`color`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Queues`
--

LOCK TABLES `Queues` WRITE;
/*!40000 ALTER TABLE `Queues` DISABLE KEYS */;
INSERT INTO `Queues` VALUES
(1,'Ventas','#8ee63f','Gracias por contactar a Techkepper Ventas.','2026-06-09 18:44:28','2026-06-09 18:44:28',1),
(2,'Soporte Técnico','#29b6f6','El equipo de soporte revisará su solicitud.','2026-06-09 18:44:28','2026-06-09 18:44:28',1),
(3,'Desarrollo Web','#7c4dff','Nuestro equipo web dará seguimiento a su proyecto.','2026-06-09 18:44:28','2026-06-09 18:44:28',1),
(4,'Ciberseguridad','#ff7043','Su solicitud de seguridad sera atendida con prioridad.','2026-06-09 18:44:28','2026-06-09 18:44:28',1),
(5,'Administración','#78909c','Administración Techkepper ha recibido su mensaje.','2026-06-09 18:44:28','2026-06-09 18:44:28',1);
/*!40000 ALTER TABLE `Queues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QuickAnswers`
--

DROP TABLE IF EXISTS `QuickAnswers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `QuickAnswers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shortcut` text NOT NULL,
  `message` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `queueId` int(11) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `QuickAnswers_queueId_foreign_idx` (`queueId`),
  CONSTRAINT `QuickAnswers_queueId_foreign_idx` FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QuickAnswers`
--

LOCK TABLES `QuickAnswers` WRITE;
/*!40000 ALTER TABLE `QuickAnswers` DISABLE KEYS */;
INSERT INTO `QuickAnswers` VALUES
(1,'/saludo','Hola, le saluda Techkepper. Gracias por contactarnos. Con gusto revisamos su solicitud.','2026-06-09 18:44:28','2026-06-09 18:44:28',NULL,1),
(2,'/datos','Para brindarle una atención mas precisa, por favor indíquenos su nombre, empresa y el detalle de la solicitud.','2026-06-09 18:44:28','2026-06-09 18:44:28',NULL,1),
(3,'/recibido','Hemos recibido su información correctamente. Nuestro equipo revisará el caso y le dará seguimiento por este medio.','2026-06-09 18:44:28','2026-06-09 18:44:28',NULL,1),
(4,'/horario','Nuestro horario de atención es de lunes a viernes de 9:00 a.m. a 5:00 p.m. Si su solicitud ingresa fuera de horario, sera atendida el siguiente día hábil.','2026-06-09 18:44:28','2026-06-09 18:44:28',NULL,1),
(5,'/agenda','Con gusto podemos coordinar una reunión para revisar su necesidad con mayor detalle. Por favor indíquenos que horario le funciona mejor.','2026-06-09 18:44:28','2026-06-09 18:44:28',1,1),
(6,'/seguimiento','Estamos dando seguimiento a su solicitud para poder avanzar de forma ordenada. Quedamos atentos a su confirmación para continuar con el proceso.','2026-06-09 18:44:28','2026-06-09 18:44:28',1,1),
(7,'/cierre','Su solicitud ha sido atendida. Procederemos a cerrar este caso, quedando siempre atentos si requiere apoyo adicional.','2026-06-09 18:44:28','2026-06-09 18:44:28',NULL,1);
/*!40000 ALTER TABLE `QuickAnswers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES
('20200717133438-create-users.js'),
('20200717144403-create-contacts.js'),
('20200717145643-create-tickets.js'),
('20200717151645-create-messages.js'),
('20200717170223-create-whatsapps.js'),
('20200723200315-create-contacts-custom-fields.js'),
('20200723202116-add-email-field-to-contacts.js'),
('20200730153237-remove-user-association-from-messages.js'),
('20200730153545-add-fromMe-to-messages.js'),
('20200813114236-change-ticket-lastMessage-column-type.js'),
('20200901235509-add-profile-column-to-users.js'),
('20200903215941-create-settings.js'),
('20200904220257-add-name-to-whatsapp.js'),
('20200906122228-add-name-default-field-to-whatsapp.js'),
('20200906155658-add-whatsapp-field-to-tickets.js'),
('20200919124112-update-default-column-name-on-whatsappp.js'),
('20200927220708-add-isDeleted-column-to-messages.js'),
('20200929145451-add-user-tokenVersion-column.js'),
('20200930162323-add-isGroup-column-to-tickets.js'),
('20200930194808-add-isGroup-column-to-contacts.js'),
('20201004150008-add-contactId-column-to-messages.js'),
('20201004155719-add-vcardContactId-column-to-messages.js'),
('20201004955719-remove-vcardContactId-column-to-messages.js'),
('20201026215410-add-retries-to-whatsapps.js'),
('20201028124427-add-quoted-msg-to-messages.js'),
('20210108001431-add-unreadMessages-to-tickets.js'),
('20210108164404-create-queues.js'),
('20210108164504-add-queueId-to-tickets.js'),
('20210108174594-associate-whatsapp-queue.js'),
('20210108204708-associate-users-queue.js'),
('20210109192513-add-greetingMessage-to-whatsapp.js'),
('20210818102605-create-quickAnswers.js'),
('20211016014719-add-farewellMessage-to-whatsapp.js'),
('20220223095932-add-whatsapp-to-user.js'),
('20241202230000-create-wpp-keys.js'),
('20241203000000-add-lid-to-contacts.js'),
('20241203000001-allow-null-number-in-contacts.js'),
('20260609090000-add-techkepper-user-fields.js'),
('20260609090100-create-ecosystems.js'),
('20260609090200-add-techkepper-ticket-fields.js'),
('20260609090300-create-ticket-assignment-events.js'),
('20260609090400-enhance-quick-answers.js'),
('20260610090000-add-is-active-to-queues.js'),
('20260610090100-normalize-techkepper-spanish.js'),
('20260611090000-remove-unofficial-whatsapp-credentials.js'),
('20260622090000-add-cloud-api-credentials-to-whatsapps.js'),
('20260623120000-add-lastCustomerMessageId-to-tickets.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Settings`
--

DROP TABLE IF EXISTS `Settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Settings` (
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Settings`
--

LOCK TABLES `Settings` WRITE;
/*!40000 ALTER TABLE `Settings` DISABLE KEYS */;
INSERT INTO `Settings` VALUES
('allowAgentHistory','disabled','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('assignmentAutoMessage','enabled','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('assignmentMessageTemplate','Hola, le saluda {EMPRESA}. Su solicitud ha sido asignada a {NOMBRE_AGENTE}, quien estará a cargo de brindarle seguimiento. Con gusto le atenderemos por este medio.','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('businessHours','lunes a viernes de 9:00 a.m. a 5:00 p.m.','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('companyEmail','ventas@techkeppercr.com','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('companyName','Techkepper Company S.A.','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('companyPhone','+506 72259973','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('defaultTheme','dark','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('userApiToken','fb9358f2-e408-4e6f-b5c8-985a0e0db3f4','2026-06-09 18:44:28','2026-06-09 18:44:28'),
('userCreation','disabled','2026-06-09 18:44:28','2026-06-09 18:44:28');
/*!40000 ALTER TABLE `Settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SmartDocumentTemplateVersions`
--

DROP TABLE IF EXISTS `SmartDocumentTemplateVersions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SmartDocumentTemplateVersions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `templateId` int(11) NOT NULL,
  `version` int(11) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `storedName` varchar(255) NOT NULL,
  `storagePath` varchar(500) NOT NULL,
  `mimeType` varchar(150) NOT NULL,
  `size` int(11) NOT NULL,
  `detectedVariables` text NOT NULL,
  `requiredVariables` text NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `uploadedById` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_smart_document_template_version` (`templateId`,`version`),
  KEY `idx_smart_document_template_versions_template` (`templateId`),
  KEY `idx_smart_document_template_versions_uploaded_by` (`uploadedById`),
  CONSTRAINT `fk_smart_document_template_versions_template` FOREIGN KEY (`templateId`) REFERENCES `SmartDocumentTemplates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_document_template_versions_uploaded_by` FOREIGN KEY (`uploadedById`) REFERENCES `Users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SmartDocumentTemplateVersions`
--

LOCK TABLES `SmartDocumentTemplateVersions` WRITE;
/*!40000 ALTER TABLE `SmartDocumentTemplateVersions` DISABLE KEYS */;
INSERT INTO `SmartDocumentTemplateVersions` VALUES
(1,1,1,'plantilla_prueba_techkepper.docx','487ff8c78114ff3e86056cc83970fb1935ed088da517d152.docx','templates/2026/06/487ff8c78114ff3e86056cc83970fb1935ed088da517d152.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',13758,'[\"CLIENTE\",\"FECHA\",\"MONTO\",\"SERVICIO\"]','[\"CLIENTE\",\"FECHA\",\"MONTO\",\"SERVICIO\"]',1,1,'2026-06-23 17:06:48','2026-06-23 17:06:48',NULL),
(2,2,1,'Plantilla-propuesta-de-servicio-2026-06-23.docx','76b007800b7630af724bc5b25c3875e3d3ad03a361b42d4a.docx','templates/2026/06/76b007800b7630af724bc5b25c3875e3d3ad03a361b42d4a.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',12100,'[]','[]',1,1,'2026-06-23 19:43:07','2026-06-23 19:43:07',NULL),
(3,6,1,'NDA_mutuo_Techkepper_plantilla_variables.docx','65d8572d4326d1c2b44e199298c9132192a549c85561a00e.docx','templates/2026/06/65d8572d4326d1c2b44e199298c9132192a549c85561a00e.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',46118,'[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"FECHA_FIRMA\"]','[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"FECHA_FIRMA\"]',1,1,'2026-06-23 23:52:41','2026-06-23 23:52:41',NULL);
/*!40000 ALTER TABLE `SmartDocumentTemplateVersions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SmartDocumentTemplates`
--

DROP TABLE IF EXISTS `SmartDocumentTemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SmartDocumentTemplates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(120) DEFAULT NULL,
  `documentType` varchar(120) DEFAULT NULL,
  `purpose` varchar(80) DEFAULT NULL,
  `requiresClient` tinyint(1) NOT NULL DEFAULT 0,
  `allowGenericRecipient` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdById` int(11) NOT NULL,
  `queueId` int(11) DEFAULT NULL,
  `ecosystemId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_smart_document_templates_created_by` (`createdById`),
  KEY `idx_smart_document_templates_queue` (`queueId`),
  KEY `idx_smart_document_templates_ecosystem` (`ecosystemId`),
  KEY `idx_smart_document_templates_updated_at` (`updatedAt`),
  KEY `idx_smart_document_templates_purpose` (`purpose`),
  KEY `idx_smart_document_templates_document_type` (`documentType`),
  CONSTRAINT `fk_smart_document_templates_created_by` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_document_templates_ecosystem` FOREIGN KEY (`ecosystemId`) REFERENCES `Ecosystems` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_document_templates_queue` FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SmartDocumentTemplates`
--

LOCK TABLES `SmartDocumentTemplates` WRITE;
/*!40000 ALTER TABLE `SmartDocumentTemplates` DISABLE KEYS */;
INSERT INTO `SmartDocumentTemplates` VALUES
(1,'Plantilla propuesta de servicio',NULL,'Propuestas','other','other',0,0,1,1,NULL,NULL,'2026-06-23 17:06:48','2026-06-23 17:06:48',NULL),
(2,'2.0',NULL,'cliente','other','other',0,0,1,1,NULL,NULL,'2026-06-23 19:43:07','2026-06-23 19:43:07',NULL),
(6,'NDA MUTUO',NULL,'Cliente','nda_mutual','nda',1,0,1,1,NULL,1,'2026-06-23 23:52:41','2026-06-23 23:52:41',NULL);
/*!40000 ALTER TABLE `SmartDocumentTemplates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SmartDocuments`
--

DROP TABLE IF EXISTS `SmartDocuments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SmartDocuments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `originalName` varchar(255) NOT NULL,
  `storedName` varchar(255) NOT NULL,
  `storagePath` varchar(500) NOT NULL,
  `mimeType` varchar(150) NOT NULL,
  `size` int(11) NOT NULL,
  `category` varchar(120) DEFAULT NULL,
  `purpose` varchar(80) DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `uploadedById` int(11) NOT NULL,
  `contactId` int(11) DEFAULT NULL,
  `ticketId` int(11) DEFAULT NULL,
  `queueId` int(11) DEFAULT NULL,
  `ecosystemId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_smart_documents_uploaded_by` (`uploadedById`),
  KEY `idx_smart_documents_contact` (`contactId`),
  KEY `idx_smart_documents_ticket` (`ticketId`),
  KEY `idx_smart_documents_queue` (`queueId`),
  KEY `idx_smart_documents_ecosystem` (`ecosystemId`),
  KEY `idx_smart_documents_created_at` (`createdAt`),
  KEY `idx_smart_documents_purpose` (`purpose`),
  CONSTRAINT `fk_smart_documents_contact` FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_documents_ecosystem` FOREIGN KEY (`ecosystemId`) REFERENCES `Ecosystems` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_documents_queue` FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_documents_ticket` FOREIGN KEY (`ticketId`) REFERENCES `Tickets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_documents_uploaded_by` FOREIGN KEY (`uploadedById`) REFERENCES `Users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SmartDocuments`
--

LOCK TABLES `SmartDocuments` WRITE;
/*!40000 ALTER TABLE `SmartDocuments` DISABLE KEYS */;
INSERT INTO `SmartDocuments` VALUES
(1,'contrato',NULL,'CONTRATO DE ECOSISTEMA TECHKEPPER WEB - Medical Tours.docx','7914cabcb379caf6611ce5feae6b44c07cd5bbe205a0dfc9.docx','2026/06/7914cabcb379caf6611ce5feae6b44c07cd5bbe205a0dfc9.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',55714,'Web','other',NULL,1,NULL,NULL,NULL,NULL,'2026-06-23 16:25:50','2026-06-23 16:25:50','2026-06-23 16:26:30'),
(2,'Plantilla propuesta de servicio','Generado desde plantilla: Plantilla propuesta de servicio','Plantilla-propuesta-de-servicio-2026-06-23.docx','c3d7c1345197be949d30a6389e2df92975ca8e52a2ac807f.docx','generated/2026/06/c3d7c1345197be949d30a6389e2df92975ca8e52a2ac807f.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',12100,'Propuestas','other','plantilla:1;version:1',1,NULL,NULL,NULL,NULL,'2026-06-23 17:07:44','2026-06-23 17:07:44','2026-06-23 18:16:25'),
(3,'2.0','Generado desde plantilla: 2.0','2.0-2026-06-23.docx','ca0925ce9235e2ab33c207d152a1b01d619c9fc123ef1bd2.docx','generated/2026/06/ca0925ce9235e2ab33c207d152a1b01d619c9fc123ef1bd2.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',12100,'cliente','other','plantilla:2;version:1',1,NULL,NULL,NULL,NULL,'2026-06-23 19:43:59','2026-06-23 19:43:59',NULL);
/*!40000 ALTER TABLE `SmartDocuments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TicketAssignmentEvents`
--

DROP TABLE IF EXISTS `TicketAssignmentEvents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `TicketAssignmentEvents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticketId` int(11) NOT NULL,
  `oldUserId` int(11) DEFAULT NULL,
  `newUserId` int(11) DEFAULT NULL,
  `performedByUserId` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `autoMessageStatus` varchar(255) NOT NULL DEFAULT 'not_applicable',
  `autoMessageError` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ticketId` (`ticketId`),
  KEY `oldUserId` (`oldUserId`),
  KEY `newUserId` (`newUserId`),
  KEY `performedByUserId` (`performedByUserId`),
  CONSTRAINT `ticketassignmentevents_ibfk_1` FOREIGN KEY (`ticketId`) REFERENCES `Tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ticketassignmentevents_ibfk_2` FOREIGN KEY (`oldUserId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ticketassignmentevents_ibfk_3` FOREIGN KEY (`newUserId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ticketassignmentevents_ibfk_4` FOREIGN KEY (`performedByUserId`) REFERENCES `Users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TicketAssignmentEvents`
--

LOCK TABLES `TicketAssignmentEvents` WRITE;
/*!40000 ALTER TABLE `TicketAssignmentEvents` DISABLE KEYS */;
INSERT INTO `TicketAssignmentEvents` VALUES
(1,1,NULL,1,1,'take','sent',NULL,'2026-06-10 20:09:16','2026-06-10 20:09:16'),
(2,1,1,3,1,'reassignment','skipped','La conexion de WhatsApp no esta activa o el contacto no es valido.','2026-06-23 13:00:45','2026-06-23 13:00:45');
/*!40000 ALTER TABLE `TicketAssignmentEvents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Tickets`
--

DROP TABLE IF EXISTS `Tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `lastMessage` text DEFAULT NULL,
  `contactId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `whatsappId` int(11) DEFAULT NULL,
  `isGroup` tinyint(1) NOT NULL DEFAULT 0,
  `unreadMessages` int(11) DEFAULT NULL,
  `queueId` int(11) DEFAULT NULL,
  `ecosystemId` int(11) DEFAULT NULL,
  `firstResponseAt` datetime DEFAULT NULL,
  `closedAt` datetime DEFAULT NULL,
  `lastCustomerMessageId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contactId` (`contactId`),
  KEY `userId` (`userId`),
  KEY `Tickets_whatsappId_foreign_idx` (`whatsappId`),
  KEY `Tickets_queueId_foreign_idx` (`queueId`),
  KEY `Tickets_ecosystemId_foreign_idx` (`ecosystemId`),
  CONSTRAINT `Tickets_ecosystemId_foreign_idx` FOREIGN KEY (`ecosystemId`) REFERENCES `Ecosystems` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Tickets_queueId_foreign_idx` FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Tickets_whatsappId_foreign_idx` FOREIGN KEY (`whatsappId`) REFERENCES `Whatsapps` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Tickets`
--

LOCK TABLES `Tickets` WRITE;
/*!40000 ALTER TABLE `Tickets` DISABLE KEYS */;
INSERT INTO `Tickets` VALUES
(1,'open','prueba de whatsapp',1,3,'2026-06-10 20:09:04.000000','2026-06-23 13:00:45.000000',2,0,0,NULL,NULL,'2026-06-10 20:09:16',NULL,NULL);
/*!40000 ALTER TABLE `Tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserQueues`
--

DROP TABLE IF EXISTS `UserQueues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserQueues` (
  `userId` int(11) NOT NULL,
  `queueId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`userId`,`queueId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserQueues`
--

LOCK TABLES `UserQueues` WRITE;
/*!40000 ALTER TABLE `UserQueues` DISABLE KEYS */;
INSERT INTO `UserQueues` VALUES
(1,5,'2026-06-09 18:50:43','2026-06-09 18:50:43'),
(2,6,'2026-06-10 14:35:19','2026-06-10 14:35:19');
/*!40000 ALTER TABLE `UserQueues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `profile` varchar(255) NOT NULL DEFAULT 'admin',
  `tokenVersion` int(11) NOT NULL DEFAULT 0,
  `whatsappId` int(11) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `theme` varchar(255) NOT NULL DEFAULT 'dark',
  `lastActivityAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `Users_whatsappId_foreign_idx` (`whatsappId`),
  CONSTRAINT `Users_whatsappId_foreign_idx` FOREIGN KEY (`whatsappId`) REFERENCES `Whatsapps` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES
(1,'Aarón Cortés','aaron.cortes@techkepper.com','$2a$12$gV5EyLmjum.gLs403FJdde5ulJy7xd4cGKCe0UCrcpmGyt2ygthdK','2026-06-09 18:44:28','2026-06-23 23:55:33','admin',8,NULL,1,'dark','2026-06-23 23:55:33'),
(3,'Maria ','aaa@techkepper.com','$2a$12$wPDuJBXXPXWv5YPnpcqDQuCVBim2uCtvYE1aRkRxRsopKizqEHz.S','2026-06-11 14:24:17','2026-06-23 13:38:09','agent',6,NULL,1,'dark','2026-06-23 13:38:09'),
(4,'Luis','abc@techkepper.com','$2a$12$ZkyUgb4TbqTORAKnQZ0Rxe2aa4sBgARQgyNoD8.4gGOIZwqPt/blK','2026-06-11 14:24:42','2026-06-11 14:27:16','supervisor',1,NULL,1,'dark','2026-06-11 14:27:16');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WhatsappQueues`
--

DROP TABLE IF EXISTS `WhatsappQueues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `WhatsappQueues` (
  `whatsappId` int(11) NOT NULL,
  `queueId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`whatsappId`,`queueId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WhatsappQueues`
--

LOCK TABLES `WhatsappQueues` WRITE;
/*!40000 ALTER TABLE `WhatsappQueues` DISABLE KEYS */;
/*!40000 ALTER TABLE `WhatsappQueues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Whatsapps`
--

DROP TABLE IF EXISTS `Whatsapps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Whatsapps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session` text DEFAULT NULL,
  `qrcode` text DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `battery` varchar(255) DEFAULT NULL,
  `plugged` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `name` varchar(255) NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `retries` int(11) NOT NULL DEFAULT 0,
  `greetingMessage` text DEFAULT NULL,
  `farewellMessage` text DEFAULT NULL,
  `phoneNumberId` varchar(64) DEFAULT NULL,
  `graphApiVersion` varchar(16) NOT NULL DEFAULT 'v25.0',
  `accessTokenEncrypted` text DEFAULT NULL,
  `appSecretEncrypted` text DEFAULT NULL,
  `verifyTokenEncrypted` text DEFAULT NULL,
  `cloudApiVerifiedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Whatsapps`
--

LOCK TABLES `Whatsapps` WRITE;
/*!40000 ALTER TABLE `Whatsapps` DISABLE KEYS */;
INSERT INTO `Whatsapps` VALUES
(2,NULL,'','CONNECTED',NULL,NULL,'2026-06-11 14:16:04','2026-06-23 23:46:15','tECH',1,0,'','',NULL,'v25.0',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `Whatsapps` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-23 20:57:13
