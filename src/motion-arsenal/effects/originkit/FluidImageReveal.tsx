// Delivered by Originkit · stack: react
// Set these props to match the Originkit preview:
//   overrides={{"image":{"src":"https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/041b1d75-2371-44dc-4b15-972ecd7b2400/w=800"},"transition":{"ease":"easeOut","mass":1,"type":"tween","damping":60,"duration":2,"stiffness":800}}}
//   __curationVersion={1}
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"
// Framer resolves HTTPS ESM imports at build; these packages are not installed
// locally. Typed via app/New-components/cdn-modules.d.ts.
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    PlaneGeometry,
    Mesh,
    ShaderMaterial,
    Vector2,
    TextureLoader,
} from "three"
import { gsap } from "gsap"
import { ComponentMessage } from "./framerRuntime"
import { RenderTarget, ControlType } from "./framerRuntime"

const CAMERA_FOV = 35
const PLANE_SEGMENTS = 128

const vertexShader = `
varying vec2 vUv;

void main(){
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 clipPosition = projectionMatrix * viewPosition;
    gl_Position = clipPosition;
    vUv = uv;
}
`

const fragmentShader = `
varying vec2 vUv;
uniform float uProgress;      // Animation progress [0..1]
uniform vec2 uSize;           // Container size in pixels
uniform vec2 uImageSize;      // Image dimensions for aspect ratio
uniform sampler2D uTexture;   // The image texture
uniform int uBlobCount;
uniform float uFitCover;      // 1 = cover (fill+crop), 0 = contain (fit+letterbox)
#define PI 3.1415926538
#define TWO_PI 6.28318530718

// Creates wavy noise based on angle - adds organic feel to blob edges
float noise(vec2 point) {
    float frequency = 1.0;
    float angle = atan(point.y, point.x) + uProgress * PI;

    // Combine multiple wave frequencies for complex pattern
    float w0 = (cos(angle * frequency) + 1.0) / 2.0;
    float w1 = (sin(2.0 * angle * frequency) + 1.0) / 2.0;
    float w2 = (cos(3.0 * angle * frequency) + 1.0) / 2.0;
    return (w0 + w1 + w2) / 3.0;
}

// Smooth maximum function for organic blending
float softMax(float a, float b, float k) {
    return log(exp(k * a) + exp(k * b)) / k;
}

// Smooth minimum function - blends shapes together smoothly
float softMin(float a, float b, float k) {
    return -softMax(-a, -b, k);
}

// Signed distance field for a circle with noise
float circleSDF(vec2 pos, float rad) {
    float a = sin(uProgress * 0.2) * 0.25;
    float amt = 0.5 + a;
    float circle = length(pos);
    circle += noise(pos) * rad * amt;
    return circle;
}

// Creates circles arranged radially around the center
float radialCircles(vec2 p, float offset, float count) {
    float angle = (2.0 * PI) / count;
    float s = round(atan(p.y, p.x) / angle);
    float an = angle * s;
    vec2 q = vec2(offset * cos(an), offset * sin(an));
    vec2 pos = p - q;
    return circleSDF(pos, 15.0);
}

void main() {
    vec4 bg = vec4(0.0, 0.0, 0.0, 0.0);

    // UV for cover (fill + crop) or contain (fit + letterbox), vs plane aspect.
    vec2 coverUV = vUv;
    if (uSize.x > 0.0 && uSize.y > 0.0 && uImageSize.x > 0.0 && uImageSize.y > 0.0) {
        float containerAspect = uSize.x / uSize.y;
        float imageAspect = uImageSize.x / uImageSize.y;

        vec2 scale = vec2(1.0);
        if (uFitCover > 0.5) {
            // Cover: shrink UV on the long axis so the image fills, cropping.
            if (containerAspect > imageAspect) scale.y = imageAspect / containerAspect;
            else scale.x = containerAspect / imageAspect;
        } else {
            // Contain: expand UV so the whole image fits; rest is letterbox.
            if (containerAspect > imageAspect) scale.x = containerAspect / imageAspect;
            else scale.y = imageAspect / containerAspect;
        }

        coverUV = (vUv - 0.5) * scale + 0.5;
    }

    vec4 texture = texture2D(uTexture, coverUV);
    // Contain: anything sampled outside [0,1] is letterbox → transparent.
    if (uFitCover < 0.5 &&
        (coverUV.x < 0.0 || coverUV.x > 1.0 || coverUV.y < 0.0 || coverUV.y > 1.0)) {
        texture = vec4(0.0);
    }
    vec2 coords = vUv * uSize;
    vec2 center = vec2(0.5) * uSize;

    // Apply easing to progress for natural animation curve
    float t = pow(uProgress, 2.5);
    // Use diagonal to ensure full coverage - need at least half diagonal to cover rectangle
    // Add extra margin to account for noise distortion
    float maxDim = sqrt(uSize.x * uSize.x + uSize.y * uSize.y);
    float rad = t * maxDim * 1.0;

    // Create main center circle (always present)
    float c1 = circleSDF(coords - center, rad);
    float k = 50.0 / max(uSize.x, uSize.y);
    float circle = c1;

    // Add extra blobs only if blobCount > 1
    int extraBlobs = uBlobCount - 1;
    for (int i = 0; i < 20; i++) {
        if (i >= extraBlobs) break;

        float idx = float(i);
        float total = float(extraBlobs);

        // Distribute evenly around the center with pseudo-random offset
        float baseAngle = idx * TWO_PI / max(total, 1.0);
        float jitter = fract(sin(idx * 127.1 + 311.7) * 43758.5453) * 0.5 - 0.25;
        float angle = baseAngle + jitter;

        // Position at varying distances from center
        float distRatio = 0.25 + 0.2 * fract(sin(idx * 43.3) * 12345.6);
        vec2 offset = vec2(cos(angle), sin(angle)) * distRatio * min(uSize.x, uSize.y);

        // Each extra blob is a simple circle
        float blobDist = length(coords - center - offset);
        float blobNoise = noise(coords - center - offset) * rad * 0.4;
        float blob = blobDist + blobNoise;

        circle = softMin(circle, blob, k);
    }

    // Create sharp edge at the blob boundary
    circle = step(circle, rad);

    // Mix background (transparent) with texture based on blob mask
    gl_FragColor = mix(bg, texture, circle);
}
`

// Distance a perspective camera must sit from a `height`-px plane to fit it
function cameraDistance(height: number, fov: number): number {
    const h = Math.max(height, 1)
    const r = (fov * Math.PI) / 360
    return h / 2 / Math.tan(r) || 1
}

// Fit the camera to a width×height (px) plane centered at origin
function fitCamera(camera: any, width: number, height: number) {
    const w = Math.max(width, 1)
    const h = Math.max(height, 1)
    camera.aspect = w / h
    camera.fov = CAMERA_FOV
    camera.position.set(0, 0, cameraDistance(h, camera.fov))
    camera.updateProjectionMatrix()
}

// Resolve a ResponsiveImage control (object or string) to a URL
function resolveImageSrc(image: any): string | undefined {
    if (!image) return undefined
    if (typeof image === "string") return image.trim() || undefined
    return image.src || undefined
}

// Map a Framer transition ease (bezier array or string preset) to a gsap ease.
// gsap accepts an ease as a function(progress) → eased value.
const NAMED_EASES: Record<string, [number, number, number, number]> = {
    linear: [0, 0, 1, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
}

function cubicBezierEase(x1: number, y1: number, x2: number, y2: number) {
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx
    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
    const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
    return (p: number) => {
        let t = p
        for (let i = 0; i < 8; i++) {
            const x = sampleX(t) - p
            const d = dX(t)
            if (Math.abs(x) < 1e-4 || Math.abs(d) < 1e-6) break
            t -= x / d
        }
        t = t < 0 ? 0 : t > 1 ? 1 : t
        return sampleY(t)
    }
}

function easeToGsap(ease: any) {
    if (Array.isArray(ease) && ease.length === 4)
        return cubicBezierEase(ease[0], ease[1], ease[2], ease[3])
    const b =
        (typeof ease === "string" && NAMED_EASES[ease]) || NAMED_EASES.easeOut
    return cubicBezierEase(b[0], b[1], b[2], b[3])
}

type StartAlign = "top" | "center" | "bottom"

interface Props {
    image?: any
    fit?: "cover" | "contain"
    blobCount?: number
    startAlign?: StartAlign
    replay?: boolean
    transition?: any
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BlobReveal(props: Props) {
    const {
        image = {
            src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/041b1d75-2371-44dc-4b15-972ecd7b2400/w=800",
        },
        fit = "cover",
        blobCount = 20,
        startAlign = "bottom",
        replay = true,
        transition = { type: "tween", duration: 2, ease: "easeOut" },
        style,
    } = props

    // Transition drives timing: duration = time, ease = way it completes.
    // Framer rebuilds the Transition object on every render, so memoizing on its
    // identity produced a new `ease` each time — which re-ran the tween effect and
    // killed the in-flight reveal on every scroll frame. Key on the contents.
    const trDuration =
        typeof transition?.duration === "number" ? transition.duration : 2
    const easeKey = JSON.stringify(transition?.ease ?? null)
    const ease = useMemo(
        () => easeToGsap(transition?.ease),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [easeKey]
    )

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sceneRef = useRef<any>(null)
    const rendererRef = useRef<any>(null)
    const cameraRef = useRef<any>(null)
    const meshRef = useRef<any>(null)
    // Tiny probe used to read Framer's canvas zoom without a resize event
    const zoomProbeRef = useRef<HTMLDivElement>(null)
    const sizeStateRef = useRef({ width: 0, height: 0, zoom: 0 })
    const rafIdRef = useRef<number | null>(null)
    const isRenderingRef = useRef(false)
    const scrollTweenRef = useRef<any>(null)

    const [inView, setInView] = useState(false)
    // True only when the layer is entirely off-screen (above OR below) — the one
    // state in which a revealed image is reset (Replay on). While any part of it
    // is still on screen it stays revealed.
    const [offScreen, setOffScreen] = useState(false)
    const [appeared, setAppeared] = useState(false)
    const [textureReady, setTextureReady] = useState(false)

    const resolvedImage = resolveImageSrc(image)
    // Only Framer's canvas renders statically; the Next preview animates.
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const hasImage = !!resolvedImage

    // Build the three.js scene / camera / renderer / mesh
    const initThree = useCallback(() => {
        if (!canvasRef.current || !containerRef.current) return null
        const container = containerRef.current
        const width = container.clientWidth || container.offsetWidth || 1
        const height = container.clientHeight || container.offsetHeight || 1

        const scene = new Scene()
        sceneRef.current = scene

        const camera = new PerspectiveCamera(
            CAMERA_FOV,
            width / height,
            0.1,
            2000
        )
        fitCamera(camera, width, height)
        cameraRef.current = camera

        const renderer = new WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
        })
        renderer.setSize(width, height, false)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        rendererRef.current = renderer

        // Plane is sized to the CONTAINER; the camera fits the same size, so the
        // plane fills the component. The shader then covers/contains the image
        // within it based on the image's aspect ratio.
        const iw = Math.max(1, width)
        const ih = Math.max(1, height)
        const geometry = new PlaneGeometry(
            iw,
            ih,
            PLANE_SEGMENTS,
            PLANE_SEGMENTS
        )
        const material = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            uniforms: {
                uProgress: { value: 0 },
                uSize: { value: new Vector2(iw, ih) },
                uImageSize: { value: new Vector2(1, 1) },
                uTexture: { value: null },
                uBlobCount: {
                    value: Math.min(20, Math.max(1, Math.round(blobCount))),
                },
                uFitCover: { value: fit === "contain" ? 0 : 1 },
            },
        })
        const mesh = new Mesh(geometry, material)
        meshRef.current = mesh
        scene.add(mesh)

        return { scene, camera, renderer, mesh }
        // fit is applied live via the uFitCover effect; no rebuild needed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blobCount])

    // Load the image into a texture and feed its size to the shader
    const loadTexture = useCallback(() => {
        if (!resolvedImage || !meshRef.current) {
            setTextureReady(false)
            return
        }
        setTextureReady(false)
        new TextureLoader().load(
            resolvedImage,
            (texture: any) => {
                if (!meshRef.current?.material) return
                const material = meshRef.current.material
                if (texture.image) {
                    const w = texture.image.width || 1
                    const h = texture.image.height || 1
                    material.uniforms.uImageSize.value.set(w, h)
                }
                material.uniforms.uTexture.value = texture
                setTextureReady(true)
                if (
                    rendererRef.current &&
                    sceneRef.current &&
                    cameraRef.current
                )
                    rendererRef.current.render(
                        sceneRef.current,
                        cameraRef.current
                    )
            },
            undefined,
            (err: any) => {
                console.error("Texture loading error:", err)
                setTextureReady(false)
            }
        )
    }, [resolvedImage])

    // Fit camera/renderer AND resize the plane to the container, so the image
    // always fills the component (cover/contain handled in the shader).
    const resize = useCallback((width: number, height: number) => {
        if (!cameraRef.current || !rendererRef.current) return
        fitCamera(cameraRef.current, width, height)
        rendererRef.current.setSize(width, height, false)
        rendererRef.current.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 2)
        )
        const mesh = meshRef.current
        if (mesh) {
            const iw = Math.max(1, width)
            const ih = Math.max(1, height)
            if (mesh.geometry) mesh.geometry.dispose()
            mesh.geometry = new PlaneGeometry(
                iw,
                ih,
                PLANE_SEGMENTS,
                PLANE_SEGMENTS
            )
            if (mesh.material?.uniforms?.uSize)
                mesh.material.uniforms.uSize.value.set(iw, ih)
        }
    }, [])

    const renderOnce = useCallback(() => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
            return
        rendererRef.current.render(sceneRef.current, cameraRef.current)
    }, [])

    // Continuous render loop, active only while an animation is running
    const renderLoop = useCallback(() => {
        renderOnce()
        rafIdRef.current = isRenderingRef.current
            ? requestAnimationFrame(renderLoop)
            : null
    }, [renderOnce])

    const startLoop = useCallback(() => {
        isRenderingRef.current = true
        if (rafIdRef.current == null)
            rafIdRef.current = requestAnimationFrame(renderLoop)
    }, [renderLoop])

    const stopLoop = useCallback(() => {
        isRenderingRef.current = false
        if (rafIdRef.current != null) {
            cancelAnimationFrame(rafIdRef.current)
            rafIdRef.current = null
        }
    }, [])

    // Reset transient state on mount
    useEffect(() => {
        setAppeared(false)
        setTextureReady(false)
    }, [])

    // Reset progress when image / trigger / canvas mode changes
    useEffect(() => {
        if (!hasImage) {
            setAppeared(false)
            setTextureReady(false)
            return
        }
        setAppeared(false)
        setTextureReady(false)
        if (meshRef.current?.material)
            meshRef.current.material.uniforms.uProgress.value = isCanvas ? 1 : 0
    }, [hasImage, resolvedImage, isCanvas])

    // Create / tear down the three.js pipeline
    useEffect(() => {
        if (!hasImage) {
            stopLoop()
            if (rendererRef.current) {
                rendererRef.current.dispose()
                rendererRef.current = null
            }
            if (sceneRef.current) {
                sceneRef.current.clear()
                sceneRef.current = null
            }
            meshRef.current = null
            return
        }
        initThree()
        if (rendererRef.current && sceneRef.current && cameraRef.current)
            renderOnce()
        const t = setTimeout(() => loadTexture(), 0)
        if (isCanvas && meshRef.current?.material)
            meshRef.current.material.uniforms.uProgress.value = 1
        return () => {
            clearTimeout(t)
            stopLoop()
            if (rendererRef.current) {
                rendererRef.current.dispose()
                rendererRef.current = null
            }
            if (sceneRef.current) {
                sceneRef.current.clear()
                sceneRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasImage, isCanvas, initThree, loadTexture, stopLoop, renderOnce])

    // Track layer size (ResizeObserver) + Framer canvas zoom (probe poll)
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const measure = () => {
            const w = container.clientWidth || container.offsetWidth || 1
            const h = container.clientHeight || container.offsetHeight || 1
            const s = sizeStateRef.current
            if (Math.abs(w - s.width) > 1 || Math.abs(h - s.height) > 1) {
                s.width = w
                s.height = h
                resize(w, h)
                renderOnce()
            }
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(container)
        const zoomTimer = setInterval(() => {
            const probeW =
                zoomProbeRef.current?.getBoundingClientRect().width ?? 20
            const s = sizeStateRef.current
            if (Math.abs(probeW - s.zoom) > 0.5) {
                s.zoom = probeW
                measure()
            }
        }, 250)
        return () => {
            observer.disconnect()
            clearInterval(zoomTimer)
        }
    }, [resize, renderOnce])

    // Live-update blob count
    useEffect(() => {
        if (!meshRef.current?.material) return
        meshRef.current.material.uniforms.uBlobCount.value = Math.min(
            20,
            Math.max(1, Math.round(blobCount))
        )
        renderOnce()
    }, [blobCount, renderOnce])

    // Live-update fit mode (cover / contain)
    useEffect(() => {
        const mesh = meshRef.current
        if (!mesh?.material?.uniforms?.uFitCover) return
        mesh.material.uniforms.uFitCover.value = fit === "contain" ? 0 : 1
        renderOnce()
    }, [fit, renderOnce])

    // Scroll trigger: flag in-view / scrolled-above from the layer's rect
    useEffect(() => {
        if (isCanvas) return
        let raf: number | null = null
        const check = () => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const vh = window.innerHeight || 0
            const edge =
                startAlign === "top"
                    ? rect.top
                    : startAlign === "center"
                      ? rect.top + rect.height / 2
                      : rect.bottom
            setInView(edge <= vh && rect.bottom >= 0)
            // Fully off-screen in EITHER direction: entirely below the fold
            // (rect.top > vh) or scrolled entirely past the top (rect.bottom < 0).
            // Both re-arm the reveal, so it plays again whichever way you come
            // back. Only checking the below case meant scrolling up past the
            // image never reset it, so Replay never fired on the way back down.
            setOffScreen(rect.top > vh || rect.bottom < 0)
        }
        const onScroll = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = requestAnimationFrame(check)
        }
        check()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", check)
        return () => {
            if (raf) cancelAnimationFrame(raf)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", check)
        }
    }, [startAlign, isCanvas])

    // Appear animation: tween progress 0 → 1
    useEffect(() => {
        if (
            isCanvas ||
            !appeared ||
            !textureReady ||
            !meshRef.current?.material ||
            !meshRef.current.material.uniforms.uTexture.value
        )
            return
        const material = meshRef.current.material
        startLoop()
        const tween = gsap.to(material.uniforms.uProgress, {
            value: 1,
            duration: trDuration,
            ease,
            onUpdate: renderOnce,
            onComplete: () => {
                renderOnce()
                stopLoop()
            },
        })
        return () => {
            tween.kill()
            stopLoop()
        }
    }, [
        appeared,
        textureReady,
        trDuration,
        ease,
        isCanvas,
        renderOnce,
        startLoop,
        stopLoop,
    ])

    // Scroll animation: tween to 1 when in view; with Replay on, reset to 0 once
    // the layer is fully off-screen (either direction) so it reveals again on the
    // way back in — from above or below.
    useEffect(() => {
        if (
            isCanvas ||
            !textureReady ||
            !meshRef.current?.material ||
            !meshRef.current.material.uniforms.uTexture.value
        )
            return
        const material = meshRef.current.material
        const progress = material.uniforms.uProgress.value
        if (offScreen) {
            // Completely out of sight — rewind so the next entrance re-reveals.
            // Nothing the user can see is being reset here.
            if (scrollTweenRef.current) {
                scrollTweenRef.current.kill()
                scrollTweenRef.current = null
                stopLoop()
            }
            if (replay && progress > 0.01) {
                material.uniforms.uProgress.value = 0
                renderOnce()
            }
            return
        }
        if (inView && progress < 0.99) {
            // A reveal already in flight is left alone. Scrolling re-runs this
            // effect, and killing + restarting the tween each time froze the
            // reveal partway through — it must run to completion once started.
            if (scrollTweenRef.current) return
            startLoop()
            scrollTweenRef.current = gsap.to(material.uniforms.uProgress, {
                value: 1,
                duration: trDuration,
                ease,
                onUpdate: renderOnce,
                onComplete: () => {
                    renderOnce()
                    stopLoop()
                    scrollTweenRef.current = null
                },
            })
        }
        // No cleanup that kills the tween: this effect re-runs on every scroll
        // update, and tearing the tween down there is what stopped the animation
        // mid-reveal. It is killed on unmount instead (effect below).
    }, [
        inView,
        offScreen,
        replay,
        textureReady,
        trDuration,
        ease,
        isCanvas,
        renderOnce,
        startLoop,
        stopLoop,
    ])

    // Tear the scroll tween down only when the component actually goes away.
    useEffect(() => {
        return () => {
            if (scrollTweenRef.current) {
                scrollTweenRef.current.kill()
                scrollTweenRef.current = null
            }
            stopLoop()
        }
    }, [stopLoop])

    // Framer canvas: always play the reveal preview once.
    useEffect(() => {
        if (!isCanvas || !meshRef.current?.material) return
        const u = meshRef.current.material.uniforms
        u.uProgress.value = 0
        startLoop()
        const tween = gsap.to(u.uProgress, {
            value: 1,
            duration: trDuration,
            ease,
            onUpdate: renderOnce,
            onComplete: () => {
                renderOnce()
                stopLoop()
            },
        })
        return () => {
            tween?.kill()
            stopLoop()
        }
    }, [isCanvas, trDuration, ease, renderOnce, startLoop, stopLoop, blobCount])

    if (!hasImage) {
        return (
            <ComponentMessage
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    ...style,
                }}
                title="Blob Image Reveal"
                subtitle="Add an image to see the blob reveal effect"
            />
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "block",
                margin: 0,
                padding: 0,
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
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

// ControlType.ResponsiveImage takes no defaultValue, so the default image is
// supplied here (and in the destructure above).
BlobReveal.defaultProps = {
    image: {
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/041b1d75-2371-44dc-4b15-972ecd7b2400/w=800",
    },
    fit: "cover",
    blobCount: 20,
    startAlign: "bottom",
    replay: true,
}