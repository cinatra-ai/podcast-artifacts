// Episode PREVIEW renderer (slot `preview`) — the compact view, drawn where an
// episode appears beside others rather than on its own.
//
// The same reading and the same card as the detail slot, at the density a
// listing needs: the title and the facts that place it, without the description
// or the addresses, which belong to the full view.

import type { ReactElement } from "react";

import type { ArtifactRendererProps } from "../artifact-renderer-props";
import { EpisodeCard } from "./episode-card";
import { resolveEpisodeView } from "./episode-view";

export default function EpisodeArtifactPreview(props: ArtifactRendererProps): ReactElement {
  return <EpisodeCard view={resolveEpisodeView(props)} compact={true} />;
}
