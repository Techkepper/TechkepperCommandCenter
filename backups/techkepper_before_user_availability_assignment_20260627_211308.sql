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
-- Table structure for table `BusinessClients`
--

DROP TABLE IF EXISTS `BusinessClients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `businessclients` (
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
  `legalRepresentativePosition` varchar(255) DEFAULT NULL,
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
(1,'physical','Luis perez solozano',NULL,NULL,'Cédula física','112340567','112340567',NULL,NULL,NULL,'aaa@tech.com','88888888','casitaa','Costa Rica','alajuela','poas','carrillos','Nota de prueba',NULL,1,1,'2026-06-23 18:51:11','2026-06-23 18:51:11',NULL),
(2,'legal','Casita S,A,','Casita lux','Casita lux','Cédula jurídica','3101888888','3101888888','Pablico corrales','112340567','Gerente general','asd@tfs.com','88888888','Casita linda','Costa Rica','San Jose','San pedro','lindora','Prueba 2',NULL,1,1,'2026-06-23 18:52:42','2026-06-24 00:05:33',NULL);
/*!40000 ALTER TABLE `BusinessClients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CommercialProposalEvents`
--

DROP TABLE IF EXISTS `CommercialProposalEvents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `commercialproposalevents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposalId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `eventType` varchar(80) NOT NULL,
  `previousStatus` varchar(50) DEFAULT NULL,
  `newStatus` varchar(50) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `metadata` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `idx_proposal_events_proposal` (`proposalId`),
  CONSTRAINT `commercialproposalevents_ibfk_1` FOREIGN KEY (`proposalId`) REFERENCES `CommercialProposals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `commercialproposalevents_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommercialProposalEvents`
--

LOCK TABLES `CommercialProposalEvents` WRITE;
/*!40000 ALTER TABLE `CommercialProposalEvents` DISABLE KEYS */;
INSERT INTO `CommercialProposalEvents` VALUES
(16,4,1,'proposal_created',NULL,'draft',NULL,NULL,'2026-06-24 22:33:50','2026-06-24 22:33:50'),
(17,4,1,'items_added',NULL,NULL,NULL,'{\"itemCount\":2}','2026-06-24 22:33:50','2026-06-24 22:33:50'),
(18,4,1,'docx_generated',NULL,NULL,NULL,'{\"documentId\":55}','2026-06-24 22:33:57','2026-06-24 22:33:57'),
(19,5,1,'proposal_created',NULL,'draft',NULL,NULL,'2026-06-25 02:58:51','2026-06-25 02:58:51'),
(20,5,1,'items_added',NULL,NULL,NULL,'{\"itemCount\":2}','2026-06-25 02:58:51','2026-06-25 02:58:51'),
(21,5,1,'docx_generated',NULL,NULL,NULL,'{\"documentId\":56}','2026-06-25 02:58:57','2026-06-25 02:58:57'),
(22,5,1,'pdf_generated',NULL,NULL,NULL,NULL,'2026-06-25 02:59:41','2026-06-25 02:59:41'),
(23,6,1,'proposal_created',NULL,'draft',NULL,'{\"proposalNumber\":\"PROP-2026-006\"}','2026-06-25 03:21:32','2026-06-25 03:21:32'),
(24,6,1,'items_added',NULL,NULL,NULL,'{\"itemCount\":2}','2026-06-25 03:21:32','2026-06-25 03:21:32'),
(25,6,1,'docx_generated',NULL,NULL,NULL,'{\"documentId\":57,\"variant\":\"formal\"}','2026-06-25 03:21:40','2026-06-25 03:21:40'),
(26,6,1,'docx_generated',NULL,NULL,NULL,'{\"documentId\":58,\"variant\":\"quick\"}','2026-06-25 03:22:13','2026-06-25 03:22:13'),
(27,4,1,'proposal_deleted','draft',NULL,NULL,'{\"proposalNumber\":\"PROP-2026-005\"}','2026-06-25 03:24:08','2026-06-25 03:24:08'),
(28,5,1,'proposal_deleted','draft',NULL,NULL,'{\"proposalNumber\":\"PROP-2026-gd\"}','2026-06-25 03:24:10','2026-06-25 03:24:10'),
(29,6,1,'docx_generated',NULL,NULL,NULL,'{\"documentId\":59,\"variant\":\"formal\"}','2026-06-25 03:26:01','2026-06-25 03:26:01'),
(30,6,1,'docx_generated',NULL,NULL,NULL,'{\"documentId\":60,\"variant\":\"formal\"}','2026-06-25 03:26:44','2026-06-25 03:26:44'),
(31,6,1,'docx_generated',NULL,NULL,NULL,'{\"documentId\":61,\"variant\":\"quick\"}','2026-06-25 03:27:00','2026-06-25 03:27:00');
/*!40000 ALTER TABLE `CommercialProposalEvents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CommercialProposalItems`
--

DROP TABLE IF EXISTS `CommercialProposalItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `commercialproposalitems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposalId` int(11) NOT NULL,
  `sortOrder` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `includedItems` text NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `isIncluded` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_proposal_items_proposal` (`proposalId`),
  CONSTRAINT `commercialproposalitems_ibfk_1` FOREIGN KEY (`proposalId`) REFERENCES `CommercialProposals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommercialProposalItems`
--

LOCK TABLES `CommercialProposalItems` WRITE;
/*!40000 ALTER TABLE `CommercialProposalItems` DISABLE KEYS */;
INSERT INTO `CommercialProposalItems` VALUES
(8,4,1,'calculadora','dadada','[\"dadada\"]',50000.00,1,'2026-06-24 22:33:50','2026-06-24 22:33:50'),
(9,4,2,'dadada','dada','[\"gfagaa\"]',52222.00,1,'2026-06-24 22:33:50','2026-06-24 22:33:50'),
(10,5,1,'avava','avava','[\"vava\"]',250000.00,1,'2026-06-25 02:58:51','2026-06-25 02:58:51'),
(11,5,2,'baba','avava','[\"vavava\"]',455000.00,1,'2026-06-25 02:58:51','2026-06-25 02:58:51'),
(12,6,1,'afafa','afafa','[\"fafafa\"]',500000.00,1,'2026-06-25 03:21:32','2026-06-25 03:21:32'),
(13,6,2,'afafa','fafaf','[\"afafa\"]',2500000.00,1,'2026-06-25 03:21:32','2026-06-25 03:21:32');
/*!40000 ALTER TABLE `CommercialProposalItems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CommercialProposalPaymentMilestones`
--

DROP TABLE IF EXISTS `CommercialProposalPaymentMilestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `commercialproposalpaymentmilestones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposalId` int(11) NOT NULL,
  `sortOrder` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `percentage` decimal(7,4) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_proposal_milestones_proposal` (`proposalId`),
  CONSTRAINT `commercialproposalpaymentmilestones_ibfk_1` FOREIGN KEY (`proposalId`) REFERENCES `CommercialProposals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommercialProposalPaymentMilestones`
--

LOCK TABLES `CommercialProposalPaymentMilestones` WRITE;
/*!40000 ALTER TABLE `CommercialProposalPaymentMilestones` DISABLE KEYS */;
INSERT INTO `CommercialProposalPaymentMilestones` VALUES
(8,4,1,'Pago inicial',40.0000,46204.34,NULL,'2026-06-24 22:33:50','2026-06-24 22:33:50'),
(9,4,2,'Segundo pago contra avance funcional',30.0000,34653.26,NULL,'2026-06-24 22:33:50','2026-06-24 22:33:50'),
(10,4,3,'Pago final contra entrega',30.0000,34653.26,NULL,'2026-06-24 22:33:50','2026-06-24 22:33:50'),
(11,5,1,'Pago inicial',40.0000,318660.00,NULL,'2026-06-25 02:58:51','2026-06-25 02:58:51'),
(12,5,2,'Segundo pago contra avance funcional',30.0000,238995.00,NULL,'2026-06-25 02:58:51','2026-06-25 02:58:51'),
(13,5,3,'Pago final contra entrega',30.0000,238995.00,NULL,'2026-06-25 02:58:51','2026-06-25 02:58:51'),
(14,6,1,'Pago inicial',40.0000,1356000.00,NULL,'2026-06-25 03:21:32','2026-06-25 03:21:32'),
(15,6,2,'Segundo pago contra avance funcional',30.0000,1017000.00,NULL,'2026-06-25 03:21:32','2026-06-25 03:21:32'),
(16,6,3,'Pago final contra entrega',30.0000,1017000.00,NULL,'2026-06-25 03:21:32','2026-06-25 03:21:32');
/*!40000 ALTER TABLE `CommercialProposalPaymentMilestones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CommercialProposals`
--

DROP TABLE IF EXISTS `CommercialProposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `commercialproposals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessClientId` int(11) DEFAULT NULL,
  `manualClientName` varchar(255) DEFAULT NULL,
  `manualClientEmail` varchar(255) DEFAULT NULL,
  `manualClientPhone` varchar(80) DEFAULT NULL,
  `manualClientIdentification` varchar(80) DEFAULT NULL,
  `clientNumber` varchar(80) NOT NULL,
  `proposalNumber` varchar(80) NOT NULL,
  `offerDate` date NOT NULL,
  `title` varchar(255) NOT NULL,
  `introduction` text DEFAULT NULL,
  `identifiedNeed` text DEFAULT NULL,
  `generalScope` text DEFAULT NULL,
  `investmentAnalysis` text DEFAULT NULL,
  `currency` varchar(3) NOT NULL,
  `desiredNetAmount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sellerCommissionRate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `externalCosts` decimal(15,2) NOT NULL DEFAULT 0.00,
  `thirdPartyLicenses` decimal(15,2) NOT NULL DEFAULT 0.00,
  `additionalMarginRate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `recommendedSubtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discountAmount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `ivaRate` decimal(7,4) NOT NULL DEFAULT 13.0000,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `ivaAmount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `estimatedCommission` decimal(15,2) NOT NULL DEFAULT 0.00,
  `estimatedNetAmount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `roundFinalPrice` tinyint(1) NOT NULL DEFAULT 0,
  `showIvi` tinyint(1) NOT NULL DEFAULT 0,
  `paymentTermsText` text DEFAULT NULL,
  `projectTimeline` varchar(255) DEFAULT NULL,
  `termsText` text DEFAULT NULL,
  `futureRecommendation` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `queueId` int(11) DEFAULT NULL,
  `generatedDocumentId` int(11) DEFAULT NULL,
  `createdById` int(11) NOT NULL,
  `updatedById` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `proposalNumber` (`proposalNumber`),
  KEY `generatedDocumentId` (`generatedDocumentId`),
  KEY `createdById` (`createdById`),
  KEY `updatedById` (`updatedById`),
  KEY `idx_proposals_status` (`status`),
  KEY `idx_proposals_client` (`businessClientId`),
  KEY `idx_proposals_queue` (`queueId`),
  KEY `idx_proposals_offer_date` (`offerDate`),
  CONSTRAINT `commercialproposals_ibfk_1` FOREIGN KEY (`businessClientId`) REFERENCES `BusinessClients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `commercialproposals_ibfk_2` FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `commercialproposals_ibfk_3` FOREIGN KEY (`generatedDocumentId`) REFERENCES `SmartDocuments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `commercialproposals_ibfk_4` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `commercialproposals_ibfk_5` FOREIGN KEY (`updatedById`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommercialProposals`
--

LOCK TABLES `CommercialProposals` WRITE;
/*!40000 ALTER TABLE `CommercialProposals` DISABLE KEYS */;
INSERT INTO `CommercialProposals` VALUES
(4,2,NULL,NULL,NULL,NULL,'001','PROP-2026-005','2026-06-25','Prueba 1','Hola','Hola 2','Hola 3','Hola 4','CRC',55000.00,7.0000,25000.00,0.00,0.0000,86022.00,0.00,13.0000,102222.00,13288.86,115510.86,7155.54,70066.46,1,0,'aagag','gagag','haha','hahaha','draft',3,55,1,1,'2026-06-24 22:33:50','2026-06-25 03:24:08','2026-06-25 03:24:08'),
(5,2,NULL,NULL,NULL,NULL,'05','PROP-2026-gd','2026-06-25','Prueba 2','vavava','vavava','avavava','avavava','CRC',550000.00,7.0000,41000.00,0.00,0.0000,635484.00,0.00,13.0000,705000.00,91650.00,796650.00,49350.00,614650.00,1,0,NULL,NULL,NULL,NULL,'draft',NULL,56,1,1,'2026-06-25 02:58:51','2026-06-25 03:24:10','2026-06-25 03:24:10'),
(6,2,NULL,NULL,NULL,NULL,'555','PROP-2026-006','2026-06-25','fafafa','afaf','afa','fafa',NULL,'CRC',2500000.00,7.0000,0.00,0.00,0.0000,2688173.00,0.00,13.0000,3000000.00,390000.00,3390000.00,210000.00,2790000.00,1,0,NULL,NULL,NULL,NULL,'draft',NULL,61,1,1,'2026-06-25 03:21:32','2026-06-25 03:27:00',NULL);
/*!40000 ALTER TABLE `CommercialProposals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ContactCustomFields`
--

DROP TABLE IF EXISTS `ContactCustomFields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contactcustomfields` (
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
CREATE TABLE `contacts` (
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
CREATE TABLE `ecosystems` (
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
-- Table structure for table `InternalNotifications`
--

DROP TABLE IF EXISTS `InternalNotifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `internalnotifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `createdById` int(11) DEFAULT NULL,
  `type` varchar(80) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `documentId` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `comment` text DEFAULT NULL,
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `proposalId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_internal_notifications_user` (`userId`),
  KEY `idx_internal_notifications_creator` (`createdById`),
  KEY `idx_internal_notifications_document` (`documentId`),
  KEY `idx_internal_notifications_type` (`type`),
  KEY `idx_internal_notifications_read` (`readAt`),
  KEY `idx_internal_notifications_created` (`createdAt`),
  KEY `idx_internal_notifications_proposal` (`proposalId`),
  CONSTRAINT `InternalNotifications_proposalId_foreign_idx` FOREIGN KEY (`proposalId`) REFERENCES `CommercialProposals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `internalnotifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `internalnotifications_ibfk_2` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `internalnotifications_ibfk_3` FOREIGN KEY (`documentId`) REFERENCES `SmartDocuments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `internalnotifications_ibfk_4` FOREIGN KEY (`documentId`) REFERENCES `SmartDocuments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InternalNotifications`
--

LOCK TABLES `InternalNotifications` WRITE;
/*!40000 ALTER TABLE `InternalNotifications` DISABLE KEYS */;
INSERT INTO `InternalNotifications` VALUES
(12,3,1,'document_status_change','Nuevo documento para revisión o seguimiento','Aarón Cortés cambió el estado de Contrato Freelance a En revisión.',29,'in_review','revision','2026-06-24 21:33:08','2026-06-24 21:33:01','2026-06-24 21:33:08',NULL),
(13,3,1,'document_status_change','Nuevo documento para revisión o seguimiento','Aarón Cortés cambió el estado de Contrato Freelance a Enviado.',29,'sent','envia porfa','2026-06-24 21:33:47','2026-06-24 21:33:31','2026-06-24 21:33:47',NULL);
/*!40000 ALTER TABLE `InternalNotifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InternalNotificationsV2`
--

DROP TABLE IF EXISTS `InternalNotificationsV2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `internalnotificationsv2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `createdById` int(11) DEFAULT NULL,
  `type` varchar(80) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `documentId` int(11) DEFAULT NULL,
  `proposalId` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `comment` text DEFAULT NULL,
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `createdById` (`createdById`),
  KEY `idx_internal_notifications_v2_user` (`userId`),
  KEY `idx_internal_notifications_v2_document` (`documentId`),
  KEY `idx_internal_notifications_v2_proposal` (`proposalId`),
  KEY `idx_internal_notifications_v2_read` (`readAt`),
  CONSTRAINT `internalnotificationsv2_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `internalnotificationsv2_ibfk_2` FOREIGN KEY (`createdById`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `internalnotificationsv2_ibfk_3` FOREIGN KEY (`documentId`) REFERENCES `SmartDocuments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `internalnotificationsv2_ibfk_4` FOREIGN KEY (`proposalId`) REFERENCES `CommercialProposals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InternalNotificationsV2`
--

LOCK TABLES `InternalNotificationsV2` WRITE;
/*!40000 ALTER TABLE `InternalNotificationsV2` DISABLE KEYS */;
INSERT INTO `InternalNotificationsV2` VALUES
(12,3,1,'document_status_change','Nuevo documento para revisión o seguimiento','Aarón Cortés cambió el estado de Contrato Freelance a En revisión.',29,NULL,'in_review','revision','2026-06-24 21:33:08','2026-06-24 21:33:01','2026-06-24 21:33:08'),
(13,3,1,'document_status_change','Nuevo documento para revisión o seguimiento','Aarón Cortés cambió el estado de Contrato Freelance a Enviado.',29,NULL,'sent','envia porfa','2026-06-24 21:33:47','2026-06-24 21:33:31','2026-06-24 21:33:47');
/*!40000 ALTER TABLE `InternalNotificationsV2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Messages`
--

DROP TABLE IF EXISTS `Messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
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
CREATE TABLE `queues` (
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
CREATE TABLE `quickanswers` (
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
CREATE TABLE `sequelizemeta` (
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
('20200717000000-initial-schema.js'),
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
('20260623120000-add-lastCustomerMessageId-to-tickets.js'),
('20260624183000-create-collaborators.js'),
('20260624194500-add-smart-document-lifecycle.js'),
('20260624213000-add-internal-document-notifications.js'),
('20260625003000-add-commercial-proposals.js'),
('20260625003100-create-internal-notifications-v2.js'),
('20260626000000-dropbox-storage-base.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Settings`
--

DROP TABLE IF EXISTS `Settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
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
CREATE TABLE `smartdocumenttemplateversions` (
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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SmartDocumentTemplateVersions`
--

LOCK TABLES `SmartDocumentTemplateVersions` WRITE;
/*!40000 ALTER TABLE `SmartDocumentTemplateVersions` DISABLE KEYS */;
INSERT INTO `SmartDocumentTemplateVersions` VALUES
(1,1,1,'plantilla_prueba_techkepper.docx','487ff8c78114ff3e86056cc83970fb1935ed088da517d152.docx','templates/2026/06/487ff8c78114ff3e86056cc83970fb1935ed088da517d152.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',13758,'[\"CLIENTE\",\"FECHA\",\"MONTO\",\"SERVICIO\"]','[\"CLIENTE\",\"FECHA\",\"MONTO\",\"SERVICIO\"]',1,1,'2026-06-23 17:06:48','2026-06-23 17:06:48','2026-06-24 00:13:55'),
(2,2,1,'Plantilla-propuesta-de-servicio-2026-06-23.docx','76b007800b7630af724bc5b25c3875e3d3ad03a361b42d4a.docx','templates/2026/06/76b007800b7630af724bc5b25c3875e3d3ad03a361b42d4a.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',12100,'[]','[]',1,1,'2026-06-23 19:43:07','2026-06-23 19:43:07','2026-06-24 00:13:57'),
(3,6,1,'NDA_mutuo_Techkepper_plantilla_variables.docx','65d8572d4326d1c2b44e199298c9132192a549c85561a00e.docx','templates/2026/06/65d8572d4326d1c2b44e199298c9132192a549c85561a00e.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',46118,'[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"FECHA_FIRMA\"]','[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"FECHA_FIRMA\"]',1,1,'2026-06-23 23:52:41','2026-06-23 23:52:41',NULL),
(9,12,1,'Contrato_Techkepper_Web_plantilla_variables.docx','3cd330cda4adba2d6c0a27af91e5debd952f6d4c3b028d44.docx','templates/2026/06/3cd330cda4adba2d6c0a27af91e5debd952f6d4c3b028d44.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',51551,'[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CLIENTE_TELEFONO\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]','[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]',1,1,'2026-06-24 13:45:44','2026-06-24 13:45:44',NULL),
(10,13,1,'Contrato_Techkepper_Growth_plantilla_variables.docx','ff0a2580633b2a11b75bc3c51f93d304144f6e7c39681f1b.docx','templates/2026/06/ff0a2580633b2a11b75bc3c51f93d304144f6e7c39681f1b.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',56499,'[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CLIENTE_TELEFONO\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\"]','[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]',1,1,'2026-06-24 13:46:26','2026-06-24 13:46:26','2026-06-24 13:54:21'),
(11,14,1,'Contrato_Techkepper_Secure_plantilla_variables.docx','4874f5f6feb94d41eef15f630e4bef6134bd22374d7d6c9e.docx','templates/2026/06/4874f5f6feb94d41eef15f630e4bef6134bd22374d7d6c9e.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',51656,'[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CLIENTE_TELEFONO\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]','[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]',1,1,'2026-06-24 13:48:09','2026-06-24 13:48:09',NULL),
(12,15,1,'Contrato_Techkepper_Automate_plantilla_variables.docx','e5e318c69bc07033d9da409947bc3821d9d7a4d1fde8116c.docx','templates/2026/06/e5e318c69bc07033d9da409947bc3821d9d7a4d1fde8116c.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',51623,'[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CLIENTE_TELEFONO\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]','[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]',1,1,'2026-06-24 13:49:45','2026-06-24 13:49:45',NULL),
(13,16,1,'Contrato_Techkepper_Growth_plantilla_variables_actualizado.docx','285a6a3299c20b7fa5593657620aa04b25ab6c1f1a025396.docx','templates/2026/06/285a6a3299c20b7fa5593657620aa04b25ab6c1f1a025396.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',52669,'[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CLIENTE_TELEFONO\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]','[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"CONDICIONES_ESPECIALES\",\"ECOSISTEMA\",\"ENTREGABLES\",\"FECHA_FIRMA\",\"FECHA_INICIO\",\"HERRAMIENTAS_EXCLUIDAS\",\"HERRAMIENTAS_INCLUIDAS\",\"LUGAR_FIRMA\",\"MONEDA\",\"MONTO\",\"NOMBRE_PROYECTO\",\"PERIODICIDAD\",\"PLAZO_MINIMO\",\"TIEMPOS_RESPUESTA\"]',1,1,'2026-06-24 13:55:06','2026-06-24 13:55:06',NULL),
(20,23,1,'NDA_unilateral_Techkepper_plantilla_variables.docx','67ed3940d62fc479ff2930f0dc63f1615c2ba184b74d2015.docx','templates/2026/06/67ed3940d62fc479ff2930f0dc63f1615c2ba184b74d2015.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',44600,'[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"FECHA_FIRMA\",\"PROPOSITO\"]','[\"CLIENTE_CARGO_REPRESENTANTE\",\"CLIENTE_CEDULA\",\"CLIENTE_CEDULA_REPRESENTANTE\",\"CLIENTE_CORREO\",\"CLIENTE_DOMICILIO\",\"CLIENTE_RAZON_SOCIAL\",\"CLIENTE_REPRESENTANTE\",\"FECHA_FIRMA\",\"PROPOSITO\"]',1,1,'2026-06-24 14:21:07','2026-06-24 14:21:07',NULL),
(31,34,1,'Contrato_Freelance_Ventas_Techkepper_plantilla_variables.docx','7c422a6bdbec88b9ed0ccb9d39e2d7679d5345d62db6468f.docx','templates/2026/06/7c422a6bdbec88b9ed0ccb9d39e2d7679d5345d62db6468f.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',85982,'[\"FECHA_FIRMA\",\"FREELANCE_CEDULA\",\"FREELANCE_DENOMINACION\",\"FREELANCE_NOMBRE\",\"LUGAR_FIRMA\"]','[\"FECHA_FIRMA\",\"FREELANCE_CEDULA\",\"FREELANCE_DENOMINACION\",\"FREELANCE_NOMBRE\",\"LUGAR_FIRMA\"]',1,1,'2026-06-24 15:35:55','2026-06-24 15:35:55',NULL);
/*!40000 ALTER TABLE `SmartDocumentTemplateVersions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SmartDocumentTemplates`
--

DROP TABLE IF EXISTS `SmartDocumentTemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `smartdocumenttemplates` (
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SmartDocumentTemplates`
--

LOCK TABLES `SmartDocumentTemplates` WRITE;
/*!40000 ALTER TABLE `SmartDocumentTemplates` DISABLE KEYS */;
INSERT INTO `SmartDocumentTemplates` VALUES
(1,'Plantilla propuesta de servicio',NULL,'Propuestas','other','other',0,0,1,1,NULL,NULL,'2026-06-23 17:06:48','2026-06-23 17:06:48','2026-06-24 00:13:55'),
(2,'2.0',NULL,'cliente','other','other',0,0,1,1,NULL,NULL,'2026-06-23 19:43:07','2026-06-23 19:43:07','2026-06-24 00:13:57'),
(6,'NDA MUTUO',NULL,'Cliente','nda_mutual','nda',1,0,1,1,NULL,1,'2026-06-23 23:52:41','2026-06-23 23:52:41',NULL),
(12,'Ecositema Web',NULL,'Contrato','web_contract','contracts',1,0,1,1,NULL,1,'2026-06-24 13:45:44','2026-06-24 13:45:44',NULL),
(13,'Ecosistema Growth',NULL,'Contrato','growth_contract','contracts',1,0,1,1,NULL,3,'2026-06-24 13:46:26','2026-06-24 13:46:26','2026-06-24 13:54:21'),
(14,'Ecosistema Secure',NULL,'Contrato','secure_contract','contracts',1,0,1,1,NULL,2,'2026-06-24 13:48:09','2026-06-24 13:48:09',NULL),
(15,'Ecosistema Automate',NULL,'Contrato','automate_contract','contracts',1,0,1,1,NULL,4,'2026-06-24 13:49:45','2026-06-24 13:49:45',NULL),
(16,'Ecosistema Growth',NULL,'Contrato','growth_contract','contracts',1,0,1,1,NULL,3,'2026-06-24 13:55:06','2026-06-24 13:55:06',NULL),
(23,'NDA unilateral',NULL,'NDA','nda_unilateral','nda',1,0,1,1,NULL,NULL,'2026-06-24 14:21:07','2026-06-24 14:21:07',NULL),
(34,'Contrato Freelance',NULL,'Freelance','freelance_sales_contract','contracts',0,0,1,1,NULL,NULL,'2026-06-24 15:35:55','2026-06-24 15:35:55',NULL);
/*!40000 ALTER TABLE `SmartDocumentTemplates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TicketAssignmentEvents`
--

DROP TABLE IF EXISTS `TicketAssignmentEvents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticketassignmentevents` (
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
CREATE TABLE `tickets` (
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
CREATE TABLE `userqueues` (
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
CREATE TABLE `users` (
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES
(1,'Aarón Cortés','aaron.cortes@techkepper.com','$2a$12$gV5EyLmjum.gLs403FJdde5ulJy7xd4cGKCe0UCrcpmGyt2ygthdK','2026-06-09 18:44:28','2026-06-27 23:40:44','admin',13,NULL,1,'dark','2026-06-27 23:40:44'),
(3,'Maria ','aaa@techkepper.com','$2a$12$mR9OZnZ7O8vnxIQNgdhlmurb3DPM7/vaOcg.lGoHhX8w8BgkFhlG2','2026-06-11 14:24:17','2026-06-24 22:14:05','agent',8,NULL,1,'dark','2026-06-24 22:14:05'),
(4,'Luis','abc@techkepper.com','$2a$12$ZkyUgb4TbqTORAKnQZ0Rxe2aa4sBgARQgyNoD8.4gGOIZwqPt/blK','2026-06-11 14:24:42','2026-06-24 22:14:04','supervisor',1,NULL,1,'dark','2026-06-24 22:14:04');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WhatsappQueues`
--

DROP TABLE IF EXISTS `WhatsappQueues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsappqueues` (
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
CREATE TABLE `whatsapps` (
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
(2,NULL,'','ERROR',NULL,NULL,'2026-06-11 14:16:04','2026-06-27 23:33:55','tECH',1,0,'','',NULL,'v25.0',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `Whatsapps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `businessclientdocuments`
--

DROP TABLE IF EXISTS `businessclientdocuments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `businessclientdocuments` (
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
  CONSTRAINT `fk_business_client_documents_linked_by` FOREIGN KEY (`linkedById`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `businessclientdocuments`
--

LOCK TABLES `businessclientdocuments` WRITE;
/*!40000 ALTER TABLE `businessclientdocuments` DISABLE KEYS */;
INSERT INTO `businessclientdocuments` VALUES
(2,2,4,1,'2026-06-24 00:12:17','2026-06-24 00:12:17'),
(8,2,10,1,'2026-06-24 13:53:12','2026-06-24 13:53:12'),
(16,1,18,1,'2026-06-24 14:28:44','2026-06-24 14:28:44'),
(17,1,19,1,'2026-06-24 14:31:15','2026-06-24 14:31:15'),
(34,2,55,1,'2026-06-24 22:33:57','2026-06-24 22:33:57'),
(35,2,56,1,'2026-06-25 02:58:57','2026-06-25 02:58:57'),
(36,2,57,1,'2026-06-25 03:21:40','2026-06-25 03:21:40'),
(37,2,58,1,'2026-06-25 03:22:13','2026-06-25 03:22:13'),
(38,2,59,1,'2026-06-25 03:26:01','2026-06-25 03:26:01'),
(39,2,60,1,'2026-06-25 03:26:44','2026-06-25 03:26:44'),
(40,2,61,1,'2026-06-25 03:27:00','2026-06-25 03:27:00');
/*!40000 ALTER TABLE `businessclientdocuments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `collaboratordocuments`
--

DROP TABLE IF EXISTS `collaboratordocuments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `collaboratordocuments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `collaboratorId` int(11) NOT NULL,
  `documentId` int(11) NOT NULL,
  `linkedById` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `documentId` (`documentId`),
  KEY `collaboratorId` (`collaboratorId`),
  KEY `fk_collaborator_documents_linked_by` (`linkedById`),
  CONSTRAINT `fk_collaborator_documents_linked_by` FOREIGN KEY (`linkedById`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collaboratordocuments`
--

LOCK TABLES `collaboratordocuments` WRITE;
/*!40000 ALTER TABLE `collaboratordocuments` DISABLE KEYS */;
INSERT INTO `collaboratordocuments` VALUES
(2,2,29,1,'2026-06-24 15:37:24','2026-06-24 15:37:24'),
(5,2,32,1,'2026-06-24 16:07:25','2026-06-24 16:07:25'),
(11,19,70,1,'2026-06-25 21:42:31','2026-06-25 21:42:31'),
(12,2,71,1,'2026-06-26 14:12:49','2026-06-26 14:12:49'),
(13,2,72,1,'2026-06-27 23:19:46','2026-06-27 23:19:46');
/*!40000 ALTER TABLE `collaboratordocuments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `collaborators`
--

DROP TABLE IF EXISTS `collaborators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `collaborators` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fullName` varchar(255) NOT NULL,
  `identificationType` varchar(80) NOT NULL,
  `identificationNumber` varchar(80) NOT NULL,
  `normalizedIdentificationNumber` varchar(80) NOT NULL,
  `contractualDenomination` enum('LA CONTRATISTA','EL CONTRATISTA') NOT NULL,
  `sex` enum('female','male','unspecified') NOT NULL DEFAULT 'unspecified',
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `queueId` int(11) DEFAULT NULL,
  `createdById` int(11) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `normalizedIdentificationNumber` (`normalizedIdentificationNumber`),
  KEY `queueId` (`queueId`),
  KEY `fk_collaborators_created_by` (`createdById`),
  CONSTRAINT `collaborators_ibfk_1` FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_collaborators_created_by` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collaborators`
--

LOCK TABLES `collaborators` WRITE;
/*!40000 ALTER TABLE `collaborators` DISABLE KEYS */;
INSERT INTO `collaborators` VALUES
(2,'Alberto Paniagua','Cédula de identidad','2-3569-8888','235698888','EL CONTRATISTA','unspecified','acvv@tidns.com','8888-5564','Casita bonita','Hola prueba',NULL,1,1,'2026-06-24 15:37:05','2026-06-24 15:37:05',NULL),
(19,'Marcos corrales','Cédula de identidad','1-1415-1516','114151516','EL CONTRATISTA','male','sfsfs@fafa.com','444444444',NULL,NULL,NULL,1,0,'2026-06-25 21:41:59','2026-06-25 21:43:17',NULL);
/*!40000 ALTER TABLE `collaborators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `externalstorageconnections`
--

DROP TABLE IF EXISTS `externalstorageconnections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `externalstorageconnections` (
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
  CONSTRAINT `ExternalStorageConnections_createdById_fk` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ExternalStorageConnections_updatedById_fk` FOREIGN KEY (`updatedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `externalstorageconnections`
--

LOCK TABLES `externalstorageconnections` WRITE;
/*!40000 ALTER TABLE `externalstorageconnections` DISABLE KEYS */;
INSERT INTO `externalstorageconnections` VALUES
(1,'dropbox','connected',NULL,'{\"account_id\":\"dbid:AAAIPzRER-3lcQRBbUeh6cJswfZus6rIsr0\",\"account_type\":{\".tag\":\"pro\"},\"country\":\"CR\",\"disabled\":false,\"email\":\"techkepper@gmail.com\",\"email_verified\":true,\"is_paired\":false,\"locale\":\"es\",\"name\":{\"abbreviated_name\":\"T\",\"display_name\":\"Techkepper\",\"familiar_name\":\"Techkepper\",\"given_name\":\"Techkepper\",\"surname\":\"\"},\"referral_link\":\"https://www.dropbox.com/referrals/AACEEYcdDtGrrLMDnU66_S8glAaK-iVA-ds?src=app9-7412227\",\"root_info\":{\".tag\":\"user\",\"home_namespace_id\":\"4636936657\",\"root_namespace_id\":\"4636936657\"}}',1,1,'2026-06-27 23:15:08','2026-06-26 14:05:27','2026-06-27 23:15:08',NULL);
/*!40000 ALTER TABLE `externalstorageconnections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequelizedata`
--

DROP TABLE IF EXISTS `sequelizedata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequelizedata` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequelizedata`
--

LOCK TABLES `sequelizedata` WRITE;
/*!40000 ALTER TABLE `sequelizedata` DISABLE KEYS */;
INSERT INTO `sequelizedata` VALUES
('20200904070004-create-default-settings.js'),
('20200904070004-create-default-users.js'),
('20200904070006-create-apiToken-settings.js'),
('20260609091000-create-techkepper-baseline.js');
/*!40000 ALTER TABLE `sequelizedata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smartdocumentevents`
--

DROP TABLE IF EXISTS `smartdocumentevents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `smartdocumentevents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `documentId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `eventType` varchar(80) NOT NULL,
  `previousStatus` varchar(50) DEFAULT NULL,
  `newStatus` varchar(50) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `metadata` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_smart_document_events_document` (`documentId`),
  KEY `idx_smart_document_events_user` (`userId`),
  KEY `idx_smart_document_events_type` (`eventType`),
  KEY `idx_smart_document_events_created` (`createdAt`),
  KEY `idx_smart_document_events_status` (`newStatus`),
  CONSTRAINT `fk_smart_document_events_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smartdocumentevents`
--

LOCK TABLES `smartdocumentevents` WRITE;
/*!40000 ALTER TABLE `smartdocumentevents` DISABLE KEYS */;
INSERT INTO `smartdocumentevents` VALUES
(21,32,1,'status_changed','generated','in_review','prueba',NULL,'2026-06-24 18:28:04','2026-06-24 18:28:04'),
(22,32,1,'status_changed','in_review','sent','prueba 2',NULL,'2026-06-24 18:28:15','2026-06-24 18:28:15'),
(23,32,1,'status_changed','sent','approved','23',NULL,'2026-06-24 18:28:25','2026-06-24 18:28:25'),
(24,32,1,'status_changed','approved','rejected','333',NULL,'2026-06-24 18:28:30','2026-06-24 18:28:30'),
(25,32,1,'archived','rejected','archived','444',NULL,'2026-06-24 18:28:37','2026-06-24 18:28:37'),
(26,32,1,'status_changed','archived','pending_signature','adad',NULL,'2026-06-24 18:28:44','2026-06-24 18:28:44'),
(27,32,1,'status_changed','pending_signature','draft',NULL,NULL,'2026-06-24 18:28:54','2026-06-24 18:28:54'),
(40,32,3,'downloaded_pdf',NULL,'draft',NULL,NULL,'2026-06-24 21:24:48','2026-06-24 21:24:48'),
(43,29,1,'status_changed','generated','in_review','revision','{\"notifiedUserIds\":[3]}','2026-06-24 21:33:01','2026-06-24 21:33:01'),
(44,29,1,'status_changed','in_review','sent','envia porfa','{\"notifiedUserIds\":[3]}','2026-06-24 21:33:31','2026-06-24 21:33:31'),
(48,55,1,'generated',NULL,'generated',NULL,'{\"commercialProposalId\":4}','2026-06-24 22:33:57','2026-06-24 22:33:57'),
(49,56,1,'generated',NULL,'generated',NULL,'{\"commercialProposalId\":5}','2026-06-25 02:58:57','2026-06-25 02:58:57'),
(50,57,1,'generated',NULL,'generated',NULL,'{\"commercialProposalId\":6,\"variant\":\"formal\"}','2026-06-25 03:21:40','2026-06-25 03:21:40'),
(51,58,1,'generated',NULL,'generated',NULL,'{\"commercialProposalId\":6,\"variant\":\"quick\"}','2026-06-25 03:22:13','2026-06-25 03:22:13'),
(52,59,1,'generated',NULL,'generated',NULL,'{\"commercialProposalId\":6,\"variant\":\"formal\"}','2026-06-25 03:26:01','2026-06-25 03:26:01'),
(53,60,1,'generated',NULL,'generated',NULL,'{\"commercialProposalId\":6,\"variant\":\"formal\"}','2026-06-25 03:26:44','2026-06-25 03:26:44'),
(54,61,1,'generated',NULL,'generated',NULL,'{\"commercialProposalId\":6,\"variant\":\"quick\"}','2026-06-25 03:27:00','2026-06-25 03:27:00'),
(55,29,1,'downloaded_pdf',NULL,'sent',NULL,NULL,'2026-06-25 03:51:12','2026-06-25 03:51:12'),
(56,32,1,'downloaded_pdf',NULL,'draft',NULL,NULL,'2026-06-25 03:52:28','2026-06-25 03:52:28'),
(57,32,1,'downloaded_docx',NULL,'draft',NULL,NULL,'2026-06-25 03:52:28','2026-06-25 03:52:28'),
(65,70,1,'associated_collaborator',NULL,'generated',NULL,'{\"collaboratorId\":19}','2026-06-25 21:42:31','2026-06-25 21:42:31'),
(66,70,1,'generated',NULL,'generated',NULL,'{\"templateId\":34,\"templateVersionId\":31,\"baseDocumentId\":null}','2026-06-25 21:42:31','2026-06-25 21:42:31'),
(67,70,1,'downloaded_docx',NULL,'generated',NULL,NULL,'2026-06-25 21:42:34','2026-06-25 21:42:34'),
(68,70,1,'dropbox_sync_failed',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-26 14:06:49','2026-06-26 14:06:49'),
(69,70,1,'dropbox_sync_failed',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-26 14:07:14','2026-06-26 14:07:14'),
(70,70,1,'dropbox_sync_failed',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-26 14:09:58','2026-06-26 14:09:58'),
(71,70,1,'dropbox_sync_failed',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-26 14:11:10','2026-06-26 14:11:10'),
(72,61,1,'dropbox_sync_failed',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-26 14:11:12','2026-06-26 14:11:12'),
(73,71,1,'associated_collaborator',NULL,'generated',NULL,'{\"collaboratorId\":2}','2026-06-26 14:12:49','2026-06-26 14:12:49'),
(74,71,1,'generated',NULL,'generated',NULL,'{\"templateId\":34,\"templateVersionId\":31,\"baseDocumentId\":null}','2026-06-26 14:12:49','2026-06-26 14:12:49'),
(75,71,1,'dropbox_sync_failed',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-26 14:12:49','2026-06-26 14:12:49'),
(76,71,1,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\",\"storageFileId\":\"id:qEZS6CsqaTAAAAAAAAAABQ\",\"externalStoragePath\":\"/TechkepperCommandCenter/generated/docx/Contrato-Freelance-2026-06-26.docx\"}','2026-06-26 14:19:14','2026-06-26 14:19:14'),
(77,70,1,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\",\"storageFileId\":\"id:qEZS6CsqaTAAAAAAAAAACQ\",\"externalStoragePath\":\"/TechkepperCommandCenter/generated/docx/Contrato-Freelance-2026-06-26 (1).docx\"}','2026-06-26 14:20:00','2026-06-26 14:20:00'),
(78,61,1,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\",\"storageFileId\":\"id:qEZS6CsqaTAAAAAAAAAACg\",\"externalStoragePath\":\"/TechkepperCommandCenter/generated/docx/PROP-2026-006-quick.docx\"}','2026-06-26 14:20:02','2026-06-26 14:20:02'),
(79,61,1,'deleted','generated',NULL,NULL,'{\"title\":\"Cotización rápida - fafafa\"}','2026-06-26 14:26:09','2026-06-26 14:26:09'),
(80,72,1,'uploaded_existing_document',NULL,'approved','hola','{\"documentType\":\"legal_document\",\"documentDate\":\"2026-06-28\"}','2026-06-27 23:19:46','2026-06-27 23:19:46'),
(81,72,1,'associated_collaborator',NULL,'approved',NULL,'{\"collaboratorId\":2}','2026-06-27 23:19:46','2026-06-27 23:19:46'),
(82,72,1,'dropbox_sync_success',NULL,'approved',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:19:47','2026-06-27 23:19:47'),
(83,10,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:38:57','2026-06-27 23:38:57'),
(84,18,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:38:58','2026-06-27 23:38:58'),
(85,19,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:38:59','2026-06-27 23:38:59'),
(86,32,NULL,'dropbox_sync_success',NULL,'draft',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:39:01','2026-06-27 23:39:01'),
(87,29,NULL,'dropbox_sync_success',NULL,'sent',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:39:02','2026-06-27 23:39:02'),
(88,55,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:39:03','2026-06-27 23:39:03'),
(89,56,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:39:05','2026-06-27 23:39:05'),
(90,57,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:39:06','2026-06-27 23:39:06'),
(91,58,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:39:07','2026-06-27 23:39:07'),
(92,59,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:39:08','2026-06-27 23:39:08'),
(93,60,NULL,'dropbox_sync_success',NULL,'generated',NULL,'{\"provider\":\"dropbox\"}','2026-06-27 23:39:10','2026-06-27 23:39:10');
/*!40000 ALTER TABLE `smartdocumentevents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smartdocuments`
--

DROP TABLE IF EXISTS `smartdocuments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `smartdocuments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `originalName` varchar(255) NOT NULL,
  `storedName` varchar(255) NOT NULL,
  `storagePath` varchar(500) NOT NULL,
  `storageProvider` varchar(50) NOT NULL DEFAULT 'local',
  `storageFileId` varchar(255) DEFAULT NULL,
  `externalStoragePath` varchar(500) DEFAULT NULL,
  `storageSyncedAt` datetime DEFAULT NULL,
  `storageStatus` varchar(50) NOT NULL DEFAULT 'pending',
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
  `status` varchar(50) NOT NULL DEFAULT 'generated',
  `documentDate` date DEFAULT NULL,
  `baseDocumentId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_smart_documents_uploaded_by` (`uploadedById`),
  KEY `idx_smart_documents_contact` (`contactId`),
  KEY `idx_smart_documents_ticket` (`ticketId`),
  KEY `idx_smart_documents_queue` (`queueId`),
  KEY `idx_smart_documents_ecosystem` (`ecosystemId`),
  KEY `idx_smart_documents_created_at` (`createdAt`),
  KEY `idx_smart_documents_purpose` (`purpose`),
  KEY `idx_smart_documents_status` (`status`),
  KEY `idx_smart_documents_base_document` (`baseDocumentId`),
  CONSTRAINT `fk_smart_documents_contact` FOREIGN KEY (`contactId`) REFERENCES `Contacts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_documents_ecosystem` FOREIGN KEY (`ecosystemId`) REFERENCES `Ecosystems` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_documents_queue` FOREIGN KEY (`queueId`) REFERENCES `Queues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_documents_ticket` FOREIGN KEY (`ticketId`) REFERENCES `Tickets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_smart_documents_uploaded_by` FOREIGN KEY (`uploadedById`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smartdocuments`
--

LOCK TABLES `smartdocuments` WRITE;
/*!40000 ALTER TABLE `smartdocuments` DISABLE KEYS */;
INSERT INTO `smartdocuments` VALUES
(1,'contrato',NULL,'CONTRATO DE ECOSISTEMA TECHKEPPER WEB - Medical Tours.docx','7914cabcb379caf6611ce5feae6b44c07cd5bbe205a0dfc9.docx','2026/06/7914cabcb379caf6611ce5feae6b44c07cd5bbe205a0dfc9.docx','local',NULL,NULL,NULL,'pending','application/vnd.openxmlformats-officedocument.wordprocessingml.document',55714,'Web','other',NULL,1,NULL,NULL,NULL,NULL,'2026-06-23 16:25:50','2026-06-23 16:25:50','2026-06-23 16:26:30','generated',NULL,NULL),
(2,'Plantilla propuesta de servicio','Generado desde plantilla: Plantilla propuesta de servicio','Plantilla-propuesta-de-servicio-2026-06-23.docx','c3d7c1345197be949d30a6389e2df92975ca8e52a2ac807f.docx','generated/2026/06/c3d7c1345197be949d30a6389e2df92975ca8e52a2ac807f.docx','local',NULL,NULL,NULL,'pending','application/vnd.openxmlformats-officedocument.wordprocessingml.document',12100,'Propuestas','other','plantilla:1;version:1',1,NULL,NULL,NULL,NULL,'2026-06-23 17:07:44','2026-06-23 17:07:44','2026-06-23 18:16:25','generated',NULL,NULL),
(3,'2.0','Generado desde plantilla: 2.0','2.0-2026-06-23.docx','ca0925ce9235e2ab33c207d152a1b01d619c9fc123ef1bd2.docx','generated/2026/06/ca0925ce9235e2ab33c207d152a1b01d619c9fc123ef1bd2.docx','local',NULL,NULL,NULL,'pending','application/vnd.openxmlformats-officedocument.wordprocessingml.document',12100,'cliente','other','plantilla:2;version:1',1,NULL,NULL,NULL,NULL,'2026-06-23 19:43:59','2026-06-23 19:43:59','2026-06-24 00:13:48','generated',NULL,NULL),
(4,'NDA MUTUO','Generado desde plantilla: NDA MUTUO','NDA-MUTUO-2026-06-24.docx','7c4003cc5413223946abf453a31aa3a40f9b21244f964454.docx','generated/2026/06/7c4003cc5413223946abf453a31aa3a40f9b21244f964454.docx','local',NULL,NULL,NULL,'pending','application/vnd.openxmlformats-officedocument.wordprocessingml.document',46267,'Cliente','nda','plantilla:6;version:1',1,NULL,NULL,NULL,1,'2026-06-24 00:12:17','2026-06-24 00:12:17','2026-06-24 00:13:50','generated',NULL,NULL),
(10,'Ecosistema Automate','Generado desde plantilla: Ecosistema Automate','Ecosistema-Automate-2026-06-24.docx','665fec296058d5c734fda1a55c8a8f3d01d08247ef904dbe.docx','generated/2026/06/665fec296058d5c734fda1a55c8a8f3d01d08247ef904dbe.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAADg','/TechkepperCommandCenter/generated/docx/10-Ecosistema-Automate-2026-06-24.docx','2026-06-27 23:38:57','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',51718,'Contrato','contracts','plantilla:15;version:1',1,NULL,NULL,NULL,4,'2026-06-24 13:53:12','2026-06-27 23:38:57',NULL,'generated',NULL,NULL),
(18,'NDA unilateral','Generado desde plantilla: NDA unilateral','NDA-unilateral-2026-06-24.docx','dc31d6292ebe27b6e791eeb6cfe0132079af771aeeafa4b3.docx','generated/2026/06/dc31d6292ebe27b6e791eeb6cfe0132079af771aeeafa4b3.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAADw','/TechkepperCommandCenter/generated/docx/18-NDA-unilateral-2026-06-24.docx','2026-06-27 23:38:58','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',44514,'NDA','nda','plantilla:23;version:1',1,NULL,NULL,NULL,NULL,'2026-06-24 14:28:43','2026-06-27 23:38:58',NULL,'generated',NULL,NULL),
(19,'Ecositema Web','Generado desde plantilla: Ecositema Web','Ecositema-Web-2026-06-24.docx','a5bf386059feaac7f9de469e1bf896d918fed831a5e5da33.docx','generated/2026/06/a5bf386059feaac7f9de469e1bf896d918fed831a5e5da33.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAEA','/TechkepperCommandCenter/generated/docx/19-Ecositema-Web-2026-06-24.docx','2026-06-27 23:38:59','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',51649,'Contrato','contracts','plantilla:12;version:1',1,NULL,NULL,NULL,1,'2026-06-24 14:31:15','2026-06-27 23:38:59',NULL,'generated',NULL,NULL),
(29,'Contrato Freelance','Generado desde plantilla: Contrato Freelance','Contrato-Freelance-2026-06-24.docx','6ab15a2d88c47b0ec24d764e436740d01988ce0f18deee2f.docx','generated/2026/06/6ab15a2d88c47b0ec24d764e436740d01988ce0f18deee2f.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAEg','/TechkepperCommandCenter/generated/docx/29-Contrato-Freelance-2026-06-24.docx','2026-06-27 23:39:02','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',86177,'Freelance','contracts','plantilla:34;version:1',1,NULL,NULL,NULL,NULL,'2026-06-24 15:37:24','2026-06-27 23:39:02',NULL,'sent',NULL,NULL),
(32,'NDA MUTUO','Generado desde plantilla: NDA MUTUO','NDA-MUTUO-2026-06-24.docx','5a09d119d15d4d795461ac81208fc6899c006fc2e4427ac2.docx','generated/2026/06/5a09d119d15d4d795461ac81208fc6899c006fc2e4427ac2.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAEQ','/TechkepperCommandCenter/generated/docx/32-NDA-MUTUO-2026-06-24.docx','2026-06-27 23:39:01','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',46258,'Cliente','nda','plantilla:6;version:1',1,NULL,NULL,NULL,1,'2026-06-24 16:07:25','2026-06-27 23:39:01',NULL,'draft',NULL,NULL),
(55,'Prueba 1','Propuesta comercial PROP-2026-005','PROP-2026-005.docx','2c5d6c574c7e27cc5f3f211571acdb3a5b4c684da6b36a45.docx','generated/2026/06/2c5d6c574c7e27cc5f3f211571acdb3a5b4c684da6b36a45.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAEw','/TechkepperCommandCenter/generated/docx/55-PROP-2026-005.docx','2026-06-27 23:39:03','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',1680,'Propuesta comercial','quotations','commercial-proposal:4',1,NULL,NULL,3,NULL,'2026-06-24 22:33:57','2026-06-27 23:39:03',NULL,'generated',NULL,NULL),
(56,'Prueba 2','Propuesta comercial PROP-2026-gd','PROP-2026-gd.docx','7acded586e6de9b0d2164d046c3d70fc514b4d1bf3253cf8.docx','generated/2026/06/7acded586e6de9b0d2164d046c3d70fc514b4d1bf3253cf8.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAFA','/TechkepperCommandCenter/generated/docx/56-PROP-2026-gd.docx','2026-06-27 23:39:05','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',1636,'Propuesta comercial','quotations','commercial-proposal:5',1,NULL,NULL,NULL,NULL,'2026-06-25 02:58:57','2026-06-27 23:39:05',NULL,'generated',NULL,NULL),
(57,'Propuesta comercial - fafafa','Propuesta comercial PROP-2026-006, generada desde el machote oficial Techkepper','PROP-2026-006-formal.docx','9e9c7efa1975e9c37797aa30c59c43a87b5d0906fb988b73.docx','generated/2026/06/9e9c7efa1975e9c37797aa30c59c43a87b5d0906fb988b73.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAFQ','/TechkepperCommandCenter/generated/docx/57-PROP-2026-006-formal.docx','2026-06-27 23:39:06','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',64586,'Propuesta comercial','quotations','commercial-proposal:6;variant:formal',1,NULL,NULL,NULL,NULL,'2026-06-25 03:21:40','2026-06-27 23:39:06',NULL,'generated',NULL,NULL),
(58,'Cotización rápida - fafafa','Cotización rápida PROP-2026-006, generada desde el machote oficial Techkepper','PROP-2026-006-quick.docx','cc9e751c99c04bca3b7a721c527146d7f9e178b08331610f.docx','generated/2026/06/cc9e751c99c04bca3b7a721c527146d7f9e178b08331610f.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAFg','/TechkepperCommandCenter/generated/docx/58-PROP-2026-006-quick.docx','2026-06-27 23:39:07','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',68503,'Cotización rápida','quotations','commercial-proposal:6;variant:quick',1,NULL,NULL,NULL,NULL,'2026-06-25 03:22:13','2026-06-27 23:39:07',NULL,'generated',NULL,NULL),
(59,'Propuesta comercial - fafafa','Propuesta comercial PROP-2026-006, generada desde el machote oficial Techkepper','PROP-2026-006-formal.docx','5735330f4f5848bc4f511078d766756e6a017c8846b43741.docx','generated/2026/06/5735330f4f5848bc4f511078d766756e6a017c8846b43741.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAFw','/TechkepperCommandCenter/generated/docx/59-PROP-2026-006-formal.docx','2026-06-27 23:39:08','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',68503,'Propuesta comercial','quotations','commercial-proposal:6;variant:formal',1,NULL,NULL,NULL,NULL,'2026-06-25 03:26:01','2026-06-27 23:39:08',NULL,'generated',NULL,NULL),
(60,'Propuesta comercial - fafafa','Propuesta comercial PROP-2026-006, generada desde el machote oficial Techkepper','PROP-2026-006-formal.docx','e8f56c2a941c3aa3f9b5f575263e86113445591308040a64.docx','generated/2026/06/e8f56c2a941c3aa3f9b5f575263e86113445591308040a64.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAAGA','/TechkepperCommandCenter/generated/docx/60-PROP-2026-006-formal.docx','2026-06-27 23:39:10','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',68503,'Propuesta comercial','quotations','commercial-proposal:6;variant:formal',1,NULL,NULL,NULL,NULL,'2026-06-25 03:26:44','2026-06-27 23:39:10',NULL,'generated',NULL,NULL),
(61,'Cotización rápida - fafafa','Cotización rápida PROP-2026-006, generada desde el machote oficial Techkepper','PROP-2026-006-quick.docx','241bcc6c3d4cfd8cc385fd33fdb17f3ee35c2c22c920c46f.docx','generated/2026/06/241bcc6c3d4cfd8cc385fd33fdb17f3ee35c2c22c920c46f.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAACg','/TechkepperCommandCenter/generated/docx/PROP-2026-006-quick.docx','2026-06-26 14:20:02','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',64586,'Cotización rápida','quotations','commercial-proposal:6;variant:quick',1,NULL,NULL,NULL,NULL,'2026-06-25 03:27:00','2026-06-26 14:20:02','2026-06-26 14:26:09','generated',NULL,NULL),
(70,'Contrato Freelance','Generado desde plantilla: Contrato Freelance','Contrato-Freelance-2026-06-26.docx','2633419e776092c2d7c786107e200e5be5767bfcd010aba6.docx','generated/2026/06/2633419e776092c2d7c786107e200e5be5767bfcd010aba6.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAACQ','/TechkepperCommandCenter/generated/docx/Contrato-Freelance-2026-06-26 (1).docx','2026-06-26 14:20:00','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',86177,'Freelance','contracts','plantilla:34;version:1',1,NULL,NULL,NULL,NULL,'2026-06-25 21:42:31','2026-06-26 14:20:00',NULL,'generated','2026-06-26',NULL),
(71,'Contrato Freelance','Generado desde plantilla: Contrato Freelance','Contrato-Freelance-2026-06-26.docx','ef5fb4aff2d1f9ec55d1dd66dd2e30acf2b61f37b540c7fd.docx','generated/2026/06/ef5fb4aff2d1f9ec55d1dd66dd2e30acf2b61f37b540c7fd.docx','dropbox','id:qEZS6CsqaTAAAAAAAAAABQ','/TechkepperCommandCenter/generated/docx/Contrato-Freelance-2026-06-26.docx','2026-06-26 14:19:14','synced','application/vnd.openxmlformats-officedocument.wordprocessingml.document',86177,'Freelance','contracts','plantilla:34;version:1',1,NULL,NULL,NULL,NULL,'2026-06-26 14:12:49','2026-06-26 14:19:14',NULL,'generated','2026-06-26',NULL),
(72,'tests','hola','null (1).pdf','0e4019da28bfcc6ff87beca8f2ba58c44da1459db9787ec7.pdf','documents/2026/06/0e4019da28bfcc6ff87beca8f2ba58c44da1459db9787ec7.pdf','dropbox','id:qEZS6CsqaTAAAAAAAAAACw','/TechkepperCommandCenter/documents/collaborators/72-null (1).pdf','2026-06-27 23:19:47','synced','application/pdf',230670,'legal_document','other','origen:expediente;preexistente:true',1,NULL,NULL,NULL,NULL,'2026-06-27 23:19:46','2026-06-27 23:19:47',NULL,'approved','2026-06-28',NULL);
/*!40000 ALTER TABLE `smartdocuments` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-27 21:13:09
