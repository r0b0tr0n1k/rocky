import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadSkills } from "/home/goce/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/skills.js";
import { loadProjectContextFiles } from "/home/goce/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js";

// The globally-installed pi's agent config dir (used as the "user" skill root).
const PI_AGENT_DIR = "/home/goce/.pi/agent";

describe("RobotFarm role folders (cwd -> AGENTS.md + .pi/skills)", () => {
  let roleDir: string; // a bot folder: owns AGENTS.md AND .pi/skills/<name>/SKILL.md
  let otherDir: string; // an unrelated folder: no contract, no skills

  before(() => {
    roleDir = mkdtempSync(join(tmpdir(), "role-folder-"));
    otherDir = mkdtempSync(join(tmpdir(), "other-folder-"));

    writeFileSync(join(roleDir, "AGENTS.md"), "# Database Bot\nYou are the Database Bot.\n");
    mkdirSync(join(roleDir, ".pi", "skills", "db-migration"), { recursive: true });
    writeFileSync(
      join(roleDir, ".pi", "skills", "db-migration", "SKILL.md"),
      "---\nname: db-migration\ndescription: test migration skill\n---\n# Migration\n",
    );
  });

  after(() => {
    rmSync(roleDir, { recursive: true, force: true });
    rmSync(otherDir, { recursive: true, force: true });
  });

  it("loads the role folder's AGENTS.md as a context file when cwd is that folder", () => {
    const files = loadProjectContextFiles({ cwd: roleDir, agentDir: PI_AGENT_DIR });
    const hit = files.find((f) => f.path === join(roleDir, "AGENTS.md"));
    assert.ok(hit, `expected ${roleDir}/AGENTS.md to be loaded as a context file`);
  });

  it("discovers the per-role skill from <cwd>/.pi/skills", () => {
    const r = loadSkills({ cwd: roleDir, agentDir: PI_AGENT_DIR, skillPaths: [], includeDefaults: true });
    const names = r.skills.map((s) => s.name);
    assert.ok(names.includes("db-migration"), `expected db-migration in [${names.join(", ")}]`);
  });

  it("scopes skills to the cwd: the role skill is NOT visible from an unrelated folder", () => {
    const r = loadSkills({ cwd: otherDir, agentDir: PI_AGENT_DIR, skillPaths: [], includeDefaults: true });
    const names = r.skills.map((s) => s.name);
    assert.ok(!names.includes("db-migration"), `db-migration must not leak into [${names.join(", ")}]`);
  });
});
