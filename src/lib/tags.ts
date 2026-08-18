import { prisma } from "./prisma";
import type { Tag } from "./types";

type TagClient = {
  mediaAsset: typeof prisma.mediaAsset;
  mediaAssetTag: typeof prisma.mediaAssetTag;
  tag: typeof prisma.tag;
};

export function normalizeTagName(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function tagSlug(input: string) {
  return normalizeTagName(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function parseTagNames(value: FormDataEntryValue | string | null | undefined) {
  return uniqueTagNames(
    String(value || "")
      .split(",")
      .map(normalizeTagName)
      .filter(Boolean),
  );
}

export function uniqueTagNames(names: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const name of names.map(normalizeTagName).filter(Boolean)) {
    const slug = tagSlug(name);

    if (!slug || seen.has(slug)) {
      continue;
    }

    seen.add(slug);
    unique.push(name);
  }

  return unique.sort((a, b) => a.localeCompare(b));
}

function mapTag(tag: {
  _count?: { mediaAssets: number };
  archivedAt: Date | null;
  category: string | null;
  createdAt: Date;
  description: string | null;
  id: string;
  name: string;
  slug: string;
  updatedAt: Date;
}): Tag {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    category: tag.category ?? undefined,
    description: tag.description ?? undefined,
    archivedAt: tag.archivedAt?.toISOString(),
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
    usageCount: tag._count?.mediaAssets ?? 0,
  };
}

export async function listTags(includeArchived = false) {
  const tags = await prisma.tag.findMany({
    where: includeArchived ? undefined : { archivedAt: null },
    include: {
      _count: {
        select: { mediaAssets: true },
      },
    },
    orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
  });

  return tags.map(mapTag);
}

export async function ensureTags(client: TagClient, names: string[]) {
  const uniqueNames = uniqueTagNames(names);
  const tags = [];

  for (const name of uniqueNames) {
    const slug = tagSlug(name);

    if (!slug) {
      continue;
    }

    tags.push(
      await client.tag.upsert({
        where: { slug },
        update: {
          archivedAt: null,
          name,
        },
        create: {
          id: crypto.randomUUID(),
          name,
          slug,
        },
      }),
    );
  }

  return tags;
}

export async function syncMediaTags(
  client: TagClient,
  mediaAssetId: string,
  names: string[],
) {
  const tags = await ensureTags(client, names);
  const canonicalNames = tags.map((tag) => tag.name).sort((a, b) => a.localeCompare(b));

  await client.mediaAssetTag.deleteMany({
    where: { mediaAssetId },
  });

  if (tags.length > 0) {
    await client.mediaAssetTag.createMany({
      data: tags.map((tag) => ({
        mediaAssetId,
        tagId: tag.id,
      })),
      skipDuplicates: true,
    });
  }

  await client.mediaAsset.update({
    where: { id: mediaAssetId },
    data: { tags: canonicalNames },
  });

  return canonicalNames;
}
