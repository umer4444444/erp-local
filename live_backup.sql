-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: erp_db
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.24.04.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `workShiftId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `clockIn` datetime NOT NULL,
  `clockOut` datetime DEFAULT NULL,
  `status` enum('present','late','absent','on_leave') COLLATE utf8mb4_unicode_ci DEFAULT 'present',
  `lateMinutes` int DEFAULT '0',
  `earlyMinutes` int DEFAULT '0',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employeeId` (`employeeId`),
  KEY `workShiftId` (`workShiftId`),
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `attendance_ibfk_4` FOREIGN KEY (`workShiftId`) REFERENCES `work_shifts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES ('7c211a29-3f29-42e1-9953-c3c9a81bf4b5','e45a687b-28dd-456e-8f89-8500e5a50167',NULL,'2026-07-22 15:45:45',NULL,'late',405,0,31.57132525,74.41214788,NULL,'2026-07-22 15:45:45','2026-07-22 15:45:45'),('843e6d3f-3683-4c3c-8fd5-cf752fc3ad1a','580f2fdd-2318-4e8a-b14d-3cbabc178c08',NULL,'2026-07-14 12:02:06','2026-07-17 15:36:43','late',182,0,31.57132269,74.41214928,NULL,'2026-07-14 12:02:06','2026-07-17 15:36:43'),('a2090d4a-897c-4d2a-b1ac-4bac518cce97','580f2fdd-2318-4e8a-b14d-3cbabc178c08',NULL,'2026-07-22 15:40:54','2026-07-22 15:41:09','late',400,0,31.57133779,74.41214810,NULL,'2026-07-22 15:40:54','2026-07-22 15:41:09'),('c512fe36-13b2-4e69-84d5-c5d592a24c16','580f2fdd-2318-4e8a-b14d-3cbabc178c08',NULL,'2026-07-12 15:55:16','2026-07-14 12:02:03','late',415,0,31.57156424,74.41218616,NULL,'2026-07-12 15:55:16','2026-07-14 12:02:03'),('dac2acdb-ecbf-44bd-8f84-581b9133c0b8','580f2fdd-2318-4e8a-b14d-3cbabc178c08',NULL,'2026-07-18 15:01:12','2026-07-22 15:40:53','late',361,0,31.57162286,74.41219533,NULL,'2026-07-18 15:01:12','2026-07-22 15:40:53'),('e0a92f8a-ae1f-44e2-9362-115b5b86db7b','580f2fdd-2318-4e8a-b14d-3cbabc178c08',NULL,'2026-07-22 15:41:25','2026-07-23 09:45:24','late',401,0,31.57133817,74.41214795,NULL,'2026-07-22 15:41:25','2026-07-23 09:45:24');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recordId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oldValue` text COLLATE utf8mb4_unicode_ci,
  `newValue` text COLLATE utf8mb4_unicode_ci,
  `ip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('1d4d508b-6a43-4b10-8ad5-923ce4c474a0','3fa639a9-0107-4b6c-8a50-871bc7bf198b','PUT','suppliers','1b0a0ef8-0e4e-42ff-a7e5-d76cbd892e04','{}','{}','::ffff:127.0.0.1','2026-07-12 15:54:08'),('23849cd3-af11-4df4-813f-164861cee277','3fa639a9-0107-4b6c-8a50-871bc7bf198b','POST','inventory',NULL,NULL,'{}','::ffff:127.0.0.1','2026-07-14 11:51:34'),('867fe471-8087-4c69-99f0-c2d597ccfa63','3fa639a9-0107-4b6c-8a50-871bc7bf198b','POST','suppliers','7e685ab3-6d31-4bd7-98ca-a12d2a41e584',NULL,'{\"name\":\"umer\",\"contactPerson\":\"umer\",\"email\":\"umeramin577@gmail.com\",\"phone\":\"03037988851\",\"address\":\"11A\",\"category\":\"materials\",\"rating\":3}','::ffff:127.0.0.1','2026-07-12 15:53:59'),('886eb288-2710-4ea4-8e14-c2cd8555a836','3fa639a9-0107-4b6c-8a50-871bc7bf198b','POST','customers','843bfc70-a6c2-4c77-892a-16873513a201',NULL,'{\"name\":\"ali asghar\",\"email\":\"ali@gmail.com\",\"phone\":\"+923284394097\",\"address\":\" bus stop gt road lahore\"}','::ffff:127.0.0.1','2026-07-22 13:51:29'),('97685f87-4690-42e7-9d09-4b0fdba4e621','3fa639a9-0107-4b6c-8a50-871bc7bf198b','POST','inventory',NULL,NULL,'{}','::ffff:127.0.0.1','2026-07-14 11:53:37'),('9ac2cc10-d103-45c7-ba91-dc33490eb47e','3fa639a9-0107-4b6c-8a50-871bc7bf198b','PUT','suppliers','400fb717-5e67-44c4-85f3-cee3309afacc','{}','{}','::ffff:127.0.0.1','2026-07-14 12:03:10'),('9fe502f6-ccfd-4343-9b92-b6ba8365652a','3fa639a9-0107-4b6c-8a50-871bc7bf198b','POST','inventory',NULL,NULL,'{}','::ffff:127.0.0.1','2026-07-14 11:44:08'),('b05a2678-828d-42bc-baa7-b15223758a0a','3fa639a9-0107-4b6c-8a50-871bc7bf198b','POST','inventory',NULL,NULL,'{}','::ffff:127.0.0.1','2026-07-14 14:10:09'),('befefbe5-8cf2-4dd7-8427-24ca67812cef','3fa639a9-0107-4b6c-8a50-871bc7bf198b','POST','inventory',NULL,NULL,'{}','::ffff:127.0.0.1','2026-07-14 11:34:48'),('f333efb9-fa89-43e6-9a7d-5b5292a81499','3fa639a9-0107-4b6c-8a50-871bc7bf198b','POST','inventory',NULL,NULL,'{}','::ffff:127.0.0.1','2026-07-12 15:54:02');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bids`
--

DROP TABLE IF EXISTS `bids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bids` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `rideId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `driverId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','accepted','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rideId` (`rideId`),
  KEY `driverId` (`driverId`),
  CONSTRAINT `bids_ibfk_3` FOREIGN KEY (`rideId`) REFERENCES `rides` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bids_ibfk_4` FOREIGN KEY (`driverId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bids`
--

LOCK TABLES `bids` WRITE;
/*!40000 ALTER TABLE `bids` DISABLE KEYS */;
/*!40000 ALTER TABLE `bids` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storeType` enum('department') COLLATE utf8mb4_unicode_ci DEFAULT 'department',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('05cebd85-ab82-49d5-a933-d84b504abf15','Structural Materials','department','Cement, Steel, Bricks','2026-07-12 15:52:29','2026-07-12 15:52:29'),('4534ce5c-4c3b-4f7c-a505-0011cfb06e62','Finishing & Interior','department','Tiles, Paint, Flooring','2026-07-12 15:52:29','2026-07-12 15:52:29'),('4862c26f-10f2-4411-94eb-e5899d40151a','MEP (Mechanical/Elec/Plumb)','department','Pipes, Wires, Fittings','2026-07-12 15:52:29','2026-07-12 15:52:29'),('ce5f38ce-48cd-42c5-af08-7d108925cdfa','Tools & Safety','department','Power tools and PPE','2026-07-12 15:52:29','2026-07-12 15:52:29');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditBalance` decimal(12,2) DEFAULT '0.00',
  `loyaltyPoints` int DEFAULT '0',
  `tier` enum('Bronze','Silver','Gold','VIP') COLLATE utf8mb4_unicode_ci DEFAULT 'Bronze',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('5fd53259-9b27-43c1-a7dc-9e53e1413415','Modern Builders Ltd','info@modernbuilders.com','021-3456789','DHA Phase 6, Karachi',0.00,0,'Bronze','2026-07-12 15:52:29','2026-07-12 15:52:29'),('843bfc70-a6c2-4c77-892a-16873513a201','ali asghar','ali@gmail.com','+923284394097',' bus stop gt road lahore',0.00,0,'Bronze','2026-07-22 13:51:29','2026-07-22 13:51:29'),('afce5ff8-76a4-4b34-b339-082045edf752','Elite Residency Project','procurement@eliteresidency.com','042-9988776','Gulberg III, Lahore',0.00,0,'Bronze','2026-07-12 15:52:29','2026-07-12 15:52:29');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES ('3b4fe9e5-86b6-4744-bc86-cb32cc179c74','Finance','Accounts, Billing, and Bidding','active','2026-07-12 15:52:29','2026-07-12 15:52:29'),('47ac67c0-23da-448f-9e0b-b99ceee1b152','HR & Admin','Staff and Labor Management','active','2026-07-12 15:52:29','2026-07-12 15:52:29'),('7d64bdb9-fcb6-420b-930d-a897e7fe5e1c','Procurement','Sourcing and Supply Chain','active','2026-07-12 15:52:29','2026-07-12 15:52:29'),('96204d70-8212-490f-8b08-548cdeb950f8','Architecture & Design','Planning and Interior','active','2026-07-12 15:52:29','2026-07-12 15:52:29'),('f1af3f94-a163-42f8-92cd-eba39685a9ba','Civil Engineering','Structural and Site works','active','2026-07-12 15:52:29','2026-07-12 15:52:29');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` enum('junior','mid','senior','lead','manager','director') COLLATE utf8mb4_unicode_ci DEFAULT 'mid',
  `departmentId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
INSERT INTO `designations` VALUES ('34896d65-b198-492d-96f8-81bae1de6d4e','Safety Officer','mid',NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29'),('6a60ae98-7bcb-4442-9436-0920507d12a5','Senior Civil Engineer','lead',NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29'),('8bdaa229-8ca4-4992-88aa-8da784f30b0a','Procurement Officer','mid',NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29'),('c36e29f0-db9e-4989-95a1-30963b70050b','Site Supervisor','mid',NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29'),('f0d92b0f-eef0-4592-9bc6-d727cc661013','Quantity Surveyor','mid',NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29');
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_vaults`
--

DROP TABLE IF EXISTS `document_vaults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_vaults` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `encryptedContent` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploadedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employeeId` (`employeeId`),
  CONSTRAINT `document_vaults_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_vaults`
--

LOCK TABLES `document_vaults` WRITE;
/*!40000 ALTER TABLE `document_vaults` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_vaults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drugs`
--

DROP TABLE IF EXISTS `drugs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drugs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `genericName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brandName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batchNo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacturer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `isControlledSubstance` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `productId` (`productId`),
  CONSTRAINT `drugs_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drugs`
--

LOCK TABLES `drugs` WRITE;
/*!40000 ALTER TABLE `drugs` DISABLE KEYS */;
/*!40000 ALTER TABLE `drugs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `empCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnic` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departmentId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `designationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salary` decimal(12,2) DEFAULT NULL,
  `salaryType` enum('monthly','hourly') COLLATE utf8mb4_unicode_ci DEFAULT 'monthly',
  `bankAccount` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `joiningDate` date DEFAULT NULL,
  `status` enum('active','inactive','on_leave','resigned') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `empCode` (`empCode`),
  UNIQUE KEY `empCode_2` (`empCode`),
  KEY `departmentId` (`departmentId`),
  KEY `designationId` (`designationId`),
  KEY `userId` (`userId`),
  CONSTRAINT `employees_ibfk_4` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_ibfk_5` FOREIGN KEY (`designationId`) REFERENCES `designations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_ibfk_6` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES ('0c4f0265-5ea2-47a9-88ad-596584acf456','EMP-1001','Asif','Khan','asif.eng@lancerstech.com',NULL,NULL,NULL,'Senior Civil Engineer','f1af3f94-a163-42f8-92cd-eba39685a9ba','6a60ae98-7bcb-4442-9436-0920507d12a5',150000.00,'monthly',NULL,'2024-01-01','active',NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29',NULL),('580f2fdd-2318-4e8a-b14d-3cbabc178c08',NULL,'Project','Director','admin@lancerstech.com',NULL,NULL,NULL,'ADMIN',NULL,NULL,5000.00,'monthly',NULL,NULL,'active','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-12 15:55:16','2026-07-17 15:37:09',NULL),('acf7b4f8-89d7-45ea-b470-e0981b765c79','EMP-1002','Sarah','Ahmed','sarah.proc@lancerstech.com',NULL,NULL,NULL,'Procurement Officer','7d64bdb9-fcb6-420b-930d-a897e7fe5e1c','8bdaa229-8ca4-4992-88aa-8da784f30b0a',85000.00,'monthly',NULL,'2024-03-15','active',NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29',NULL),('e45a687b-28dd-456e-8f89-8500e5a50167','EMP-1003','ALISHA ','FAROOQ','alisha@gmail.com','36592-7987979-2','238/389 dha phase 2','+92 303898799','Senior Civil Engineer','3b4fe9e5-86b6-4744-bc86-cb32cc179c74','6a60ae98-7bcb-4442-9436-0920507d12a5',10.00,'hourly','389983984983','2026-07-29','active','531d15b6-66d8-40e3-b9c1-c770486ff243','2026-07-18 14:47:57','2026-07-18 14:47:57',NULL);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date` date DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES ('3c379d1b-ca41-471c-93ba-7952b63f9e7e','Utilities',2000.00,'bill','2026-07-12','approved','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-12 15:55:01','2026-07-12 15:55:04'),('5eecf43e-5424-410a-a0c6-c59c59d06749','Other',200.00,'ac maintniance','2026-07-14','approved','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-14 11:45:43','2026-07-14 11:45:47'),('8a336c2d-739f-4baa-bdee-85c8bd31ccbd','Logistics',200.00,'water bill','2026-07-15','approved','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-14 11:37:01','2026-07-14 11:37:10'),('d06d2830-91bc-4d96-9791-b257dbd95efd','Inventory',1200.00,'WATER BILL','2026-07-13','approved','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-13 11:58:52','2026-07-13 11:59:15'),('f13be675-9064-42d1-bb7a-0b6a135fb82d','Other',200.00,'water bill','2026-07-14','approved','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-14 11:55:02','2026-07-14 11:55:08');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_balances`
--

DROP TABLE IF EXISTS `leave_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_balances` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` enum('casual','medical','annual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total` decimal(4,1) DEFAULT '0.0',
  `used` decimal(4,1) DEFAULT '0.0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employeeId` (`employeeId`),
  CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_balances`
--

LOCK TABLES `leave_balances` WRITE;
/*!40000 ALTER TABLE `leave_balances` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leaves`
--

DROP TABLE IF EXISTS `leaves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leaves` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` enum('casual','medical','annual','unpaid','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `days` decimal(4,1) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `approvedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `rejectionReason` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employeeId` (`employeeId`),
  CONSTRAINT `leaves_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leaves`
--

LOCK TABLES `leaves` WRITE;
/*!40000 ALTER TABLE `leaves` DISABLE KEYS */;
INSERT INTO `leaves` VALUES ('492b2dad-a9e0-4aac-ae55-4a53d01d5b40','580f2fdd-2318-4e8a-b14d-3cbabc178c08','medical','2026-07-13','2026-07-13',1.0,'AN Emergency ','pending',NULL,NULL,'2026-07-13 12:02:11','2026-07-13 12:02:11'),('9022858a-1ca6-4be6-8438-666b53030d26','e45a687b-28dd-456e-8f89-8500e5a50167','other','2026-07-22','2026-07-22',1.0,'important work','pending',NULL,NULL,'2026-07-22 15:46:30','2026-07-22 15:46:30'),('aba4f3d0-05bb-4d5c-9f09-70a03b7f6c65','580f2fdd-2318-4e8a-b14d-3cbabc178c08','medical','2026-07-14','2026-07-15',2.0,'an emergency','pending',NULL,NULL,'2026-07-14 11:38:46','2026-07-14 11:38:46'),('f67a932f-85f6-4df8-a7fb-eb2d6f7e902a','580f2fdd-2318-4e8a-b14d-3cbabc178c08','casual','2026-07-31','2026-08-01',2.0,'working','pending',NULL,NULL,'2026-07-14 11:46:58','2026-07-14 11:46:58');
/*!40000 ALTER TABLE `leaves` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_transactions`
--

DROP TABLE IF EXISTS `loyalty_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_transactions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `points` int NOT NULL,
  `type` enum('earn','redeem') COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customerId` (`customerId`),
  KEY `saleId` (`saleId`),
  CONSTRAINT `loyalty_transactions_ibfk_3` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `loyalty_transactions_ibfk_4` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_transactions`
--

LOCK TABLES `loyalty_transactions` WRITE;
/*!40000 ALTER TABLE `loyalty_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_runs`
--

DROP TABLE IF EXISTS `payroll_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_runs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `status` enum('draft','processed','finalized') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `totalAmount` decimal(14,2) DEFAULT '0.00',
  `processedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `processedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payroll_month_year` (`month`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_runs`
--

LOCK TABLES `payroll_runs` WRITE;
/*!40000 ALTER TABLE `payroll_runs` DISABLE KEYS */;
/*!40000 ALTER TABLE `payroll_runs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payslips`
--

DROP TABLE IF EXISTS `payslips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslips` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `payrollRunId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `baseSalary` decimal(12,2) NOT NULL,
  `allowances` decimal(12,2) DEFAULT '0.00',
  `deductions` decimal(12,2) DEFAULT '0.00',
  `netSalary` decimal(12,2) NOT NULL,
  `status` enum('unpaid','paid','voided') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employeeId` (`employeeId`),
  KEY `payrollRunId` (`payrollRunId`),
  CONSTRAINT `payslips_ibfk_3` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `payslips_ibfk_4` FOREIGN KEY (`payrollRunId`) REFERENCES `payroll_runs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payslips`
--

LOCK TABLES `payslips` WRITE;
/*!40000 ALTER TABLE `payslips` DISABLE KEYS */;
/*!40000 ALTER TABLE `payslips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `po_items`
--

DROP TABLE IF EXISTS `po_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `po_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `purchaseOrderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unitCost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `purchaseOrderId` (`purchaseOrderId`),
  KEY `productId` (`productId`),
  CONSTRAINT `po_items_ibfk_3` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `po_items_ibfk_4` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `po_items`
--

LOCK TABLES `po_items` WRITE;
/*!40000 ALTER TABLE `po_items` DISABLE KEYS */;
INSERT INTO `po_items` VALUES ('0cbe8c99-5ffb-405a-9f82-d0c9a85c7e90','4c6768aa-1ae0-47de-b59f-ffb337f3cc6b','42e9b2c9-c0d7-4fa2-8f89-caa855a55642',50,5000.00,'2026-07-14 11:44:08','2026-07-14 11:44:08'),('11496608-c3ed-4f94-a75b-733aa0c39542','74de72c7-2893-4bca-a61a-815690c66379','42e9b2c9-c0d7-4fa2-8f89-caa855a55642',50,5000.00,'2026-07-14 11:51:34','2026-07-14 11:51:34'),('1c80fdd1-0d86-4e8b-8374-59af72b25ea8','1b0a0ef8-0e4e-42ff-a7e5-d76cbd892e04','03819e0d-db85-4b34-abc0-21d9a17958f2',50,35000.00,'2026-07-12 15:54:02','2026-07-12 15:54:02'),('1fe0303f-543b-49dd-90f6-db73ffb97d86','1b0a0ef8-0e4e-42ff-a7e5-d76cbd892e04','8c7172ac-7d95-4d97-b549-bf70c19b5792',50,240000.00,'2026-07-12 15:54:02','2026-07-12 15:54:02'),('3cbbeab1-045d-497b-8926-c1c09e82758d','386c97e9-af2c-4dcf-b231-5eef1e1960fa','42e9b2c9-c0d7-4fa2-8f89-caa855a55642',50,5000.00,'2026-07-14 11:53:37','2026-07-14 11:53:37'),('65aca8e3-f0da-4dde-8143-f7d4ac4b2fab','400fb717-5e67-44c4-85f3-cee3309afacc','42e9b2c9-c0d7-4fa2-8f89-caa855a55642',50,5000.00,'2026-07-14 11:34:48','2026-07-14 11:34:48'),('ffc9f5a0-4d7b-47ef-bd2a-6e6e027f5245','abe4d8ba-b431-4731-af7b-c84acc9879c8','175b1fca-dada-46ba-998e-1339171dd90a',50,7200.00,'2026-07-14 14:10:09','2026-07-14 14:10:09');
/*!40000 ALTER TABLE `po_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription_items`
--

DROP TABLE IF EXISTS `prescription_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `prescriptionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `drugId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantity` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `prescriptionId` (`prescriptionId`),
  KEY `drugId` (`drugId`),
  CONSTRAINT `prescription_items_ibfk_1` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `prescription_items_ibfk_2` FOREIGN KEY (`drugId`) REFERENCES `drugs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription_items`
--

LOCK TABLES `prescription_items` WRITE;
/*!40000 ALTER TABLE `prescription_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescription_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptions`
--

DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `doctorName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `verifiedByUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `verifiedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptions`
--

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variations`
--

DROP TABLE IF EXISTS `product_variations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variations` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `sku_2` (`sku`),
  KEY `productId` (`productId`),
  CONSTRAINT `product_variations_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variations`
--

LOCK TABLES `product_variations` WRITE;
/*!40000 ALTER TABLE `product_variations` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_variations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `costPrice` decimal(10,2) DEFAULT '0.00',
  `stock` int DEFAULT '0',
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `storeType` enum('department') COLLATE utf8mb4_unicode_ci DEFAULT 'department',
  `expiryDate` date DEFAULT NULL,
  `manufacturer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `sku_2` (`sku`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('03819e0d-db85-4b34-abc0-21d9a17958f2','Jack Hammer 15kg','TLS-HMR-15',45000.00,35000.00,44,'ce5f38ce-48cd-42c5-af08-7d108925cdfa','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-18 14:42:00'),('175b1fca-dada-46ba-998e-1339171dd90a','Electrical Wire 3/29 (Coil)','MEP-WRE-01',8500.00,7200.00,2,'4862c26f-10f2-4411-94eb-e5899d40151a','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-18 12:52:14'),('3ec8483e-cd8f-4e8b-a039-df864bb282df','wire 6mm','SKU-B5AG1',1200.00,1000.00,89,'4534ce5c-4c3b-4f7c-a505-0011cfb06e62','department','0001-01-01',NULL,'2026-07-18 15:17:23','2026-07-18 15:17:52'),('42e9b2c9-c0d7-4fa2-8f89-caa855a55642','Electrical Wire 7/36 (Coil)','SKU-96TXR',5600.00,5000.00,148,'4862c26f-10f2-4411-94eb-e5899d40151a','department',NULL,NULL,'2026-07-13 11:47:11','2026-07-18 12:06:37'),('4416776b-be75-4e22-ba38-a3c76674eeb9','Red Clay Bricks (1000 pcs)','STR-BRK-01',18000.00,15000.00,47,'05cebd85-ab82-49d5-a933-d84b504abf15','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-14 11:35:31'),('5de692c1-43e8-47f8-b804-fc6e4738692e','Crush Stone (Manual)','STR-CRS-01',85.00,65.00,1997,'05cebd85-ab82-49d5-a933-d84b504abf15','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-18 14:43:08'),('61096bda-b283-42e7-8241-a1746fd81ee1','OPC Cement (50kg)','STR-CEM-01',1200.00,950.00,499,'05cebd85-ab82-49d5-a933-d84b504abf15','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-12 15:54:21'),('674229d5-4943-4623-bd4b-129a0bab303e','Matte White Paint (20L)','FIN-PNT-WH',15500.00,12000.00,4,'4534ce5c-4c3b-4f7c-a505-0011cfb06e62','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-22 13:36:45'),('76443154-72df-4385-beb2-b8a93e8445d7','Porcelain Tile 2x2 (Box)','FIN-TILE-01',4500.00,3800.00,199,'4534ce5c-4c3b-4f7c-a505-0011cfb06e62','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-14 11:44:38'),('8c7172ac-7d95-4d97-b549-bf70c19b5792','Steel Rebar 12mm (Ton)','STR-STL-12',265000.00,240000.00,59,'05cebd85-ab82-49d5-a933-d84b504abf15','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-14 11:44:38'),('b2179532-e397-4bd7-8ed5-02de58e81a9f','Copper Pipe 1/2-inch','MEP-COP-01',1200.00,900.00,150,'4862c26f-10f2-4411-94eb-e5899d40151a','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29'),('e13fe6ec-0f5b-47db-b132-ad900922426b','Safety Helmet (Yellow)','TLS-SAF-HLM',850.00,450.00,99,'ce5f38ce-48cd-42c5-af08-7d108925cdfa','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-18 14:42:00'),('e9a0e8e3-2e40-4030-9cd1-d48b9d2e6bd3','PVC Pipe 4-inch (10ft)','MEP-PVC-04',2500.00,1800.00,100,'4862c26f-10f2-4411-94eb-e5899d40151a','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29'),('ed7e09a9-e9c5-4ccc-ae13-9611ab1c1c94','Reflective Safety Vest','TLS-SAF-VST',450.00,200.00,150,'ce5f38ce-48cd-42c5-af08-7d108925cdfa','department',NULL,NULL,'2026-07-12 15:52:29','2026-07-12 15:52:29');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `supplierId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderDate` datetime DEFAULT NULL,
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `status` enum('pending','ordered','received','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `receivedDate` datetime DEFAULT NULL,
  `receivedByUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `stockUpdated` tinyint(1) DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `supplierId` (`supplierId`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES ('1b0a0ef8-0e4e-42ff-a7e5-d76cbd892e04','7e685ab3-6d31-4bd7-98ca-a12d2a41e584','2026-07-12 15:54:02',13750000.00,'received',NULL,NULL,0,'Auto-generated PO from predictive restock','2026-07-12 15:54:02','2026-07-12 15:54:08'),('386c97e9-af2c-4dcf-b231-5eef1e1960fa','7e685ab3-6d31-4bd7-98ca-a12d2a41e584','2026-07-14 11:53:37',250000.00,'pending',NULL,NULL,0,'Auto-generated PO from predictive restock','2026-07-14 11:53:37','2026-07-14 11:53:37'),('400fb717-5e67-44c4-85f3-cee3309afacc','7e685ab3-6d31-4bd7-98ca-a12d2a41e584','2026-07-14 11:34:48',250000.00,'received',NULL,NULL,0,'Auto-generated PO from predictive restock','2026-07-14 11:34:48','2026-07-14 12:03:10'),('4c6768aa-1ae0-47de-b59f-ffb337f3cc6b','7e685ab3-6d31-4bd7-98ca-a12d2a41e584','2026-07-14 11:44:08',250000.00,'pending',NULL,NULL,0,'Auto-generated PO from predictive restock','2026-07-14 11:44:08','2026-07-14 11:44:08'),('74de72c7-2893-4bca-a61a-815690c66379','7e685ab3-6d31-4bd7-98ca-a12d2a41e584','2026-07-14 11:51:34',250000.00,'pending',NULL,NULL,0,'Auto-generated PO from predictive restock','2026-07-14 11:51:34','2026-07-14 11:51:34'),('abe4d8ba-b431-4731-af7b-c84acc9879c8','7e685ab3-6d31-4bd7-98ca-a12d2a41e584','2026-07-14 14:10:09',360000.00,'pending',NULL,NULL,0,'Auto-generated PO from predictive restock','2026-07-14 14:10:09','2026-07-14 14:10:09');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `targetId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `score` int DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ratings`
--

LOCK TABLES `ratings` WRITE;
/*!40000 ALTER TABLE `ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rides`
--

DROP TABLE IF EXISTS `rides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rides` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `riderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `driverId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `pickupLocation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dropoffLocation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `status` enum('requested','bidding','accepted','in_progress','completed','cancelled','pending','assigned','picked_up','in_transit','delivered','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `fare` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `riderId` (`riderId`),
  KEY `driverId` (`driverId`),
  CONSTRAINT `rides_ibfk_1` FOREIGN KEY (`riderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rides_ibfk_2` FOREIGN KEY (`driverId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rides`
--

LOCK TABLES `rides` WRITE;
/*!40000 ALTER TABLE `rides` DISABLE KEYS */;
INSERT INTO `rides` VALUES ('1a8f335d-53e3-4957-b83a-bcf3c991c866','3fa639a9-0107-4b6c-8a50-871bc7bf198b',NULL,NULL,NULL,'danial','+923269941804','390/104 salamat pura bus stop gt road lahore',NULL,'high','failed',NULL,'2026-07-18 15:14:11','2026-07-18 15:14:26');
/*!40000 ALTER TABLE `rides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_advances`
--

DROP TABLE IF EXISTS `salary_advances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_advances` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employeeId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `deductionMonths` int NOT NULL DEFAULT '1',
  `remainingAmount` decimal(12,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `approvedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employeeId` (`employeeId`),
  CONSTRAINT `salary_advances_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_advances`
--

LOCK TABLES `salary_advances` WRITE;
/*!40000 ALTER TABLE `salary_advances` DISABLE KEYS */;
/*!40000 ALTER TABLE `salary_advances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `saleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `costPrice` decimal(10,2) DEFAULT '0.00',
  `total` decimal(12,2) DEFAULT '0.00',
  `discountAmount` decimal(10,2) DEFAULT '0.00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `saleId` (`saleId`),
  KEY `productId` (`productId`),
  CONSTRAINT `sale_items_ibfk_3` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sale_items_ibfk_4` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES ('0385f408-7c15-4d3e-9ee0-6b170c29e668','d584be80-dfc5-441c-89f1-9adf31644c1a','674229d5-4943-4623-bd4b-129a0bab303e',34,15500.00,0.00,527000.00,0.00,'2026-07-22 13:36:45','2026-07-22 13:36:45'),('0e5138bc-828a-47e2-aade-4ec4e68e9f72','bd105d6a-818d-4435-b842-0472250aeca9','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-18 13:36:38','2026-07-18 13:36:38'),('0fa75811-277e-4ae7-ab59-cd80403a2a88','7f7bdbce-a26d-4c0e-ba56-deb034178c1a','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-18 12:52:14','2026-07-18 12:52:14'),('13b61106-875a-4fcc-8d1b-b6704c2c530f','fdfc2451-3e02-419c-b22d-50c3b26f95da','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-18 14:40:04','2026-07-18 14:40:04'),('185197e4-e4c1-4683-b5da-e5235aeb3281','d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a','61096bda-b283-42e7-8241-a1746fd81ee1',1,1200.00,0.00,1200.00,0.00,'2026-07-12 15:54:21','2026-07-12 15:54:21'),('19703362-1fa7-4563-993c-db060400d3d0','d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a','674229d5-4943-4623-bd4b-129a0bab303e',1,15500.00,0.00,15500.00,0.00,'2026-07-12 15:54:21','2026-07-12 15:54:21'),('28d04071-23ad-45b9-bc7a-9c5e76b1e620','7285595e-c573-4a38-919c-40659d693361','4416776b-be75-4e22-ba38-a3c76674eeb9',1,18000.00,0.00,18000.00,0.00,'2026-07-13 11:52:13','2026-07-13 11:52:13'),('2b72069a-0082-4cd6-8039-71c7fe06a19a','eee28026-e060-470a-852b-cf40511fb8bd','5de692c1-43e8-47f8-b804-fc6e4738692e',1,85.00,0.00,85.00,0.00,'2026-07-14 11:59:56','2026-07-14 11:59:56'),('30ba3f45-1218-45a3-845b-4542553ae39c','10ccd1a4-57da-4673-9bdc-561f48191e24','674229d5-4943-4623-bd4b-129a0bab303e',1,15500.00,0.00,15500.00,0.00,'2026-07-12 15:54:30','2026-07-12 15:54:30'),('377309cd-a49c-4de8-9e3b-aaa04c057f53','eee28026-e060-470a-852b-cf40511fb8bd','175b1fca-dada-46ba-998e-1339171dd90a',1,8500.00,0.00,8500.00,0.00,'2026-07-14 11:59:56','2026-07-14 11:59:56'),('3c63ab81-fb28-43a4-963f-b82efcfa3cbc','7285595e-c573-4a38-919c-40659d693361','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-13 11:52:13','2026-07-13 11:52:13'),('5b0183f4-c7bf-45f1-84b7-2cae8fc19744','f18f5693-d6cc-4ae1-a8ee-d6b4360a696a','5de692c1-43e8-47f8-b804-fc6e4738692e',1,85.00,0.00,85.00,0.00,'2026-07-18 14:43:08','2026-07-18 14:43:08'),('5ee40987-395e-4f83-90cc-005081e36bbb','3ee058c2-1ce1-4748-8618-f9688c497bc6','175b1fca-dada-46ba-998e-1339171dd90a',1,8500.00,0.00,8500.00,0.00,'2026-07-18 12:06:37','2026-07-18 12:06:37'),('61682250-1915-4c21-9225-670e613e3956','594921f5-7e07-4f03-b0e2-b8234e98ced8','42e9b2c9-c0d7-4fa2-8f89-caa855a55642',10,5600.00,0.00,56000.00,0.00,'2026-07-13 11:52:36','2026-07-13 11:52:36'),('67e2133d-8448-483d-8e3b-a27b223ab1fe','7285595e-c573-4a38-919c-40659d693361','175b1fca-dada-46ba-998e-1339171dd90a',1,8500.00,0.00,8500.00,0.00,'2026-07-13 11:52:13','2026-07-13 11:52:13'),('6bd138c1-c341-4bb4-85d4-c38259642c4b','6f78fbfe-984d-48a4-b260-d7d0ed9c96fb','4416776b-be75-4e22-ba38-a3c76674eeb9',1,18000.00,0.00,18000.00,0.00,'2026-07-14 11:35:31','2026-07-14 11:35:31'),('70a4bc4c-bd02-417a-ac84-c48233c1783e','ac8e6906-e693-472b-8b0c-b3aaa0610cd7','8c7172ac-7d95-4d97-b549-bf70c19b5792',1,265000.00,0.00,265000.00,0.00,'2026-07-14 11:44:38','2026-07-14 11:44:38'),('7cc9a6e1-0eb7-4546-9783-a7a5ec905092','7f7bdbce-a26d-4c0e-ba56-deb034178c1a','175b1fca-dada-46ba-998e-1339171dd90a',1,8500.00,0.00,8500.00,0.00,'2026-07-18 12:52:14','2026-07-18 12:52:14'),('92954cbe-a1e1-4e9c-a45e-6fff1926433a','647be524-f0a1-4d91-b490-57300528f845','5de692c1-43e8-47f8-b804-fc6e4738692e',1,85.00,0.00,85.00,0.00,'2026-07-14 11:25:58','2026-07-14 11:25:58'),('9745f0ae-7428-4226-bc84-835ee2bb698b','e481df57-0696-47c6-a3b7-078dfb73b748','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-18 14:27:26','2026-07-18 14:27:26'),('9a3c29ec-73ea-405f-9768-e81d4292571d','a04b3eaf-8190-4653-bcee-371c0b705683','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-18 11:49:22','2026-07-18 11:49:22'),('a0dfe288-e002-4f5d-b847-1b109cea1f10','3ee058c2-1ce1-4748-8618-f9688c497bc6','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-18 12:06:37','2026-07-18 12:06:37'),('a8163984-b718-4679-9b7a-32ad3a3d5c00','ca09f73f-1d6e-49d3-b2fd-03259b5aa3dd','e13fe6ec-0f5b-47db-b132-ad900922426b',1,850.00,0.00,850.00,0.00,'2026-07-18 14:42:00','2026-07-18 14:42:00'),('ab85eee5-fde6-480b-b013-2ce14aeb5a00','3ee058c2-1ce1-4748-8618-f9688c497bc6','42e9b2c9-c0d7-4fa2-8f89-caa855a55642',1,5600.00,0.00,5600.00,0.00,'2026-07-18 12:06:37','2026-07-18 12:06:37'),('c36a2c1d-9250-442b-b984-28e407ee4429','f75e814b-76d9-4a7d-a555-69b21ffcaabb','42e9b2c9-c0d7-4fa2-8f89-caa855a55642',1,5600.00,0.00,5600.00,0.00,'2026-07-14 11:54:08','2026-07-14 11:54:08'),('d0c82831-dd9a-49c8-ae99-a916dc603b9a','f75e814b-76d9-4a7d-a555-69b21ffcaabb','175b1fca-dada-46ba-998e-1339171dd90a',1,8500.00,0.00,8500.00,0.00,'2026-07-14 11:54:08','2026-07-14 11:54:08'),('d55fdfb9-fe0e-47b7-809d-fbdfe2864fa4','458632e8-13b1-4ca0-9c4d-17b45cf5bb19','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-15 15:00:29','2026-07-15 15:00:29'),('d59cd033-baab-4959-aff2-4002b8943492','d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a','4416776b-be75-4e22-ba38-a3c76674eeb9',1,18000.00,0.00,18000.00,0.00,'2026-07-12 15:54:21','2026-07-12 15:54:21'),('d8b6f58f-7a13-4abb-b809-d5d2f929f9e6','eee28026-e060-470a-852b-cf40511fb8bd','42e9b2c9-c0d7-4fa2-8f89-caa855a55642',1,5600.00,0.00,5600.00,0.00,'2026-07-14 11:59:56','2026-07-14 11:59:56'),('d975b030-bd3f-40bd-a3dc-4c1b7f1c4b32','ac8e6906-e693-472b-8b0c-b3aaa0610cd7','76443154-72df-4385-beb2-b8a93e8445d7',1,4500.00,0.00,4500.00,0.00,'2026-07-14 11:44:38','2026-07-14 11:44:38'),('e8018a5f-d3b6-4595-bc55-7c83851b4f32','c5e90b1f-933a-437f-84c3-4c8cede9a20c','175b1fca-dada-46ba-998e-1339171dd90a',22,8500.00,0.00,187000.00,0.00,'2026-07-14 13:51:03','2026-07-14 13:51:03'),('eecbd7aa-e4ac-4ba0-94fa-3c905001722b','d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a','175b1fca-dada-46ba-998e-1339171dd90a',1,8500.00,0.00,8500.00,0.00,'2026-07-12 15:54:21','2026-07-12 15:54:21'),('ef68249c-448f-434b-973d-a74d2e2fb328','99d006f5-dccf-4817-a314-011ef024d3c0','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-18 10:33:46','2026-07-18 10:33:46'),('f7ac7562-7438-4855-ab5c-30ffef0e75e3','ca09f73f-1d6e-49d3-b2fd-03259b5aa3dd','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-18 14:42:00','2026-07-18 14:42:00'),('fbf859c8-87ee-42bb-985a-d0bffdfe605d','6f78fbfe-984d-48a4-b260-d7d0ed9c96fb','03819e0d-db85-4b34-abc0-21d9a17958f2',1,45000.00,0.00,45000.00,0.00,'2026-07-14 11:35:31','2026-07-14 11:35:31');
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `totalAmount` decimal(12,2) DEFAULT '0.00',
  `discount` decimal(12,2) DEFAULT '0.00',
  `tax` decimal(12,2) DEFAULT '0.00',
  `grandTotal` decimal(12,2) DEFAULT '0.00',
  `paymentMethod` enum('cash','card','credit','split') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `cashAmount` decimal(12,2) DEFAULT '0.00',
  `cardAmount` decimal(12,2) DEFAULT '0.00',
  `status` enum('active','voided','refunded','held') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `voidReason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `discountType` enum('flat','percent') COLLATE utf8mb4_unicode_ci DEFAULT 'flat',
  `extraCharges` decimal(12,2) DEFAULT '0.00',
  `extraChargeReason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditReason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cashierName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES ('10ccd1a4-57da-4673-9bdc-561f48191e24',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',15500.00,0.00,0.00,15500.00,'cash',15500.00,0.00,'active',NULL,NULL,'2026-07-12 15:54:30','2026-07-12 15:54:30','flat',0.00,NULL,NULL,NULL,NULL,NULL),('3ee058c2-1ce1-4748-8618-f9688c497bc6',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',59100.00,0.00,0.00,59100.00,'cash',59100.00,0.00,'active',NULL,NULL,'2026-07-18 12:06:37','2026-07-18 12:06:37','flat',0.00,NULL,NULL,NULL,NULL,NULL),('458632e8-13b1-4ca0-9c4d-17b45cf5bb19',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',45000.00,0.00,0.00,45000.00,'cash',45000.00,0.00,'active',NULL,NULL,'2026-07-15 15:00:29','2026-07-15 15:00:29','flat',0.00,NULL,NULL,NULL,NULL,NULL),('594921f5-7e07-4f03-b0e2-b8234e98ced8',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',56000.00,0.00,0.00,56000.00,'cash',56000.00,0.00,'active',NULL,NULL,'2026-07-13 11:52:36','2026-07-13 11:52:36','flat',0.00,NULL,NULL,NULL,NULL,NULL),('647be524-f0a1-4d91-b490-57300528f845',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',85.00,2.00,83.00,166.00,'split',66.00,100.00,'active',NULL,NULL,'2026-07-14 11:25:58','2026-07-14 11:25:58','flat',0.00,NULL,NULL,NULL,NULL,NULL),('6f78fbfe-984d-48a4-b260-d7d0ed9c96fb',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',63000.00,10.00,3149.50,66139.50,'split',6000.00,6139.00,'active',NULL,NULL,'2026-07-14 11:35:31','2026-07-14 11:35:31','flat',0.00,NULL,NULL,NULL,NULL,NULL),('7285595e-c573-4a38-919c-40659d693361',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',71500.00,50.00,0.00,71450.00,'split',7000.00,1450.00,'active',NULL,NULL,'2026-07-13 11:52:13','2026-07-13 11:52:13','flat',0.00,NULL,NULL,NULL,NULL,NULL),('7f7bdbce-a26d-4c0e-ba56-deb034178c1a',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',53500.00,0.00,0.00,53500.00,'card',0.00,53500.00,'active',NULL,NULL,'2026-07-18 12:52:14','2026-07-18 12:52:14','flat',0.00,NULL,NULL,NULL,NULL,NULL),('99d006f5-dccf-4817-a314-011ef024d3c0',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',45000.00,12.00,2249.40,50237.40,'cash',50237.40,0.00,'active',NULL,NULL,'2026-07-18 10:33:46','2026-07-18 10:33:46','flat',0.00,NULL,NULL,NULL,NULL,NULL),('a04b3eaf-8190-4653-bcee-371c0b705683',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',45000.00,2250.00,2137.50,44900.50,'card',0.00,44900.50,'active',NULL,NULL,'2026-07-18 11:49:22','2026-07-18 11:49:22','flat',0.00,NULL,NULL,NULL,NULL,NULL),('ac8e6906-e693-472b-8b0c-b3aaa0610cd7',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',269500.00,900.00,13430.00,282030.00,'cash',282030.00,0.00,'active',NULL,NULL,'2026-07-14 11:44:38','2026-07-14 11:44:38','flat',0.00,NULL,NULL,NULL,NULL,NULL),('bd105d6a-818d-4435-b842-0472250aeca9',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',45000.00,0.00,0.00,45000.00,'cash',45000.00,0.00,'active',NULL,NULL,'2026-07-18 13:36:38','2026-07-18 13:36:38','flat',0.00,NULL,NULL,NULL,NULL,NULL),('c5e90b1f-933a-437f-84c3-4c8cede9a20c',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',187000.00,0.00,0.00,187000.00,'cash',187000.00,0.00,'active',NULL,NULL,'2026-07-14 13:51:03','2026-07-14 13:51:03','flat',0.00,NULL,NULL,NULL,NULL,NULL),('ca09f73f-1d6e-49d3-b2fd-03259b5aa3dd',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',45850.00,0.00,0.00,45850.00,'credit',0.00,0.00,'active',NULL,NULL,'2026-07-18 14:42:00','2026-07-18 14:42:00','flat',0.00,NULL,NULL,NULL,NULL,'Project Director'),('d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',43200.00,0.00,0.00,43200.00,'cash',43200.00,0.00,'active',NULL,NULL,'2026-07-12 15:54:21','2026-07-12 15:54:21','flat',0.00,NULL,NULL,NULL,NULL,NULL),('d584be80-dfc5-441c-89f1-9adf31644c1a',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',527000.00,100.00,26345.00,553245.00,'card',0.00,553245.00,'active',NULL,NULL,'2026-07-22 13:36:45','2026-07-22 13:36:45','flat',0.00,NULL,NULL,NULL,NULL,'Project Director'),('e481df57-0696-47c6-a3b7-078dfb73b748',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',45000.00,0.00,0.00,45000.00,'cash',45000.00,0.00,'active',NULL,NULL,'2026-07-18 14:27:26','2026-07-18 14:27:26','flat',0.00,NULL,NULL,NULL,NULL,NULL),('eee28026-e060-470a-852b-cf40511fb8bd',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',14185.00,0.00,0.00,14185.00,'cash',14185.00,0.00,'active',NULL,NULL,'2026-07-14 11:59:56','2026-07-14 11:59:56','flat',0.00,NULL,NULL,NULL,NULL,NULL),('f18f5693-d6cc-4ae1-a8ee-d6b4360a696a',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',85.00,0.00,0.00,85.00,'credit',0.00,0.00,'active',NULL,NULL,'2026-07-18 14:43:08','2026-07-18 14:43:08','flat',0.00,NULL,NULL,NULL,NULL,'Project Director'),('f75e814b-76d9-4a7d-a555-69b21ffcaabb',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',14100.00,10.00,704.50,14794.50,'cash',14794.50,0.00,'active',NULL,NULL,'2026-07-14 11:54:08','2026-07-14 11:54:08','flat',0.00,NULL,NULL,NULL,NULL,NULL),('fdfc2451-3e02-419c-b22d-50c3b26f95da',NULL,'3fa639a9-0107-4b6c-8a50-871bc7bf198b',45000.00,0.00,0.00,45000.00,'credit',0.00,0.00,'active',NULL,NULL,'2026-07-18 14:40:04','2026-07-18 14:40:04','flat',0.00,NULL,NULL,NULL,NULL,'Project Director');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_sessions`
--

DROP TABLE IF EXISTS `sales_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_sessions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime DEFAULT NULL,
  `totalHours` decimal(5,2) DEFAULT '0.00',
  `earnings` decimal(10,2) DEFAULT '0.00',
  `cashCount` decimal(12,2) DEFAULT '0.00',
  `status` enum('active','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `sales_sessions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_sessions`
--

LOCK TABLES `sales_sessions` WRITE;
/*!40000 ALTER TABLE `sales_sessions` DISABLE KEYS */;
INSERT INTO `sales_sessions` VALUES ('1d240639-7f04-425b-9aaf-eaa33b8910b1','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-14 12:04:13','2026-07-14 12:04:25',0.00,0.00,317075.00,'completed','2026-07-14 12:04:13','2026-07-14 12:04:25'),('27fa2b7c-a424-4ad0-9e07-69cd8492f72f','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-14 11:47:58','2026-07-14 11:48:12',0.00,0.00,3.00,'completed','2026-07-14 11:47:58','2026-07-14 11:48:12'),('290e94cd-1d16-4efe-9989-a30358eac82b','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-14 11:20:34','2026-07-14 11:40:24',0.00,0.00,2000.00,'completed','2026-07-14 11:20:34','2026-07-14 11:40:24'),('3b173027-6d79-48da-b128-7b31f84115c5','3fa639a9-0107-4b6c-8a50-871bc7bf198b','2026-07-14 13:49:44',NULL,0.00,0.00,0.00,'active','2026-07-14 13:49:44','2026-07-14 13:49:44');
/*!40000 ALTER TABLE `sales_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime DEFAULT NULL,
  `totalHours` decimal(5,2) DEFAULT '0.00',
  `earnings` decimal(10,2) DEFAULT '0.00',
  `cashCount` decimal(12,2) DEFAULT '0.00',
  `status` enum('active','completed') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `shifts_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_logs`
--

DROP TABLE IF EXISTS `stock_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `change` int DEFAULT NULL,
  `type` enum('sale','restock','adjustment','return','void','prescription') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `productId` (`productId`),
  KEY `userId` (`userId`),
  CONSTRAINT `stock_logs_ibfk_3` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stock_logs_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_logs`
--

LOCK TABLES `stock_logs` WRITE;
/*!40000 ALTER TABLE `stock_logs` DISABLE KEYS */;
INSERT INTO `stock_logs` VALUES ('0a6c83f6-0dad-4c31-930e-6f87048d9165','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','458632e8-13b1-4ca0-9c4d-17b45cf5bb19','2026-07-15 15:00:29','2026-07-15 15:00:29'),('22004d5f-477b-49ab-8a56-9f060ffad8ca','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','e481df57-0696-47c6-a3b7-078dfb73b748','2026-07-18 14:27:26','2026-07-18 14:27:26'),('2bffd824-93e0-4100-877a-39ac84cf4540','42e9b2c9-c0d7-4fa2-8f89-caa855a55642','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','f75e814b-76d9-4a7d-a555-69b21ffcaabb','2026-07-14 11:54:08','2026-07-14 11:54:08'),('2c3a07d9-59de-49ec-818e-20cffb74851a','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',50,'restock','Purchase Order receipt: PO-1b0a0ef8',NULL,'2026-07-12 15:54:08','2026-07-12 15:54:08'),('2e7248ab-b760-41fe-a1fe-1752b2fa850b','175b1fca-dada-46ba-998e-1339171dd90a','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','3ee058c2-1ce1-4748-8618-f9688c497bc6','2026-07-18 12:06:37','2026-07-18 12:06:37'),('388f3c10-a834-4868-a2ec-5aa4f33cd001','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','bd105d6a-818d-4435-b842-0472250aeca9','2026-07-18 13:36:38','2026-07-18 13:36:38'),('3f615ec5-37f6-4cb9-9cd3-a53ebd2a8789','42e9b2c9-c0d7-4fa2-8f89-caa855a55642','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','eee28026-e060-470a-852b-cf40511fb8bd','2026-07-14 11:59:56','2026-07-14 11:59:56'),('3fa8557b-9dff-41fe-8151-10d7133db929','e13fe6ec-0f5b-47db-b132-ad900922426b','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','ca09f73f-1d6e-49d3-b2fd-03259b5aa3dd','2026-07-18 14:42:00','2026-07-18 14:42:00'),('4a5e7415-b337-4947-b67f-a6f042de9640','8c7172ac-7d95-4d97-b549-bf70c19b5792','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','ac8e6906-e693-472b-8b0c-b3aaa0610cd7','2026-07-14 11:44:38','2026-07-14 11:44:38'),('4cfd23b9-1854-4f0f-8fe6-7a3d8430dafd','4416776b-be75-4e22-ba38-a3c76674eeb9','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','6f78fbfe-984d-48a4-b260-d7d0ed9c96fb','2026-07-14 11:35:31','2026-07-14 11:35:31'),('525d1862-f9cd-407e-91b3-9f38ad55b3c0','175b1fca-dada-46ba-998e-1339171dd90a','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-22,'sale','sale','c5e90b1f-933a-437f-84c3-4c8cede9a20c','2026-07-14 13:51:03','2026-07-14 13:51:03'),('55a052cc-1e07-4f7b-b01e-94da456b4575','175b1fca-dada-46ba-998e-1339171dd90a','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','7285595e-c573-4a38-919c-40659d693361','2026-07-13 11:52:13','2026-07-13 11:52:13'),('5983d346-3a34-46a4-9849-d0950b9ca9fc','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','7f7bdbce-a26d-4c0e-ba56-deb034178c1a','2026-07-18 12:52:14','2026-07-18 12:52:14'),('5a929950-db98-43a6-8d53-263fc717614f','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','99d006f5-dccf-4817-a314-011ef024d3c0','2026-07-18 10:33:46','2026-07-18 10:33:46'),('6601cd64-7d5b-4f4e-abd0-df799b045e2e','175b1fca-dada-46ba-998e-1339171dd90a','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a','2026-07-12 15:54:21','2026-07-12 15:54:21'),('6bf944dc-cb7c-46d1-9c38-cc787b69b25c','61096bda-b283-42e7-8241-a1746fd81ee1','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a','2026-07-12 15:54:21','2026-07-12 15:54:21'),('6e0cf1d5-1f05-41a8-b9dd-d3239c8cba9e','76443154-72df-4385-beb2-b8a93e8445d7','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','ac8e6906-e693-472b-8b0c-b3aaa0610cd7','2026-07-14 11:44:38','2026-07-14 11:44:38'),('74028420-9007-432f-9482-4e105d58ffd4','42e9b2c9-c0d7-4fa2-8f89-caa855a55642','3fa639a9-0107-4b6c-8a50-871bc7bf198b',50,'restock','Purchase Order receipt: PO-400fb717',NULL,'2026-07-14 12:03:10','2026-07-14 12:03:10'),('78569456-5a9f-46a4-a49d-b314dd453511','5de692c1-43e8-47f8-b804-fc6e4738692e','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','eee28026-e060-470a-852b-cf40511fb8bd','2026-07-14 11:59:56','2026-07-14 11:59:56'),('7eeb1b92-a2b2-40ab-9804-7f622e3105e5','175b1fca-dada-46ba-998e-1339171dd90a','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','eee28026-e060-470a-852b-cf40511fb8bd','2026-07-14 11:59:56','2026-07-14 11:59:56'),('95a85e73-1674-4364-8a1c-99c679c0b5bc','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','a04b3eaf-8190-4653-bcee-371c0b705683','2026-07-18 11:49:22','2026-07-18 11:49:22'),('985fe653-2029-4f41-a2f5-a7080686c781','5de692c1-43e8-47f8-b804-fc6e4738692e','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','647be524-f0a1-4d91-b490-57300528f845','2026-07-14 11:25:58','2026-07-14 11:25:58'),('9d834dcf-5b2e-4648-9a22-eac80216f71b','4416776b-be75-4e22-ba38-a3c76674eeb9','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','7285595e-c573-4a38-919c-40659d693361','2026-07-13 11:52:13','2026-07-13 11:52:13'),('a21a11aa-097f-4fd2-90ca-b0c2fe9a6d79','42e9b2c9-c0d7-4fa2-8f89-caa855a55642','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-10,'sale','sale','594921f5-7e07-4f03-b0e2-b8234e98ced8','2026-07-13 11:52:36','2026-07-13 11:52:36'),('ae4ef195-64b7-4945-ae92-4dc526206edf','674229d5-4943-4623-bd4b-129a0bab303e','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a','2026-07-12 15:54:21','2026-07-12 15:54:21'),('b358bf27-03cb-4a6f-9bdf-bda9cd495d8a','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','6f78fbfe-984d-48a4-b260-d7d0ed9c96fb','2026-07-14 11:35:31','2026-07-14 11:35:31'),('b3aa1c99-28e4-4a56-8498-afa1a7931dee','175b1fca-dada-46ba-998e-1339171dd90a','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','7f7bdbce-a26d-4c0e-ba56-deb034178c1a','2026-07-18 12:52:14','2026-07-18 12:52:14'),('c424ff97-deed-4483-919c-8d07ec9c996f','5de692c1-43e8-47f8-b804-fc6e4738692e','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','f18f5693-d6cc-4ae1-a8ee-d6b4360a696a','2026-07-18 14:43:08','2026-07-18 14:43:08'),('d9b61222-fd53-4e4d-9ea5-eeaac5b58b57','674229d5-4943-4623-bd4b-129a0bab303e','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-34,'sale','sale','d584be80-dfc5-441c-89f1-9adf31644c1a','2026-07-22 13:36:45','2026-07-22 13:36:45'),('dce11b4f-9b55-4e4d-861c-c59cfb2bce8e','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','ca09f73f-1d6e-49d3-b2fd-03259b5aa3dd','2026-07-18 14:42:00','2026-07-18 14:42:00'),('e0a872a5-9405-459a-a6c7-ce0f1a2745da','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','fdfc2451-3e02-419c-b22d-50c3b26f95da','2026-07-18 14:40:04','2026-07-18 14:40:04'),('e4aae7a2-702b-47c3-a46e-ec63efb28b6c','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','3ee058c2-1ce1-4748-8618-f9688c497bc6','2026-07-18 12:06:37','2026-07-18 12:06:37'),('e559188d-ce9f-44b7-90ed-f8b1f61a27eb','674229d5-4943-4623-bd4b-129a0bab303e','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','10ccd1a4-57da-4673-9bdc-561f48191e24','2026-07-12 15:54:30','2026-07-12 15:54:30'),('ea8e7658-fca0-4e69-960f-a853108b49f0','03819e0d-db85-4b34-abc0-21d9a17958f2','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','7285595e-c573-4a38-919c-40659d693361','2026-07-13 11:52:13','2026-07-13 11:52:13'),('eb9dea9f-aba3-4173-a1c6-bd67f5d3cf41','8c7172ac-7d95-4d97-b549-bf70c19b5792','3fa639a9-0107-4b6c-8a50-871bc7bf198b',50,'restock','Purchase Order receipt: PO-1b0a0ef8',NULL,'2026-07-12 15:54:08','2026-07-12 15:54:08'),('ed8f55c3-06de-4cab-82bf-0f70294149c0','4416776b-be75-4e22-ba38-a3c76674eeb9','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','d2ac21a4-14d0-48f6-a6bb-aad59ec67d9a','2026-07-12 15:54:21','2026-07-12 15:54:21'),('f298fac1-e57b-4bbf-acd6-696ea2d35d0b','42e9b2c9-c0d7-4fa2-8f89-caa855a55642','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','3ee058c2-1ce1-4748-8618-f9688c497bc6','2026-07-18 12:06:37','2026-07-18 12:06:37'),('facdf3c2-b1e2-47ce-8304-6b2dbbfddda9','175b1fca-dada-46ba-998e-1339171dd90a','3fa639a9-0107-4b6c-8a50-871bc7bf198b',-1,'sale','sale','f75e814b-76d9-4a7d-a555-69b21ffcaabb','2026-07-14 11:54:08','2026-07-14 11:54:08');
/*!40000 ALTER TABLE `stock_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactPerson` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES ('7e685ab3-6d31-4bd7-98ca-a12d2a41e584','umer','umer','umeramin577@gmail.com','03037988851','11A','materials','2026-07-12 15:53:59','2026-07-12 15:53:59');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','manager','cashier','hr','inventory','pharmacist','expenses','operations','finance') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cashier',
  `profileImage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_make` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_model` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_plate` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isVerified` tinyint(1) DEFAULT '0',
  `location` point DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone_2` (`phone`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('0de5bddf-e7d4-46e5-b43f-cfe3b87c41f0','Inventory Controller','2222222222','inventory@lancerstech.com','$2a$10$teP/iJjFXLuEvKFRJFPpLuOgTKeWe9b.I3zHlsU.cA.ua/OYcnKOu','inventory',NULL,NULL,NULL,NULL,0,NULL,1,'2026-07-12 15:52:29','2026-07-12 15:52:29'),('3fa639a9-0107-4b6c-8a50-871bc7bf198b','Project Director','0000000000','admin@lancerstech.com','$2a$12$rOB6p0PCe6geIFtVYWBAD.W9ef32DmeTGeCsysbGUFn4Mm9setenq','admin',NULL,NULL,NULL,NULL,0,NULL,1,'2026-07-12 15:52:29','2026-07-12 15:53:02'),('531d15b6-66d8-40e3-b9c1-c770486ff243','ALISHA  FAROOQ','+92 303898799','alisha@gmail.com','$2a$12$2aN53k/lcQDdC51yiGmvQeqLlLnqqc/TxiDVjiom.y668GLB7NFhW','finance',NULL,NULL,NULL,NULL,0,NULL,1,'2026-07-18 14:47:57','2026-07-18 14:49:10'),('bfdd7144-3168-4bb0-a8f5-7b7495115eab','HR & Payroll Lead','3333333333','hr@lancerstech.com','$2a$10$teP/iJjFXLuEvKFRJFPpLuOgTKeWe9b.I3zHlsU.cA.ua/OYcnKOu','hr',NULL,NULL,NULL,NULL,0,NULL,1,'2026-07-12 15:52:29','2026-07-12 15:52:29'),('f536bd25-e20d-40a1-b12c-73073c92c4fd','Site Manager','1111111111','manager@lancerstech.com','$2a$10$teP/iJjFXLuEvKFRJFPpLuOgTKeWe9b.I3zHlsU.cA.ua/OYcnKOu','manager',NULL,NULL,NULL,NULL,0,NULL,1,'2026-07-12 15:52:29','2026-07-12 15:52:29');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_shifts`
--

DROP TABLE IF EXISTS `work_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_shifts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `days` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_shifts`
--

LOCK TABLES `work_shifts` WRITE;
/*!40000 ALTER TABLE `work_shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_shifts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-27 12:45:58
