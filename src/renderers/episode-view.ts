// THE VIEW CONTRACT — what an episode display can be showing, and what it says
// when it is showing nothing.
//
// An episode artifact holds ONE episode's data exactly as the feed lister emits
// it, so this module's whole job is to read that pinned json into the fields a
// person sees, and to name — never to guess — every case where it cannot. It
// reaches nothing: no host module, no fetch, no sanitizer. That is what keeps
// the package root importable and typecheckable with nothing installed.
//
// IT NEVER INVENTS A FIELD. The two feed primitives always emit `id`, `title`
// and `mediaUrl`; `link`, `description`, `publishedAt` and `duration` arrive
// only when the source carries them, and `duration` only from a podcast feed. A
// field the agent did not emit reads as null here and is not drawn at all.
//
// IT NORMALIZES, IT DOES NOT REWRITE. The one normalization this reading applies
// is trimming the surrounding whitespace off a string field, so a field a feed
// shipped as a blank tag reads as the same absence a missing key produces and
// the display has ONE absence case to draw rather than two. No other value is
// altered, substituted or defaulted.

import type { ArtifactRendererProps } from "../artifact-renderer-props";
import { ARTIFACT_CONTENT_CHANNEL_VERSION } from "../artifact-content-channel";

/** The props-contract version these displays declare, and the only one they
 * accept a snapshot at. The manifest entries declare the same number. */
export const EPISODE_DISPLAY_PROPS_API_VERSION = 1;

export type EpisodeFloorReason =
  | "malformed-props"
  | "props-version"
  | "channel-version"
  | "content-unavailable"
  | "content-absent"
  | "content-over-cap"
  | "content-unsupported-form"
  | "content-not-episode-form"
  | "content-revision-mismatch"
  | "content-truncated"
  | "not-an-episode";

/** One episode, in the fields the display draws. Every one of them is the
 * agent's own value NORMALIZED only by trimming its surrounding whitespace, and
 * never substituted: a field the source did not provide — or provided as a
 * blank tag — is null, not an empty string. */
export interface Episode {
  id: string | null;
  title: string | null;
  mediaUrl: string | null;
  link: string | null;
  publishedAt: string | null;
  duration: string | null;
  description: string | null;
}

export type EpisodeView =
  | {
      kind: "episode";
      episode: Episode;
      /** The pinned revision the episode was read from. */
      revisionId: string;
    }
  | { kind: "floor"; reason: EpisodeFloorReason };

const FLOOR_MESSAGES: Record<EpisodeFloorReason, string> = {
  "malformed-props": "This episode cannot be drawn: the view was opened without an episode to show.",
  "props-version":
    "This episode cannot be drawn: it was handed a view of a version this display does not read.",
  "channel-version":
    "This episode cannot be drawn: its content arrived in a form of the content channel this display does not read.",
  "content-unavailable": "This episode cannot be drawn here: this view was not given the episode to show.",
  "content-absent": "No episode data is available for the revision being viewed.",
  "content-over-cap": "This episode's data is too large to show here. Download it to read all of it.",
  "content-unsupported-form": "This artifact is not structured data, so the episode view has nothing to draw.",
  "content-not-episode-form":
    "This artifact holds something other than an episode's data, so the episode view has nothing to draw.",
  "content-revision-mismatch":
    "This episode cannot be drawn: the data handed to this view was read from a different revision than the one being viewed.",
  "content-truncated":
    "This episode's data arrived incomplete, so it is not shown rather than shown wrongly. Download it to read all of it.",
  "not-an-episode": "This artifact does not hold one episode's data, so there is nothing to draw.",
};

/** The sentence a person reads when the display is drawing no episode. */
export function episodeFloorMessage(reason: EpisodeFloorReason): string {
  return FLOOR_MESSAGES[reason] ?? FLOOR_MESSAGES["not-an-episode"];
}

const floor = (reason: EpisodeFloorReason): EpisodeView => ({ kind: "floor", reason });

/** A string field as the agent emitted it, or null when it emitted nothing
 * usable. Whitespace-only is nothing usable. */
function field(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * The identifying fields the feed primitives GUARANTEE. Both listers declare
 * `id`, `title` and `mediaUrl` as non-optional, so an object missing any one of
 * them is not an episode this artifact should be drawing, whatever else it
 * holds.
 *
 * The test is ALL THREE, not any one of them. Accepting any one would let a
 * mis-filed row — an object that merely happens to carry a `title` — draw as an
 * episode with no identity and nothing to play: a wrong drawing rather than an
 * honest floor.
 */
function looksLikeAnEpisode(row: Record<string, unknown>): boolean {
  return field(row.id) !== null && field(row.title) !== null && field(row.mediaUrl) !== null;
}

/**
 * Read the one episode this artifact holds out of the host-supplied snapshot.
 *
 * The order of the checks is the order of the truths: a snapshot this display
 * cannot read at all, then a channel it cannot read, then an absence the channel
 * itself reports, then a projection of the wrong class, then a revision that is
 * not the one being viewed, then content that is only part of the episode — and
 * only then is anything parsed.
 */
export function resolveEpisodeView(snapshot: ArtifactRendererProps): EpisodeView {
  if (snapshot === null || snapshot === undefined || typeof snapshot !== "object") {
    return floor("malformed-props");
  }
  if (snapshot.propsApiVersion !== EPISODE_DISPLAY_PROPS_API_VERSION) {
    return floor("props-version");
  }

  const content = (snapshot as { content?: unknown }).content;
  if (content === null || content === undefined || typeof content !== "object") {
    // The host attached no projection at all. Held apart from a projection that
    // says, itself, that there is no content.
    return floor("content-unavailable");
  }

  const projection = content as Record<string, unknown>;
  if (projection.channelVersion !== ARTIFACT_CONTENT_CHANNEL_VERSION) {
    return floor("channel-version");
  }

  if (projection.kind === "none") {
    const reason = projection.reason;
    if (reason === "over-cap") return floor("content-over-cap");
    if (reason === "unsupported-form") return floor("content-unsupported-form");
    if (reason === "absent") return floor("content-absent");
    return floor("content-absent");
  }

  // An episode is stored as json, which the channel projects as TEXT. A
  // configuration or a remote page is some other artifact's content entirely.
  if (projection.kind !== "text") {
    return floor("content-not-episode-form");
  }

  const contentRevisionId = projection.representationRevisionId;
  if (typeof contentRevisionId !== "string" || contentRevisionId.length === 0) {
    return floor("content-revision-mismatch");
  }
  // A snapshot whose `representation` is null has NO materialized representation
  // at all — the props contract says so in as many words. Content attached
  // beside it cannot be shown to be the revision being viewed, because there is
  // no revision being viewed, so it is refused rather than drawn under a
  // revision label this display cannot stand behind.
  const representation = snapshot.representation;
  if (representation === null || representation === undefined) {
    return floor("content-revision-mismatch");
  }
  if (representation.revisionId !== contentRevisionId) {
    return floor("content-revision-mismatch");
  }

  // HALF A JSON DOCUMENT IS NOT A SMALLER EPISODE. A truncated projection is
  // refused before any parse: it would either throw, or — worse — parse a prefix
  // that happens to close and draw an episode that is missing its later fields
  // without saying so.
  if (projection.truncated === true) {
    return floor("content-truncated");
  }

  const text = projection.text;
  if (typeof text !== "string") {
    return floor("not-an-episode");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return floor("not-an-episode");
  }

  // One artifact per episode: the binding files each member on its own, so an
  // artifact holding a list, a string or a number is a mis-filed artifact.
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return floor("not-an-episode");
  }

  const row = parsed as Record<string, unknown>;
  if (!looksLikeAnEpisode(row)) {
    return floor("not-an-episode");
  }

  return {
    kind: "episode",
    revisionId: contentRevisionId,
    episode: {
      id: field(row.id),
      title: field(row.title),
      mediaUrl: field(row.mediaUrl),
      link: field(row.link),
      publishedAt: field(row.publishedAt),
      duration: field(row.duration),
      description: field(row.description),
    },
  };
}
