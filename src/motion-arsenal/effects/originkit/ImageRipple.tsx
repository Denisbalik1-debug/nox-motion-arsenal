// Delivered by Originkit · stack: react
// Set these props to match the Originkit preview:
//   overrides={{}}
//   __curationVersion={1}
import { RenderTarget } from "./framerRuntime"

import {
useState,
    useCallback,
    useMemo,
    useRef,
    useEffect,
    startTransition,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
} from "react"
interface Props {
    radius?: number
    elementSize?: number
    gap?: number
    borderColor?: string
    image?: any
    animation?: "default" | "enter"
    startAlign?: "top" | "center" | "bottom"
    replay?: boolean
    rippleColor?: string[]
    rippleShape?: string
    style?: CSSProperties
}

// Fixed pulse scale for the colored ripple cell as the wave passes
const RIPPLE_SCALE = 1

interface GridElement {
    id: string
    row: number
    col: number
    x: number
    y: number
}

interface RippleData {
    delay: number
    colorIndex: number
    progress: number
    scale: number
}

export const extractRGBColorFromString = (str: string): string => {
    const rgbRegex = /(rgba|rgb)\(.*?\)/g
    const match = str.match(rgbRegex)
    return match ? match[0] : str
}

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function RippleGrid(props: Props) {
    const {
        radius = 100,
        elementSize = 4,
        gap = 10,
        borderColor = "#FFFFFF",
        image = {
            src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/08f4d1ae-43ca-4879-80f4-c1e7969eef00/w=800",
        },
        animation = "default",
        startAlign = "top",
        replay = true,
        rippleColor = ["#FFFFFF", "#FED34D", "#78371F", "#D78B4E"],
        rippleShape = "lightning",
        style,
    } = props
    const [rippleElements, setRippleElements] = useState<
        Map<string, RippleData>
    >(new Map())
    const [dimensions, setDimensions] = useState({ width: 400, height: 300 })
    const [isRipplePlaying, setIsRipplePlaying] = useState(false)
    // On the Framer canvas, show either the pixels (grid) or the image — never
    // both. Switches based on which kind of control the user just edited.
    const [canvasView, setCanvasView] = useState<"image" | "pixels">("image")
    const prevKeysRef = useRef<{ grid: string; image: string } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number | undefined>(undefined)
    // Loaded image + the set of grid cells the ripple has already revealed
    const imgRef = useRef<HTMLImageElement | null>(null)
    const revealedRef = useRef<Set<string>>(new Set())

    // Update dimensions when container size changes
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                // Use style dimensions if available, else getBoundingClientRect
                const width =
                    style?.width === "100%"
                        ? containerRef.current.offsetWidth
                        : parseFloat(String(style?.width ?? "")) || rect.width
                const height =
                    style?.height === "100%"
                        ? containerRef.current.offsetHeight
                        : parseFloat(String(style?.height ?? "")) || rect.height
                setDimensions({ width, height })
            }
        }
        updateDimensions()
        if (typeof window !== "undefined") {
            const resizeObserver = new ResizeObserver(updateDimensions)
            if (containerRef.current) {
                resizeObserver.observe(containerRef.current)
            }
            return () => {
                resizeObserver.disconnect()
            }
        }
    }, [style?.width, style?.height])

    const { columns, rows, elements } = useMemo(() => {
        const containerWidth = dimensions.width
        const containerHeight = dimensions.height
        const columns = Math.max(
            1,
            Math.floor((containerWidth + gap) / (elementSize + gap))
        )
        const rows = Math.max(
            1,
            Math.floor((containerHeight + gap) / (elementSize + gap))
        )
        // Total grid dimensions
        const totalGridWidth = columns * elementSize + (columns - 1) * gap
        const totalGridHeight = rows * elementSize + (rows - 1) * gap
        // Offset to center the grid
        const offsetX = (containerWidth - totalGridWidth) / 2
        const offsetY = (containerHeight - totalGridHeight) / 2
        const elements: GridElement[] = []
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                elements.push({
                    id: `${row}-${col}`,
                    row,
                    col,
                    x: offsetX + col * (elementSize + gap),
                    y: offsetY + row * (elementSize + gap),
                })
            }
        }
        return { columns, rows, elements }
    }, [dimensions.width, dimensions.height, elementSize, gap])

    // Decide the canvas view from which control changed: editing an image prop
    // (image) shows the image; editing a grid/pixel prop shows the pixels.
    // Color / Shape are handled separately (they replay the ripple).
    useEffect(() => {
        const gridKey = JSON.stringify([elementSize, gap, radius, borderColor])
        const imageKey = JSON.stringify([image?.src])
        const prev = prevKeysRef.current
        if (prev) {
            if (imageKey !== prev.image) setCanvasView("image")
            else if (gridKey !== prev.grid) setCanvasView("pixels")
        }
        prevKeysRef.current = { grid: gridKey, image: imageKey }
    }, [elementSize, gap, radius, borderColor, image])

    // Canvas rendering function
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        canvas.width = dimensions.width
        canvas.height = dimensions.height
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // On the canvas, "pixels" view shows the grid only (no image); "image"
        // view shows the revealed image only (no border overlay).
        const isCanvas = RenderTarget.current() === RenderTarget.canvas
        const canvasPixels = isCanvas && canvasView === "pixels"
        const img = imgRef.current
        // Displayed image size, derived from the component size and the image's
        // aspect ratio. Fit = contain (whole image, letterboxed); Fill = cover
        // (fills the component, cropped). Centered either way.
        const cW = dimensions.width
        const cH = dimensions.height
        let dispW = cW
        let dispH = cH
        if (img) {
            const nW = img.naturalWidth || 1
            const nH = img.naturalHeight || 1
            const imgAspect = nW / nH
            const contAspect = cW / (cH || 1)
            // Fill (cover): scale so the image fills the component, cropping
            // the overflow; centered.
            if (imgAspect > contAspect) {
                dispH = cH
                dispW = cH * imgAspect
            } else {
                dispW = cW
                dispH = cW / imgAspect
            }
        }
        const imgX0 = (cW - dispW) / 2
        const imgY0 = (cH - dispH) / 2
        elements.forEach((element) => {
            const rippleData = rippleElements.get(element.id)
            const isActive = rippleData !== undefined
            const currentScale = isActive ? rippleData!.scale : 1
            const currentSize = elementSize * currentScale
            const currentX = element.x + (elementSize - currentSize) / 2
            const currentY = element.y + (elementSize - currentSize) / 2
            const isRevealed = revealedRef.current.has(element.id)
            // A revealed cell shows its slice of the image once the wave passes
            const centerX = element.x + elementSize / 2
            const centerY = element.y + elementSize / 2
            const inImage =
                !!img &&
                centerX >= imgX0 &&
                centerX <= imgX0 + dispW &&
                centerY >= imgY0 &&
                centerY <= imgY0 + dispH

            if (isActive) {
                // Colored ripple pass
                const currentColor =
                    rippleColor[rippleData!.colorIndex] || rippleColor[0]
                ctx.fillStyle = extractRGBColorFromString(currentColor)
                ctx.beginPath()
                ctx.roundRect(
                    currentX,
                    currentY,
                    currentSize,
                    currentSize,
                    radius
                )
                ctx.fill()
            } else if (isRevealed && inImage && img && !canvasPixels) {
                // Draw the image slice over the cell's FULL tile (element + the
                // surrounding gap) so revealed cells tile seamlessly into one
                // continuous image instead of separated dots.
                const nW = img.naturalWidth || 1
                const nH = img.naturalHeight || 1
                const tileX = element.x - gap / 2
                const tileY = element.y - gap / 2
                const tileW = elementSize + gap
                const tileH = elementSize + gap
                const sx = ((tileX - imgX0) / dispW) * nW
                const sy = ((tileY - imgY0) / dispH) * nH
                const sw = (tileW / dispW) * nW
                const sh = (tileH / dispH) * nH
                try {
                    ctx.drawImage(
                        img,
                        sx,
                        sy,
                        sw,
                        sh,
                        tileX,
                        tileY,
                        tileW,
                        tileH
                    )
                } catch {
                    // ignore draw errors (e.g. image not decodable yet)
                }
            } else {
                // Base cell (pre-reveal): solid 1px border in the chosen color
                ctx.strokeStyle = extractRGBColorFromString(borderColor)
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.roundRect(
                    currentX,
                    currentY,
                    currentSize,
                    currentSize,
                    radius
                )
                ctx.stroke()
            }
        })
    }, [
        elements,
        rippleElements,
        elementSize,
        gap,
        radius,
        borderColor,
        rippleColor,
        dimensions,
        canvasView,
    ])

    // Animation loop
    useEffect(() => {
        const animate = () => {
            renderCanvas()
            animationFrameRef.current = requestAnimationFrame(animate)
        }
        animate()
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [renderCanvas])

    const calculateRippleDelay = useCallback(
        (
            element: GridElement,
            closestElement: GridElement,
            columns: number,
            rows: number,
            shape: string
        ) => {
            const dx = element.col - closestElement.col
            const dy = element.row - closestElement.row
            let distance = 0
            switch (shape) {
                case "circle":
                    distance = Math.sqrt(dx * dx + dy * dy)
                    break
                case "star": {
                    // Star pattern: alternating rays with dramatic variation
                    const angle = Math.atan2(dy, dx)
                    const normalizedAngle =
                        ((angle + Math.PI) / (2 * Math.PI)) * 10 // 10 rays
                    const rayIndex = Math.floor(normalizedAngle)
                    const rayOffset = normalizedAngle - rayIndex
                    const isMainRay = rayIndex % 2 === 0
                    const isSubRay = Math.abs(rayOffset - 0.5) < 0.2
                    const baseDistance = Math.sqrt(dx * dx + dy * dy)
                    if (isMainRay) {
                        distance = baseDistance * 0.8
                    } else if (isSubRay) {
                        distance = baseDistance * 2.5
                    } else {
                        distance = baseDistance * 4
                    }
                    distance *= 0.8 + Math.random() * 0.4
                    break
                }
                case "radialLines": {
                    // Radial lines: multiple rotated cross patterns
                    const radialDistance = Math.sqrt(dx * dx + dy * dy)
                    const radialAngle = Math.atan2(dy, dx)
                    const normalizedRadialAngle =
                        ((radialAngle + Math.PI) / (2 * Math.PI)) * 8
                    const lineIndex = Math.round(normalizedRadialAngle) % 8
                    const isOnLine =
                        Math.abs(normalizedRadialAngle - lineIndex) < 0.3
                    distance = isOnLine ? radialDistance : radialDistance * 3
                    break
                }
                case "diamond":
                    distance = Math.abs(dx) + Math.abs(dy)
                    break
                case "cross":
                    // Single line for both x and y axis
                    distance =
                        dx === 0 || dy === 0
                            ? Math.max(Math.abs(dx), Math.abs(dy))
                            : Math.max(Math.abs(dx), Math.abs(dy)) * 3
                    break
                case "wave": {
                    // Wave pattern: alternating rows/columns
                    const waveDistance = Math.sqrt(dx * dx + dy * dy)
                    const waveModifier = Math.sin((dx + dy) * 0.5) * 0.5 + 1
                    distance = waveDistance * waveModifier
                    break
                }
                case "lightning": {
                    // Lightning pattern: zigzag effect
                    const lightningDistance = Math.sqrt(dx * dx + dy * dy)
                    const zigzag = Math.sin(lightningDistance * 2) * 0.5 + 1
                    distance = lightningDistance * zigzag
                    break
                }
                default:
                    distance = Math.sqrt(dx * dx + dy * dy)
            }
            const maxDistance = Math.max(columns, rows)
            return (distance / maxDistance) * 500
        },
        []
    )

    const animateElement = useCallback(
        (elementId: string, colorIndex: number, delay: number) => {
            const startTime = Date.now() + delay
            const duration = 300
            const animate = () => {
                const now = Date.now()
                const elapsed = now - startTime
                if (elapsed < 0) {
                    // Not started yet
                    requestAnimationFrame(animate)
                    return
                }
                if (elapsed >= duration) {
                    // Animation complete: mark the cell revealed (so the image
                    // stays behind the wave) and remove its ripple state
                    revealedRef.current.add(elementId)
                    startTransition(() => {
                        setRippleElements((prev) => {
                            const next = new Map(prev)
                            next.delete(elementId)
                            return next
                        })
                    })
                    return
                }
                // Progress (0 to 1)
                const progress = elapsed / duration
                // Scale (animate from 1 to RIPPLE_SCALE and back)
                let scale
                if (progress < 0.5) {
                    scale = 1 + (RIPPLE_SCALE - 1) * (progress * 2)
                } else {
                    scale =
                        RIPPLE_SCALE -
                        (RIPPLE_SCALE - 1) * ((progress - 0.5) * 2)
                }
                startTransition(() => {
                    setRippleElements((prev) => {
                        const next = new Map(prev)
                        next.set(elementId, {
                            delay,
                            colorIndex,
                            progress,
                            scale,
                        })
                        return next
                    })
                })
                requestAnimationFrame(animate)
            }
            requestAnimationFrame(animate)
        },
        [RIPPLE_SCALE]
    )

    const triggerRippleFromCenter = useCallback(() => {
        // Start a fresh reveal: clear any previously revealed cells so the
        // ripple animates the image in from scratch.
        revealedRef.current = new Set()
        // Find center element
        const centerCol = Math.floor(columns / 2)
        const centerRow = Math.floor(rows / 2)
        const closestElement = elements.find(
            (el) => el.col === centerCol && el.row === centerRow
        )
        if (!closestElement) return
        setIsRipplePlaying(true)
        // Ripple effect with shape and color gradient
        elements.forEach((element) => {
            const delay = calculateRippleDelay(
                element,
                closestElement,
                columns,
                rows,
                rippleShape
            )
            // Color index based on distance for gradient effect
            const dx = element.col - closestElement.col
            const dy = element.row - closestElement.row
            const distance = Math.sqrt(dx * dx + dy * dy)
            let colorIndex
            if (distance === 0) {
                colorIndex = 0
            } else {
                const maxDistance = Math.max(columns, rows) * 0.5
                const normalizedDistance = Math.min(distance / maxDistance, 1)
                colorIndex = Math.round(
                    normalizedDistance * (rippleColor.length - 1)
                )
            }
            animateElement(element.id, colorIndex, delay)
        })
        // Total ripple duration and reset playing state
        const maxDelay = Math.max(
            ...elements.map((element) =>
                calculateRippleDelay(
                    element,
                    closestElement,
                    columns,
                    rows,
                    rippleShape
                )
            )
        )
        setTimeout(() => {
            setIsRipplePlaying(false)
        }, maxDelay + 300)
    }, [
        elements,
        columns,
        rows,
        calculateRippleDelay,
        rippleShape,
        rippleColor,
        animateElement,
    ])

    // Refs so the effects can reach the latest grid + trigger without
    // re-subscribing (and re-firing the reveal) on every resize.
    const elementsRef = useRef(elements)
    elementsRef.current = elements
    const triggerRef = useRef(triggerRippleFromCenter)
    triggerRef.current = triggerRippleFromCenter

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [imageReady, setImageReady] = useState(false)
    const [isInView, setIsInView] = useState(false)
    const [hasAnimated, setHasAnimated] = useState(false)

    // Load the uploaded image. On the static canvas it is revealed fully; live,
    // the trigger effect below runs the ripple reveal.
    useEffect(() => {
        const src = image?.src
        revealedRef.current = new Set()
        setImageReady(false)
        setHasAnimated(false)
        if (!src) {
            imgRef.current = null
            return
        }
        let cancelled = false
        const im = new Image()
        im.crossOrigin = "anonymous"
        im.src = src
        im.onload = () => {
            if (cancelled) return
            imgRef.current = im
            if (isCanvas) {
                revealedRef.current = new Set(
                    elementsRef.current.map((e) => e.id)
                )
            }
            setImageReady(true)
        }
        return () => {
            cancelled = true
            im.onload = null
        }
    }, [image?.src, isCanvas])

    // Enter mode: reveal when the component scrolls into view (mirrors PixelReveal)
    useEffect(() => {
        if (animation !== "enter" || !containerRef.current || isCanvas) return
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true)
                        if (replay || !hasAnimated) setHasAnimated(true)
                    } else if (replay) {
                        setIsInView(false)
                        // Clear so the next enter replays the reveal
                        revealedRef.current = new Set()
                    }
                })
            },
            {
                threshold:
                    startAlign === "top"
                        ? 0
                        : startAlign === "center"
                          ? 0.5
                          : 1,
            }
        )
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [animation, startAlign, replay, hasAnimated, isCanvas])

    // Trigger the ripple reveal. "default" plays on load (and re-plays if the
    // grid changes, e.g. after the container is measured); "enter" plays when
    // scrolled into view. Canvas shows the image statically (no rAF ripple).
    useEffect(() => {
        if (!imageReady || isCanvas) return
        const shouldPlay =
            animation === "default"
                ? true
                : isInView && (replay || !hasAnimated)
        if (shouldPlay) triggerRef.current()
    }, [
        imageReady,
        animation,
        isInView,
        replay,
        hasAnimated,
        isCanvas,
        elements,
    ])

    // On the static canvas, keep the whole image revealed as the grid changes.
    useEffect(() => {
        if (!imgRef.current || !isCanvas) return
        revealedRef.current = new Set(elements.map((e) => e.id))
    }, [elements, isCanvas])

    // On the canvas, replay the ripple whenever Color or Shape changes, so the
    // designer can preview the effect while editing (skips the first render).
    const rippleKey = JSON.stringify([rippleColor, rippleShape])
    const prevRippleKeyRef = useRef<string | null>(null)
    useEffect(() => {
        const prev = prevRippleKeyRef.current
        prevRippleKeyRef.current = rippleKey
        if (!isCanvas || prev === null || prev === rippleKey) return
        setCanvasView("image")
        triggerRef.current()
    }, [rippleKey, isCanvas])

    const runRippleFrom = useCallback(
        (clickX: number, clickY: number) => {
            let closestElement: GridElement | null = null
            let minDistance = Infinity
            elements.forEach((element) => {
                const centerX = element.x + elementSize / 2
                const centerY = element.y + elementSize / 2
                const distance = Math.sqrt(
                    Math.pow(clickX - centerX, 2) +
                        Math.pow(clickY - centerY, 2)
                )
                if (distance < minDistance) {
                    minDistance = distance
                    closestElement = element
                }
            })
            if (!closestElement) return
            const origin: GridElement = closestElement
            setIsRipplePlaying(true)
            // Ripple effect with shape and color gradient
            elements.forEach((element) => {
                const delay = calculateRippleDelay(
                    element,
                    origin,
                    columns,
                    rows,
                    rippleShape
                )
                const dx = element.col - origin.col
                const dy = element.row - origin.row
                const distance = Math.sqrt(dx * dx + dy * dy)
                let colorIndex
                if (distance === 0) {
                    colorIndex = 0
                } else {
                    const maxDistance = Math.max(columns, rows) * 0.5
                    const normalizedDistance = Math.min(
                        distance / maxDistance,
                        1
                    )
                    colorIndex = Math.round(
                        normalizedDistance * (rippleColor.length - 1)
                    )
                }
                animateElement(element.id, colorIndex, delay)
            })
            // Total ripple duration and reset playing state
            const maxDelay = Math.max(
                ...elements.map((element) =>
                    calculateRippleDelay(
                        element,
                        origin,
                        columns,
                        rows,
                        rippleShape
                    )
                )
            )
            setTimeout(() => {
                setIsRipplePlaying(false)
            }, maxDelay + 300)
        },
        [
            elements,
            columns,
            rows,
            elementSize,
            calculateRippleDelay,
            rippleShape,
            rippleColor,
            animateElement,
        ]
    )

    // Click always triggers a ripple, regardless of the animation mode.
    const handleClick = useCallback(
        (event: ReactMouseEvent<HTMLCanvasElement>) => {
            if (isRipplePlaying) return // Prevent new ripples while one is playing
            const rect = event.currentTarget.getBoundingClientRect()
            runRippleFrom(event.clientX - rect.left, event.clientY - rect.top)
        },
        [isRipplePlaying, runRippleFrom]
    )

    // Global click handler — click works in every mode
    useEffect(() => {
        if (typeof window === "undefined") return
        const handleGlobalClick = (event: MouseEvent) => {
            if (isRipplePlaying) return // Prevent new ripples while one is playing
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const clickX = event.clientX - rect.left
            const clickY = event.clientY - rect.top
            // Check if click is within container bounds
            if (
                clickX >= 0 &&
                clickX <= rect.width &&
                clickY >= 0 &&
                clickY <= rect.height
            ) {
                runRippleFrom(clickX, clickY)
            }
        }
        document.addEventListener("click", handleGlobalClick)
        return () => {
            document.removeEventListener("click", handleGlobalClick)
        }
    }, [isRipplePlaying, runRippleFrom])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: "default",
                pointerEvents: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                onClick={handleClick}
            />
        </div>
    )
}

RippleGrid.displayName = "Ripple Grid"