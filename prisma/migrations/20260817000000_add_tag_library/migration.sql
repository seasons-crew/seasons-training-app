-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAssetTag" (
    "mediaAssetId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAssetTag_pkey" PRIMARY KEY ("mediaAssetId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_archivedAt_idx" ON "Tag"("archivedAt");

-- CreateIndex
CREATE INDEX "MediaAssetTag_tagId_idx" ON "MediaAssetTag"("tagId");

-- Backfill canonical tags from existing MediaAsset.tags.
WITH raw_tags AS (
    SELECT DISTINCT btrim(tag) AS "name"
    FROM "MediaAsset", unnest("tags") AS tag
    WHERE btrim(tag) <> ''
),
normalized_tags AS (
    SELECT DISTINCT ON ("slug")
        "name",
        "slug"
    FROM (
        SELECT
            "name",
            lower(
                regexp_replace(
                    regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'),
                    '(^-|-$)',
                    '',
                    'g'
                )
            ) AS "slug"
        FROM raw_tags
    ) AS normalized_base
    ORDER BY "slug", "name"
)
INSERT INTO "Tag" ("id", "name", "slug", "updatedAt")
SELECT 'tag-' || "slug", "name", "slug", CURRENT_TIMESTAMP
FROM normalized_tags
WHERE "slug" <> ''
ON CONFLICT ("slug") DO NOTHING;

-- Backfill media/tag joins from existing MediaAsset.tags.
WITH raw_media_tags AS (
    SELECT
        "MediaAsset"."id" AS "mediaAssetId",
        lower(
            regexp_replace(
                regexp_replace(btrim(tag), '[^a-zA-Z0-9]+', '-', 'g'),
                '(^-|-$)',
                '',
                'g'
            )
        ) AS "slug"
    FROM "MediaAsset", unnest("tags") AS tag
    WHERE btrim(tag) <> ''
)
INSERT INTO "MediaAssetTag" ("mediaAssetId", "tagId")
SELECT raw_media_tags."mediaAssetId", "Tag"."id"
FROM raw_media_tags
JOIN "Tag" ON "Tag"."slug" = raw_media_tags."slug"
ON CONFLICT DO NOTHING;

-- AddForeignKey
ALTER TABLE "MediaAssetTag" ADD CONSTRAINT "MediaAssetTag_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetTag" ADD CONSTRAINT "MediaAssetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
