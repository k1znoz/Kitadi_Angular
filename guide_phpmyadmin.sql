-- ============================================================
-- Kitadi Energies - Guide SQL pour phpMyAdmin (MySQL/MariaDB)
-- Date: 2026-03-03
-- Objectif: script UNIQUE (initialisation complète + mises à jour du schéma)
-- Utilisation: importer ce fichier une seule fois dans phpMyAdmin
-- ============================================================

-- 1) Créer la base
CREATE DATABASE IF NOT EXISTS kitadi_energies
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kitadi_energies;

-- 2) Supprimer les tables si tu veux rejouer le script de zéro
--    (décommente les lignes ci-dessous si nécessaire)
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS pieces;
-- DROP TABLE IF EXISTS maisons;
-- DROP TABLE IF EXISTS rapports;
-- DROP TABLE IF EXISTS clients;
-- SET FOREIGN_KEY_CHECKS = 1;

-- 3) Table clients (équivalent de ClientDatabaseService)
CREATE TABLE IF NOT EXISTS clients (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(120) NOT NULL,
  prenom VARCHAR(120) NOT NULL DEFAULT '',
  numero VARCHAR(20) NOT NULL DEFAULT '',
  rue VARCHAR(255) NOT NULL DEFAULT '',
  ref VARCHAR(50) NOT NULL,
  date_dossier DATE NULL,
  ville VARCHAR(120) NOT NULL,
  cp VARCHAR(20) NOT NULL,
  tel VARCHAR(30) NOT NULL DEFAULT '',
  mail VARCHAR(190) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clients_ref (ref),
  KEY idx_clients_nom_prenom (nom, prenom),
  KEY idx_clients_ville_cp (ville, cp)
) ENGINE=InnoDB;

-- 4) Table maisons (1 maison par client)
CREATE TABLE IF NOT EXISTS maisons (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id INT UNSIGNED NOT NULL,
  isolation VARCHAR(120) NOT NULL DEFAULT '',
  temperature_base DECIMAL(6,2) NOT NULL DEFAULT 0,
  hauteur_sous_plafond DECIMAL(6,2) NOT NULL DEFAULT 0,
  nombre_pieces INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_maisons_client (client_id),
  CONSTRAINT fk_maisons_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5) Table pieces (plusieurs pièces pour une maison)
CREATE TABLE IF NOT EXISTS pieces (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  maison_id INT UNSIGNED NOT NULL,
  piece_index INT UNSIGNED NOT NULL,
  nom VARCHAR(120) NOT NULL DEFAULT '',
  longueur DECIMAL(8,2) NOT NULL DEFAULT 0,
  largeur DECIMAL(8,2) NOT NULL DEFAULT 0,
  hauteur DECIMAL(8,2) NOT NULL DEFAULT 0,
  temperature_confort DECIMAL(6,2) NOT NULL DEFAULT 0,
  delta_t DECIMAL(6,2) NOT NULL DEFAULT 0,
  puissance DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pieces_maison_pieceindex (maison_id, piece_index),
  KEY idx_pieces_nom (nom),
  CONSTRAINT fk_pieces_maison
    FOREIGN KEY (maison_id) REFERENCES maisons(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6) Table rapports (historique des exports, lié aux clients)
CREATE TABLE IF NOT EXISTS rapports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id INT UNSIGNED NOT NULL,
  ref_dossier VARCHAR(50) NOT NULL,
  isolation VARCHAR(120) NOT NULL DEFAULT '',
  temperature_base DECIMAL(6,2) NOT NULL DEFAULT 0,
  hauteur_sous_plafond DECIMAL(6,2) NOT NULL DEFAULT 0,
  nombre_pieces INT UNSIGNED NOT NULL DEFAULT 1,
  puissance_totale DECIMAL(12,2) NOT NULL DEFAULT 0,
  pieces_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rapports_client (client_id),
  KEY idx_rapports_ref (ref_dossier),
  CONSTRAINT fk_rapports_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7) Vue de synthèse (optionnelle) pour affichage type BDD/Rapport
CREATE OR REPLACE VIEW v_dossiers AS
SELECT
  c.id AS client_id,
  c.ref,
  c.nom,
  c.prenom,
  c.date_dossier,
  c.ville,
  c.cp,
  m.id AS maison_id,
  m.isolation,
  m.temperature_base,
  m.hauteur_sous_plafond,
  m.nombre_pieces,
  COALESCE(SUM(p.puissance), 0) AS puissance_totale
FROM clients c
LEFT JOIN maisons m ON m.client_id = c.id
LEFT JOIN pieces p ON p.maison_id = m.id
GROUP BY
  c.id, c.ref, c.nom, c.prenom, c.date_dossier, c.ville, c.cp,
  m.id, m.isolation, m.temperature_base, m.hauteur_sous_plafond, m.nombre_pieces;

-- 8) Exemples d'insert (facultatif)
-- INSERT INTO clients (nom, prenom, numero, rue, ref, date_dossier, ville, cp, tel, mail)
-- VALUES ('DUPONT', 'Jean', '12', 'Rue de Paris', '030326JD', '2026-03-03', 'Lille', '59000', '0612345678', 'jean.dupont@mail.com');
--
-- INSERT INTO maisons (client_id, isolation, temperature_base, hauteur_sous_plafond, nombre_pieces)
-- VALUES (1, 'Moyenne', -7, 2.5, 5);
--
-- INSERT INTO pieces (maison_id, piece_index, nom, longueur, largeur, hauteur, temperature_confort, delta_t, puissance)
-- VALUES (1, 1, 'Salon', 5.2, 4.1, 2.5, 20, 27, 1438.2);

-- Fin du script
