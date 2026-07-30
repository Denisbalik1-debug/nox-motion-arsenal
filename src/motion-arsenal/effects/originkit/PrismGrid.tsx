// Delivered by Originkit · stack: react
// Set these props to match the Originkit preview:
//   overrides={{}}
//   __curationVersion={1}
import {
    useMemo,
    useRef,
    useState,
    useLayoutEffect,
    useCallback,
    type CSSProperties,
} from "react"
import { motion } from "framer-motion"
import { ControlType, RenderTarget } from "./framerRuntime"
const DEFAULT_COLORS = [
    "#FFFFFF",
    "#FFC2E3",
    "#DEFFEA",
    "#A68F1F",
    "#A85E5E",
    "#DFC2FF",
]

// Camera distance. Must match the `perspective` on the 3D wrapper below — the
// pointer→cell maths inverts exactly this projection.
const PERSPECTIVE = 1000

/**
 * Invert the CSS 3D projection: given a point on screen (relative to the centre,
 * which is also the perspective origin), work out which point of the flat,
 * rotated plane sits under it.
 *
 * Browsers hit-test 3D-transformed content unreliably once a plane is steeply
 * tilted — the far half of the grid simply stopped responding to hover. So the
 * hover is not left to the browser at all: the pointer is mapped onto the plane
 * analytically, which is exact at every angle.
 *
 * The plane's transform is `rotateY(a) rotateX(b)` applied to a local point
 * (x, y, 0), giving:
 *      X = x·cos a
 *      Y = x·sin a·sin b + y·cos b
 *      Z = -x·sin a·cos b + y·sin b
 * and the perspective divide is  s = p / (p − Z),  screen = (X·s, Y·s).
 *
 * Substituting the divide back in turns those into two linear equations in
 * (x, y), which is the 2x2 system solved here.
 */
function screenToPlane(
    sx: number,
    sy: number,
    yawDeg: number,
    pitchDeg: number,
    p = PERSPECTIVE
): { x: number; y: number } | null {
    const a = (yawDeg * Math.PI) / 180
    const b = (pitchDeg * Math.PI) / 180
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    const cb = Math.cos(b)
    const sb = Math.sin(b)

    // (1)  x·(p·cos a − sx·sin a·cos b) + y·(sx·sin b)            = sx·p
    // (2)  x·(p·sin a·sin b − sy·sin a·cos b) + y·(p·cos b + sy·sin b) = sy·p
    const a11 = p * ca - sx * sa * cb
    const a12 = sx * sb
    const a21 = p * sa * sb - sy * sa * cb
    const a22 = p * cb + sy * sb

    const det = a11 * a22 - a12 * a21
    if (!isFinite(det) || Math.abs(det) < 1e-6) return null // edge-on: no hit

    const b1 = sx * p
    const b2 = sy * p
    return {
        x: (b1 * a22 - a12 * b2) / det,
        y: (a11 * b2 - b1 * a21) / det,
    }
}

/** A filled cell: which box, what colour, and an id so a fading one keeps its own */
interface Cell {
    id: number
    row: number
    col: number
    color: string
}

interface Rotate {
    x?: number
    y?: number
}

interface ColorsProp {
    paletteCount?: number
    [key: string]: string | number | undefined
}

interface BackgroundBoxesProps {
    backgroundColor?: string
    boxSize?: number
    borderWidth?: number
    borderColor?: string
    rotate?: Rotate
    colors?: ColorsProp
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
export default function BackgroundBoxes({
    backgroundColor = "rgba(0,0,0,1)",
    boxSize = 40,
    borderWidth = 2,
    borderColor = "rgba(255,255,255,0.2)",
    rotate = { x: 0, y: 0 },
    colors: colorsProp = {
        paletteCount: 6,
        color1: "#FFFFFF",
        color2: "#FFC2E3",
        color3: "#DEFFEA",
        color4: "#A68F1F",
        color5: "#A85E5E",
        color6: "#DFC2FF",
    },
    style,
}: BackgroundBoxesProps) {
    // Fixed hover timing (Appear/Disappear controls removed): instant fill,
    // fade back out over 1s.
    const inDuration = 0
    const outDuration = 1

    const containerRef = useRef<HTMLDivElement>(null)
    const zoomProbeRef = useRef<HTMLDivElement>(null)
    const [rows, setRows] = useState(35)
    const [cols, setCols] = useState(35)

    // X control = left/right sweep (yaw, applied as CSS rotateY).
    // Y control = front/back tilt (pitch, applied as CSS rotateX).
    const swingX = rotate?.x ?? 0
    const swingY = rotate?.y ?? 0

    // Build colors array from the palette modal, gated by the size slider
    const colors = useMemo(() => {
        const entries: string[] = []
        if (colorsProp) {
            const count = Math.max(
                1,
                Math.min(10, colorsProp.paletteCount || 6)
            )
            for (let i = 1; i <= count; i++) {
                const value = colorsProp[`color${i}`]
                if (typeof value === "string" && value.trim().length > 0) {
                    entries.push(value.trim())
                }
            }
        }
        // Fallback to default colors if none provided
        if (entries.length === 0) return DEFAULT_COLORS
        return entries
    }, [colorsProp])

    const getRandomColor = () => {
        if (colors.length === 0) return DEFAULT_COLORS[0] || "rgb(125 211 252)"
        return colors[Math.floor(Math.random() * colors.length)]
    }

    // The grid is exactly the size of the component — one box per cell of the
    // layer, nothing more. It used to be oversized (up to 2.4x the diagonal) so
    // that rotating it never exposed an edge, but that is what made the thing read
    // as an enormous plane sliding behind a window instead of a panel of boxes
    // tilting in 3D. Its edges SHOULD be visible: that is the perspective.
    const calculateGrid = useCallback(() => {
        const container = containerRef.current
        if (!container) return
        const w = container.clientWidth || container.offsetWidth || 1
        const h = container.clientHeight || container.offsetHeight || 1
        setCols(Math.max(1, Math.ceil(w / boxSize)))
        setRows(Math.max(1, Math.ceil(h / boxSize)))
    }, [boxSize])

    // Handle resize — zoom-probe polling on canvas, resize events in preview
    useLayoutEffect(() => {
        const isCanvas = RenderTarget.current() === RenderTarget.canvas
        if (isCanvas) {
            let rafId = 0
            const TICK_MS = 100
            let lastCalc = 0
            const tick = (now?: number) => {
                const t = now || performance.now()
                if (!lastCalc || t - lastCalc >= TICK_MS) {
                    calculateGrid()
                    lastCalc = t
                }
                rafId = requestAnimationFrame(tick)
            }
            rafId = requestAnimationFrame(tick)
            return () => {
                if (rafId) cancelAnimationFrame(rafId)
            }
        } else {
            calculateGrid()
            window.addEventListener("resize", calculateGrid)
            return () => window.removeEventListener("resize", calculateGrid)
        }
    }, [calculateGrid])

    const gridWidth = cols * boxSize
    const gridHeight = rows * boxSize

    const border = borderWidth
        ? `${borderWidth}px solid ${borderColor}`
        : undefined

    // The cell under the cursor, plus the ones still fading back out behind it.
    const [lit, setLit] = useState<Cell | null>(null)
    const [fading, setFading] = useState<Cell[]>([])
    const idRef = useRef(0)

    const leave = useCallback(() => {
        setLit((current) => {
            if (current) setFading((f) => [...f, current])
            return null
        })
    }, [])

    // Hover is resolved by MAPPING THE POINTER ONTO THE PLANE, not by letting the
    // browser hit-test the boxes. Browsers get that wrong on a steeply tilted
    // plane — the far half of the grid stopped filling entirely — and no amount of
    // styling fixes it. This is exact at any rotation.
    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const container = containerRef.current
            if (!container) return
            const rect = container.getBoundingClientRect()
            // Relative to the centre, which is where the perspective origin sits.
            const sx = event.clientX - rect.left - rect.width / 2
            const sy = event.clientY - rect.top - rect.height / 2

            const point = screenToPlane(sx, sy, swingX, swingY)
            if (!point) return leave()

            // Plane coords are centred, so shift into grid coords.
            const gx = point.x + gridWidth / 2
            const gy = point.y + gridHeight / 2
            const col = Math.floor(gx / boxSize)
            const row = Math.floor(gy / boxSize)
            if (col < 0 || col >= cols || row < 0 || row >= rows) return leave()

            setLit((current) => {
                if (current && current.row === row && current.col === col) {
                    return current
                }
                if (current) setFading((f) => [...f, current])
                return {
                    id: ++idRef.current,
                    row,
                    col,
                    color: getRandomColor(),
                }
            })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            swingX,
            swingY,
            gridWidth,
            gridHeight,
            boxSize,
            cols,
            rows,
            colors,
            leave,
        ]
    )

    // Drop faded-out cells once their fade has finished.
    useLayoutEffect(() => {
        if (fading.length === 0) return
        const timer = setTimeout(
            () => setFading((f) => f.slice(1)),
            outDuration * 1000
        )
        return () => clearTimeout(timer)
    }, [fading, outDuration])

    // The grid itself is now completely static — no hover handlers, no motion
    // components, so it never re-renders while the pointer moves.
    const boxes = useMemo(() => {
        const rowsArray = new Array(rows).fill(1)
        const colsArray = new Array(cols).fill(1)
        return rowsArray.map((_, i) => (
            <div
                key={`row-${i}`}
                style={{
                    display: "flex",
                    borderLeft: border,
                    // The last row closes the grid: every box draws only its top and
                    // right edge, so without this the bottom of the grid hung open.
                    borderBottom: i === rows - 1 ? border : undefined,
                }}
            >
                {colsArray.map((_, j) => (
                    <div
                        key={`col-${j}`}
                        style={{
                            width: `${boxSize}px`,
                            height: `${boxSize}px`,
                            flexShrink: 0,
                            boxSizing: "border-box",
                            borderRight: border,
                            borderTop: border,
                        }}
                    />
                ))}
            </div>
        ))
    }, [rows, cols, boxSize, border])

    const cellStyle = (cell: Cell): CSSProperties => ({
        position: "absolute",
        left: cell.col * boxSize,
        top: cell.row * boxSize,
        width: boxSize,
        height: boxSize,
        backgroundColor: cell.color,
        pointerEvents: "none",
    })

    return (
        // Outer element does the CLIPPING and nothing else. It must not establish a
        // 3D rendering context: an element that has both `overflow: hidden` and
        // `transform-style: preserve-3d` cannot clip its 3D-transformed children,
        // so the oversized grid spilled far outside the layer and the component
        // rendered much bigger than its own bounds.
        <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={leave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
            }}
        >
            <div
                ref={zoomProbeRef}
                style={{
                    position: "absolute",
                    width: 20,
                    height: 20,
                    opacity: 0,
                    pointerEvents: "none",
                }}
            />
            {/* Inner element owns the 3D context that the grid is rotated in.
                A 10000px camera was so far away the projection was effectively
                orthographic — rotating just squashed the grid flat instead of
                sending one edge away from the viewer. Bring the camera in close
                enough that the depth actually reads as perspective. */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: `${PERSPECTIVE}px`,
                    perspectiveOrigin: "center center",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* The plane. The fills live INSIDE it, so they are rotated with
                    the grid and land exactly on their box at any angle. */}
                <div
                    style={{
                        transform: `translate(-50%, -50%) rotateY(${swingX}deg) rotateX(${swingY}deg)`,
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        display: "flex",
                        flexDirection: "column",
                        transformOrigin: "center center",
                        width: `${gridWidth}px`,
                        height: `${gridHeight}px`,
                        zIndex: 0,
                    }}
                >
                    {boxes}
                    {fading.map((cell) => (
                        <motion.div
                            key={cell.id}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: outDuration }}
                            style={cellStyle(cell)}
                        />
                    ))}
                    {lit && (
                        <motion.div
                            key={lit.id}
                            initial={{ opacity: inDuration > 0 ? 0 : 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: inDuration }}
                            style={cellStyle(lit)}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

BackgroundBoxes.displayName = "Background Boxes"

const colorControl = (title: string, defaultValue: string, minCount: number) =>
    ({
        type: ControlType.Color,
        title,
        defaultValue,
        hidden: (props: ColorsProp) => (props?.paletteCount ?? 6) < minCount,
    }) as const
