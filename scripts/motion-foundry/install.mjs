#!/usr/bin/env node

import fs from "node:fs"
import { promises as fsp } from "node:fs"
import path from "node:path"
import {
    ROOT,
    buildPlan,
    loadBatch,
    normalizeRepositoryPath,
    toRepositoryPath,
    walkFiles,
    writeJson,
} from "./lib.mjs"

const args = process.argv.slice(2)
const batchArgument = args.find((arg) => !arg.startsWith("--")) ?? "batches/example-motion-batch.json"
const targetArgument = readFlag("--target")
const effectFilter = readFlag("--effect")
const dryRun = args.includes("--dry-run")
const force = args.includes("--force")

if (!targetArgument) {
    console.error(
        "Usage: npm run foundry:install -- <batch.json> --target <project-directory> [--effect <id>] [--dry-run] [--force]",
    )
    process.exit(1)
}

const targetRoot = path.resolve(process.cwd(), targetArgument)
if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
    throw new Error(`Target project does not exist: ${targetRoot}`)
}
if (targetRoot === ROOT) throw new Error("Target project must be different from the Motion Arsenal repository")

const { batch, batchPath } = await loadBatch(batchArgument)
const plan = await buildPlan(batch, batchPath)
const selected = effectFilter ? plan.effects.filter((effect) => effect.id === effectFilter) : plan.effects
if (selected.length === 0) throw new Error(`No matching effect found for --effect ${effectFilter}`)

const receipts = []
for (const effect of selected) {
    if (effect.componentFiles.length === 0) {
        throw new Error(
            `Cannot install ${effect.id}: no implementation files were resolved. Add an explicit files array to the batch entry.`,
        )
    }

    const entry = batch.effects.find((candidate) => {
        const raw = candidate.id ?? candidate.url ?? ""
        return raw === effect.id || raw.includes(`/effect/${effect.id}`)
    })
    const roots = [
        ...effect.componentFiles,
        ...((entry?.assets ?? []).map((file) => normalizeRepositoryPath(file))),
    ]
    const files = await collectTransitiveFiles(roots)

    if (effect.brandKits.length > 0) {
        const brandKitDirectory = path.join(ROOT, "src", "motion-arsenal", "brand-kits")
        if (fs.existsSync(brandKitDirectory)) {
            for (const file of await walkFiles(brandKitDirectory, { extensions: null })) {
                files.add(toRepositoryPath(file))
            }
        }
    }

    const copied = []
    for (const relative of [...files].sort()) {
        const source = path.join(ROOT, relative)
        const destination = path.join(targetRoot, relative)
        await copyFileControlled(source, destination)
        copied.push(relative)
    }

    const missingDependencies = await findMissingDependencies(targetRoot, effect.dependencies)
    const receipt = {
        schemaVersion: "1.0",
        effectId: effect.id,
        sourceRepository: "Finitolombardo/nox-motion-arsenal",
        installedAt: new Date().toISOString(),
        dryRun,
        variants: effect.variants,
        brandKits: effect.brandKits,
        files: copied,
        missingDependencies,
        integrationHint: effect.componentFiles.map((file) => ({
            sourceFile: file,
            note: "Import this component in the intended page or section and pass the selected variant and brand-kit props.",
        })),
    }

    if (!dryRun) {
        await writeJson(path.join(targetRoot, ".nox", "motion-installs", `${effect.id}.json`), receipt)
    }
    receipts.push(receipt)
    console.log(
        `[foundry] ${dryRun ? "planned" : "installed"} ${effect.id}: ${copied.length} files, ${missingDependencies.length} missing packages`,
    )
}

if (receipts.some((receipt) => receipt.missingDependencies.length > 0)) {
    console.log("[foundry] install completed with missing dependency warnings; see .nox/motion-installs receipts")
}

async function collectTransitiveFiles(initialFiles) {
    const collected = new Set()
    const queue = initialFiles.map((file) => normalizeRepositoryPath(file))

    while (queue.length > 0) {
        const relative = queue.shift()
        if (!relative || collected.has(relative)) continue
        const absolute = path.join(ROOT, relative)
        if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
            throw new Error(`Install source does not exist: ${relative}`)
        }
        collected.add(relative)

        if (!/[.](?:ts|tsx|js|jsx|css|scss)$/.test(relative)) continue
        const content = await fsp.readFile(absolute, "utf8")
        const imports = extractRelativeImports(content)
        for (const importPath of imports) {
            const resolved = resolveImport(absolute, importPath)
            if (!resolved) continue
            const dependency = toRepositoryPath(resolved)
            if (dependency.startsWith("src/motion-arsenal/") && !collected.has(dependency)) {
                queue.push(dependency)
            }
        }
    }

    return collected
}

function extractRelativeImports(content) {
    const output = new Set()
    const patterns = [
        /(?:import|export)\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g,
        /import\(\s*["']([^"']+)["']\s*\)/g,
    ]
    for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(content))) {
            if (match[1].startsWith(".")) output.add(match[1])
        }
    }
    return output
}

function resolveImport(importer, importPath) {
    const base = path.resolve(path.dirname(importer), importPath)
    const candidates = [
        base,
        `${base}.tsx`,
        `${base}.ts`,
        `${base}.jsx`,
        `${base}.js`,
        `${base}.css`,
        `${base}.scss`,
        path.join(base, "index.tsx"),
        path.join(base, "index.ts"),
        path.join(base, "index.jsx"),
        path.join(base, "index.js"),
    ]
    return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null
}

async function copyFileControlled(source, destination) {
    if (dryRun) {
        console.log(`[foundry] copy ${path.relative(ROOT, source)} -> ${path.relative(targetRoot, destination)}`)
        return
    }

    await fsp.mkdir(path.dirname(destination), { recursive: true })
    if (fs.existsSync(destination) && !force) {
        const [sourceData, destinationData] = await Promise.all([fsp.readFile(source), fsp.readFile(destination)])
        if (!sourceData.equals(destinationData)) {
            throw new Error(`Target file already differs: ${path.relative(targetRoot, destination)}. Re-run with --force after review.`)
        }
        return
    }
    await fsp.copyFile(source, destination)
}

async function findMissingDependencies(target, dependencies) {
    if (!Array.isArray(dependencies) || dependencies.length === 0) return []
    const packagePath = path.join(target, "package.json")
    if (!fs.existsSync(packagePath)) return dependencies
    const packageJson = JSON.parse(await fsp.readFile(packagePath, "utf8"))
    const installed = {
        ...(packageJson.dependencies ?? {}),
        ...(packageJson.devDependencies ?? {}),
        ...(packageJson.peerDependencies ?? {}),
    }
    return dependencies.filter((dependency) => !installed[dependency])
}

function readFlag(name) {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : null
}
