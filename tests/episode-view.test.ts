// @vitest-environment node
// THE READING: what this display is showing, and what it says when it is
// showing nothing. Every answer is named — the display never paints blank and
// never invents a field the agent did not emit.

import { describe, expect, it } from "vitest";

import {
  EPISODE_DISPLAY_PROPS_API_VERSION,
  episodeFloorMessage,
  resolveEpisodeView,
} from "../src/renderers/episode-view";
import {
  BLANK_FIELD_EPISODE,
  MINIMAL_EPISODE,
  PODCAST_EPISODE,
  REVISION_ID,
  YOUTUBE_EPISODE,
  props,
  textProjection,
} from "./fixtures";

describe("the props version this display accepts", () => {
  it("is the version the manifest entries declare", () => {
    expect(EPISODE_DISPLAY_PROPS_API_VERSION).toBe(1);
  });
});

describe("one episode read from a pinned revision", () => {
  it("reads a podcast episode's every emitted field, normalized and never substituted", () => {
    const view = resolveEpisodeView(props(textProjection(PODCAST_EPISODE)));
    expect(view.kind).toBe("episode");
    if (view.kind !== "episode") return;
    expect(view.revisionId).toBe(REVISION_ID);
    expect(view.episode).toEqual({
      id: "ep-8f2c",
      title: "The one about feeds",
      link: "https://example.com/episodes/the-one-about-feeds",
      mediaUrl: "https://cdn.example.com/audio/the-one-about-feeds.mp3",
      description: "A conversation about how feeds are discovered and read.",
      publishedAt: "2026-02-14T09:00:00.000Z",
      duration: "00:42:17",
    });
  });

  it("leaves a field the source never provided ABSENT rather than inventing it", () => {
    const view = resolveEpisodeView(props(textProjection(YOUTUBE_EPISODE)));
    if (view.kind !== "episode") throw new Error("expected an episode");
    // The YouTube lister emits no duration. The reading says so; it does not
    // fabricate a zero, an empty string or a placeholder.
    expect(view.episode.duration).toBeNull();
    expect(view.episode.description).toBe("A walkthrough of the reader.");
  });

  it("reads the barest episode the primitive contract guarantees", () => {
    const view = resolveEpisodeView(props(textProjection(MINIMAL_EPISODE)));
    if (view.kind !== "episode") throw new Error("expected an episode");
    expect(view.episode.title).toBe("A minimal episode");
    expect(view.episode.mediaUrl).toBe("https://cdn.example.com/audio/min.mp3");
    expect(view.episode.link).toBeNull();
    expect(view.episode.publishedAt).toBeNull();
    expect(view.episode.duration).toBeNull();
    expect(view.episode.description).toBeNull();
  });

  it("keeps an unknown extra field out of the reading without refusing the episode", () => {
    // The artifact holds the episode's data exactly as the agent emits it. A
    // field this display does not draw is not an error — it is simply not drawn.
    const view = resolveEpisodeView(
      props(textProjection({ ...PODCAST_EPISODE, sourceFeedUrl: "https://example.com/feed.xml" })),
    );
    expect(view.kind).toBe("episode");
    if (view.kind !== "episode") return;
    expect("sourceFeedUrl" in view.episode).toBe(false);
    expect(view.episode.title).toBe("The one about feeds");
  });
});

describe("what it says when it cannot draw an episode", () => {
  const floor = (p: Parameters<typeof resolveEpisodeView>[0]) => {
    const view = resolveEpisodeView(p);
    if (view.kind !== "floor") throw new Error(`expected a floor, got ${view.kind}`);
    return view.reason;
  };

  it("names a snapshot that is not a snapshot", () => {
    expect(floor(null as never)).toBe("malformed-props");
    expect(floor(undefined as never)).toBe("malformed-props");
  });

  it("names a props version it does not read", () => {
    expect(floor(props(textProjection(PODCAST_EPISODE), { propsApiVersion: 2 }))).toBe("props-version");
  });

  it("names a content channel version it does not read", () => {
    expect(floor(props(textProjection(PODCAST_EPISODE, { channelVersion: 2 })))).toBe("channel-version");
  });

  it("names a snapshot the host attached no content to", () => {
    expect(floor(props(undefined))).toBe("content-unavailable");
  });

  it("names each absence the channel itself reports", () => {
    const none = (reason: string) =>
      props({ kind: "none", channelVersion: 1, representationRevisionId: REVISION_ID, reason } as never);
    expect(floor(none("absent"))).toBe("content-absent");
    expect(floor(none("over-cap"))).toBe("content-over-cap");
    expect(floor(none("unsupported-form"))).toBe("content-unsupported-form");
  });

  it("names a projection that is not text — an episode is read from its json", () => {
    const configuration = {
      kind: "configuration",
      channelVersion: 1,
      representationRevisionId: REVISION_ID,
      configuration: PODCAST_EPISODE,
      digest: "d",
      byteLength: 1,
      projectedByteLength: 1,
      cap: 10,
    };
    expect(floor(props(configuration as never))).toBe("content-not-episode-form");
  });

  it("REFUSES a truncated projection instead of parsing half an episode", () => {
    // Half a json document is not a smaller episode, it is a broken one. Parsing
    // it would either throw or, worse, succeed on a prefix that happens to close.
    const full = JSON.stringify(PODCAST_EPISODE);
    const cut = full.slice(0, Math.floor(full.length / 2));
    expect(
      floor(
        props(
          textProjection(cut, { truncated: true, projectedByteLength: cut.length, byteLength: full.length }),
        ),
      ),
    ).toBe("content-truncated");
  });

  it("names content read from a different revision than the one being viewed", () => {
    expect(
      floor(props(textProjection(PODCAST_EPISODE, { representationRevisionId: "rev-other" }))),
    ).toBe("content-revision-mismatch");
  });

  it("names json it cannot parse", () => {
    expect(floor(props(textProjection("{not json at all")))).toBe("not-an-episode");
  });

  it("names json that parses but is not one episode", () => {
    // The binding files ONE artifact per member, so an artifact holding the
    // whole list is a mis-filed artifact, not an episode.
    expect(floor(props(textProjection([PODCAST_EPISODE])))).toBe("not-an-episode");
    expect(floor(props(textProjection("a bare string")))).toBe("not-an-episode");
    expect(floor(props(textProjection(42)))).toBe("not-an-episode");
    expect(floor(props(textProjection(null)))).toBe("not-an-episode");
  });

  it("names an object carrying none of an episode's identifying fields", () => {
    expect(floor(props(textProjection({ unrelated: true })))).toBe("not-an-episode");
  });

  it("carries a sentence for every reason it can name", () => {
    // A floor with no words is a blank display by another road.
    const reasons = [
      "malformed-props",
      "props-version",
      "channel-version",
      "content-unavailable",
      "content-absent",
      "content-over-cap",
      "content-unsupported-form",
      "content-not-episode-form",
      "content-revision-mismatch",
      "content-truncated",
      "not-an-episode",
    ];
    for (const reason of reasons) {
      const message = episodeFloorMessage(reason as never);
      expect(typeof message).toBe("string");
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("a field the feed carried but left empty", () => {
  it("reads as ABSENT, never as an empty string", () => {
    // The feed supplied the keys and put nothing usable in them. An empty
    // string is not a value a person can be shown: it would draw a row with
    // no content in it. The reading collapses it to the same absence a
    // missing key produces, so the display has one case to draw, not two.
    const view = resolveEpisodeView(props(textProjection(BLANK_FIELD_EPISODE)));
    if (view.kind !== "episode") throw new Error("expected an episode");
    expect(view.episode.link).toBeNull();
    expect(view.episode.description).toBeNull();
    expect(view.episode.publishedAt).toBeNull();
    expect(view.episode.duration).toBeNull();
  });

  it("still reads the fields the same episode did carry", () => {
    const view = resolveEpisodeView(props(textProjection(BLANK_FIELD_EPISODE)));
    if (view.kind !== "episode") throw new Error("expected an episode");
    expect(view.episode.id).toBe("ep-blank");
    expect(view.episode.title).toBe("An episode with empty tags");
    expect(view.episode.mediaUrl).toBe("https://cdn.example.com/audio/blank.mp3");
  });
});

/** The named reason a view floored on. */
const floorReason = (p: Parameters<typeof resolveEpisodeView>[0]) => {
  const view = resolveEpisodeView(p);
  if (view.kind !== "floor") throw new Error(`expected a floor, got ${view.kind}`);
  return view.reason;
};

describe("the producer contract is the fence, not a hint", () => {
  // Both feed primitives declare `id`, `title` and `mediaUrl` as non-optional.
  // A member the binding files that is missing any one of them did not come out
  // of that contract, and drawing it as an episode would be a wrong drawing.
  it("refuses an object carrying only SOME of the guaranteed fields", () => {
    expect(floorReason(props(textProjection({ title: "Quarterly totals" })))).toBe("not-an-episode");
    expect(floorReason(props(textProjection({ id: "ep-1", title: "No media" })))).toBe("not-an-episode");
    expect(
      floorReason(props(textProjection({ id: "ep-1", mediaUrl: "https://cdn.example.com/a.mp3" }))),
    ).toBe("not-an-episode");
    expect(
      floorReason(props(textProjection({ title: "T", mediaUrl: "https://cdn.example.com/a.mp3" }))),
    ).toBe("not-an-episode");
  });

  it("refuses a row whose guaranteed field is present but blank", () => {
    // The key is there and carries nothing usable, which is the same as absent.
    expect(
      floorReason(
        props(
          textProjection({ id: "  ", title: "A title", mediaUrl: "https://cdn.example.com/a.mp3" }),
        ),
      ),
    ).toBe("not-an-episode");
  });

  it("still reads the barest episode the contract does guarantee", () => {
    const view = resolveEpisodeView(props(textProjection(MINIMAL_EPISODE)));
    expect(view.kind).toBe("episode");
  });
});

describe("a snapshot with no materialized representation", () => {
  it("floors rather than drawing content under a revision it cannot stand behind", () => {
    // `representation: null` is the props contract's own words for "this
    // artifact has no materialized representation". Content attached beside it
    // cannot be shown to be the revision being viewed, because none is.
    expect(
      floorReason(props(textProjection(PODCAST_EPISODE), { representation: null })),
    ).toBe("content-revision-mismatch");
  });
});
