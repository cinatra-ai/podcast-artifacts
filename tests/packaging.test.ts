// @vitest-environment node
// The packaging half of the display: the SDK it draws through is declared as
// the host-provided optional peer it is, and the props version the manifest
// publishes is the one the displays actually accept a snapshot at.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { EPISODE_DISPLAY_PROPS_API_VERSION } from "../src/renderers/episode-view";
import { ARTIFACT_CONTENT_CHANNEL_VERSION } from "../src/artifact-content-channel";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as {
  peerDependencies: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  cinatra: {
    artifact: { ui: { renderers: Record<string, { propsApiVersion: number }> } };
  };
};

describe("the SDK the display draws through", () => {
  it("is declared as a peer, and an OPTIONAL one — the host provides it", () => {
    expect(pkg.peerDependencies["@cinatra-ai/sdk-extensions"]).toBeDefined();
    expect(pkg.peerDependenciesMeta?.["@cinatra-ai/sdk-extensions"]?.optional).toBe(true);
  });

  it("declares react as an optional peer too — the host owns the runtime", () => {
    expect(pkg.peerDependencies["react"]).toBeDefined();
    expect(pkg.peerDependenciesMeta?.["react"]?.optional).toBe(true);
  });
});

describe("the declared versions", () => {
  it("publish the props version every display entry declares", () => {
    const renderers = Object.values(pkg.cinatra.artifact.ui.renderers);
    expect(renderers.length).toBeGreaterThan(0);
    for (const renderer of renderers) {
      expect(renderer.propsApiVersion).toBe(EPISODE_DISPLAY_PROPS_API_VERSION);
    }
  });

  it("read the content channel at the version the host projects at", () => {
    expect(ARTIFACT_CONTENT_CHANNEL_VERSION).toBe(1);
  });
});
