// `@cinatra-ai/podcast-artifacts` — one podcast or video episode, as the feed
// lister emits it.
//
// The feed lister returns a list of episodes; its fan-out binding files ONE
// artifact per member of that list, and each artifact holds that member's data
// exactly as the agent produced it, unchanged, with the episode's own title as
// the artifact's title. This package gives those artifacts a type of their own
// and a display that draws one episode.
//
// A renderer artifact: it declares the form it accepts (`application/json` —
// an episode is structured data), two v1 display slots, and a dedicated
// `objectTypes` claim so a row of this type resolves this extension's own
// display. It declares NO matcher skill: episodes arrive through the binding,
// never through an upload a matcher would have to associate.
//
// HOW IT IS PINNED, AND HOW IT IS NOT. This pack is BINDING-FED: the host's
// binding names the object type outright when it files each member, so this
// pack never needs to be resolved from an upload's MIME. It must therefore be
// installed WITHOUT joining the host's required-in-prod set (`cinatra.extensions`
// in the host's root manifest). That set is the upload-resolution candidacy set,
// and upload resolution is exactly-one-or-refuse: an episode's data IS
// `application/json`, which the generic structured-data base already claims, so
// adding this pack to the required set would give that form two claimants and
// the host would refuse EVERY ordinary json upload — not only this pack's — as
// ambiguous. The host carries a fence over that, so the mistake fails a suite
// rather than reaching anyone.
//
// The AUTHORITATIVE manifest is the `cinatra` block in `package.json` (what the
// host install pipeline and the marketplace publish gate read), and the displays
// are published through this package's own `exports` at the keys the host's
// manifest generator derives from the renderer entries. This module re-declares
// the `artifact` descriptor as a typed value for programmatic use; the manifest
// test keeps the two in agreement.

export {
  type ArtifactRendererProps,
  ARTIFACT_RENDERER_PROPS_API_VERSION,
} from "./artifact-renderer-props";

export {
  type ArtifactContentProjection,
  ARTIFACT_CONTENT_CHANNEL_VERSION,
} from "./artifact-content-channel";

export {
  type Episode,
  type EpisodeView,
  type EpisodeFloorReason,
  EPISODE_DISPLAY_PROPS_API_VERSION,
  episodeFloorMessage,
  resolveEpisodeView,
} from "./renderers/episode-view";

/** The closed v1 renderer-slot names — the WHOLE enum the host contract
 * defines, not just the ones this package declares. */
export type ArtifactUiSlot = "detail" | "preview" | "listRow";

/** A single slot renderer. v1 requests NO host ports — only these three keys. */
export interface ArtifactUiRenderer {
  entry: string;
  propsApiVersion: number;
  representations?: string[];
}

export interface ArtifactUiManifest {
  abiVersion: 1;
  sdkAbiRange: string;
  renderers: Partial<Record<ArtifactUiSlot, ArtifactUiRenderer>>;
}

export interface PodcastArtifactsManifest {
  accepts: { file: { mimeTypes: string[] } };
  ui: ArtifactUiManifest;
}

export const podcastArtifactsManifest: PodcastArtifactsManifest = {
  accepts: {
    file: {
      mimeTypes: ["application/json"],
    },
  },
  ui: {
    abiVersion: 1,
    sdkAbiRange: "^2.5.0",
    renderers: {
      // Both slots draw exactly what this package accepts: an extension's own
      // display wins outright for its own type and never falls through to a
      // display registered for a content form, so every accepted form must be
      // drawn here or it would draw nothing at all.
      detail: {
        entry: "./src/renderers/detail.tsx",
        propsApiVersion: 1,
        representations: ["application/json"],
      },
      preview: {
        entry: "./src/renderers/preview.tsx",
        propsApiVersion: 1,
        representations: ["application/json"],
      },
    },
  },
};
