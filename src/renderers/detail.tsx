// Episode DETAIL renderer (slot `detail`) — the full view of one episode on the
// artifact page and on the review card, which resolve the same entry.
//
// It draws the episode the feed lister filed: its title, when it was published,
// how long it runs, what it is about, and the two addresses — the media itself
// and the episode's own page — where the feed gave them. Nothing is fetched and
// nothing is guessed: everything comes from the pinned revision the host
// projected onto the props, which is what lets this display draw inside a
// third-party application too.
//
// READ-ONLY: no decision control by construction.

import type { ReactElement } from "react";

import type { ArtifactRendererProps } from "../artifact-renderer-props";
import { EpisodeCard } from "./episode-card";
import { resolveEpisodeView } from "./episode-view";

export default function EpisodeArtifactDetail(props: ArtifactRendererProps): ReactElement {
  return <EpisodeCard view={resolveEpisodeView(props)} compact={false} />;
}
