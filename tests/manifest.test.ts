// @vitest-environment node
// The manifest half of the extension: the claim, the accepted form, the display
// block, and the `exports` that publish the display. This is what "complete"
// means for an artifact extension.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { podcastArtifactsManifest } from "../src/index";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as {
  name: string;
  main: string;
  files: string[];
  exports: Record<string, unknown>;
  cinatra: {
    apiVersion: string;
    kind: string;
    displayName: string;
    vendor: { key: string; name: string };
    dependencies: unknown[];
    artifact: {
      accepts: { file: { mimeTypes: string[] } };
      ui: {
        abiVersion: number;
        sdkAbiRange: string;
        renderers: Record<
          string,
          { entry: string; propsApiVersion: number; representations?: string[] }
        >;
      };
      objectTypes: Array<{
        type: string;
        claim: string;
        dispositions: Record<string, unknown>;
        schema: Record<string, unknown>;
      }>;
    };
  };
};

const MIMES = ["application/json"];

const ARTIFACT_ALLOWED_CINATRA_KEYS = new Set([
  "kind",
  "apiVersion",
  "artifact",
  "dependencies",
  "roles",
  "displayName",
  "vendor",
]);
const ARTIFACT_UI_RENDERER_ALLOWED_KEYS = new Set(["entry", "propsApiVersion", "representations"]);

/** The key the host's manifest generator derives from a renderer entry: the
 * entry path minus its source extension. A display is published only at THIS
 * key — the generator refuses to generate when nothing resolves it. */
function generatorExportsKeyForEntry(entry: string): string {
  return `./${entry.replace(/^\.\//, "").replace(/\.(ts|tsx)$/, "")}`;
}

describe("package.json manifest — the episode identity", () => {
  it("names the package per the first-party artifact convention", () => {
    expect(pkg.name).toBe("@cinatra-ai/podcast-artifacts");
  });

  it("declares the first-party artifact identity", () => {
    expect(pkg.cinatra.kind).toBe("artifact");
    expect(pkg.cinatra.apiVersion).toBe("cinatra.ai/v1");
    expect(pkg.cinatra.displayName).toBe("Episode");
    expect(pkg.cinatra.vendor).toEqual({ key: "cinatra-ai", name: "Cinatra" });
  });

  it("omits dependency edges — an artifact extension declares no producer", () => {
    // The producer edge belongs to the FEED LISTER's manifest, not to this one:
    // an artifact extension is depended UPON, it does not depend.
    expect(pkg.cinatra.dependencies).toEqual([]);
  });

  it("declares only the allowed top-level cinatra.* keys", () => {
    for (const k of Object.keys(pkg.cinatra)) {
      expect(ARTIFACT_ALLOWED_CINATRA_KEYS.has(k)).toBe(true);
    }
  });

  it("declares NO matcher skill — an episode is bound, never matched from an upload", () => {
    // Episodes reach this type through the feed lister's fan-out binding. There
    // is no upload road to associate, so there is no matcher to run.
    expect("skills" in pkg.cinatra.artifact).toBe(false);
    expect("matcherConfidenceThreshold" in pkg.cinatra.artifact).toBe(false);
  });

  it("ACCEPTS application/json alone — an episode is structured data", () => {
    expect(pkg.cinatra.artifact.accepts.file.mimeTypes).toEqual(MIMES);
    for (const m of pkg.cinatra.artifact.accepts.file.mimeTypes) {
      expect(m.includes("*")).toBe(false);
    }
  });

  it("declares a strict v1 ui block bound to the host SDK ABI range", () => {
    const ui = pkg.cinatra.artifact.ui;
    expect(ui.abiVersion).toBe(1);
    expect(ui.sdkAbiRange).toBe("^2.5.0");
    expect(Object.keys(ui.renderers).sort()).toEqual(["detail", "listRow", "preview"]);
  });

  it("draws every form it accepts — an own display never falls through", () => {
    // An extension's own display wins outright for its own type, so a form this
    // package accepts but no renderer declares would draw nothing at all.
    for (const slot of ["detail", "preview"]) {
      expect(pkg.cinatra.artifact.ui.renderers[slot].representations).toEqual(MIMES);
    }
  });

  it("requests NO host ports on any slot (the v1 no-ports contract)", () => {
    for (const renderer of Object.values(pkg.cinatra.artifact.ui.renderers)) {
      for (const k of Object.keys(renderer)) {
        expect(ARTIFACT_UI_RENDERER_ALLOWED_KEYS.has(k)).toBe(true);
      }
      expect(renderer.propsApiVersion).toBe(1);
    }
  });

  it("points every entry at a package-contained subpath that exists", () => {
    for (const renderer of Object.values(pkg.cinatra.artifact.ui.renderers)) {
      const entry = renderer.entry;
      expect(entry.startsWith("./src/renderers/")).toBe(true);
      expect(entry.includes("..")).toBe(false);
      const resolved = fileURLToPath(new URL(`../${entry.slice(2)}`, import.meta.url));
      expect(() => readFileSync(resolved, "utf8")).not.toThrow();
    }
  });

  it("declares exactly one dedicated objectTypes claim", () => {
    const claims = pkg.cinatra.artifact.objectTypes;
    expect(Array.isArray(claims)).toBe(true);
    expect(claims).toHaveLength(1);
    const claim = claims[0];
    expect(claim.type).toBe("@cinatra-ai/podcast-artifacts:artifact");
    expect(claim.claim).toBe("dedicated");
    expect(claim.dispositions).toEqual({
      projection: "artifact-safe",
      pinnable: false,
      snapshotPolicy: "none",
      sensitivity: "normal",
    });
    expect(claim.schema).toEqual({ type: "object" });
  });

  it("keeps the typed src manifest in agreement with package.json", () => {
    expect(podcastArtifactsManifest.accepts).toEqual(pkg.cinatra.artifact.accepts);
    expect(podcastArtifactsManifest.ui).toEqual(pkg.cinatra.artifact.ui);
  });
});

describe("package.json exports — the display is published by the package itself", () => {
  it("declares an exports subpath map (never a bare sugar target)", () => {
    expect(typeof pkg.exports).toBe("object");
    expect(Array.isArray(pkg.exports)).toBe(false);
    for (const key of Object.keys(pkg.exports)) {
      expect(key.startsWith(".")).toBe(true);
    }
  });

  it("publishes EVERY declared renderer at the generator's key", () => {
    for (const renderer of Object.values(pkg.cinatra.artifact.ui.renderers)) {
      const key = generatorExportsKeyForEntry(renderer.entry);
      expect(Object.keys(pkg.exports)).toContain(key);
      expect(pkg.exports[key]).toBe(renderer.entry);
    }
  });

  it("names no PATTERN subpath", () => {
    for (const key of Object.keys(pkg.exports)) {
      expect(key.includes("*")).toBe(false);
    }
  });

  it("keeps the package ROOT importable", () => {
    expect(pkg.exports["."]).toBe("./src/index.ts");
    expect(pkg.exports["."]).toBe(pkg.main);
  });

  it("keeps every exports target inside the published files allowlist", () => {
    expect(pkg.files).toContain("src");
    for (const target of Object.values(pkg.exports)) {
      expect(typeof target).toBe("string");
      expect((target as string).startsWith("./src/")).toBe(true);
      const resolved = fileURLToPath(new URL(`../${(target as string).slice(2)}`, import.meta.url));
      expect(() => readFileSync(resolved, "utf8")).not.toThrow();
    }
  });
});
