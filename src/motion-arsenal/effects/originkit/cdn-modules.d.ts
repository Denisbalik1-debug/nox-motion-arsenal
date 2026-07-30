declare module "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js" {
    export * from "three"
}

declare module "https://esm.sh/gsap@3.12.5" {
    export * from "gsap"
    export const gsap: any
}

declare module "https://framer.com/m/Utils-FINc.js" {
    export const ComponentMessage: any
    export const RenderTarget: {
        current(): string | number
        canvas: string | number
    }
}
