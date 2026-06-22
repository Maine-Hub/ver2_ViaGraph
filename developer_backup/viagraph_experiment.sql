-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 19, 2026 at 07:32 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `viagraph_experiment`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `uid` varchar(128) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `category` enum('user','admin') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `uid`, `username`, `action`, `details`, `category`, `created_at`) VALUES
(1, 'system', 'System', 'Updated User Role', 'Changed role of admin2 to admin', 'admin', '2026-03-13 06:16:19'),
(2, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:34'),
(3, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:34'),
(4, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:36'),
(5, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:36'),
(6, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:36'),
(7, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:36'),
(8, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:37'),
(9, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:38'),
(10, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:40'),
(11, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:40'),
(12, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:40'),
(13, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:40'),
(14, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:40'),
(15, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:40'),
(16, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:42'),
(17, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:43'),
(18, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:43'),
(19, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:43'),
(20, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:44'),
(21, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:44'),
(22, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:45'),
(23, 'system', 'System', 'Updated Route', 'Modified route N/A: tambo-terminal to tambo-market', 'admin', '2026-03-13 06:28:45'),
(24, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to msu-iit', 'admin', '2026-03-16 08:24:12'),
(25, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to msu-iit', 'admin', '2026-03-16 08:24:34'),
(26, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to gaisano-mall', 'admin', '2026-03-17 01:28:57'),
(27, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to gaisano-mall', 'admin', '2026-03-17 01:29:36'),
(28, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to st.michael-cathedral', 'admin', '2026-03-17 01:33:46'),
(29, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to unitop', 'admin', '2026-03-17 01:37:06'),
(30, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to port-iligan', 'admin', '2026-03-17 01:41:55'),
(31, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to gaisano-sukiclub', 'admin', '2026-03-17 01:44:02'),
(32, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to wet-market', 'admin', '2026-03-17 01:46:18'),
(33, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to public-plaza', 'admin', '2026-03-17 01:49:44'),
(34, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to night-market', 'admin', '2026-03-17 01:50:42'),
(35, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: anahaw-amphitheater to anahaw-amphitheater', 'admin', '2026-03-17 01:52:10'),
(36, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to zoey\'s-cafe', 'admin', '2026-03-17 01:54:57'),
(37, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to deped', 'admin', '2026-03-17 01:57:03'),
(38, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to crown-paper', 'admin', '2026-03-17 02:06:08'),
(39, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to 167-Hypermart', 'admin', '2026-03-17 02:58:36'),
(40, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to unicity', 'admin', '2026-03-17 02:59:42'),
(41, 'system', 'System', 'Updated Route', 'Modified route BAYANIHAN_NORTH-SOUTH MINI BUS: tambo-terminal to robinsons-mall', 'admin', '2026-03-17 05:25:43'),
(42, 'system', 'System', 'Updated Route', 'Modified route BAYANIHAN_NORTH-SOUTH MINI BUS: tambo-terminal to philhealth', 'admin', '2026-03-17 05:31:05'),
(43, 'system', 'System', 'Updated Route', 'Modified route BAYANIHAN_NORTH-SOUTH MINI BUS: tambo-terminal to icnhs', 'admin', '2026-03-17 07:58:08'),
(44, 'system', 'System', 'Updated Route', 'Modified route BAYANIHAN_NORTH-SOUTH MINI BUS: tambo-terminal to icc', 'admin', '2026-03-17 07:59:39'),
(45, 'system', 'System', 'Updated Route', 'Modified route BAYANIHAN_NORTH-SOUTH MINI BUS: tambo-terminal to red-cross', 'admin', '2026-03-17 08:10:35'),
(46, 'system', 'System', 'Updated Route', 'Modified route BAYANIHAN_NORTH-SOUTH MINI BUS: tambo-terminal to lto', 'admin', '2026-03-17 08:11:48'),
(47, 'system', 'System', 'Updated Route', 'Modified route BAYANIHAN_NORTH-SOUTH MINI BUS: tambo-terminal to hall-justice', 'admin', '2026-03-17 08:19:15'),
(0, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to paseo-santaigo', 'admin', '2026-05-05 08:40:22'),
(0, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: msu-iit to tambo-terminal', 'admin', '2026-05-05 08:45:41'),
(0, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to paseo-santaigo', 'admin', '2026-05-05 08:54:49'),
(0, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to paseo-santaigo', 'admin', '2026-05-05 09:05:00'),
(0, 'system', 'System', 'Updated Route', 'Modified route TAMBO_GERONA-ILIGAN PROPER: tambo-terminal to gaisano-mall', 'admin', '2026-05-06 05:16:23'),
(0, 'system', 'System', 'Updated Route', 'Modified route TAMBO_BAYUG-ILIGAN PROPER: anahaw-amphitheater to anahaw-amphitheater', 'admin', '2026-05-08 08:10:18'),
(0, '4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'Elle Woods', 'Updated Profile', 'Updated username from Elle to Elle Woods', 'user', '2026-05-10 16:40:17'),
(0, '4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'Elle Woods', 'Updated Profile', 'Updated username from Elle to Elle Woods', 'user', '2026-05-10 16:40:30'),
(0, '4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'Elle Woods', 'Updated Profile', 'Updated username from Elle to Elle Woods', 'user', '2026-05-10 16:42:12'),
(0, '4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'Elle Woods', 'Updated Profile', 'Updated username from Elle to Elle Woods', 'user', '2026-05-10 16:46:18'),
(0, '4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'Elle Woods', 'Changed Password', 'User successfully updated their password', 'user', '2026-05-10 16:49:26'),
(0, '4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'Elle Woods', 'Changed Password', 'User successfully updated their password', 'user', '2026-05-10 16:52:08'),
(0, 'c3794506-ec60-4025-9180-5ea0571522b6', 'admin10', 'Updated Profile', 'Updated username from admin1 to admin10', 'user', '2026-05-10 16:52:49'),
(0, 'c3794506-ec60-4025-9180-5ea0571522b6', 'admin1', 'Updated Profile', 'Updated username from admin10 to admin1', 'user', '2026-05-10 16:52:56'),
(0, 'c3794506-ec60-4025-9180-5ea0571522b6', 'admin1', 'Changed Password', 'User successfully updated their password', 'user', '2026-05-10 16:53:10'),
(0, '4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'Elle Woods', 'Changed Password', 'User successfully updated their password', 'user', '2026-05-10 17:00:48'),
(0, '4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'Elle Woods', 'Changed Password', 'User successfully updated their password', 'user', '2026-05-10 17:04:06'),
(0, 'c3794506-ec60-4025-9180-5ea0571522b6', 'admin1', 'Changed Password', 'User successfully updated their password', 'user', '2026-05-10 17:05:16'),
(0, 'd72c0c91-ed72-4c40-b42f-9a7a299e63d4', 'Kevin', 'Updated Profile', 'Updated profile settings (Username: unchanged, Security Question: Updated)', 'user', '2026-05-10 17:56:05');

-- --------------------------------------------------------

--
-- Table structure for table `fare_matrix`
--

CREATE TABLE `fare_matrix` (
  `id` int(11) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `base_fare` decimal(10,2) NOT NULL,
  `base_km` decimal(10,2) NOT NULL,
  `succeeding_km_rate` decimal(10,2) NOT NULL,
  `discount_rate` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fare_matrix`
--

INSERT INTO `fare_matrix` (`id`, `vehicle_type`, `base_fare`, `base_km`, `succeeding_km_rate`, `discount_rate`) VALUES
(1, 'jeepney', 13.00, 4.00, 1.80, 0.20),
(2, 'minibus', 15.00, 4.00, 2.20, 0.20),
(3, 'walking', 0.00, 0.00, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `nodes`
--

CREATE TABLE `nodes` (
  `id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `aliases` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nodes`
--

INSERT INTO `nodes` (`id`, `name`, `latitude`, `longitude`, `aliases`) VALUES
('anahaw-amphitheater', 'Anahaw Amphitheater', 8.22514061, 124.25159412, ''),
('centennial-park', 'Dalipuga Centennial Park', 8.31986196, 124.24824151, ''),
('childrens-park', 'Children\'s Park', 8.24014800, 124.24515700, ''),
('city-hospital', 'Gregorio T. Lluch Memorial Hospital', 8.22623962, 124.25462895, ''),
('dalipuga_vista_village', 'Dalipuga Vista Village', 8.30650000, 124.27000000, ''),
('deped', 'DepEd Iligan', 8.22827304, 124.23833339, ''),
('esplanade', 'Mandulog River Esplanade', 8.25138861, 124.24965292, ''),
('gaisano-mall', 'Gaisano Mall Iligan', 8.23095949, 124.24096255, ''),
('gaisano-sukiclub', 'Gaisano Suki Club', 8.22940390, 124.23435389, ''),
('hall-justice', 'Hall of Justice', 8.21374151, 124.23945926, ''),
('highway-30-or-pedestrian-lane-transfer', 'HIGHWAY 30 OR PEDESTRIAN LANE TRANSFER (Auto-Generated)', 99.99999999, 8.24188441, ''),
('hypermart-167', '167 HyperMart', 8.22778600, 124.24099900, ''),
('icc', 'Iligan Capitol College', 8.22275144, 124.24095289, ''),
('icnhs', 'Iligan City National High School', 8.22569808, 124.23972865, ''),
('iligan-cityhall', 'Iligan City Hall', 8.22579364, 124.25187255, ''),
('iligan-medical-center-college', 'ILIGAN MEDICAL CENTER COLLEGE (Auto-Generated)', 99.99999999, 8.23128656, ''),
('iligan-medical-center-hospital', 'ILIGAN MEDICAL CENTER HOSPITAL (Auto-Generated)', 99.99999999, 8.23058336, ''),
('iligan-port', 'Port of Iligan', 8.23126000, 124.23458700, ''),
('imch', 'Iligan Medical Center', 8.22779900, 124.24073300, ''),
('kiwalan_port', 'Kiwalan Port Area', 8.27500000, 124.26500000, ''),
('landbank-main', 'Landbank Iligan Main', 8.22823800, 124.24311200, ''),
('lto', 'Land Transportation Office', 8.21450606, 124.24021090, ''),
('msu-iit', 'Mindanao State University - Iligan Institute of Technology', 8.23967172, 124.24454620, ''),
('night-market', 'Iligan Night Market', 8.22871371, 124.23721227, ''),
('paseo-santaigo', 'Paseo', 8.24504975, 124.24253467, ''),
('philhealth-office', 'PhilHealth Office', 8.21808400, 124.24096300, ''),
('psa-office', 'PSA Office', 8.22792700, 124.23986400, ''),
('public-plaza', 'Iligan Public Plaza', 8.22851727, 124.23716930, ''),
('red-cross', 'Philippine Red Cross', 8.21471800, 124.24001500, ''),
('robinsons-mall', 'Robinsons Mall', 8.21828632, 124.24052238, ''),
('soda-beach', 'Soda Beach', 8.27025593, 124.25836976, ''),
('south-bound', 'Iligan City Integrated Bus & Jeepney Terminal-South Bound', 8.20714719, 124.21654814, ''),
('south-bound-terminal', 'SOUTH BOUND TERMINAL (Auto-Generated)', 99.99999999, 8.20688639, ''),
('st.michael\'s-college', 'St. Michael\'s College', 8.22866593, 124.23950783, ''),
('st.michael-cathedral', 'St. Michael Cathedral', 8.22929241, 124.23946185, ''),
('tambo-market', 'Tambo Public Market', 8.24292084, 124.25960869, ''),
('tambo-terminal', 'Tambo Bus Terminal', 8.24159359, 124.26072390, ''),
('timoga', 'Timoga', 8.19148127, 124.17968520, ''),
('transfer-point', 'TRANSFER POINT (Auto-Generated)', 99.99999999, 8.24188441, ''),
('unicity', 'Unicity', 8.22773600, 124.24131800, ''),
('united-church-of-christ-in-the-philippines-(uccp)-transfer', 'UNITED CHURCH OF CHRIST IN THE PHILIPPINES (UCCP) TRANSFER (Auto-Generated)', 99.99999999, 8.22792705, ''),
('unitop', 'Unitop', 8.22880927, 124.23839331, ''),
('v-crown-paper', 'Crown Paper Stop', 8.22788000, 124.23992000, ''),
('v-desmark', 'Desmark Iligan', 8.22810000, 124.23950000, ''),
('v-highway-30', 'Highway 30 (Junction)', 8.24209000, 124.24838000, ''),
('v-jollibee-aguinaldo', 'Jollibee Aguinaldo', 8.22772000, 124.24071000, ''),
('v-mastertech', 'MasterTech Stop', 8.24028000, 124.24527000, ''),
('wet-market', 'Iligan Wet Market', 8.22852789, 124.23373065, ''),
('zoey\'s-cafe', 'Zoey\'s Cafe', 8.22803944, 124.23847780, '');

-- --------------------------------------------------------

--
-- Table structure for table `routes`
--

CREATE TABLE `routes` (
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(20) DEFAULT '#6366f1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `routes`
--

INSERT INTO `routes` (`name`, `description`, `color`) VALUES
('ANY JEEP / MINIBUS GO TO CITY PROPER\r\nEXCEPT DALIPUGA JEEP & MINI BUS', 'ANY JEEP / MINIBUS GO TO CITY PROPER\r\nEXCEPT DALIPUGA JEEP & MINI BUS', '#6366f1'),
('ANY JEEP GO TO CITY PROPER\r\n', 'ANY JEEP GO TO CITY PROPER\r\n', '#6366f1'),
('ANY JEEP GO TO CITY PROPER\r\nMINI BUS', 'ANY JEEP GO TO CITY PROPER\r\nMINI BUS', '#6366f1'),
('ANY JEEP GO TO CITY PROPER', 'ANY JEEP GO TO CITY PROPER', '#6366f1'),
('ANY JEEP GO TO TAMBO TERMINAL\r\nMINI BUS', 'ANY JEEP GO TO TAMBO TERMINAL\r\nMINI BUS', '#6366f1'),
('BURUUN JEEP', 'BURUUN JEEP', '#6366f1'),
('BURUUN JEEP then used Pedestrian Lane', 'BURUUN JEEP then used Pedestrian Lane', '#6366f1'),
('BUS', 'BUS', '#6366f1'),
('Childrens Park', 'Childrens Park', '#6366f1'),
('Dalipuga Jeep or Mini bus', 'Dalipuga Jeep or Mini bus', '#6366f1'),
('DALIPUGA LINE', 'DALIPUGA LINE', '#6366f1'),
('Gaisano', 'Gaisano', '#6366f1'),
('JEEP/MINIBUS', 'JEEP/MINIBUS', '#6366f1'),
('JUST WALK', 'JUST WALK', '#6366f1'),
('LUGAIT LANE JEEP', 'LUGAIT LANE JEEP', '#6366f1'),
('MINIBUS SOUTHBOUND TO NORTHBOUND', 'MINIBUS SOUTHBOUND TO NORTHBOUND', '#6366f1'),
('MSU-IIT', 'MSU-IIT', '#6366f1'),
('PALAO JEEP', 'PALAO JEEP', '#6366f1'),
('Paseo', 'Paseo', '#6366f1'),
('Random', 'Random', '#6366f1'),
('SANTAIGO JEEP', 'SANTAIGO JEEP', '#6366f1'),
('SANTIAGO JEEP', 'SANTIAGO JEEP', '#6366f1'),
('Sikad ', 'Sikad ', '#6366f1'),
('SIKAD or JUST WALK\r\n\r\n\r\n\r\n\r\n\r\nANY JEEP/MINIBUS', 'SIKAD or JUST WALK\r\n\r\n\r\n\r\n\r\n\r\nANY JEEP/MINIBUS', '#6366f1'),
('SIKAD or JUST WALK\r\n\r\n\r\n\r\n\r\n\r\nANY JEEP/MINIBUS GO TO \r\nTAMBO TERMINAL', 'SIKAD or JUST WALK\r\n\r\n\r\n\r\n\r\n\r\nANY JEEP/MINIBUS GO TO \r\nTAMBO TERMINAL', '#6366f1'),
('SIKAD or JUST WALK\r\n\r\n\r\n\r\n\r\n', 'SIKAD or JUST WALK\r\n\r\n\r\n\r\n\r\n', '#6366f1'),
('SIKAD or SAN MIGUEL JEEP or WALK', 'SIKAD or SAN MIGUEL JEEP or WALK', '#6366f1'),
('SIKAD or SANTAIGO JEEP or WALK', 'SIKAD or SANTAIGO JEEP or WALK', '#6366f1'),
('SIKAD or WALK', 'SIKAD or WALK', '#6366f1'),
('TAMBO GERONA', 'TAMBO GERONA', '#6366f1'),
('Tambo Terminal-Centennial Park', 'Tambo Terminal-Centennial Park', '#6366f1'),
('Tambo Terminal-Gaisano Mall', 'Tambo Terminal-Gaisano Mall', '#6366f1'),
('Tambo-Gerona', 'Tambo-Gerona', '#6366f1'),
('Tambo-Ubaldo', 'Tambo-Ubaldo', '#6366f1'),
('UBALDO JEEP', 'UBALDO JEEP', '#6366f1'),
('UBALDO JEEP then WALK', 'UBALDO JEEP then WALK', '#6366f1');

-- --------------------------------------------------------

--
-- Table structure for table `route_blocks`
--

CREATE TABLE `route_blocks` (
  `id` int(11) NOT NULL,
  `source_id` varchar(100) NOT NULL,
  `target_id` varchar(100) NOT NULL,
  `route_name` varchar(100) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `distance` decimal(10,3) NOT NULL,
  `regular_fare` decimal(10,2) NOT NULL,
  `discounted_fare` decimal(10,2) NOT NULL,
  `path_coordinates` longtext DEFAULT NULL,
  `original_excel_ref` text DEFAULT NULL,
  `block_order` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `route_blocks`
--

INSERT INTO `route_blocks` (`id`, `source_id`, `target_id`, `route_name`, `vehicle_type`, `distance`, `regular_fare`, `discounted_fare`, `path_coordinates`, `original_excel_ref`, `block_order`, `created_at`) VALUES
(5, 'tambo-terminal', 'gaisano-mall', 'Tambo-Gerona', 'jeepney', 3.362, 13.00, 10.50, '[[8.241594,124.260724],[8.241597,124.260947],[8.241582,124.26087],[8.241521,124.260805],[8.241435,124.260791],[8.241364,124.260822],[8.241334,124.26063],[8.241313,124.260297],[8.241281,124.25996],[8.241305,124.259777],[8.24136,124.259701],[8.241483,124.25966],[8.242123,124.259617],[8.243019,124.259553],[8.243314,124.259472],[8.24348,124.259318],[8.243643,124.259138],[8.243898,124.258903],[8.243878,124.258814],[8.243912,124.258676],[8.244556,124.257608],[8.24522,124.25652],[8.244803,124.25546],[8.244402,124.254402],[8.243643,124.252525],[8.243209,124.251443],[8.242781,124.250356],[8.241916,124.248193],[8.241352,124.246639],[8.241153,124.246229],[8.241043,124.246045],[8.240584,124.2456],[8.239961,124.245013],[8.239087,124.244395],[8.237655,124.243926],[8.236989,124.243653],[8.236397,124.243375],[8.235817,124.243106],[8.23525,124.242832],[8.234992,124.242717],[8.234701,124.242587],[8.233989,124.242264],[8.23359,124.242007],[8.233228,124.241724],[8.232577,124.241211],[8.232072,124.241031],[8.231734,124.240973],[8.23139,124.2409],[8.231164,124.240859],[8.230967,124.240812],[8.23078,124.240783],[8.230618,124.240758]]', NULL, 1, '2026-05-19 17:31:18');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `uid` varchar(128) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `password_hash` varchar(255) DEFAULT NULL,
  `password_changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `security_question` text DEFAULT NULL,
  `security_answer_hash` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`uid`, `email`, `username`, `role`, `created_at`, `password_hash`, `password_changed_at`, `security_question`, `security_answer_hash`) VALUES
('07fbe9a1-183d-4baf-b251-e3296a8c4969', 'april@gmail.com', 'april', 'user', '2026-05-08 08:02:50', '$2b$12$haQimNa41uRcWIw0EiMVwO.s9GK4pSNAupSQ4559aWRTqz5IBWJOy', '2026-05-10 17:00:16', NULL, NULL),
('15310073-725a-48ec-8929-d926b6ba0a70', 'tester@example.com', 'tester', 'user', '2026-05-08 06:23:53', '$2b$12$5VqLvsnZcnUvztKKmXmXseGiagr70U7SjEgUb3.yU0C5bgxlQyYSi', '2026-05-10 17:00:16', NULL, NULL),
('4b590042-22bc-4d29-b92c-47c204dc7d50', 'test@example.com', 'testuser', 'user', '2026-05-15 21:07:40', '$2b$12$9KpRV2s7RX8T69P63jrwG.Nyr9AjR6icRlWHH2sCBb7KGw7fRHwuy', '2026-05-15 21:07:40', NULL, NULL),
('4db67e84-7458-42fc-bf1d-d63dbe60bbd6', 'elle@gmail.com', 'Elle Woods', 'user', '2026-05-10 13:56:40', '$2b$12$jWvRAJ/0Orpe8R1xKjEKveK4qDBNBLPmmCfnKQpPsNJT/JG0Es08O', '2026-05-10 17:04:06', NULL, NULL),
('501f0ae9-ec07-4e0b-8953-0094fa0410bc', 'dom@gmail.com', 'dom', 'user', '2026-05-05 09:17:59', '$2b$12$Htx4bjwAx1fDKXyh6dVmLukbcDJjnFqmMxfFLHTW/tRMBkeQ94UAa', '2026-05-10 17:00:16', NULL, NULL),
('51150ab6-74a7-41f7-b271-dd466a7522a7', 'charmaine@gmail.com', 'charmaine', 'user', '2026-05-04 08:33:57', '$2b$12$/P3caui3t99s7RH5U6/a8udfwT7u2v7iHbQQnxQPSU/4/PDIzERaW', '2026-05-10 17:00:16', NULL, NULL),
('53468460-be4c-4786-97a7-10f12f66265c', 'charmaineromero65@gmail.com', 'Charmaine Hazel', 'user', '2026-05-10 17:42:55', '$2b$12$OIP4oWaQbrd0gM.35F0WsOaHF64xlRh8qSi1583VpTo2eH3NgrghK', '2026-05-10 17:42:55', NULL, NULL),
('7396fcf5-ebef-4ee6-882e-b8d00a0e370e', 'admin@viagraph.com', 'admin', 'user', '2026-05-16 02:06:16', '$2b$12$Q9aYY3/I1LMqtgOrg9dT9uHhgSHH5Tv5i/cj6eY/08qBFQDqzPfty', '2026-05-16 02:06:16', NULL, NULL),
('8ac913f7-8b3b-41ae-b303-0aed5cb47919', 'hazel@gmail.com', 'hazel', 'admin', '2026-03-11 02:42:13', '$2b$12$WRi6.phx60uNfjrrleHpkuMCnwjKODcTgcYFluQRfrcEOe.EWjWma', '2026-05-10 17:00:16', NULL, NULL),
('b9f37f70-7770-40fa-aedd-0099b02cae9d', 'johnny@gmail.com', 'johnny', 'user', '2026-05-06 05:19:46', '$2b$12$aSiSbzm2pG309VqQk4YteeYVIDste/sZpRNivJj5Fg6ulx7t/xzn6', '2026-05-10 17:00:16', NULL, NULL),
('c3794506-ec60-4025-9180-5ea0571522b6', 'admin1@gmail.com', 'admin1', 'admin', '2026-03-06 07:16:18', '$2b$12$U864Z0D871Mu87nOIEhsHeYFXUu1GHvfBb5ghs0kmE3iFu.xv4EJy', '2026-05-10 17:05:16', NULL, NULL),
('d58582a5-55dc-4fa6-9cd9-92d666c97cf1', 'maine@gmail.com', 'maine', 'user', '2026-03-11 02:31:07', '$2b$12$Po41dAuFcnQ/mFi4Qvbe.utSkrHWiQR17mX1G3Z7G03FG15tIV6qO', '2026-05-10 17:00:16', NULL, NULL),
('d72c0c91-ed72-4c40-b42f-9a7a299e63d4', 'kevin@gmail.com', 'Kevin', 'user', '2026-05-10 17:54:43', '$2b$12$57a72bf.lZ0bnyHVhIZd2eW54gb0fZssD8cWhOGSQ1xLVOvECBPQu', '2026-05-10 18:05:02', 'What is the name of your first pet?', '$2b$12$WOkodSa0nA2g0GSb.nLMLuQJmUCA04XtSg/Doy7kRHiTJsbhJ0NC2'),
('dcefc9a1-aca6-4038-a35f-815180b0b6c2', 'admin@gmail.com', 'admin', 'admin', '2026-05-08 05:55:35', '$2b$12$Wt4YJ5DomOkNqcnqYOoumeT4C5QuCaYKLK2d7s63PMt9WOPk.4/ma', '2026-05-10 17:00:16', NULL, NULL),
('e1779d59-bd3d-43d6-bb6c-bcb79efde66a', 'mariavianell.tadoy@g.msuiit.edu.ph', 'Maria Vianell Tadoy', 'user', '2026-05-08 08:17:51', '$2b$12$92JS1h62KSK9BT6bdHlNVuWaQq32mvtDZpSa.PmB.Q/SZNxvo3sKC', '2026-05-10 17:00:16', NULL, NULL),
('ec1f2f62-86f2-4b7c-96de-96fbd877e58a', 'kurt@gmail.com', 'Kurt', 'user', '2026-05-08 09:09:32', '$2b$12$yJa3bkb5qH4bkL.sTqYOGuld4VDLWrSRyiojAe7DKv2MSkgo1KwWe', '2026-05-10 17:00:16', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fare_matrix`
--
ALTER TABLE `fare_matrix`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `nodes`
--
ALTER TABLE `nodes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`name`);

--
-- Indexes for table `route_blocks`
--
ALTER TABLE `route_blocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `source_id` (`source_id`),
  ADD KEY `target_id` (`target_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uid`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fare_matrix`
--
ALTER TABLE `fare_matrix`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `route_blocks`
--
ALTER TABLE `route_blocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `route_blocks`
--
ALTER TABLE `route_blocks`
  ADD CONSTRAINT `route_blocks_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `nodes` (`id`),
  ADD CONSTRAINT `route_blocks_ibfk_2` FOREIGN KEY (`target_id`) REFERENCES `nodes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
