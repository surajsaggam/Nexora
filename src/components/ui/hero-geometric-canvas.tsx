"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- Simplex noise + 4x4 Bayer dithering shader from Componentry HeroGeometric ---
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float bayerDither4x4(vec2 uv) {
    int x = int(mod(uv.x, 4.0));
    int y = int(mod(uv.y, 4.0));
    
    int matrix[16];
    matrix[0] = 0; matrix[1] = 8; matrix[2] = 2; matrix[3] = 10;
    matrix[4] = 12; matrix[5] = 4; matrix[6] = 14; matrix[7] = 6;
    matrix[8] = 3; matrix[9] = 11; matrix[10] = 1; matrix[11] = 9;
    matrix[12] = 15; matrix[13] = 7; matrix[14] = 13; matrix[15] = 5;
    
    return float(matrix[y * 4 + x]) / 16.0;
}

void main() {
    vec2 uv = vUv;
    vec2 coord = gl_FragCoord.xy;
    
    // Smooth time progression driven by uTime
    float t = uTime * 0.2;
    
    // Dynamic noise coordinates with gentle multi-frequency drift
    vec2 noiseCoord1 = uv * 1.4 + vec2(t * 0.5, t * 0.35);
    vec2 noiseCoord2 = uv * 0.8 - vec2(t * 0.25, t * 0.4);
    float noise = (snoise(noiseCoord1) * 0.6 + snoise(noiseCoord2) * 0.4) * 0.28;
    
    // Diagonal gradient with gentle breathing undulation
    float diagonal = (uv.x + uv.y) * 0.5;
    float wave = sin(diagonal * 3.14159 + t * 0.4) * 0.06;
    
    // Combined gradient driving the stepped geometric bands
    float gradient = diagonal * 1.1 + noise + wave;
    
    // Interpolate colors based on gradient
    vec3 deepColor = uColor1;
    vec3 paleColor = uColor2;
    vec3 softColor = mix(deepColor, paleColor, 0.33);
    vec3 lightColor = mix(deepColor, paleColor, 0.66);
    
    // Map to colors with distinct steps
    vec3 color;
    if (gradient < 0.3) {
        color = deepColor;
    } else if (gradient < 0.55) {
        color = softColor;
    } else if (gradient < 0.8) {
        color = lightColor;
    } else {
        color = paleColor;
    }
    
    // Enhanced dithering at boundaries
    float dither = bayerDither4x4(coord);
    float threshold = fract(gradient * 4.0);
    
    if (gradient < 0.3 && threshold > dither * 0.5) {
        color = softColor;
    } else if (gradient >= 0.3 && gradient < 0.55 && threshold > dither * 0.5) {
        color = lightColor;
    } else if (gradient >= 0.55 && gradient < 0.8 && threshold > dither * 0.5) {
        color = paleColor;
    }
    
    // Softer fade to pale color at bottom-left corner
    vec2 cornerDist = vec2(uv.x, uv.y);
    float fadeMask = smoothstep(0.0, 0.25, length(cornerDist));
    color = mix(paleColor, color, fadeMask);
    
    // Subtle vignette to emphasize architectural curvature
    float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
    color = mix(color, color * 0.96, (1.0 - vignette) * 0.25);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

const HEX_COLOR_REGEX = /^#?[0-9a-fA-F]{6}$/;

function sanitizeHexColor(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) return fallback;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

const GradientPlane = ({
  color1,
  color2,
  speed = 0.8,
}: {
  color1: string;
  color2: string;
  speed?: number;
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1000, 1000) },
      uColor1: { value: new THREE.Color("#e0e4d3") },
      uColor2: { value: new THREE.Color("#fdfffa") },
    }),
    []
  );

  useFrame((state) => {
    const { clock, size } = state;
    const time = clock.getElapsedTime() * speed;

    // Continuously update uniform values
    uniforms.uTime.value = time;
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uColor1.value.set(sanitizeHexColor(color1, "#e0e4d3"));
    uniforms.uColor2.value.set(sanitizeHexColor(color2, "#fdfffa"));

    // Also update material directly to guarantee the GPU uniform updates every frame
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
      materialRef.current.uniforms.uColor1.value.set(sanitizeHexColor(color1, "#e0e4d3"));
      materialRef.current.uniforms.uColor2.value.set(sanitizeHexColor(color2, "#fdfffa"));
    }
  });

  return (
    <mesh scale={[3, 3, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

export interface HeroGeometricCanvasProps {
  color1?: string;
  color2?: string;
  speed?: number;
  className?: string;
}

export default function HeroGeometricCanvas({
  color1 = "#e0e4d3",
  color2 = "#fdfffa",
  speed = 0.8,
  className = "",
}: HeroGeometricCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`w-full h-full ${className}`}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <Canvas
        frameloop="always"
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 1]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <GradientPlane color1={color1} color2={color2} speed={speed} />
      </Canvas>
    </div>
  );
}
