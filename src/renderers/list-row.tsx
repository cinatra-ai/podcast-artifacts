// Row icon of an episode (slot `listRow`) — the icon the Artifacts list draws
// for a row of this type: a podcast glyph at 17 pixels, inside the cell the
// application provides (the cell's size and tint stay the application's).
// It reads nothing but its props, requests no host port and fetches nothing, so
// every object type it receives gets the same icon.

import { Podcast } from "lucide-react";
import type { ReactElement } from "react";

import type { ArtifactRendererProps } from "@cinatra-ai/sdk-extensions";

export default function EpisodeRowIcon(
  _props: { artifact: Pick<ArtifactRendererProps["artifact"], "objectType"> },
): ReactElement {
  return <Podcast aria-hidden size={17} strokeWidth={2} data-row-glyph="podcast" />;
}
