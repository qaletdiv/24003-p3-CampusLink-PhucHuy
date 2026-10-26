-- =====================================================================
-- CampusLink – Sample data for development
-- Every sample account's password: Password123
-- (the password_hash below is the bcrypt hash of that string)
-- =====================================================================

USE campuslink_db;

INSERT INTO users (id, full_name, email, password_hash, major) VALUES
  (1, 'Nguyen Van An',  'an@student.test',   '$2b$10$hBZnqM.7HgHqltP1Z1y2dejV8DltCYkOvhJMRyVZeCbasGvts2N0m', 'Information Technology'),
  (2, 'Tran Thi Binh',  'binh@student.test', '$2b$10$hBZnqM.7HgHqltP1Z1y2dejV8DltCYkOvhJMRyVZeCbasGvts2N0m', 'Applied Mathematics'),
  (3, 'Le Minh Chau',   'chau@student.test', '$2b$10$hBZnqM.7HgHqltP1Z1y2dejV8DltCYkOvhJMRyVZeCbasGvts2N0m', NULL);

INSERT INTO help_requests
  (user_id, title, description, category, support_mode, location_label, scheduled_at, status, created_at)
VALUES
  (1, 'Need help debugging an Express route that returns 404',
      'I''m working on an Express assignment and POST /api/items always returns 404 even though the route is declared. Looking for someone to take a look for about 30 minutes.',
      'programming', 'in_person', 'Library, 2nd floor', NOW() + INTERVAL 1 DAY, 'open', NOW() - INTERVAL 1 HOUR),
  (2, 'Review integration by parts before the midterm',
      'I''m still unsure how to choose u and dv for integration by parts. Would love someone to walk through a few examples.',
      'math', 'online', NULL, NOW() + INTERVAL 2 DAY, 'open', NOW() - INTERVAL 3 HOUR),
  (3, 'Feedback on the structure of my English essay',
      'About 800 words. Need someone to read it and comment on the structure of the introduction and conclusion.',
      'writing', 'online', NULL, NULL, 'open', NOW() - INTERVAL 5 HOUR),
  (1, 'How do I book a group study room?',
      'Does anyone know how to book a study room for a group of 5 in Building B?',
      'campus_life', 'in_person', 'Building B', NULL, 'open', NOW() - INTERVAL 1 DAY),
  (2, 'Explain JOINs in MySQL',
      'I keep mixing up INNER JOIN and LEFT JOIN. Looking for someone to explain with a real example.',
      'programming', 'online', NULL, NOW() + INTERVAL 3 DAY, 'matched', NOW() - INTERVAL 2 DAY),
  (3, 'Looking for a presentation practice partner',
      'I''m presenting for Soft Skills class next week and need someone to listen and give feedback.',
      'other', 'in_person', 'Building A lobby', NOW() - INTERVAL 1 DAY, 'completed', NOW() - INTERVAL 4 DAY),
  (1, 'Linear algebra: eigenvalues and eigenvectors',
      'Our lecture went too fast on eigenvalues. Looking for someone to go through two homework problems with me.',
      'math', 'in_person', 'Building C, room 204', NOW() + INTERVAL 4 DAY, 'open', NOW() - INTERVAL 6 HOUR),
  (2, 'Help setting up Git and pushing to GitHub',
      'I keep getting "permission denied (publickey)" when I push. Need someone to help me set up SSH keys.',
      'programming', 'online', NULL, NOW() + INTERVAL 5 HOUR, 'open', NOW() - INTERVAL 8 HOUR),
  (3, 'Proofreading a scholarship application letter',
      'One-page motivation letter, due Friday. Looking for someone to check grammar and tone.',
      'writing', 'online', NULL, NOW() + INTERVAL 2 DAY, 'open', NOW() - INTERVAL 10 HOUR),
  (1, 'Where to print posters on campus?',
      'Need to print an A1 poster for a club event. Which place on campus is cheapest and fastest?',
      'campus_life', 'in_person', 'Student center', NULL, 'open', NOW() - INTERVAL 12 HOUR),
  (2, 'Understanding recursion in Python',
      'I understand loops but recursion still confuses me. Would like a 1-hour session with examples like factorial and tree traversal.',
      'programming', 'in_person', 'Library, group room 3', NOW() + INTERVAL 6 DAY, 'open', NOW() - INTERVAL 1 DAY - INTERVAL 2 HOUR),
  (3, 'Statistics: when to use a t-test vs. a z-test',
      'Preparing for the statistics quiz and confused about which test to use. Online call is fine.',
      'math', 'online', NULL, NOW() + INTERVAL 1 DAY + INTERVAL 3 HOUR, 'open', NOW() - INTERVAL 1 DAY - INTERVAL 5 HOUR),
  (1, 'Citation format for a research report (APA 7)',
      'Not sure how to cite websites and lecture slides in APA 7. Quick review of my reference list would help a lot.',
      'writing', 'online', NULL, NULL, 'open', NOW() - INTERVAL 2 DAY - INTERVAL 1 HOUR),
  (2, 'Looking for a running buddy before morning classes',
      'Want to start running around campus at 6am, three times a week. Anyone interested?',
      'other', 'in_person', 'Main gate', NOW() + INTERVAL 2 DAY, 'open', NOW() - INTERVAL 3 DAY),
  (3, 'Help with CSS Flexbox layout',
      'My navbar items won''t align properly on mobile. Can someone look at my CSS?',
      'programming', 'online', NULL, NOW() + INTERVAL 1 DAY, 'cancelled', NOW() - INTERVAL 5 DAY);

-- Offers and sessions. Request ids follow the insert order above:
-- 1 = An's Express question (open), 5 = Binh's JOIN question (matched), 6 = Chau's presentation (completed)
INSERT INTO help_offers (id, help_request_id, helper_user_id, message, preferred_mode, status, created_at) VALUES
  (1, 1, 2, 'I ran into the same 404 last week – it was the router mount path. Happy to look at your code.', 'in_person', 'pending', NOW() - INTERVAL 30 MINUTE),
  (2, 1, 3, 'I can help over a video call tonight if that works for you.', 'online', 'pending', NOW() - INTERVAL 20 MINUTE),
  (3, 5, 1, 'I just finished a database course, I can walk you through JOINs with diagrams.', 'online', 'accepted', NOW() - INTERVAL 1 DAY),
  (4, 5, 3, 'I can explain JOINs with a small example database.', 'online', 'closed', NOW() - INTERVAL 1 DAY),
  (5, 6, 2, 'I can listen to your presentation and give feedback.', 'in_person', 'accepted', NOW() - INTERVAL 3 DAY);

INSERT INTO help_sessions
  (help_request_id, help_offer_id, requester_user_id, helper_user_id, mode, scheduled_at, location_label, status, created_at)
VALUES
  (5, 3, 2, 1, 'online', NOW() + INTERVAL 3 DAY, NULL, 'scheduled', NOW() - INTERVAL 20 HOUR),
  (6, 5, 3, 2, 'in_person', NOW() - INTERVAL 1 DAY, 'Building A lobby', 'completed', NOW() - INTERVAL 3 DAY);

-- An (helper in session 1) suggests meeting in person instead; Binh hasn't answered yet
UPDATE help_sessions
   SET proposed_by_user_id = 1, proposed_mode = 'in_person',
       proposed_scheduled_at = NOW() + INTERVAL 2 DAY, proposed_location_label = 'Library, group room 2',
       proposed_at = NOW() - INTERVAL 2 HOUR
 WHERE id = 1;

-- Teams: 1 = Web Dev (An owns; An, Binh) · 2 = Calculus (Binh owns; Binh, Chau)
--        3 = Morning Runners (Chau owns; Chau) · 4 = Writing Circle (Chau owns; Chau, An)
INSERT INTO teams (id, owner_user_id, name, description, created_at) VALUES
  (1, 1, 'Web Dev Study Group', 'We learn Node.js, Express and MySQL together. Weekly coding sessions in the library and code reviews for each other''s assignments.', NOW() - INTERVAL 20 DAY),
  (2, 2, 'Calculus II Crew', 'Working through problem sets before each deadline. All levels welcome – we explain things to each other.', NOW() - INTERVAL 15 DAY),
  (3, 3, 'Morning Runners', 'Easy 5 km runs around campus before class. No pace pressure.', NOW() - INTERVAL 10 DAY),
  (4, 3, 'English Writing Circle', 'Peer feedback on essays and reports. Bring a draft, leave with better structure.', NOW() - INTERVAL 5 DAY);

INSERT INTO team_members (team_id, user_id, joined_at) VALUES
  (1, 1, NOW() - INTERVAL 20 DAY), (1, 2, NOW() - INTERVAL 12 DAY),
  (2, 2, NOW() - INTERVAL 15 DAY), (2, 3, NOW() - INTERVAL 9 DAY),
  (3, 3, NOW() - INTERVAL 10 DAY),
  (4, 3, NOW() - INTERVAL 5 DAY),  (4, 1, NOW() - INTERVAL 2 DAY);

INSERT INTO team_sessions (team_id, created_by_user_id, title, description, starts_at, ends_at, location_label, status) VALUES
  (1, 1, 'Express routing workshop', 'Hands-on: routers, middleware and error handling. Bring your laptop.', NOW() + INTERVAL 2 DAY, NOW() + INTERVAL 2 DAY + INTERVAL 2 HOUR, 'Library, group room 3', 'scheduled'),
  (1, 2, 'SQL JOIN practice', 'We solve 10 JOIN exercises together.', NOW() + INTERVAL 5 DAY, NOW() + INTERVAL 5 DAY + INTERVAL 90 MINUTE, 'Building C, room 204', 'scheduled'),
  (1, 1, 'Git basics', 'Branches, commits and pull requests.', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY + INTERVAL 1 HOUR, 'Library, group room 3', 'scheduled'),
  (2, 2, 'Problem set 4 review', NULL, NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY + INTERVAL 2 HOUR, 'Building C, room 101', 'scheduled');

INSERT INTO team_signals (team_id, sender_user_id, message, location_label, expires_at, created_at) VALUES
  (1, 2, 'Grabbed a big table at the library café – come code with us!', 'Library café', NOW() + INTERVAL 45 MINUTE, NOW() - INTERVAL 15 MINUTE),
  (1, 1, 'Anyone around for lunch?', 'Main canteen', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY - INTERVAL 1 HOUR);

INSERT INTO lost_found_posts
  (user_id, post_type, title, description, category, location_label, occurred_at, image_url, contact_info, status, created_at)
VALUES
  (2, 'lost', 'Black water bottle with stickers', 'Black metal bottle with a NASA sticker and a small dent on the lid.', 'other', 'Library, 2nd floor', NOW() - INTERVAL 1 DAY, NULL, NULL, 'open', NOW() - INTERVAL 20 HOUR),
  (1, 'found', 'Set of keys on a blue lanyard', 'Three keys and a small bike lock key on a blue university lanyard. Describe the keychain to claim them.', 'keys', 'Building C, near room 204', NOW() - INTERVAL 5 HOUR, NULL, 'Message me via an@student.test', 'open', NOW() - INTERVAL 4 HOUR),
  (3, 'lost', 'Grey laptop charger (USB-C, 65W)', 'Left it plugged in at a study desk. Has my initials L.M.C. written on the plug.', 'electronics', 'Library, silent study area', NOW() - INTERVAL 2 DAY, NULL, NULL, 'open', NOW() - INTERVAL 2 DAY),
  (2, 'found', 'Calculus textbook', 'Stewart Calculus, 8th edition, with some notes inside the cover.', 'books_stationery', 'Main canteen', NOW() - INTERVAL 3 DAY, NULL, NULL, 'resolved', NOW() - INTERVAL 3 DAY),
  (1, 'lost', 'Navy hoodie', 'Plain navy hoodie, size M.', 'clothing', 'Sports hall changing room', NULL, NULL, NULL, 'closed', NOW() - INTERVAL 12 DAY),
  (3, 'found', 'Student ID card', 'Found a student ID card. To protect the owner, details are not posted – describe it to claim.', 'cards_ids', 'Building A lobby', NOW() - INTERVAL 6 HOUR, NULL, NULL, 'open', NOW() - INTERVAL 6 HOUR);
