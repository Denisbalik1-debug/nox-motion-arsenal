import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import {
    ROOT,
    effectIdFromUrl,
    loadConfig,
    readJson,
    validateBatch,
} from "./motion-foundry/lib.mjs"

const config = await loadConfig()
assert.equal(config.repository, "Finitolombardo/nox-motion-arsenal")
assert.equal(config.productionBranch, "main")
assert.equal(config.skipPreviewByDefault, true)
assert.equal(config.vercel.projectName, "nox-motion-arsenal")
assert.equal(config.vercel.projectId, "prj_4xAbkEUC6U59MjVJS66ErLe9U2U7")
assert.equal(config.vercel.productionDomain, "https://nox-motion-arsenal.vercel.app")
assert.equal(config.publishGuard.requiredEnv, "NOX_MOTION_FOUNDRY_PROD_GO")
assert.equal(config.publishGuard.requiredValue, "GO")
assert.equal(config.publishGuard.requireLinkedProject, true)

assert.equal(
    effectIdFromUrl("https://nox-motion-arsenal.vercel.app/#/effect/nox-spinimage"),
    "nox-spinimage",
)
assert.equal(effectIdFromUrl("nox-spinimage"), "nox-spinimage")
assert.equal(effectIdFromUrl("not a valid effect route"), null)

const batchPath = path.join(ROOT, "batches", "example-motion-batch.json")
const batch = await readJson(batchPath)
assert.deepEqual(validateBatch(batch), [])
assert.equal(batch.publish.mode, "production")
assert.equal(batch.publish.skipPreview, true)
assert.equal(batch.effects.length, 1)

for (const requiredPath of [
    "scripts/motion-foundry/lib.mjs",
    "scripts/motion-foundry/run.mjs",
    "scripts/motion-foundry/install.mjs",
    "src/motion-arsenal/brand-kits/types.ts",
    "src/motion-arsenal/brand-kits/noxLabs.ts",
    "src/motion-arsenal/brand-kits/index.ts",
    "docs/MOTION_FOUNDRY.md",
]) {
    assert.equal(fs.existsSync(path.join(ROOT, requiredPath)), true, `Missing ${requiredPath}`)
}

const packageJson = await readJson(path.join(ROOT, "package.json"))
for (const scriptName of [
    "foundry:plan",
    "foundry:verify",
    "foundry:batch",
    "foundry:prod",
    "foundry:install",
    "test:foundry",
]) {
    assert.equal(typeof packageJson.scripts?.[scriptName], "string", `Missing npm script ${scriptName}`)
}

console.log("Motion Foundry contract passed")
