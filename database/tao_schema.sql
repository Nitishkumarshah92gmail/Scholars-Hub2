-- ============================================================================
-- Scholars Hub: Facebook TAO (The Association and Object) Graph Schema
-- ============================================================================

-- 1. Objects Table (Nodes in the Graph)
CREATE TABLE IF NOT EXISTS tao_objects (
    id BIGSERIAL PRIMARY KEY,
    otype INT NOT NULL,              -- 1=User, 2=Post, 3=Comment, 4=Playlist
    version INT NOT NULL DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast type scanning
CREATE INDEX IF NOT EXISTS idx_tao_objects_otype ON tao_objects (otype, created_at DESC);

-- 2. Associations Table (Directed Edges in the Graph)
CREATE TABLE IF NOT EXISTS tao_associations (
    id1 BIGINT NOT NULL,             -- Source Object ID (e.g. User ID)
    atype INT NOT NULL,              -- 101=FOLLOWS, 102=LIKES, 103=AUTHORED, 104=COMMENTED
    id2 BIGINT NOT NULL,             -- Target Object ID (e.g. Post ID, Target User ID)
    weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id1, atype, id2)
);

-- Primary Range Index: Forward traversal (e.g., Posts created by User, Users followed by User)
CREATE INDEX IF NOT EXISTS idx_tao_assoc_forward 
    ON tao_associations (id1, atype, created_at DESC);

-- Secondary Range Index: Reverse traversal (e.g., Likes on a Post, Followers of a User)
CREATE INDEX IF NOT EXISTS idx_tao_assoc_reverse 
    ON tao_associations (id2, atype, created_at DESC);

-- 3. Association Counts Table (Cached Edge Counts for O(1) Reads)
CREATE TABLE IF NOT EXISTS tao_association_counts (
    id1 BIGINT NOT NULL,
    atype INT NOT NULL,
    count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id1, atype)
);

-- 4. Automatic Edge Count Maintenance Trigger
CREATE OR REPLACE FUNCTION maintain_tao_assoc_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO tao_association_counts (id1, atype, count, updated_at)
        VALUES (NEW.id1, NEW.atype, 1, NOW())
        ON CONFLICT (id1, atype) 
        DO UPDATE SET count = tao_association_counts.count + 1, updated_at = NOW();
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE tao_association_counts 
        SET count = GREATEST(0, count - 1), updated_at = NOW()
        WHERE id1 = OLD.id1 AND atype = OLD.atype;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tao_assoc_count ON tao_associations;
CREATE TRIGGER trg_tao_assoc_count
AFTER INSERT OR DELETE ON tao_associations
FOR EACH ROW EXECUTE FUNCTION maintain_tao_assoc_count();
