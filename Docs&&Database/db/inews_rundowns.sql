-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2023 at 07:33 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `inews_rundowns`
--
CREATE DATABASE IF NOT EXISTS `inews_rundowns` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `inews_rundowns`;

-- --------------------------------------------------------

--
-- Table structure for table `current_lineup`
--

CREATE TABLE `current_lineup` (
  `storyName` varchar(500) NOT NULL,
  `storyIndex` int(11) NOT NULL,
  `fileName` varchar(30) NOT NULL,
  `locator` varchar(30) NOT NULL,
  `modified` varchar(30) NOT NULL,
  `floated` varchar(10) NOT NULL,
  `cues` varchar(500) NOT NULL,
  `attachments` varchar(2000) NOT NULL,
  `body` varchar(5000) NOT NULL,
  `meta` varchar(500) NOT NULL,
  `storyId` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `current_lineup`
--

INSERT INTO `current_lineup` (`storyName`, `storyIndex`, `fileName`, `locator`, `modified`, `floated`, `cues`, `attachments`, `body`, `meta`, `storyId`) VALUES
('opener', 0, '080E10C5:000292BF:65480413', '000292BF:65480413', '2023-11-05 16:07:00.000', '0', '[]', '{}', '', '{\"rate\":\"180\",\"wordlength\":\"6\",\"version\":\"10\"}', '080e10c5:000292bf:65480413'),
('gagagagaga', 1, '024FC712:000292AF:654FC7C7', '000292AF:654FC7C7', '2023-11-11 13:28:00.000', '0', '[]', '{}', '', '{\"rate\":\"180\",\"wordlength\":\"6\",\"version\":\"1\"}', '024fc712:000292af:654fc7c7'),
('dialog', 2, '04173EC4:00026B95:651FB5BE', '00026B95:651FB5BE', '2023-10-06 03:22:00.000', '0', '[]', '{}', '<p>hello, we start our </p><p></p><p></p>', '{\"words\":\"4\",\"rate\":\"180\",\"wordlength\":\"6\",\"version\":\"9\"}', '04173ec4:00026b95:651fb5be');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `current_lineup`
--
ALTER TABLE `current_lineup`
  ADD PRIMARY KEY (`storyIndex`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
