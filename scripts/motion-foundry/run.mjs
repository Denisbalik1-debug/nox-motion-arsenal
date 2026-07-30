#!/usr/bin/env node

import { promises as fsp } from "node:fs"
import path from "node:path"
import {
    ROOT,
    buildPlan,
    loadBatch,
    loadConfig,
    renderPlanMarkdown,
    runCommand,
    smokeProduction,
    verifyPublishTarget,
    writeJson,
} from "./lib.mjs"

const args = process.argv.slice(2)
const command = args[0] ?? "help"
const flags = new Set(args.filter((arg) => arg.startsWith("--")))
const batchArgument = args.slice(1).find((arg) => !arg.startsWith("--")) ?? "batches/example-motion-batch.json"

async function createPlan(batchArgumentValue) {
    const { batch, batchPath } = await loadBatch(batchArgumentValue)
    const plan = await buildPlan(batch, batchPath)
    const reportDirectory = path.join(ROOT, "reports", "motion-foundry", batch.id)
    await writeJson(path.join(reportDirectory, "plan.json"), plan)
    await fsp.writeFile(path.join(reportDirectory, "plan.md"), renderPlanMarkdown(plan), "utf8")

    console.log(
        `[foundry] planned ${plan.summary.effectCount} effects; ${plan.summary.resolvedEffectCount} implementation sets resolved; ${plan.summary.warningCount} warnings`,
    )
    console.log(`[foundry] report: ${path.relative(ROOT, reportDirectory)}`)
    return { batch, plan, reportDirectory }
}

async function verify(config) {
    const commands = flags.has("--fast")
        ? config.verificationCommands.filter((commandValue) => commandValue !== "npm ci")
        : config.verificationCommands

    for (const commandValue of commands) {
        console.log(`[foundry] verify: ${commandValue}`)
        await runCommand(commandValue)
    }
}

async function publish(config, batch, reportDirectory) {
    if (batch.publish.skipPreview !== true || config.skipPreviewByDefault !== true) {
        throw new Error("Motion Foundry direct-production mode requires preview skipping to be enabled")
    }

    await verifyPublishTarget(config)
    console.log(`[foundry] deploying directly to ${config.vercel.projectName}; no preview will be created`)
    const deployResult = await runCommand(config.vercel.deployCommand, { capture: true })
    if (deployResult.stdout) console.log(deployResult.stdout)
    if (deployResult.stderr) console.error(deployResult.stderr)

    const smoke = await smokeProduction(config)
    const receipt = {
        schemaVersion: "1.0",
        batchId: batch.id,
        deployedAt: new Date().toISOString(),
        repository: config.repository,
        branch: config.productionBranch,
        vercel: {
            teamId: config.vercel.teamId,
            projectId: config.vercel.projectId,
            projectName: config.vercel.projectName,
            productionDomain: config.vercel.productionDomain,
        },
        previewCreated: false,
        smoke,
    }
    await writeJson(path.join(reportDirectory, "production-receipt.json"), receipt)
    console.log(`[foundry] production live: ${config.vercel.productionDomain}`)
}

async function main() {
    const config = await loadConfig()

    switch (command) {
        case "plan": {
            await createPlan(batchArgument)
            break
        }
        case "verify": {
            await createPlan(batchArgument)
            await verify(config)
            break
        }
        case "batch": {
            const { batch, reportDirectory } = await createPlan(batchArgument)
            await verify(config)
            if (flags.has("--prod")) await publish(config, batch, reportDirectory)
            else console.log("[foundry] batch verified; production was not requested")
            break
        }
        case "publish": {
            const { batch, reportDirectory } = await createPlan(batchArgument)
            if (!flags.has("--skip-verify")) await verify(config)
            await publish(config, batch, reportDirectory)
            break
        }
        case "status": {
            console.log(
                JSON.stringify(
                    {
                        repository: config.repository,
                        productionBranch: config.productionBranch,
                        skipPreview: config.skipPreviewByDefault,
                        vercelProject: config.vercel.projectName,
                        productionDomain: config.vercel.productionDomain,
                        publishGuard: `${config.publishGuard.requiredEnv}=${config.publishGuard.requiredValue}`,
                    },
                    null,
                    2,
                ),
            )
            break
        }
        default:
            console.log(`NOX Motion Foundry v1\n\nCommands:\n  npm run foundry:plan -- <batch.json>\n  npm run foundry:verify -- <batch.json>\n  npm run foundry:batch -- <batch.json>\n  NOX_MOTION_FOUNDRY_PROD_GO=GO npm run foundry:prod -- <batch.json>\n\nFlags:\n  --fast         Skip npm ci during verification\n  --prod         Publish after the batch command\n  --skip-verify  Publish an already verified clean main checkout\n`)
    }
}

main().catch((error) => {
    console.error(`[foundry] ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
})
