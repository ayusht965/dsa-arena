-- 1. users table
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(255)    UNIQUE NOT NULL,
    password    VARCHAR(255)    NOT NULL,          -- we'll store bcrypt hash here
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- 2. groups table
CREATE TABLE IF NOT EXISTS groups (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    admin_id    INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- 3. group_members (which users are in which groups)
CREATE TABLE IF NOT EXISTS group_members (
    group_id    INTEGER         NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id     INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

-- 4. problems (DSA problems)
CREATE TABLE IF NOT EXISTS problems (
    id              SERIAL          PRIMARY KEY,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            NOT NULL,
    examples        TEXT,                           -- can be JSON string or plain text for now
    constraints     TEXT,                           -- can be multiline or JSON later
    created_by      INTEGER         REFERENCES users(id),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- 5. group_problems (which problems belong to which group)
CREATE TABLE IF NOT EXISTS group_problems (
    group_id        INTEGER         NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    problem_id      INTEGER         NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, problem_id)
);

-- 6. user_problem_progress (user's status & score per problem)
CREATE TABLE IF NOT EXISTS user_problem_progress (
    user_id         INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id      INTEGER         NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    group_id        INTEGER         REFERENCES groups(id) ON DELETE SET NULL,
    status          VARCHAR(30)     DEFAULT 'assigned'
                                    CHECK (status IN ('assigned', 'started', 'submitted', 'solved')),
    points_earned   INTEGER         DEFAULT 0,      -- admin will set this manually
    time_spent_sec  INTEGER         DEFAULT 0,
    solved_at       TIMESTAMP,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, problem_id)
);

-- Optional: add some comments for clarity
COMMENT ON TABLE groups IS 'Coding/DSA practice groups';
COMMENT ON TABLE group_members IS 'Membership between users and groups';
COMMENT ON TABLE group_problems IS 'Problems assigned to a group';
COMMENT ON TABLE user_problem_progress IS 'Per-user progress and manual score per problem';

CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  time_spent INTEGER DEFAULT 0, -- in minutes
  notes TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, problem_id)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_problem ON user_progress(problem_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);

-- Add joined_at to group_members if not exists
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

COMMENT ON TABLE user_progress IS 'Tracks individual user progress on problems';
COMMENT ON COLUMN user_progress.time_spent IS 'Time spent in minutes';
COMMENT ON COLUMN user_progress.status IS 'not_started, in_progress, or completed';

ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS platform_link VARCHAR(500);

COMMENT ON COLUMN problems.platform_link IS 'Link to the problem on external platform (LeetCode, HackerRank, etc.)';


-- Migration: Add soft delete support

-- Add deleted_at to groups
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add deleted_at to problems
ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at);
CREATE INDEX IF NOT EXISTS idx_problems_deleted_at ON problems(deleted_at);

COMMENT ON COLUMN groups.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN problems.deleted_at IS 'Soft delete timestamp - NULL means active';