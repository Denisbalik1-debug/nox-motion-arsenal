export type MotionEnergy = "calm" | "charged" | "overdrive"

export type MotionLogoPlacement =
    | "none"
    | "core"
    | "card"
    | "watermark"
    | "floating"

export type MotionBrandColors = {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
}

export type MotionBrandKit = {
    id: string
    label: string
    logo?: string
    monogram?: string
    colors: MotionBrandColors
    glowStrength: number
    motionIntensity: number
    defaultEnergy: MotionEnergy
    logoPlacement: MotionLogoPlacement
    fontFamily?: string
    metadata?: Record<string, string>
}
