// Delivered by Originkit · NOX overdrive adaptation · stack: react
"use client"

import { useEffect, useMemo, useRef } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"

const makeFallbackImage = (primary: string, secondary: string, index: number) =>
    `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop stop-color="${primary}"/>
                    <stop offset="1" stop-color="#060611"/>
                </linearGradient>
                <radialGradient id="orb" cx="35%" cy="28%" r="72%">
                    <stop stop-color="#ffffff" stop-opacity=".88"/>
                    <stop offset=".2" stop-color="${secondary}" stop-opacity=".96"/>
                    <stop offset="1" stop-color="${secondary}" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect width="600" height="600" fill="url(#bg)"/>
            <circle cx="${150 + index * 42}" cy="${170 + (index % 3) * 86}" r="230" fill="url(#orb)"/>
            <path d="M-40 ${460 - index * 18}L640 ${168 + index * 24}" stroke="#ffffff" stroke-opacity=".3" stroke-width="3"/>
            <path d="M${80 + index * 24} 650L${440 - index * 18} -40" stroke="${secondary}" stroke-opacity=".6" stroke-width="18"/>
        </svg>
    `)}`

const FALLBACK_IMAGES = [
    ["#4f46e5", "#67e8f9"],
    ["#db2777", "#fbbf24"],
    ["#0f766e", "#2dd4bf"],
    ["#7c3aed", "#c4b5fd"],
    ["#be123c", "#fb7185"],
    ["#1d4ed8", "#93c5fd"],
    ["#a16207", "#fde047"],
    ["#4338ca", "#e879f9"],
].map(([primary, secondary], index) => makeFallbackImage(primary, secondary, index))

type ImageLike =
    | string
    | {
          src?: string
          url?: string
          srcSet?: string
      }

type SpinImageProps = {
    images?: ImageLike[]
    imageWidth?: number
    imageHeight?: number
    direction?: "clockwise" | "anticlockwise"
    path?: "curved" | "straight"
    xCurve?: number
    yCurve?: number
    speed?: number
    rounded?: number
    orbitUnit?: "px" | "%"
    orbitWidthPx?: number
    orbitWidthPct?: number
    depth?: number
    interactionTilt?: number
    hoverBoost?: number
    focusScale?: number
    cardTilt?: number
    trail?: number
    glowStrength?: number
    glowColor?: string
    showCore?: boolean
}

type MotionState = {
    phi: number
    pointerX: number
    pointerY: number
    targetX: number
    targetY: number
    boost: number
    boostTarget: number
    impulse: number
    lastPointerX: number
    lastPointerY: number
    lastPointerAt: number
    lastFrameAt: number
}

const TAU = Math.PI * 2
const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
const damp = (current: number, target: number, lambda: number, dt: number) =>
    current + (target - current) * (1 - Math.exp(-lambda * dt))

const extractUrl = (item: ImageLike | null | undefined): string | null => {
    if (!item) return null
    if (typeof item === "string") return item.trim() || null
    const url =
        item.src ||
        item.url ||
        (typeof item.srcSet === "string" ? item.srcSet.split(" ")[0] : null)
    return typeof url === "string" ? url.trim() || null : null
}

export default function SpinImage({
    images,
    imageWidth = 150,
    imageHeight = 150,
    direction = "anticlockwise",
    path = "curved",
    xCurve = -18,
    yCurve = 12,
    speed = 3,
    rounded = 18,
    orbitUnit = "%",
    orbitWidthPx = 760,
    orbitWidthPct = 72,
    depth = 108,
    interactionTilt = 7,
    hoverBoost = 1.9,
    focusScale = 1.18,
    cardTilt = 4,
    trail = 0.2,
    glowStrength = 0.68,
    glowColor = "#7c3aed",
    showCore = true,
}: SpinImageProps) {
    const items = useMemo(() => {
        const userUrls = Array.isArray(images)
            ? images.map(extractUrl).filter((url): url is string => Boolean(url))
            : []
        return (userUrls.length > 0 ? userUrls : FALLBACK_IMAGES).slice(0, 30)
    }, [images])

    const stageRef = useRef<HTMLDivElement | null>(null)
    const orbitRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<Array<HTMLDivElement | null>>([])
    const ghostRefs = useRef<Array<HTMLDivElement | null>>([])
    const metricsRef = useRef({ width: 0, height: 0 })
    const activeRef = useRef(true)
    const visibleRef = useRef(true)
    const reducedMotionRef = useRef(false)
    const motionRef = useRef<MotionState>({
        phi: 0,
        pointerX: 0,
        pointerY: 0,
        targetX: 0,
        targetY: 0,
        boost: 1,
        boostTarget: 1,
        impulse: 0,
        lastPointerX: 0,
        lastPointerY: 0,
        lastPointerAt: 0,
        lastFrameAt: 0,
    })

    const safeImageWidth = Math.max(1, imageWidth)
    const safeImageHeight = Math.max(1, imageHeight)
    const safeRounded = clamp(rounded, 0, 100)
    const radius = (safeRounded / 100) * (Math.min(safeImageWidth, safeImageHeight) / 2)
    const safeDepth = clamp(depth, 0, 220)
    const safeInteractionTilt = clamp(interactionTilt, 0, 9)
    const safeHoverBoost = clamp(hoverBoost, 1, 4)
    const safeFocusScale = clamp(focusScale, 0.8, 1.8)
    const safeCardTilt = clamp(cardTilt, 0, 24)
    const safeTrail = clamp(trail, 0, 1)
    const safeGlowStrength = clamp(glowStrength, 0, 1.6)
    const baseRevsPerSecond = clamp(speed, 0, 20) * 0.05
    const directionSign = direction === "anticlockwise" ? -1 : 1

    useEffect(() => {
        const stage = stageRef.current
        if (!stage) return

        const resizeObserver = new ResizeObserver(([entry]) => {
            if (!entry) return
            metricsRef.current.width = Math.round(entry.contentRect.width)
            metricsRef.current.height = Math.round(entry.contentRect.height)
        })
        resizeObserver.observe(stage)

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                visibleRef.current = entry?.isIntersecting ?? true
            },
            { rootMargin: "160px" },
        )
        intersectionObserver.observe(stage)

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const syncReducedMotion = () => {
            reducedMotionRef.current = mediaQuery.matches
        }
        syncReducedMotion()
        mediaQuery.addEventListener?.("change", syncReducedMotion)

        const syncVisibility = () => {
            activeRef.current = document.visibilityState !== "hidden"
        }
        syncVisibility()
        document.addEventListener("visibilitychange", syncVisibility)

        return () => {
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            mediaQuery.removeEventListener?.("change", syncReducedMotion)
            document.removeEventListener("visibilitychange", syncVisibility)
        }
    }, [])

    useEffect(() => {
        let frameId = 0
        const motion = motionRef.current
        motion.lastFrameAt = performance.now()

        const renderFrame = (now: number) => {
            frameId = requestAnimationFrame(renderFrame)
            if (!activeRef.current || !visibleRef.current) {
                motion.lastFrameAt = now
                return
            }

            const { width, height } = metricsRef.current
            if (!width || !height || items.length === 0) return

            const dt = Math.min(0.05, Math.max(0.001, (now - motion.lastFrameAt) / 1000))
            motion.lastFrameAt = now
            motion.pointerX = damp(motion.pointerX, motion.targetX, 9, dt)
            motion.pointerY = damp(motion.pointerY, motion.targetY, 9, dt)
            motion.boost = damp(motion.boost, motion.boostTarget, 5, dt)
            motion.impulse = damp(motion.impulse, 0, 3.5, dt)

            if (!reducedMotionRef.current && baseRevsPerSecond > 0) {
                const velocity = baseRevsPerSecond * (motion.boost + motion.impulse)
                motion.phi = (motion.phi + directionSign * TAU * velocity * dt) % TAU
            }

            const requestedOrbitWidth =
                orbitUnit === "px"
                    ? Math.max(0, orbitWidthPx)
                    : (clamp(orbitWidthPct, 0, 100) / 100) * width
            const maxOrbitWidth = Math.max(
                safeImageWidth * 1.4,
                width - safeImageWidth * 1.2,
            )
            const orbitWidth = Math.min(requestedOrbitWidth, maxOrbitWidth)
            const a = Math.max(1, orbitWidth / 2)
            const b = Math.min(
                a * (path === "curved" ? 0.28 : 0.22),
                Math.max(1, height * 0.16),
            )
            const diagonalAngle = path === "curved" ? -0.06 : 0
            const cosDiagonal = Math.cos(diagonalAngle)
            const sinDiagonal = Math.sin(diagonalAngle)
            const pointerYaw = clamp(motion.pointerX * safeInteractionTilt, -9, 9)
            const pointerPitch = clamp(motion.pointerY * safeInteractionTilt, -9, 9)
            const orbitYaw = xCurve + pointerYaw
            const orbitPitch = -yCurve + pointerPitch

            if (orbitRef.current) {
                orbitRef.current.style.transform = `rotateY(${orbitYaw}deg) rotateX(${orbitPitch}deg)`
            }

            for (let index = 0; index < items.length; index += 1) {
                const phi = (index / items.length) * TAU + motion.phi
                const ex = a * Math.cos(phi)
                const ey = b * Math.sin(phi)
                const x = ex * cosDiagonal - ey * sinDiagonal
                const y = ex * sinDiagonal + ey * cosDiagonal
                const depthSignal = Math.sin(phi)
                const z = safeDepth * depthSignal
                const normalizedDepth = (depthSignal + 1) / 2
                const curvedScale = 0.58 + normalizedDepth * (safeFocusScale - 0.58)
                const scale = path === "curved" ? curvedScale : 1
                const tangentTilt = Math.cos(phi) * safeCardTilt * directionSign
                const opacity = 0.48 + normalizedDepth * 0.52
                const blur = path === "curved" ? (1 - normalizedDepth) * 1.3 : 0
                const brightness = 0.68 + normalizedDepth * 0.48
                const transform = [
                    `translate3d(${x - safeImageWidth / 2}px, ${y - safeImageHeight / 2}px, ${z}px)`,
                    `rotateX(${-orbitPitch}deg)`,
                    `rotateY(${-orbitYaw}deg)`,
                    `rotateZ(${tangentTilt}deg)`,
                    `scale(${scale})`,
                ].join(" ")

                const card = cardRefs.current[index]
                if (card) {
                    card.style.transform = transform
                    card.style.zIndex = String(Math.round(normalizedDepth * 1000))
                    card.style.opacity = String(opacity)
                    card.style.filter = `brightness(${brightness}) saturate(${0.82 + normalizedDepth * 0.5}) blur(${blur}px)`
                    card.style.boxShadow = [
                        `0 ${12 + normalizedDepth * 24}px ${30 + normalizedDepth * 46}px rgba(0,0,0,${0.26 + normalizedDepth * 0.28})`,
                        `0 0 ${18 + normalizedDepth * 34}px color-mix(in srgb, ${glowColor} ${Math.round(22 * safeGlowStrength * normalizedDepth)}%, transparent)`,
                        `inset 0 0 0 1px rgba(255,255,255,${0.12 + normalizedDepth * 0.18})`,
                    ].join(", ")
                    card.style.setProperty("--nox-shine-x", `${50 + motion.pointerX * 42}%`)
                    card.style.setProperty("--nox-shine-y", `${50 + motion.pointerY * 42}%`)
                    card.style.setProperty("--nox-front", String(normalizedDepth))
                    card.style.setProperty("--nox-shine-alpha", String(0.08 + normalizedDepth * 0.32))
                }

                const ghost = ghostRefs.current[index]
                if (ghost && safeTrail > 0.01 && !reducedMotionRef.current) {
                    const trailPhi = phi - directionSign * (0.16 + baseRevsPerSecond * 0.28)
                    const ghostEx = a * Math.cos(trailPhi)
                    const ghostEy = b * Math.sin(trailPhi)
                    const ghostX = ghostEx * cosDiagonal - ghostEy * sinDiagonal
                    const ghostY = ghostEx * sinDiagonal + ghostEy * cosDiagonal
                    const ghostDepthSignal = Math.sin(trailPhi)
                    const ghostZ = safeDepth * ghostDepthSignal
                    const ghostScale = path === "curved" ? 0.55 + ((ghostDepthSignal + 1) / 2) * 0.42 : 0.92
                    ghost.style.transform = [
                        `translate3d(${ghostX - safeImageWidth / 2}px, ${ghostY - safeImageHeight / 2}px, ${ghostZ - 30}px)`,
                        `rotateX(${-orbitPitch}deg)`,
                        `rotateY(${-orbitYaw}deg)`,
                        `scale(${ghostScale})`,
                    ].join(" ")
                    ghost.style.opacity = String(safeTrail * (0.08 + normalizedDepth * 0.16))
                    ghost.style.display = "block"
                } else if (ghost) {
                    ghost.style.display = "none"
                }
            }
        }

        frameId = requestAnimationFrame(renderFrame)
        return () => cancelAnimationFrame(frameId)
    }, [
        items,
        safeImageWidth,
        safeImageHeight,
        directionSign,
        path,
        xCurve,
        yCurve,
        baseRevsPerSecond,
        orbitUnit,
        orbitWidthPx,
        orbitWidthPct,
        safeDepth,
        safeInteractionTilt,
        safeFocusScale,
        safeCardTilt,
        safeTrail,
        safeGlowStrength,
        glowColor,
    ])

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        const nextX = clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1)
        const nextY = clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1)
        const now = performance.now()
        const motion = motionRef.current
        const elapsed = Math.max(16, now - motion.lastPointerAt)
        const distance = Math.hypot(nextX - motion.lastPointerX, nextY - motion.lastPointerY)
        motion.targetX = nextX
        motion.targetY = nextY
        motion.impulse = clamp(motion.impulse + (distance / elapsed) * 46, 0, 2.2)
        motion.lastPointerX = nextX
        motion.lastPointerY = nextY
        motion.lastPointerAt = now
    }

    const handlePointerEnter = () => {
        motionRef.current.boostTarget = safeHoverBoost
    }

    const handlePointerLeave = () => {
        const motion = motionRef.current
        motion.targetX = 0
        motion.targetY = 0
        motion.boostTarget = 1
    }

    const cardBaseStyle: CSSProperties = {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: safeImageWidth,
        height: safeImageHeight,
        borderRadius: radius,
        overflow: "hidden",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transformOrigin: "center",
        backfaceVisibility: "hidden",
        willChange: "transform, opacity, filter",
        pointerEvents: "none",
    }

    return (
        <div
            ref={stageRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            aria-label="Interactive orbital image carousel"
            role="img"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 360,
                overflow: "hidden",
                isolation: "isolate",
                perspective: 1500,
                background:
                    "radial-gradient(circle at 50% 50%, rgba(124,58,237,.12), transparent 34%), radial-gradient(circle at 50% 110%, rgba(34,211,238,.09), transparent 42%), #050509",
                cursor: "crosshair",
                touchAction: "pan-y",
            }}
        >
            <style>{`
                @keyframes nox-spinimage-core-pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(.94); opacity: .62; }
                    50% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
                }
                @keyframes nox-spinimage-ring-drift {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nox-spinimage__core, .nox-spinimage__ring { animation: none !important; }
                }
            `}</style>

            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: -3,
                    opacity: 0.24,
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage: "radial-gradient(circle at center, black, transparent 72%)",
                }}
            />
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: "-30%",
                    zIndex: -2,
                    background: `conic-gradient(from 90deg at 50% 50%, transparent 0deg, color-mix(in srgb, ${glowColor} 28%, transparent) 68deg, transparent 138deg, rgba(34,211,238,.16) 225deg, transparent 310deg)`,
                    filter: "blur(42px)",
                    opacity: 0.72 * safeGlowStrength,
                }}
            />
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 8,
                    pointerEvents: "none",
                    boxShadow: "inset 0 0 140px 48px rgba(0,0,0,.72)",
                }}
            />

            {showCore && (
                <>
                    <div
                        className="nox-spinimage__ring"
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: "min(28vw, 260px)",
                            aspectRatio: "1",
                            borderRadius: "50%",
                            border: `1px solid color-mix(in srgb, ${glowColor} 46%, transparent)`,
                            boxShadow: `0 0 46px color-mix(in srgb, ${glowColor} 20%, transparent), inset 0 0 42px rgba(34,211,238,.08)`,
                            transform: "translate(-50%, -50%)",
                            animation: "nox-spinimage-ring-drift 18s linear infinite",
                            opacity: 0.52,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        className="nox-spinimage__core"
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            transform: "translate(-50%, -50%)",
                            background: `radial-gradient(circle at 36% 32%, #fff 0 2%, #67e8f9 7%, ${glowColor} 28%, rgba(10,8,24,.96) 64%, transparent 70%)`,
                            boxShadow: `0 0 22px rgba(103,232,249,.8), 0 0 74px color-mix(in srgb, ${glowColor} ${Math.round(58 * safeGlowStrength)}%, transparent), 0 0 150px color-mix(in srgb, ${glowColor} ${Math.round(24 * safeGlowStrength)}%, transparent)`,
                            animation: "nox-spinimage-core-pulse 3.2s ease-in-out infinite",
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}

            <div
                ref={orbitRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
            >
                {items.map((src, index) => (
                    <div
                        key={`ghost-${src}-${index}`}
                        ref={(node: HTMLDivElement | null) => {
                            ghostRefs.current[index] = node
                        }}
                        aria-hidden="true"
                        style={{
                            ...cardBaseStyle,
                            backgroundImage: `linear-gradient(color-mix(in srgb, ${glowColor} 72%, transparent), rgba(34,211,238,.34)), url(${JSON.stringify(src)})`,
                            backgroundBlendMode: "screen",
                            filter: "blur(14px) saturate(1.8)",
                            mixBlendMode: "screen",
                            opacity: 0,
                        }}
                    />
                ))}

                {items.map((src, index) => (
                    <div
                        key={`${src}-${index}`}
                        ref={(node: HTMLDivElement | null) => {
                            cardRefs.current[index] = node
                        }}
                        aria-hidden="true"
                        style={{
                            ...cardBaseStyle,
                            backgroundImage: `url(${JSON.stringify(src)})`,
                            border: "1px solid rgba(255,255,255,.14)",
                        }}
                    >
                        <div
                            aria-hidden="true"
                            style={
                                {
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "radial-gradient(circle at var(--nox-shine-x, 50%) var(--nox-shine-y, 50%), rgba(255,255,255,var(--nox-shine-alpha, .2)), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.12), transparent 34%, rgba(124,58,237,.1) 72%, rgba(34,211,238,.14))",
                                    mixBlendMode: "screen",
                                    opacity: 0.9,
                                } as CSSProperties
                            }
                        />
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                boxShadow: "inset 0 0 34px rgba(0,0,0,.22)",
                            }}
                        />
                    </div>
                ))}
            </div>

            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 22,
                    bottom: 18,
                    zIndex: 9,
                    font: "600 9px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
                    letterSpacing: ".22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.42)",
                    pointerEvents: "none",
                }}
            >
                NOX // ORBITAL IMAGE ARRAY
            </div>
        </div>
    )
}

SpinImage.defaultProps = {
    direction: "anticlockwise",
    path: "curved",
    xCurve: -68,
    yCurve: -42,
    speed: 3,
    imageWidth: 150,
    imageHeight: 150,
    rounded: 18,
    orbitUnit: "%",
    orbitWidthPx: 760,
    orbitWidthPct: 72,
    depth: 180,
    interactionTilt: 9,
    hoverBoost: 1.9,
    focusScale: 1.28,
    cardTilt: 7,
    trail: 0.58,
    glowStrength: 0.9,
    glowColor: "#7c3aed",
    showCore: true,
}
