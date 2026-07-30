import { noxLabsBrandKit } from "./noxLabs"
import type { MotionBrandKit } from "./types"

export type {
    MotionBrandColors,
    MotionBrandKit,
    MotionEnergy,
    MotionLogoPlacement,
} from "./types"

const brandKits = [noxLabsBrandKit] satisfies MotionBrandKit[]

export const motionBrandKits = Object.freeze(
    Object.fromEntries(brandKits.map((brandKit) => [brandKit.id, brandKit])) as Record<
        string,
        MotionBrandKit
    >,
)

export function getMotionBrandKit(id: string): MotionBrandKit {
    const brandKit = motionBrandKits[id]
    if (!brandKit) throw new Error(`Unknown motion brand kit: ${id}`)
    return brandKit
}

export function resolveMotionBrandKit(
    value: string | MotionBrandKit | undefined,
): MotionBrandKit | undefined {
    if (!value) return undefined
    return typeof value === "string" ? getMotionBrandKit(value) : value
}
