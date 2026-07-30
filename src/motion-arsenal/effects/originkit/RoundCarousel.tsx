// Delivered by Originkit · stack: react
// Set these props to match the Originkit preview:
//   overrides={{}}
//   __curationVersion={1}

import { useEffect, useRef } from "react"
import { useIsStaticRenderer } from "./framerRuntime"

const IMAGE_URLS = [
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/e60dd7f7-a44f-40a7-df62-095b19cd8700/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/eec164e9-23f8-4f87-b48a-a208fa806100/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/859c75ea-953e-489e-be61-91a03a35d700/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/933a7615-f4b6-4eae-8ed1-705fa0e24400/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/7d4d2641-d6a8-4fef-e85c-b12ed100d500/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/ed7b1c40-3332-43d8-a9eb-4615ef341b00/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/31afae9c-5ba3-4ec3-2534-ed8198ed1100/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/bd541261-75be-469c-7dc0-dae0ce81c400/w=800",
]
const DEFAULT_IMAGES = IMAGE_URLS.map((src) => ({ src }))

/**
 * Round Carousel
 * Rounded cards arranged around a vertical cylinder. Each card is two-sided:
 * the outer face shows the real image, the inner face shows the same image
 * mirrored (and dimmed). Auto-rotates; drag to spin with momentum.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
export default function RoundCarousel(props: any) {
    const {
        images = [],
        imageWidth = 300,
        imageHeight = 300,
        spacing = 3,
        speed = 7,
        direction = "right",
        drag = true,
        sensitivity = 5,
        tilt = -7,
        perspective = 3000,
        cornerRadius = 22,
        innerDim = 3.5,
        background = "#000000",
        style = {},
    } = props

    const items: any[] = images.length > 0 ? images : DEFAULT_IMAGES
    const count = items.length

    const isStatic = useIsStaticRenderer()
    const ringRef = useRef<HTMLDivElement>(null)
    const rafRef = useRef(0)
    const rotYRef = useRef(0)
    const velRef = useRef(0)
    const lastRef = useRef(0)
    const dragRef = useRef({ active: false, x: 0 })

    const angle = 360 / count
    // Spacing 0–20: factor 1 = touching, higher = farther apart.
    const factor = 1 + spacing * 0.15
    const radius = (imageWidth * factor) / (2 * Math.tan(Math.PI / count))
    const radiusPx = cornerRadius
    const degPerSec = speed * 6 * (direction === "left" ? -1 : 1)

    useEffect(() => {
        const ring = ringRef.current
        if (!ring) return
        const apply = () =>
            (ring.style.transform = `translateZ(${-radius}px) rotateY(${rotYRef.current}deg)`)
        apply()

        const draw = (now: number) => {
            const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0
            lastRef.current = now
            const f = Math.min(dt, 0.1)
            const d = dragRef.current
            if (!d.active) {
                if (Math.abs(velRef.current) > 0.01) {
                    rotYRef.current += velRef.current * f
                    velRef.current *= 0.94
                } else {
                    rotYRef.current += degPerSec * f
                }
            }
            apply()
            rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(rafRef.current)
    }, [radius, degPerSec, isStatic, count])

    const onPointerDown = (e: React.PointerEvent) => {
        if (isStatic || !drag) return
        e.currentTarget.setPointerCapture?.(e.pointerId)
        dragRef.current = { active: true, x: e.clientX }
        velRef.current = 0
    }
    const onPointerMove = (e: React.PointerEvent) => {
        const d = dragRef.current
        if (!d.active) return
        const dx = e.clientX - d.x
        d.x = e.clientX
        const k = 0.3 * sensitivity
        rotYRef.current += dx * k
        velRef.current = dx * k * 60
    }
    const onPointerUp = (e: React.PointerEvent) => {
        e.currentTarget.releasePointerCapture?.(e.pointerId)
        dragRef.current.active = false
    }

    const faceBase: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius: radiusPx,
        overflow: "hidden",
        backfaceVisibility: "hidden",
        backgroundSize: "cover",
        backgroundPosition: "center",
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                background,
                perspective: `${perspective}px`,
                cursor: drag && !isStatic ? "grab" : "default",
                touchAction: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <div
                style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${tilt}deg)`,
                }}
            >
                <div
                    ref={ringRef}
                    style={{
                        position: "relative",
                        width: imageWidth,
                        height: imageHeight,
                        transformStyle: "preserve-3d",
                    }}
                >
                    {items.map((img, i) => {
                        const src = img?.src
                        return (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                {/* Outer face — real image */}
                                <div
                                    style={{
                                        ...faceBase,
                                        backgroundColor: src
                                            ? "transparent"
                                            : "#222",
                                        backgroundImage: src
                                            ? `url(${src})`
                                            : undefined,
                                        boxShadow:
                                            "0 10px 30px rgba(0,0,0,0.35)",
                                    }}
                                />
                                {/* Inner face — same image, mirrored + dimmed.
                                    rotateY(180) both faces it inward and flips
                                    the image horizontally (the mirror). */}
                                <div
                                    style={{
                                        ...faceBase,
                                        transform: "rotateY(180deg)",
                                        backgroundColor: src
                                            ? "transparent"
                                            : "#181818",
                                        backgroundImage: src
                                            ? `url(${src})`
                                            : undefined,
                                        filter: `brightness(${innerDim / 10})`,
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

RoundCarousel.displayName = "Round Carousel"
