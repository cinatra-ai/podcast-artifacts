// THE EPISODE CARD — the one composition both slots draw, at two densities.
//
// It reuses the chrome the ratified drawings established for a read-only
// artifact display: a soft panel, the title as the heading, the supporting
// facts on one muted line beneath it, and the actions as plain links. It is
// READ-ONLY BY CONSTRUCTION — no decision, no Regenerate control, no form and
// no button anywhere — because this plan's displays carry no decision: the
// review floor's controls belong to the review surface, not to an extension's
// display.
//
// NEVER BLANK: a view that is not an episode draws the floor's own sentence.
// NEVER MORE THAN THERE IS: a field the agent did not emit draws no row at all,
// rather than a label with nothing after it.

import type { ReactElement } from "react";

import { episodeFloorMessage, type EpisodeView } from "./episode-view";

export function EpisodeFloor({ view }: { view: Extract<EpisodeView, { kind: "floor" }> }): ReactElement {
  return (
    <p className="text-sm text-muted-foreground" data-episode-floor={view.reason}>
      {episodeFloorMessage(view.reason)}
    </p>
  );
}

/** The supporting facts line: only the facts this episode actually carries. */
function EpisodeFacts({
  publishedAt,
  duration,
}: {
  publishedAt: string | null;
  duration: string | null;
}): ReactElement | null {
  if (publishedAt === null && duration === null) return null;
  return (
    <p className="text-sm text-muted-foreground">
      {publishedAt === null ? null : (
        <time dateTime={publishedAt} data-episode-field="publishedAt">
          {publishedAt}
        </time>
      )}
      {publishedAt !== null && duration !== null ? " · " : null}
      {duration === null ? null : <span data-episode-field="duration">{duration}</span>}
    </p>
  );
}

export function EpisodeCard({
  view,
  compact,
}: {
  view: EpisodeView;
  compact: boolean;
}): ReactElement {
  if (view.kind === "floor") {
    return (
      <article className="soft-panel rounded-card overflow-hidden p-6" data-podcast-artifacts="card">
        <EpisodeFloor view={view} />
      </article>
    );
  }

  const { episode } = view;
  // The title is the one line a person scans for. An episode whose feed carried
  // no title still draws an honest heading rather than an empty one.
  const heading = episode.title ?? "Untitled episode";

  return (
    <article
      className="soft-panel rounded-card overflow-hidden p-6"
      data-podcast-artifacts="card"
      data-episode-revision={view.revisionId}
    >
      <p className="text-sm font-medium" data-episode-field="title">
        {heading}
      </p>

      <EpisodeFacts publishedAt={episode.publishedAt} duration={episode.duration} />

      {compact || episode.description === null ? null : (
        <p className="text-sm text-muted-foreground" data-episode-field="description">
          {episode.description}
        </p>
      )}

      {compact ? null : (
        <p className="text-sm">
          {episode.mediaUrl === null ? null : (
            <a href={episode.mediaUrl} className="underline" data-episode-field="mediaUrl">
              Listen to the episode
            </a>
          )}
          {episode.mediaUrl !== null && episode.link !== null ? " · " : null}
          {episode.link === null ? null : (
            <a href={episode.link} className="underline" data-episode-field="link">
              Open the episode page
            </a>
          )}
        </p>
      )}
    </article>
  );
}
