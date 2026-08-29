// FIXTURE REVISIONS — one episode, exactly as the feed lister emits it today.
//
// The shapes below are transcribed from the media-feeds primitives that produce
// the agent's `episodes` rows: the podcast lister and the YouTube lister. `id`,
// `title` and `mediaUrl` are always present; `link`, `description`,
// `publishedAt` and `duration` appear only when the source provides them, and
// `duration` only ever comes from a podcast feed. Nothing here is invented: a
// field this fixture omits is a field the agent itself can omit.

import type { ArtifactRendererProps } from "../src/artifact-renderer-props";
import type { ArtifactContentProjection } from "../src/artifact-content-channel";

export const REVISION_ID = "rev-episode-1";

/** A podcast episode carrying every optional field the feed can supply. */
export const PODCAST_EPISODE = {
  id: "ep-8f2c",
  title: "The one about feeds",
  link: "https://example.com/episodes/the-one-about-feeds",
  mediaUrl: "https://cdn.example.com/audio/the-one-about-feeds.mp3",
  description: "A conversation about how feeds are discovered and read.",
  publishedAt: "2026-02-14T09:00:00.000Z",
  duration: "00:42:17",
};

/** A YouTube episode: no duration, as that lister never emits one. */
export const YOUTUBE_EPISODE = {
  id: "ytc-9931",
  title: "Building a feed reader",
  link: "https://www.youtube.com/watch?v=ytc9931",
  mediaUrl: "https://www.youtube.com/watch?v=ytc9931",
  description: "A walkthrough of the reader.",
  publishedAt: "2026-01-03T18:30:00.000Z",
};

/** The barest episode the primitive contract still guarantees. */
export const MINIMAL_EPISODE = {
  id: "ep-min",
  title: "A minimal episode",
  mediaUrl: "https://cdn.example.com/audio/min.mp3",
};

type TextProjection = Extract<ArtifactContentProjection, { kind: "text" }>;

/** A pinned text projection over the JSON of one episode — the shape the host
 * builds for an `application/json` file revision. */
export function textProjection(
  value: unknown,
  overrides: Partial<TextProjection> = {},
): ArtifactContentProjection {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const byteLength = new TextEncoder().encode(text).length;
  const projection: TextProjection = {
    kind: "text",
    channelVersion: 1,
    representationRevisionId: REVISION_ID,
    text,
    encoding: "utf-8",
    byteLength,
    projectedByteLength: byteLength,
    cap: 1_000_000,
    truncated: false,
  };
  return { ...projection, ...overrides };
}

/** A host-shaped renderer snapshot. Pass `null` for a projection that is
 * explicitly absent and `undefined` for one the host never attached at all. */
export function props(
  content: ArtifactContentProjection | null | undefined,
  overrides: Partial<ArtifactRendererProps> = {},
): ArtifactRendererProps {
  const base = {
    propsApiVersion: 1,
    artifact: {
      id: "artifact-1",
      title: "The one about feeds",
      objectType: "@cinatra-ai/podcast-artifacts:artifact",
      mime: "application/json",
      size: 512,
      createdAt: "2026-02-14T09:05:00.000Z",
      updatedAt: "2026-02-14T09:05:00.000Z",
      ownerLevel: "organization" as const,
      visibility: "organization" as const,
      sourceUrl: null,
    },
    representation: { revisionId: REVISION_ID, mime: "application/json" },
    urls: { preview: null, download: "/download/artifact-1" },
    identity: { kind: "extension" as const, extension: "@cinatra-ai/podcast-artifacts" },
    actions: { download: "/download/artifact-1", openInSource: null },
  };
  const withContent = content === undefined ? base : { ...base, content };
  return { ...withContent, ...overrides } as ArtifactRendererProps;
}

/** An episode whose feed carried the tags but left them EMPTY. A feed doing
 *  this is ordinary — an item can ship `<description></description>` or an
 *  `<itunes:duration>` holding nothing but spaces — and it is a different case
 *  from the field being absent: the key IS there, carrying nothing usable. */
export const BLANK_FIELD_EPISODE = {
  id: "ep-blank",
  title: "An episode with empty tags",
  mediaUrl: "https://cdn.example.com/audio/blank.mp3",
  link: "",
  description: "   ",
  publishedAt: "",
  duration: " ",
};
