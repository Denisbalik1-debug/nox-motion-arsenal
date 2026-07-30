// Delivered by Originkit · stack: react
// Hardened for the NOX Motion Arsenal: DPR-aware, pointer/touch/keyboard
// accessible, visibility-paused, resize-safe, and performance-capped.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react"
import { RenderTarget } from "./framerRuntime"

export const PIXELCARD_DEFAULT_MAX_PIXELS = 6500
const MAX_DPR = 2

type AnimationMode = "appear" | "disappear"

export class Pixel {
    ctx: CanvasRenderingContext2D
    x: number
    y: number
    color: string
    speed: number
    size = 0
    sizeStep: number
    minSize: number
    maxSizeInteger: number
    maxSize: number
    delay: number
    counter = 0
    counterStep: number
    isIdle = true
    isReverse = false
    isShimmer = false

    constructor(
        width: number,
        height: number,
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        color: string,
        speed: number,
        delay: number,
        maxPx: number
    ) {
        this.ctx = context
        this.x = x
        this.y = y
        this.color = color
        this.speed = Math.max(0.004, this.random(0.1, 0.9) * speed)
        const safeMax = Math.min(8, Math.max(0.5, maxPx))
        const factor = safeMax / 2
        this.sizeStep = Math.max(0.04, Math.random() * 0.4 * factor)
        this.minSize = Math.max(0.2, 0.5 * factor)
        this.maxSizeInteger = safeMax
        this.maxSize = Math.max(this.minSize, this.random(this.minSize, safeMax))
        this.delay = Math.max(0, delay)
        this.counterStep = Math.max(1, Math.random() * 4 + (width + height) * 0.01)
    }

    private random(min: number, max: number) {
        return Math.random() * (max - min) + min
    }

    draw() {
        const safeSize = Math.max(0, Math.min(this.size, this.maxSizeInteger))
        if (safeSize <= 0) return
        const centerOffset = this.maxSizeInteger * 0.5 - safeSize * 0.5
        this.ctx.fillStyle = this.color
        this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, safeSize, safeSize)
    }

    appear() {
        this.isIdle = false
        if (this.counter <= this.delay) {
            this.counter += this.counterStep
            return
        }
        if (this.size >= this.maxSize) this.isShimmer = true
        if (this.isShimmer) this.shimmer()
        else this.size = Math.min(this.maxSize, this.size + this.sizeStep)
        this.draw()
    }

    disappear() {
        this.isShimmer = false
        this.counter = 0
        this.size = Math.max(0, this.size - Math.max(0.1, this.sizeStep * 0.45))
        this.isIdle = this.size === 0
        this.draw()
    }

    shimmer() {
        if (this.size >= this.maxSize) this.isReverse = true
        if (this.size <= this.minSize) this.isReverse = false
        this.size = this.isReverse
            ? Math.max(this.minSize, this.size - this.speed)
            : Math.min(this.maxSize, this.size + this.speed)
    }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
    if (reducedMotion) return 0
    return Math.min(100, Math.max(0, value)) * 0.002
}

const DEFAULT_COLORS = [
    "rgba(255, 255, 255, 1)",
    "rgba(255, 255, 255, 0.8)",
    "rgba(255, 255, 255, 0.6)",
]

interface LabelGroup {
    text?: string
    color?: string
    font?: CSSProperties
}

type AppearFrom = "middle" | "top" | "bottom" | "left" | "right"
type Trigger = "default" | "hover" | "enter"
type EnterPosition = "above" | "middle" | "below"

export interface PixelCardProps {
    colors?: string[]
    color?: string
    gap?: number
    pixelSize?: number
    maxPixels?: number
    speed?: number
    appearFrom?: AppearFrom
    trigger?: Trigger
    enterPosition?: EnterPosition
    enterReplay?: "yes" | "no"
    backgroundColor?: string
    padding?: number
    borderColor?: string
    borderWidth?: number
    radius?: number
    showLabel?: boolean
    label?: LabelGroup
    style?: CSSProperties
}

export default function PixelCard(props: PixelCardProps) {
    const {
        colors,
        color,
        gap = 6,
        pixelSize = 2,
        maxPixels = PIXELCARD_DEFAULT_MAX_PIXELS,
        speed = 80,
        appearFrom = "middle",
        trigger = "hover",
        enterPosition = "above",
        enterReplay = "no",
        backgroundColor = "#000000",
        padding = 0,
        borderColor = "#27272a",
        borderWidth = 1,
        radius = 25,
        showLabel = false,
        label,
        style,
    } = props

    const labelCfg: LabelGroup = { text: "", color: "#ffffff", ...label }
    const renderTarget = RenderTarget.current()
    const isExport = renderTarget === RenderTarget.export || renderTarget === RenderTarget.thumbnail
    const isCanvas = renderTarget === RenderTarget.canvas
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const pixelsRef = useRef<Pixel[]>([])
    const animationRef = useRef<number | null>(null)
    const resizeFrameRef = useRef<number | null>(null)
    const animationModeRef = useRef<AnimationMode | null>(null)
    const mountedRef = useRef(false)
    const inViewportRef = useRef(true)
    const documentVisibleRef = useRef(
        typeof document === "undefined" || document.visibilityState === "visible"
    )
    const hasPlayedRef = useRef(false)
    const revealedRef = useRef(false)
    const sizeRef = useRef({ w: 0, h: 0, dpr: 0 })
    const propsKeyRef = useRef("")
    const timePreviousRef = useRef(
        typeof performance !== "undefined" ? performance.now() : 0
    )
    const reducedMotion = useRef(
        typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ).current
    const hoverCapable = useRef(
        typeof window !== "undefined" &&
            window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ).current
    const [focused, setFocused] = useState(false)

    const finalColors = color
        ? [color]
        : colors && colors.length > 0
          ? colors
          : DEFAULT_COLORS
    const finalGap = Math.max(1, Math.floor(gap))
    const finalSpeed = Math.min(100, Math.max(0, speed))
    const finalMaxPixels = Math.min(12000, Math.max(500, Math.floor(maxPixels)))
    const shouldAutoReveal =
        isCanvas || trigger === "default" || (trigger === "hover" && !hoverCapable)

    const setCanvasState = (state: string) => {
        if (canvasRef.current) canvasRef.current.dataset.animationState = state
    }

    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext("2d")
        if (ctx) ctx.clearRect(0, 0, sizeRef.current.w, sizeRef.current.h)
    }

    const cancelAnimation = () => {
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }
    }

    const canAnimate = () =>
        mountedRef.current &&
        inViewportRef.current &&
        documentVisibleRef.current &&
        !reducedMotion

    const drawStaticFrame = () => {
        clearCanvas()
        for (const pixel of pixelsRef.current) {
            pixel.size = pixel.maxSize
            pixel.isShimmer = false
            pixel.isIdle = true
            pixel.draw()
        }
        setCanvasState("static")
    }

    const drawIdleFrame = () => {
        clearCanvas()
        for (const pixel of pixelsRef.current) {
            pixel.size = Math.max(0.22, pixel.minSize * 0.58)
            pixel.isShimmer = false
            pixel.isIdle = true
            pixel.draw()
        }
        setCanvasState("idle")
    }

    const stepAnimation = (timeNow: number) => {
        animationRef.current = null
        const mode = animationModeRef.current
        if (!mode || !canAnimate()) return

        const timePassed = timeNow - timePreviousRef.current
        const timeInterval = 1000 / 60
        if (timePassed < timeInterval) {
            animationRef.current = requestAnimationFrame(stepAnimation)
            return
        }
        timePreviousRef.current = timeNow - (timePassed % timeInterval)

        clearCanvas()
        let allIdle = mode === "disappear"
        for (const pixel of pixelsRef.current) {
            pixel[mode]()
            if (mode === "disappear" && !pixel.isIdle) allIdle = false
        }

        if (mode === "appear" || !allIdle) {
            animationRef.current = requestAnimationFrame(stepAnimation)
        } else {
            animationModeRef.current = null
            setCanvasState("hidden")
        }
    }

    const startAnimation = (mode: AnimationMode) => {
        cancelAnimation()
        animationModeRef.current = mode
        if (reducedMotion) {
            drawStaticFrame()
            return
        }
        setCanvasState(mode)
        if (canAnimate()) {
            timePreviousRef.current = performance.now()
            animationRef.current = requestAnimationFrame(stepAnimation)
        }
    }

    const reveal = () => {
        revealedRef.current = true
        startAnimation("appear")
    }

    const hide = () => {
        if (reducedMotion) drawStaticFrame()
        else startAnimation("disappear")
    }

    const snapToShimmer = () => {
        clearCanvas()
        for (const pixel of pixelsRef.current) {
            pixel.size = pixel.maxSize
            pixel.isShimmer = true
            pixel.isIdle = false
            pixel.counter = pixel.delay + pixel.counterStep
            pixel.draw()
        }
        reveal()
    }

    const initPixels = (force = false): boolean => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return false

        const rect = container.getBoundingClientRect()
        const width = Math.floor(container.clientWidth || rect.width || 0)
        const height = Math.floor(container.clientHeight || rect.height || 0)
        if (width <= 0 || height <= 0) return false

        const dpr = Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1))
        const changed =
            sizeRef.current.w !== width ||
            sizeRef.current.h !== height ||
            sizeRef.current.dpr !== dpr
        if (!force && !changed && pixelsRef.current.length > 0) return false

        const ctx = canvas.getContext("2d")
        if (!ctx) return false
        sizeRef.current = { w: width, h: height, dpr }
        canvas.width = Math.max(1, Math.round(width * dpr))
        canvas.height = Math.max(1, Math.round(height * dpr))
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        let step = Math.max(
            finalGap,
            Math.ceil(Math.sqrt((width * height) / finalMaxPixels))
        )
        while (Math.ceil(width / step) * Math.ceil(height / step) > finalMaxPixels) {
            step += 1
        }

        const pxs: Pixel[] = []
        let index = 0
        for (let x = step * 0.5; x < width; x += step) {
            for (let y = step * 0.5; y < height; y += step) {
                let delay = 0
                if (!reducedMotion) {
                    if (appearFrom === "top") delay = y
                    else if (appearFrom === "bottom") delay = height - y
                    else if (appearFrom === "left") delay = x
                    else if (appearFrom === "right") delay = width - x
                    else {
                        const dx = x - width / 2
                        const dy = y - height / 2
                        delay = Math.sqrt(dx * dx + dy * dy)
                    }
                }
                pxs.push(
                    new Pixel(
                        width,
                        height,
                        ctx,
                        x,
                        y,
                        finalColors[index % finalColors.length],
                        getEffectiveSpeed(finalSpeed, reducedMotion),
                        delay,
                        pixelSize
                    )
                )
                index += 1
            }
        }
        pixelsRef.current = pxs
        canvas.dataset.pixelCount = String(pxs.length)
        canvas.dataset.pixelLimit = String(finalMaxPixels)
        canvas.dataset.effectiveGap = String(step)
        canvas.dataset.dpr = String(dpr)
        return true
    }

    const present = (built: boolean) => {
        if (pixelsRef.current.length === 0) return
        if (isExport || reducedMotion) {
            drawStaticFrame()
            return
        }
        if (!shouldAutoReveal) {
            drawIdleFrame()
            return
        }
        if (!revealedRef.current) reveal()
        else if (built) snapToShimmer()
        else reveal()
    }

    useEffect(() => {
        mountedRef.current = true
        documentVisibleRef.current = document.visibilityState === "visible"
        const propsKey = `${finalGap}|${finalSpeed}|${pixelSize}|${finalMaxPixels}|${appearFrom}|${JSON.stringify(
            finalColors
        )}|${trigger}`
        const propsChanged = propsKeyRef.current !== propsKey
        propsKeyRef.current = propsKey
        present(initPixels(propsChanged))

        const resizeObserver = new ResizeObserver(() => {
            if (resizeFrameRef.current !== null) return
            resizeFrameRef.current = requestAnimationFrame(() => {
                resizeFrameRef.current = null
                const built = initPixels()
                if (!built) return
                if (isExport || reducedMotion) drawStaticFrame()
                else if (
                    revealedRef.current &&
                    animationModeRef.current === "appear"
                ) {
                    snapToShimmer()
                } else {
                    present(true)
                }
            })
        })
        if (containerRef.current) resizeObserver.observe(containerRef.current)

        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                inViewportRef.current = entry?.isIntersecting ?? false
                if (!inViewportRef.current) {
                    cancelAnimation()
                } else if (animationModeRef.current && canAnimate()) {
                    animationRef.current = requestAnimationFrame(stepAnimation)
                } else if (shouldAutoReveal) {
                    present(false)
                }
            },
            { rootMargin: "80px" }
        )
        if (containerRef.current) visibilityObserver.observe(containerRef.current)

        const onVisibilityChange = () => {
            documentVisibleRef.current = document.visibilityState === "visible"
            if (!documentVisibleRef.current) {
                cancelAnimation()
            } else if (animationModeRef.current && canAnimate()) {
                animationRef.current = requestAnimationFrame(stepAnimation)
            }
        }
        document.addEventListener("visibilitychange", onVisibilityChange)

        return () => {
            mountedRef.current = false
            animationModeRef.current = null
            cancelAnimation()
            if (resizeFrameRef.current !== null) {
                cancelAnimationFrame(resizeFrameRef.current)
                resizeFrameRef.current = null
            }
            resizeObserver.disconnect()
            visibilityObserver.disconnect()
            document.removeEventListener("visibilitychange", onVisibilityChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        finalGap,
        finalSpeed,
        pixelSize,
        finalMaxPixels,
        JSON.stringify(finalColors),
        appearFrom,
        trigger,
        isExport,
        isCanvas,
    ])

    useEffect(() => {
        if (trigger !== "enter" || isExport || isCanvas) return
        const element = containerRef.current
        if (!element) return
        const threshold =
            enterPosition === "middle" ? 0.5 : enterPosition === "below" ? 1 : 0
        hasPlayedRef.current = false
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && !hasPlayedRef.current) {
                    hasPlayedRef.current = true
                    reveal()
                } else if (!entry?.isIntersecting && enterReplay === "yes") {
                    hasPlayedRef.current = false
                    hide()
                }
            },
            { threshold }
        )
        observer.observe(element)
        return () => observer.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger, enterPosition, enterReplay, isExport, isCanvas])

    const interactive = !isExport && !isCanvas && trigger === "hover"

    const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
        if (interactive && event.pointerType !== "touch") reveal()
    }
    const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
        if (interactive && event.pointerType !== "touch") hide()
    }
    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (interactive && event.pointerType !== "mouse") reveal()
    }
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!interactive || (event.key !== "Enter" && event.key !== " ")) return
        event.preventDefault()
        reveal()
    }

    const rootStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 80,
        minHeight: 80,
        overflow: "hidden",
        boxSizing: "border-box",
        padding,
        background: backgroundColor,
        display: "grid",
        placeItems: "center",
        border: `${borderWidth}px solid ${focused ? "#d6a24a" : borderColor}`,
        borderRadius: radius,
        isolation: "isolate",
        userSelect: "none",
        touchAction: "manipulation",
        outline: focused ? "2px solid rgba(214, 162, 74, 0.9)" : "none",
        outlineOffset: focused ? -4 : 0,
        transition: "border-color 0.2s cubic-bezier(0.5,1,0.89,1)",
        ...(style || {}),
    }

    return (
        <div
            ref={containerRef}
            data-pixel-card
            role={interactive ? "button" : undefined}
            aria-label={
                interactive
                    ? labelCfg.text || "PixelCard Partikeleffekt aktivieren"
                    : undefined
            }
            style={rootStyle}
            onPointerEnter={interactive ? handlePointerEnter : undefined}
            onPointerLeave={interactive ? handlePointerLeave : undefined}
            onPointerDown={interactive ? handlePointerDown : undefined}
            onFocus={
                interactive
                    ? () => {
                          setFocused(true)
                          reveal()
                      }
                    : undefined
            }
            onBlur={
                interactive
                    ? () => {
                          setFocused(false)
                          hide()
                      }
                    : undefined
            }
            onKeyDown={interactive ? handleKeyDown : undefined}
            tabIndex={interactive ? 0 : undefined}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    maxWidth: "100%",
                    maxHeight: "100%",
                    display: "block",
                    gridArea: "1 / 1",
                    position: "relative",
                    zIndex: 0,
                }}
            />
            {showLabel && labelCfg.text ? (
                <div
                    style={{
                        gridArea: "1 / 1",
                        position: "relative",
                        zIndex: 1,
                        display: "grid",
                        placeItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    <span
                        style={{
                            color: labelCfg.color,
                            fontSize: 22,
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            ...(labelCfg.font || {}),
                        }}
                    >
                        {labelCfg.text}
                    </span>
                </div>
            ) : null}
        </div>
    )
}
