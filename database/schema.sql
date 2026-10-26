-- =====================================================================
-- CampusLink – Database schema
-- Tables: users, help requests/offers/sessions, teams, team sessions,
-- team signals, Lost & Found posts.
--
-- WARNING: this file DROPS and recreates the tables -> all existing data is lost.
-- Development only (npm run db:reset).
-- The database itself (DB_NAME in backend/.env) is created and selected by setup.js.
-- =====================================================================

-- Drop in reverse foreign-key order (child tables first, then parents)
DROP TABLE IF EXISTS lost_found_posts;
DROP TABLE IF EXISTS team_signals;
DROP TABLE IF EXISTS team_sessions;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS help_sessions;
DROP TABLE IF EXISTS help_offers;
DROP TABLE IF EXISTS help_requests;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------
-- users: student accounts
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(100)    NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,          -- bcrypt hash, NEVER the plain password
  major         VARCHAR(100)    NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- help_requests: help requests posted by students
-- ---------------------------------------------------------------------
CREATE TABLE help_requests (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,          -- author (request owner)
  title          VARCHAR(150)    NOT NULL,
  description    TEXT            NOT NULL,
  category       ENUM('programming', 'math', 'writing', 'campus_life', 'other') NOT NULL,
  support_mode   ENUM('in_person', 'online') NOT NULL,
  location_label VARCHAR(150)    NULL,              -- general location, in-person help only
  scheduled_at   DATETIME        NULL,              -- expected time, may not be set yet
  status         ENUM('open', 'matched', 'completed', 'cancelled') NOT NULL DEFAULT 'open',
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- RESTRICT: v1 has no account deletion, so block deleting a user
  -- who still has requests rather than silently losing history.
  CONSTRAINT fk_help_requests_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  -- Indexes for columns commonly filtered/sorted on the list page
  KEY idx_help_requests_status_created (status, created_at),
  KEY idx_help_requests_category (category),
  KEY idx_help_requests_scheduled (scheduled_at),
  KEY idx_help_requests_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- help_offers: a student offering to help with someone else's request
-- ---------------------------------------------------------------------
CREATE TABLE help_offers (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  help_request_id  BIGINT UNSIGNED NOT NULL,
  helper_user_id   BIGINT UNSIGNED NOT NULL,         -- who sent the offer
  message          VARCHAR(1000)   NOT NULL,
  preferred_mode   ENUM('in_person', 'online') NOT NULL,
  -- pending: waiting for the owner | accepted | declined | withdrawn: sender took it back
  -- closed: no longer considered (another offer was accepted or the request was cancelled)
  status           ENUM('pending', 'accepted', 'declined', 'withdrawn', 'closed') NOT NULL DEFAULT 'pending',
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Equals helper_user_id while the offer is still active (pending/accepted), otherwise NULL.
  -- The UNIQUE key below then allows only ONE active offer per helper per request,
  -- while still allowing a new offer after a withdrawn/declined/closed one (NULLs never clash).
  active_helper_id BIGINT UNSIGNED AS (IF(status IN ('pending', 'accepted'), helper_user_id, NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_help_offers_one_active (help_request_id, active_helper_id),
  KEY idx_help_offers_request_status (help_request_id, status),
  KEY idx_help_offers_helper (helper_user_id, created_at),
  -- No CASCADE: MySQL doesn't allow it on columns used by a stored generated column,
  -- and offers are history we don't want deleted silently anyway.
  CONSTRAINT fk_help_offers_request FOREIGN KEY (help_request_id) REFERENCES help_requests (id),
  CONSTRAINT fk_help_offers_helper  FOREIGN KEY (helper_user_id)  REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- help_sessions: created when the request owner accepts an offer
-- ---------------------------------------------------------------------
CREATE TABLE help_sessions (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  help_request_id   BIGINT UNSIGNED NOT NULL,
  help_offer_id     BIGINT UNSIGNED NOT NULL,        -- the accepted offer
  requester_user_id BIGINT UNSIGNED NOT NULL,        -- request owner
  helper_user_id    BIGINT UNSIGNED NOT NULL,
  mode              ENUM('in_person', 'online') NOT NULL,
  scheduled_at      DATETIME        NULL,
  location_label    VARCHAR(150)    NULL,
  status            ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  -- A change to mode/time/place suggested by one participant, waiting for the other to accept.
  -- All proposed_* columns are NULL when there is no pending proposal.
  proposed_by_user_id     BIGINT UNSIGNED NULL,
  proposed_mode           ENUM('in_person', 'online') NULL,
  proposed_scheduled_at   DATETIME        NULL,
  proposed_location_label VARCHAR(150)    NULL,
  proposed_at             DATETIME        NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_help_sessions_offer (help_offer_id), -- one session per accepted offer
  KEY idx_help_sessions_request (help_request_id),
  KEY idx_help_sessions_requester (requester_user_id, created_at),
  KEY idx_help_sessions_helper (helper_user_id, created_at),
  CONSTRAINT fk_help_sessions_request   FOREIGN KEY (help_request_id)   REFERENCES help_requests (id),
  CONSTRAINT fk_help_sessions_offer     FOREIGN KEY (help_offer_id)     REFERENCES help_offers (id),
  CONSTRAINT fk_help_sessions_requester FOREIGN KEY (requester_user_id) REFERENCES users (id),
  CONSTRAINT fk_help_sessions_helper    FOREIGN KEY (helper_user_id)    REFERENCES users (id),
  CONSTRAINT fk_help_sessions_proposer  FOREIGN KEY (proposed_by_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- teams: study groups. v1 only has public teams anyone can join.
-- ---------------------------------------------------------------------
CREATE TABLE teams (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,          -- the single source of truth for who owns the team
  name          VARCHAR(100)    NOT NULL,
  description   VARCHAR(1000)   NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_teams_created (created_at),
  CONSTRAINT fk_teams_owner FOREIGN KEY (owner_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- team_members: who belongs to which team (the owner is also a member)
-- ---------------------------------------------------------------------
CREATE TABLE team_members (
  team_id   BIGINT UNSIGNED NOT NULL,
  user_id   BIGINT UNSIGNED NOT NULL,
  joined_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),                  -- a user can join a team only once
  KEY idx_team_members_user (user_id),             -- "teams I'm in"
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- team_sessions: study sessions / events organised inside a team
-- ---------------------------------------------------------------------
CREATE TABLE team_sessions (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_id            BIGINT UNSIGNED NOT NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  title              VARCHAR(150)    NOT NULL,
  description        VARCHAR(2000)   NULL,
  starts_at          DATETIME        NOT NULL,
  ends_at            DATETIME        NOT NULL,
  location_label     VARCHAR(150)    NULL,
  status             ENUM('scheduled', 'cancelled') NOT NULL DEFAULT 'scheduled', -- "past" is worked out from ends_at
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team_sessions_team_start (team_id, starts_at),
  CONSTRAINT chk_team_sessions_times CHECK (ends_at > starts_at),
  CONSTRAINT fk_team_sessions_team    FOREIGN KEY (team_id)            REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_sessions_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- team_signals: short-lived "come meet us here" invitations to team members
-- A signal is active while cancelled_at IS NULL AND expires_at > NOW().
-- ---------------------------------------------------------------------
CREATE TABLE team_signals (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_id        BIGINT UNSIGNED NOT NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  message        VARCHAR(280)    NOT NULL,
  location_label VARCHAR(150)    NOT NULL,
  expires_at     DATETIME        NOT NULL,
  cancelled_at   DATETIME        NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team_signals_team_expires (team_id, expires_at),
  CONSTRAINT fk_team_signals_team   FOREIGN KEY (team_id)        REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_signals_sender FOREIGN KEY (sender_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- lost_found_posts: lost or found items on campus
-- Its categories are separate from help request categories.
-- ---------------------------------------------------------------------
CREATE TABLE lost_found_posts (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  post_type      ENUM('lost', 'found') NOT NULL,
  title          VARCHAR(150)    NOT NULL,
  description    VARCHAR(2000)   NOT NULL,
  category       ENUM('electronics', 'wallets_bags', 'keys', 'cards_ids', 'clothing', 'books_stationery', 'other') NOT NULL,
  location_label VARCHAR(150)    NOT NULL,          -- general area only, e.g. "Library, 2nd floor"
  occurred_at    DATETIME        NULL,              -- when it was lost/found, if known
  image_url      VARCHAR(500)    NULL,
  -- Only stored when the poster explicitly chose to share it on the post (opt-in)
  contact_info   VARCHAR(150)    NULL,
  -- open: still needs attention | resolved: item returned | closed: stopped without being resolved
  status         ENUM('open', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lost_found_status_created (status, created_at),
  KEY idx_lost_found_type (post_type),
  KEY idx_lost_found_category (category),
  KEY idx_lost_found_user (user_id),
  CONSTRAINT fk_lost_found_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;
