// THE DISPLAY DRAWS ONE EPISODE, from a fixture revision, on both slots.
//
// The same two entries resolve on the artifact page and on the review card, so
// what these assertions pin is what a person sees on either surface.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import EpisodeArtifactDetail from "../src/renderers/detail";
import EpisodeArtifactPreview from "../src/renderers/preview";
import {
  BLANK_FIELD_EPISODE,
  MINIMAL_EPISODE,
  PODCAST_EPISODE,
  YOUTUBE_EPISODE,
  props,
  textProjection,
} from "./fixtures";

afterEach(cleanup);

describe("the detail display over a fixture revision", () => {
  it("draws the episode the plan names: title, media address, date, duration, description", () => {
    render(<EpisodeArtifactDetail {...props(textProjection(PODCAST_EPISODE))} />);

    expect(screen.getByText("The one about feeds")).toBeTruthy();
    expect(screen.getByText(/A conversation about how feeds are discovered/)).toBeTruthy();
    expect(screen.getByText("00:42:17")).toBeTruthy();

    const media = screen.getByRole("link", { name: /listen|play|open the media/i });
    expect(media.getAttribute("href")).toBe(PODCAST_EPISODE.mediaUrl);
  });

  it("shows the publication date as the episode carries it", () => {
    const { container } = render(<EpisodeArtifactDetail {...props(textProjection(PODCAST_EPISODE))} />);
    const time = container.querySelector("time");
    expect(time).not.toBeNull();
    expect(time?.getAttribute("dateTime")).toBe(PODCAST_EPISODE.publishedAt);
  });

  it("links to the episode page when the feed provided one", () => {
    render(<EpisodeArtifactDetail {...props(textProjection(PODCAST_EPISODE))} />);
    const link = screen.getByRole("link", { name: /episode page/i });
    expect(link.getAttribute("href")).toBe(PODCAST_EPISODE.link);
  });

  it("DRAWS NO EMPTY ROW for a field the source never provided", () => {
    const { container } = render(<EpisodeArtifactDetail {...props(textProjection(MINIMAL_EPISODE))} />);
    expect(screen.getByText("A minimal episode")).toBeTruthy();
    // No duration, no date, no description, no episode-page link exist on this
    // episode — so none of their rows are drawn at all.
    expect(container.querySelector("time")).toBeNull();
    expect(container.querySelector("[data-episode-field='duration']")).toBeNull();
    expect(container.querySelector("[data-episode-field='description']")).toBeNull();
    expect(screen.queryByRole("link", { name: /episode page/i })).toBeNull();
  });

  it("carries NO decision control — this display is read-only by construction", () => {
    const { container } = render(<EpisodeArtifactDetail {...props(textProjection(PODCAST_EPISODE))} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelector("form")).toBeNull();
    for (const label of [/regenerate/i, /approve/i, /reject/i, /request changes/i]) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it("says what is wrong instead of painting blank", () => {
    const { container } = render(<EpisodeArtifactDetail {...props(undefined)} />);
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
    expect(container.querySelector("[data-episode-floor]")).not.toBeNull();
  });

  it("never renders the raw json of the episode", () => {
    const { container } = render(<EpisodeArtifactDetail {...props(textProjection(PODCAST_EPISODE))} />);
    expect(container.textContent).not.toContain("mediaUrl");
    expect(container.textContent).not.toContain('{"id"');
  });
});

describe("the preview display over a fixture revision", () => {
  it("draws the episode's title", () => {
    render(<EpisodeArtifactPreview {...props(textProjection(YOUTUBE_EPISODE))} />);
    expect(screen.getByText("Building a feed reader")).toBeTruthy();
  });

  it("stays compact — it does not draw the description", () => {
    render(<EpisodeArtifactPreview {...props(textProjection(PODCAST_EPISODE))} />);
    expect(screen.queryByText(/A conversation about how feeds are discovered/)).toBeNull();
  });

  it("says what is wrong instead of painting blank", () => {
    const { container } = render(<EpisodeArtifactPreview {...props(undefined)} />);
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });
});

describe("an episode whose feed carried empty tags", () => {
  it("DRAWS NO EMPTY ROW on the artifact page for a field left blank", () => {
    // The absent case is pinned above. This is the other one: the feed sent the
    // tag and put nothing in it. Neither may reach the page as a row with no
    // content, an empty link or a bare separator.
    const { container } = render(
      <EpisodeArtifactDetail {...props(textProjection(BLANK_FIELD_EPISODE))} />,
    );
    expect(screen.getByText("An episode with empty tags")).toBeTruthy();
    expect(container.querySelector("time")).toBeNull();
    expect(container.querySelector("[data-episode-field=duration]")).toBeNull();
    expect(container.querySelector("[data-episode-field=description]")).toBeNull();
    expect(container.querySelector("[data-episode-field=link]")).toBeNull();
    expect(screen.queryByRole("link", { name: /episode page/i })).toBeNull();
  });

  it("DRAWS NO EMPTY ROW on the review card either", () => {
    const { container } = render(
      <EpisodeArtifactPreview {...props(textProjection(BLANK_FIELD_EPISODE))} />,
    );
    expect(screen.getByText("An episode with empty tags")).toBeTruthy();
    expect(container.querySelector("time")).toBeNull();
    expect(container.querySelector("[data-episode-field=duration]")).toBeNull();
  });
});
