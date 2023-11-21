-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 21, 2023 at 08:46 PM
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
-- Database: `newsarts`
--
CREATE DATABASE IF NOT EXISTS `newsarts` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `newsarts`;

-- --------------------------------------------------------

--
-- Table structure for table `ngn_inews_items`
--

CREATE TABLE `ngn_inews_items` (
  `uid` bigint(20) NOT NULL,
  `name` varchar(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `lastupdate` bigint(20) NOT NULL,
  `production` bigint(20) NOT NULL,
  `rundown` bigint(20) NOT NULL,
  `story` bigint(20) NOT NULL,
  `ord` int(11) NOT NULL,
  `ordupdate` bigint(20) NOT NULL,
  `template` bigint(20) NOT NULL,
  `data` text DEFAULT NULL,
  `scripts` text DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `tag` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ngn_inews_rundowns`
--

CREATE TABLE `ngn_inews_rundowns` (
  `uid` bigint(20) NOT NULL,
  `name` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `lastupdate` bigint(20) NOT NULL,
  `production` bigint(20) NOT NULL,
  `enabled` bit(1) NOT NULL,
  `exported` bit(1) NOT NULL,
  `tag` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ngn_inews_rundowns`
--

INSERT INTO `ngn_inews_rundowns` (`uid`, `name`, `lastupdate`, `production`, `enabled`, `exported`, `tag`) VALUES
(170, 'show.alex.rundown', 17005947010000000, 0, b'1', b'1', '0'),
(171, 'show.alex.20:00.rundown', 17005947020000000, 0, b'1', b'1', '0'),
(431, 'show.alex.test1', 17005947090000000, 0, b'1', b'1', '0'),
(2539, 'show.alex.test2', 17005947200000000, 0, b'1', b'1', '0');

-- --------------------------------------------------------

--
-- Table structure for table `ngn_inews_stories`
--

CREATE TABLE `ngn_inews_stories` (
  `uid` bigint(20) NOT NULL,
  `name` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `lastupdate` bigint(20) NOT NULL,
  `rundown` bigint(20) NOT NULL,
  `rundownname` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `production` bigint(20) NOT NULL,
  `ord` int(11) NOT NULL,
  `ordupdate` bigint(20) NOT NULL,
  `enabled` bit(1) NOT NULL,
  `tag` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ngn_inews_stories`
--

INSERT INTO `ngn_inews_stories` (`uid`, `name`, `lastupdate`, `rundown`, `rundownname`, `production`, `ord`, `ordupdate`, `enabled`, `tag`) VALUES
(1, 'nunia2', 17005947010000000, 170, 'show.alex.rundown', 0, 0, 17005947010000000, b'1', 'tag'),
(2, 'aaabbb', 17005947010000000, 170, 'show.alex.rundown', 0, 1, 17005947010000000, b'1', 'tag'),
(5, '11', 17005947010000000, 171, 'show.alex.20:00.rundown', 0, 0, 17005947010000000, b'1', 'tag'),
(6, '22', 17005947010000000, 171, 'show.alex.20:00.rundown', 0, 1, 17005947010000000, b'1', 'tag'),
(7, '33', 17005947010000000, 171, 'show.alex.20:00.rundown', 0, 2, 17005947010000000, b'1', 'tag'),
(8, '44', 17005947010000000, 171, 'show.alex.20:00.rundown', 0, 3, 17005947010000000, b'1', 'tag'),
(9, '55', 17005947010000000, 171, 'show.alex.20:00.rundown', 0, 4, 17005947010000000, b'1', 'tag'),
(10, '66', 17005947010000000, 171, 'show.alex.20:00.rundown', 0, 5, 17005947010000000, b'1', 'tag'),
(11, '77', 17005947020000000, 171, 'show.alex.20:00.rundown', 0, 6, 17005947020000000, b'1', 'tag'),
(72, 'opener', 17005947010000000, 170, 'show.alex.rundown', 0, 2, 17005947010000000, b'1', 'tag'),
(73, 'ererer', 17005947010000000, 170, 'show.alex.rundown', 0, 3, 17005947010000000, b'1', 'tag'),
(86, 'break four', 17005947020000000, 431, 'show.alex.test1', 0, 0, 17005947020000000, b'1', 'tag'),
(87, 'sports open', 17005947020000000, 431, 'show.alex.test1', 0, 1, 17005947020000000, b'1', 'tag'),
(88, 'olympic hockey', 17005947020000000, 431, 'show.alex.test1', 0, 2, 17005947020000000, b'1', 'tag'),
(89, 'badger hockey', 17005947020000000, 431, 'show.alex.test1', 0, 3, 17005947020000000, b'1', 'tag'),
(90, 'womens hockey', 17005947020000000, 431, 'show.alex.test1', 0, 4, 17005947020000000, b'1', 'tag'),
(91, 'curling', 17005947020000000, 431, 'show.alex.test1', 0, 5, 17005947020000000, b'1', 'tag'),
(92, 'brewers', 17005947020000000, 431, 'show.alex.test1', 0, 6, 17005947020000000, b'1', 'tag'),
(93, 'cubs', 17005947020000000, 431, 'show.alex.test1', 0, 7, 17005947020000000, b'1', 'tag'),
(94, 'tease five', 17005947020000000, 431, 'show.alex.test1', 0, 8, 17005947020000000, b'1', 'tag'),
(95, 't5a-', 17005947020000000, 431, 'show.alex.test1', 0, 9, 17005947020000000, b'1', 'tag'),
(96, 't5b-', 17005947030000000, 431, 'show.alex.test1', 0, 10, 17005947030000000, b'1', 'tag'),
(97, 't5c-', 17005947030000000, 431, 'show.alex.test1', 0, 11, 17005947030000000, b'1', 'tag'),
(98, 'break five', 17005947030000000, 431, 'show.alex.test1', 0, 12, 17005947030000000, b'1', 'tag'),
(99, 'recap', 17005947030000000, 431, 'show.alex.test1', 0, 13, 17005947030000000, b'1', 'tag'),
(100, 'r1-', 17005947030000000, 431, 'show.alex.test1', 0, 14, 17005947030000000, b'1', 'tag'),
(101, 'r2-', 17005947030000000, 431, 'show.alex.test1', 0, 15, 17005947030000000, b'1', 'tag'),
(102, 'r3-', 17005947030000000, 431, 'show.alex.test1', 0, 16, 17005947030000000, b'1', 'tag'),
(103, 'tonight', 17005947030000000, 431, 'show.alex.test1', 0, 17, 17005947030000000, b'1', 'tag'),
(104, 'kicker', 17005947030000000, 431, 'show.alex.test1', 0, 18, 17005947030000000, b'1', 'tag'),
(105, 'wx recap', 17005947030000000, 431, 'show.alex.test1', 0, 19, 17005947030000000, b'1', 'tag'),
(106, 'close', 17005947030000000, 431, 'show.alex.test1', 0, 20, 17005947030000000, b'1', 'tag'),
(107, 'end', 17005947030000000, 431, 'show.alex.test1', 0, 21, 17005947030000000, b'1', 'tag'),
(108, 'training  show', 17005947040000000, 431, 'show.alex.test1', 0, 22, 17005947040000000, b'1', 'tag'),
(109, 'producer:', 17005947040000000, 431, 'show.alex.test1', 0, 23, 17005947040000000, b'1', 'tag'),
(110, 'date:   00/00/00', 17005947040000000, 431, 'show.alex.test1', 0, 24, 17005947040000000, b'1', 'tag'),
(111, 'break four', 17005947040000000, 431, 'show.alex.test1', 0, 25, 17005947040000000, b'1', 'tag'),
(112, 'sports open', 17005947040000000, 431, 'show.alex.test1', 0, 26, 17005947040000000, b'1', 'tag'),
(113, 'olympic hockey', 17005947040000000, 431, 'show.alex.test1', 0, 27, 17005947040000000, b'1', 'tag'),
(114, 'badger hockey', 17005947040000000, 431, 'show.alex.test1', 0, 28, 17005947040000000, b'1', 'tag'),
(115, 'womens hockey', 17005947040000000, 431, 'show.alex.test1', 0, 29, 17005947040000000, b'1', 'tag'),
(116, 'curling', 17005947040000000, 431, 'show.alex.test1', 0, 30, 17005947040000000, b'1', 'tag'),
(117, 'brewers', 17005947040000000, 431, 'show.alex.test1', 0, 31, 17005947040000000, b'1', 'tag'),
(118, 'cubs', 17005947040000000, 431, 'show.alex.test1', 0, 32, 17005947040000000, b'1', 'tag'),
(119, 'tease five', 17005947040000000, 431, 'show.alex.test1', 0, 33, 17005947040000000, b'1', 'tag'),
(120, 't5a-', 17005947050000000, 431, 'show.alex.test1', 0, 34, 17005947050000000, b'1', 'tag'),
(121, 't5b-', 17005947050000000, 431, 'show.alex.test1', 0, 35, 17005947050000000, b'1', 'tag'),
(122, 't5c-', 17005947050000000, 431, 'show.alex.test1', 0, 36, 17005947050000000, b'1', 'tag'),
(123, 'break five', 17005947050000000, 431, 'show.alex.test1', 0, 37, 17005947050000000, b'1', 'tag'),
(124, 'recap', 17005947050000000, 431, 'show.alex.test1', 0, 38, 17005947050000000, b'1', 'tag'),
(125, 'kicker', 17005947050000000, 431, 'show.alex.test1', 0, 39, 17005947050000000, b'1', 'tag'),
(126, 'wx recap', 17005947050000000, 431, 'show.alex.test1', 0, 40, 17005947050000000, b'1', 'tag'),
(127, 'close', 17005947050000000, 431, 'show.alex.test1', 0, 41, 17005947050000000, b'1', 'tag'),
(128, 'end', 17005947050000000, 431, 'show.alex.test1', 0, 42, 17005947050000000, b'1', 'tag'),
(129, 'training  show', 17005947050000000, 431, 'show.alex.test1', 0, 43, 17005947050000000, b'1', 'tag'),
(130, 'producer:', 17005947050000000, 431, 'show.alex.test1', 0, 44, 17005947050000000, b'1', 'tag'),
(131, 'r1-', 17005947050000000, 431, 'show.alex.test1', 0, 45, 17005947050000000, b'1', 'tag'),
(132, 'r2-', 17005947050000000, 431, 'show.alex.test1', 0, 46, 17005947050000000, b'1', 'tag'),
(133, 'r3-', 17005947060000000, 431, 'show.alex.test1', 0, 47, 17005947060000000, b'1', 'tag'),
(134, 'tonight', 17005947060000000, 431, 'show.alex.test1', 0, 48, 17005947060000000, b'1', 'tag'),
(135, 'date:   00/00/00', 17005947060000000, 431, 'show.alex.test1', 0, 49, 17005947060000000, b'1', 'tag'),
(136, 'start of show', 17005947060000000, 431, 'show.alex.test1', 0, 50, 17005947060000000, b'1', 'tag'),
(137, 'r1-', 17005947060000000, 431, 'show.alex.test1', 0, 51, 17005947060000000, b'1', 'tag'),
(138, 'r2-', 17005947060000000, 431, 'show.alex.test1', 0, 52, 17005947060000000, b'1', 'tag'),
(139, 'r3-', 17005947060000000, 431, 'show.alex.test1', 0, 53, 17005947060000000, b'1', 'tag'),
(140, 'tonight', 17005947060000000, 431, 'show.alex.test1', 0, 54, 17005947060000000, b'1', 'tag'),
(141, 'date:   00/00/00', 17005947060000000, 431, 'show.alex.test1', 0, 55, 17005947060000000, b'1', 'tag'),
(142, 'start of show', 17005947060000000, 431, 'show.alex.test1', 0, 56, 17005947060000000, b'1', 'tag'),
(143, 'start of show', 17005947060000000, 431, 'show.alex.test1', 0, 57, 17005947060000000, b'1', 'tag'),
(144, 'break four', 17005947060000000, 431, 'show.alex.test1', 0, 58, 17005947060000000, b'1', 'tag'),
(145, 'sports open', 17005947060000000, 431, 'show.alex.test1', 0, 59, 17005947060000000, b'1', 'tag'),
(146, 'olympic hockey', 17005947070000000, 431, 'show.alex.test1', 0, 60, 17005947070000000, b'1', 'tag'),
(147, 'badger hockey', 17005947070000000, 431, 'show.alex.test1', 0, 61, 17005947070000000, b'1', 'tag'),
(148, 'womens hockey', 17005947070000000, 431, 'show.alex.test1', 0, 62, 17005947070000000, b'1', 'tag'),
(149, 'curling', 17005947070000000, 431, 'show.alex.test1', 0, 63, 17005947070000000, b'1', 'tag'),
(150, 'brewers', 17005947070000000, 431, 'show.alex.test1', 0, 64, 17005947070000000, b'1', 'tag'),
(151, 'cubs', 17005947070000000, 431, 'show.alex.test1', 0, 65, 17005947070000000, b'1', 'tag'),
(152, 'tease five', 17005947070000000, 431, 'show.alex.test1', 0, 66, 17005947070000000, b'1', 'tag'),
(153, 't5a-', 17005947070000000, 431, 'show.alex.test1', 0, 67, 17005947070000000, b'1', 'tag'),
(154, 't5b-', 17005947070000000, 431, 'show.alex.test1', 0, 68, 17005947070000000, b'1', 'tag'),
(155, 't5c-', 17005947070000000, 431, 'show.alex.test1', 0, 69, 17005947070000000, b'1', 'tag'),
(156, 'break five', 17005947070000000, 431, 'show.alex.test1', 0, 70, 17005947070000000, b'1', 'tag'),
(157, 'recap', 17005947080000000, 431, 'show.alex.test1', 0, 71, 17005947080000000, b'1', 'tag'),
(158, 'r1-', 17005947080000000, 431, 'show.alex.test1', 0, 72, 17005947080000000, b'1', 'tag'),
(159, 'r2-', 17005947080000000, 431, 'show.alex.test1', 0, 73, 17005947080000000, b'1', 'tag'),
(160, 'r3-', 17005947080000000, 431, 'show.alex.test1', 0, 74, 17005947080000000, b'1', 'tag'),
(161, 'tonight', 17005947080000000, 431, 'show.alex.test1', 0, 75, 17005947080000000, b'1', 'tag'),
(162, 'kicker', 17005947080000000, 431, 'show.alex.test1', 0, 76, 17005947080000000, b'1', 'tag'),
(163, 'wx recap', 17005947080000000, 431, 'show.alex.test1', 0, 77, 17005947080000000, b'1', 'tag'),
(164, 'close', 17005947080000000, 431, 'show.alex.test1', 0, 78, 17005947080000000, b'1', 'tag'),
(165, 'end', 17005947080000000, 431, 'show.alex.test1', 0, 79, 17005947080000000, b'1', 'tag'),
(166, 'training  show', 17005947080000000, 431, 'show.alex.test1', 0, 80, 17005947080000000, b'1', 'tag'),
(167, 'producer:', 17005947080000000, 431, 'show.alex.test1', 0, 81, 17005947080000000, b'1', 'tag'),
(168, 'date:   00/00/00', 17005947080000000, 431, 'show.alex.test1', 0, 82, 17005947080000000, b'1', 'tag'),
(169, 'break four', 17005947090000000, 431, 'show.alex.test1', 0, 83, 17005947090000000, b'1', 'tag'),
(170, 'sports open', 17005947090000000, 431, 'show.alex.test1', 0, 84, 17005947090000000, b'1', 'tag'),
(171, 'olympic hockey', 17005947090000000, 431, 'show.alex.test1', 0, 85, 17005947090000000, b'1', 'tag'),
(172, 'badger hockey', 17005944780000000, 431, 'show.alex.test1', 0, 86, 17005944780000000, b'1', 'tag'),
(2203, 'wx open', 17005947090000000, 2539, 'show.alex.test2', 0, 0, 17005947090000000, b'1', 'tag'),
(2204, 'wxtoss2312', 17005947090000000, 2539, 'show.alex.test2', 0, 1, 17005947090000000, b'1', 'tag'),
(2205, 'weather', 17005947090000000, 2539, 'show.alex.test2', 0, 2, 17005947090000000, b'1', 'tag'),
(2206, 'forecast', 17005947090000000, 2539, 'show.alex.test2', 0, 3, 17005947090000000, b'1', 'tag'),
(2207, 'movie: avatar', 17005947090000000, 2539, 'show.alex.test2', 0, 4, 17005947090000000, b'1', 'tag'),
(2208, 'copyright web', 17005947090000000, 2539, 'show.alex.test2', 0, 5, 17005947090000000, b'1', 'tag'),
(2209, 'break three', 17005947090000000, 2539, 'show.alex.test2', 0, 6, 17005947090000000, b'1', 'tag'),
(2210, 'stox', 17005947100000000, 2539, 'show.alex.test2', 0, 7, 17005947100000000, b'1', 'tag'),
(2211, 'solar starts', 17005947100000000, 2539, 'show.alex.test2', 0, 8, 17005947100000000, b'1', 'tag'),
(2212, 'mr food', 17005947100000000, 2539, 'show.alex.test2', 0, 9, 17005947100000000, b'1', 'tag'),
(2213, 'sports bump', 17005947100000000, 2539, 'show.alex.test2', 0, 10, 17005947100000000, b'1', 'tag'),
(2214, 'break four', 17005947100000000, 2539, 'show.alex.test2', 0, 11, 17005947100000000, b'1', 'tag'),
(2215, 'sports open', 17005947100000000, 2539, 'show.alex.test2', 0, 12, 17005947100000000, b'1', 'tag'),
(2216, 'olympic hockey', 17005947100000000, 2539, 'show.alex.test2', 0, 13, 17005947100000000, b'1', 'tag'),
(2217, 'badger hockey', 17005947100000000, 2539, 'show.alex.test2', 0, 14, 17005947100000000, b'1', 'tag'),
(2218, 'womens hockey', 17005947100000000, 2539, 'show.alex.test2', 0, 15, 17005947100000000, b'1', 'tag'),
(2219, 'curling', 17005947100000000, 2539, 'show.alex.test2', 0, 16, 17005947100000000, b'1', 'tag'),
(2220, 'brewers', 17005947100000000, 2539, 'show.alex.test2', 0, 17, 17005947100000000, b'1', 'tag'),
(2221, 'cubs', 17005947100000000, 2539, 'show.alex.test2', 0, 18, 17005947100000000, b'1', 'tag'),
(2222, 'tease five', 17005947100000000, 2539, 'show.alex.test2', 0, 19, 17005947100000000, b'1', 'tag'),
(2223, 't5a-', 17005947110000000, 2539, 'show.alex.test2', 0, 20, 17005947110000000, b'1', 'tag'),
(2224, 't5b-', 17005947110000000, 2539, 'show.alex.test2', 0, 21, 17005947110000000, b'1', 'tag'),
(2225, 't5c-', 17005947110000000, 2539, 'show.alex.test2', 0, 22, 17005947110000000, b'1', 'tag'),
(2226, 'break five', 17005947110000000, 2539, 'show.alex.test2', 0, 23, 17005947110000000, b'1', 'tag'),
(2227, 'recap', 17005947110000000, 2539, 'show.alex.test2', 0, 24, 17005947110000000, b'1', 'tag'),
(2228, 'r1-', 17005947110000000, 2539, 'show.alex.test2', 0, 25, 17005947110000000, b'1', 'tag'),
(2229, 'r2-', 17005947110000000, 2539, 'show.alex.test2', 0, 26, 17005947110000000, b'1', 'tag'),
(2230, 'r3-', 17005947110000000, 2539, 'show.alex.test2', 0, 27, 17005947110000000, b'1', 'tag'),
(2231, 'tonight', 17005947110000000, 2539, 'show.alex.test2', 0, 28, 17005947110000000, b'1', 'tag'),
(2232, 'kicker', 17005947110000000, 2539, 'show.alex.test2', 0, 29, 17005947110000000, b'1', 'tag'),
(2233, 'wx recap', 17005947110000000, 2539, 'show.alex.test2', 0, 30, 17005947110000000, b'1', 'tag'),
(2234, 'close', 17005947110000000, 2539, 'show.alex.test2', 0, 31, 17005947110000000, b'1', 'tag'),
(2235, 'end', 17005947120000000, 2539, 'show.alex.test2', 0, 32, 17005947120000000, b'1', 'tag'),
(2236, '', 17005947120000000, 2539, 'show.alex.test2', 0, 33, 17005947120000000, b'1', 'tag'),
(2237, '', 17005947120000000, 2539, 'show.alex.test2', 0, 34, 17005947120000000, b'1', 'tag'),
(2238, 'training  show', 17005947120000000, 2539, 'show.alex.test2', 0, 35, 17005947120000000, b'1', 'tag'),
(2239, 'producer:', 17005947120000000, 2539, 'show.alex.test2', 0, 36, 17005947120000000, b'1', 'tag'),
(2240, 'date:   00/00/00', 17005947120000000, 2539, 'show.alex.test2', 0, 37, 17005947120000000, b'1', 'tag'),
(2241, 'start of show', 17005947120000000, 2539, 'show.alex.test2', 0, 38, 17005947120000000, b'1', 'tag'),
(2242, 'open', 17005947120000000, 2539, 'show.alex.test2', 0, 39, 17005947120000000, b'1', 'tag'),
(2243, 'headlines', 17005947120000000, 2539, 'show.alex.test2', 0, 40, 17005947120000000, b'1', 'tag'),
(2244, 'h1-', 17005947120000000, 2539, 'show.alex.test2', 0, 41, 17005947120000000, b'1', 'tag'),
(2245, 'h2-', 17005947120000000, 2539, 'show.alex.test2', 0, 42, 17005947120000000, b'1', 'tag'),
(2246, 'h3-', 17005947120000000, 2539, 'show.alex.test2', 0, 43, 17005947120000000, b'1', 'tag'),
(2247, 'first wx', 17005947130000000, 2539, 'show.alex.test2', 0, 44, 17005947130000000, b'1', 'tag'),
(2248, 'education summit', 17005947130000000, 2539, 'show.alex.test2', 0, 45, 17005947130000000, b'1', 'tag'),
(2249, 'education live', 17005947130000000, 2539, 'show.alex.test2', 0, 46, 17005947130000000, b'1', 'tag'),
(2250, 'education tag', 17005947130000000, 2539, 'show.alex.test2', 0, 47, 17005947130000000, b'1', 'tag'),
(2251, 'education side', 17005947130000000, 2539, 'show.alex.test2', 0, 48, 17005947130000000, b'1', 'tag'),
(2252, 'grainger fire', 17005947130000000, 2539, 'show.alex.test2', 0, 49, 17005947130000000, b'1', 'tag'),
(2253, 'gun ban scotus', 17005947130000000, 2539, 'show.alex.test2', 0, 50, 17005947130000000, b'1', 'tag'),
(2254, 'live gun ban', 17005947130000000, 2539, 'show.alex.test2', 0, 51, 17005947130000000, b'1', 'tag'),
(2255, 'pkg gun ban', 17005947130000000, 2539, 'show.alex.test2', 0, 52, 17005947130000000, b'1', 'tag'),
(2256, 'gun ban tag', 17005947130000000, 2539, 'show.alex.test2', 0, 53, 17005947130000000, b'1', 'tag'),
(2257, 'chile quake', 17005947130000000, 2539, 'show.alex.test2', 0, 54, 17005947130000000, b'1', 'tag'),
(2258, 'sot chile', 17005947130000000, 2539, 'show.alex.test2', 0, 55, 17005947130000000, b'1', 'tag'),
(2259, 'gfx chile', 17005947130000000, 2539, 'show.alex.test2', 0, 56, 17005947130000000, b'1', 'tag'),
(2260, 'bomb scare', 17005947140000000, 2539, 'show.alex.test2', 0, 57, 17005947140000000, b'1', 'tag'),
(2261, 'tease 1', 17005947140000000, 2539, 'show.alex.test2', 0, 58, 17005947140000000, b'1', 'tag'),
(2262, 't1a-', 17005947140000000, 2539, 'show.alex.test2', 0, 59, 17005947140000000, b'1', 'tag'),
(2263, 't1b-', 17005947140000000, 2539, 'show.alex.test2', 0, 60, 17005947140000000, b'1', 'tag'),
(2264, 'break one', 17005947140000000, 2539, 'show.alex.test2', 0, 61, 17005947140000000, b'1', 'tag'),
(2265, 're-open', 17005947140000000, 2539, 'show.alex.test2', 0, 62, 17005947140000000, b'1', 'tag'),
(2266, 'housing loans', 17005947140000000, 2539, 'show.alex.test2', 0, 63, 17005947140000000, b'1', 'tag'),
(2267, 'edgewater expansion', 17005947140000000, 2539, 'show.alex.test2', 0, 64, 17005947140000000, b'1', 'tag'),
(2268, 'terrorist trial', 17005947140000000, 2539, 'show.alex.test2', 0, 65, 17005947140000000, b'1', 'tag'),
(2269, 'light rail', 17005947140000000, 2539, 'show.alex.test2', 0, 66, 17005947140000000, b'1', 'tag'),
(2270, 'minipak light rail', 17005947140000000, 2539, 'show.alex.test2', 0, 67, 17005947140000000, b'1', 'tag'),
(2271, 'connector solved', 17005947140000000, 2539, 'show.alex.test2', 0, 68, 17005947140000000, b'1', 'tag'),
(2272, 't2-', 17005947150000000, 2539, 'show.alex.test2', 0, 69, 17005947150000000, b'1', 'tag'),
(2273, 't2a-', 17005947150000000, 2539, 'show.alex.test2', 0, 70, 17005947150000000, b'1', 'tag'),
(2274, 't2b-', 17005947150000000, 2539, 'show.alex.test2', 0, 71, 17005947150000000, b'1', 'tag'),
(2275, 'break two', 17005947150000000, 2539, 'show.alex.test2', 0, 72, 17005947150000000, b'1', 'tag'),
(2276, 'wx open', 17005947150000000, 2539, 'show.alex.test2', 0, 73, 17005947150000000, b'1', 'tag'),
(2277, 'wxtoss', 17005947150000000, 2539, 'show.alex.test2', 0, 74, 17005947150000000, b'1', 'tag'),
(2278, 'currents', 17005947150000000, 2539, 'show.alex.test2', 0, 75, 17005947150000000, b'1', 'tag'),
(2279, 'weather', 17005947150000000, 2539, 'show.alex.test2', 0, 76, 17005947150000000, b'1', 'tag'),
(2280, 'forecast', 17005947150000000, 2539, 'show.alex.test2', 0, 77, 17005947150000000, b'1', 'tag'),
(2281, 'movie: avatar', 17005947150000000, 2539, 'show.alex.test2', 0, 78, 17005947150000000, b'1', 'tag'),
(2282, 'copyright web', 17005947150000000, 2539, 'show.alex.test2', 0, 79, 17005947150000000, b'1', 'tag'),
(2283, 'break three', 17005947150000000, 2539, 'show.alex.test2', 0, 80, 17005947150000000, b'1', 'tag'),
(2284, 'stox', 17005947150000000, 2539, 'show.alex.test2', 0, 81, 17005947150000000, b'1', 'tag'),
(2285, 'solar starts', 17005947160000000, 2539, 'show.alex.test2', 0, 82, 17005947160000000, b'1', 'tag'),
(2286, 'mr food', 17005947160000000, 2539, 'show.alex.test2', 0, 83, 17005947160000000, b'1', 'tag'),
(2287, 'sports bump', 17005947160000000, 2539, 'show.alex.test2', 0, 84, 17005947160000000, b'1', 'tag'),
(2288, 'break four', 17005947160000000, 2539, 'show.alex.test2', 0, 85, 17005947160000000, b'1', 'tag'),
(2289, 'sports open', 17005947160000000, 2539, 'show.alex.test2', 0, 86, 17005947160000000, b'1', 'tag'),
(2290, 'olympic hockey', 17005947160000000, 2539, 'show.alex.test2', 0, 87, 17005947160000000, b'1', 'tag'),
(2291, 'badger hockey', 17005947160000000, 2539, 'show.alex.test2', 0, 88, 17005947160000000, b'1', 'tag'),
(2292, 'womens hockey', 17005947160000000, 2539, 'show.alex.test2', 0, 89, 17005947160000000, b'1', 'tag'),
(2293, 'curling', 17005947160000000, 2539, 'show.alex.test2', 0, 90, 17005947160000000, b'1', 'tag'),
(2294, 'brewers', 17005947160000000, 2539, 'show.alex.test2', 0, 91, 17005947160000000, b'1', 'tag'),
(2295, 'cubs', 17005947160000000, 2539, 'show.alex.test2', 0, 92, 17005947160000000, b'1', 'tag'),
(2296, 'tease five', 17005947160000000, 2539, 'show.alex.test2', 0, 93, 17005947160000000, b'1', 'tag'),
(2297, 't5a-', 17005947170000000, 2539, 'show.alex.test2', 0, 94, 17005947170000000, b'1', 'tag'),
(2298, 't5b-', 17005947170000000, 2539, 'show.alex.test2', 0, 95, 17005947170000000, b'1', 'tag'),
(2299, 't5c-', 17005947170000000, 2539, 'show.alex.test2', 0, 96, 17005947170000000, b'1', 'tag'),
(2300, 'break five', 17005947170000000, 2539, 'show.alex.test2', 0, 97, 17005947170000000, b'1', 'tag'),
(2301, 'recap', 17005947170000000, 2539, 'show.alex.test2', 0, 98, 17005947170000000, b'1', 'tag'),
(2302, 'r1-', 17005947170000000, 2539, 'show.alex.test2', 0, 99, 17005947170000000, b'1', 'tag'),
(2303, 'r2-', 17005947170000000, 2539, 'show.alex.test2', 0, 100, 17005947170000000, b'1', 'tag'),
(2304, 'r3-', 17005947170000000, 2539, 'show.alex.test2', 0, 101, 17005947170000000, b'1', 'tag'),
(2305, 'tonight', 17005947170000000, 2539, 'show.alex.test2', 0, 102, 17005947170000000, b'1', 'tag'),
(2306, 'kicker', 17005947170000000, 2539, 'show.alex.test2', 0, 103, 17005947170000000, b'1', 'tag'),
(2307, 'wx recap', 17005947170000000, 2539, 'show.alex.test2', 0, 104, 17005947170000000, b'1', 'tag'),
(2308, 'close', 17005947170000000, 2539, 'show.alex.test2', 0, 105, 17005947170000000, b'1', 'tag'),
(2309, 'end', 17005947180000000, 2539, 'show.alex.test2', 0, 106, 17005947180000000, b'1', 'tag'),
(2310, '', 17005947180000000, 2539, 'show.alex.test2', 0, 107, 17005947180000000, b'1', 'tag'),
(2311, '', 17005947180000000, 2539, 'show.alex.test2', 0, 108, 17005947180000000, b'1', 'tag'),
(2312, 'slug-1', 17005947180000000, 2539, 'show.alex.test2', 0, 109, 17005947180000000, b'1', 'tag'),
(2313, 'start of show', 17005947180000000, 2539, 'show.alex.test2', 0, 110, 17005947180000000, b'1', 'tag'),
(2314, 'open', 17005947180000000, 2539, 'show.alex.test2', 0, 111, 17005947180000000, b'1', 'tag'),
(2315, 'headlines', 17005947180000000, 2539, 'show.alex.test2', 0, 112, 17005947180000000, b'1', 'tag'),
(2316, 'h1-', 17005947180000000, 2539, 'show.alex.test2', 0, 113, 17005947180000000, b'1', 'tag'),
(2317, 'h2-', 17005947180000000, 2539, 'show.alex.test2', 0, 114, 17005947180000000, b'1', 'tag'),
(2318, 'h3-', 17005947180000000, 2539, 'show.alex.test2', 0, 115, 17005947180000000, b'1', 'tag'),
(2319, 'first wx', 17005947180000000, 2539, 'show.alex.test2', 0, 116, 17005947180000000, b'1', 'tag'),
(2320, 'education summit', 17005947180000000, 2539, 'show.alex.test2', 0, 117, 17005947180000000, b'1', 'tag'),
(2321, 'education live', 17005947190000000, 2539, 'show.alex.test2', 0, 118, 17005947190000000, b'1', 'tag'),
(2322, 'education tag', 17005947190000000, 2539, 'show.alex.test2', 0, 119, 17005947190000000, b'1', 'tag'),
(2323, 'education side', 17005947190000000, 2539, 'show.alex.test2', 0, 120, 17005947190000000, b'1', 'tag'),
(2324, 'grainger fire', 17005947190000000, 2539, 'show.alex.test2', 0, 121, 17005947190000000, b'1', 'tag'),
(2325, 'gun ban scotus', 17005947190000000, 2539, 'show.alex.test2', 0, 122, 17005947190000000, b'1', 'tag'),
(2326, 'live gun ban', 17005947190000000, 2539, 'show.alex.test2', 0, 123, 17005947190000000, b'1', 'tag'),
(2327, 'pkg gun ban', 17005947190000000, 2539, 'show.alex.test2', 0, 124, 17005947190000000, b'1', 'tag'),
(2328, 'gun ban tag', 17005947190000000, 2539, 'show.alex.test2', 0, 125, 17005947190000000, b'1', 'tag'),
(2329, 'chile quake', 17005947190000000, 2539, 'show.alex.test2', 0, 126, 17005947190000000, b'1', 'tag'),
(2330, 'sot chile', 17005947190000000, 2539, 'show.alex.test2', 0, 127, 17005947190000000, b'1', 'tag'),
(2331, 'gfx chile', 17005947190000000, 2539, 'show.alex.test2', 0, 128, 17005947190000000, b'1', 'tag'),
(2332, 'bomb scare', 17005947190000000, 2539, 'show.alex.test2', 0, 129, 17005947190000000, b'1', 'tag'),
(2333, 'tease 1', 17005947200000000, 2539, 'show.alex.test2', 0, 130, 17005947200000000, b'1', 'tag'),
(2334, 't1a-', 17005947200000000, 2539, 'show.alex.test2', 0, 131, 17005947200000000, b'1', 'tag'),
(2335, 't1b-alex4ever', 17005947200000000, 2539, 'show.alex.test2', 0, 132, 17005947200000000, b'1', 'tag'),
(2336, 'break one', 17005947200000000, 2539, 'show.alex.test2', 0, 133, 17005947200000000, b'1', 'tag');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ngn_inews_items`
--
ALTER TABLE `ngn_inews_items`
  ADD PRIMARY KEY (`uid`);

--
-- Indexes for table `ngn_inews_rundowns`
--
ALTER TABLE `ngn_inews_rundowns`
  ADD PRIMARY KEY (`uid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `ngn_inews_stories`
--
ALTER TABLE `ngn_inews_stories`
  ADD PRIMARY KEY (`uid`),
  ADD UNIQUE KEY `unique_rundownname_ord` (`rundownname`,`ord`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ngn_inews_items`
--
ALTER TABLE `ngn_inews_items`
  MODIFY `uid` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ngn_inews_rundowns`
--
ALTER TABLE `ngn_inews_rundowns`
  MODIFY `uid` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2771;

--
-- AUTO_INCREMENT for table `ngn_inews_stories`
--
ALTER TABLE `ngn_inews_stories`
  MODIFY `uid` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2337;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
