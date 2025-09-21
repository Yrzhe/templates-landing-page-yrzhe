import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";

const canvas = document.getElementById("universe");
const sizes = { width: canvas.clientWidth, height: canvas.clientHeight };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01020a);

const camera = new THREE.PerspectiveCamera(
  55,
  sizes.width / sizes.height,
  0.1,
  200
);
camera.position.set(0, 10, 35);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const ambient = new THREE.AmbientLight(0x405bff, 0.35);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xfff2a6, 3, 250, 1.8);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const solarSystem = new THREE.Group();
scene.add(solarSystem);

function createPlanet({ radius, color, distance, speed, glowColor }) {
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.4,
    roughness: 0.3,
    emissive: new THREE.Color(glowColor ?? 0x000000).multiplyScalar(0.2),
    emissiveIntensity: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const orbit = new THREE.Object3D();
  orbit.position.set(0, 0, 0);
  orbit.userData = { distance, speed, mesh };
  mesh.position.x = distance;
  orbit.add(mesh);

  const ringGeometry = new THREE.RingGeometry(
    distance - 0.05,
    distance + 0.05,
    128
  );
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x0f1f3b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  solarSystem.add(ring);

  solarSystem.add(orbit);
  return orbit;
}

const sunGeometry = new THREE.SphereGeometry(4.6, 72, 72);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffd16f });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.material.onBeforeCompile = (shader) => {
  shader.uniforms.time = { value: 0 };
  shader.fragmentShader = shader.fragmentShader.replace(
    "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
    `float intensity = smoothstep(0.2, 1.0, length(vUv - 0.5));
     vec3 glow = mix(vec3(1.3, 0.8, 0.2), vec3(1.0, 0.4, 0.1), intensity);
     gl_FragColor = vec4(outgoingLight * glow, diffuseColor.a);`
  );
  sun.userData.shader = shader;
};
sunLight.add(sun);

const planets = [
  createPlanet({
    radius: 1.0,
    color: 0x6de5ff,
    distance: 8,
    speed: 0.6,
    glowColor: 0x6de5ff,
  }),
  createPlanet({
    radius: 1.3,
    color: 0xff9f6d,
    distance: 12,
    speed: 0.45,
    glowColor: 0xffbc81,
  }),
  createPlanet({
    radius: 1.8,
    color: 0x8a6dff,
    distance: 16,
    speed: 0.3,
    glowColor: 0x9f8aff,
  }),
  createPlanet({
    radius: 1.1,
    color: 0x82ffaf,
    distance: 20,
    speed: 0.25,
    glowColor: 0x82ffaf,
  }),
];

// Saturn-like rings for the third planet
const saturnOrbit = planets[2];
const saturnMesh = saturnOrbit.userData.mesh;
const saturnRingGeometry = new THREE.RingGeometry(2.8, 4.2, 128);
const saturnRingMaterial = new THREE.MeshStandardMaterial({
  color: 0xb79cff,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.45,
  metalness: 0.2,
  roughness: 0.4,
});
const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
saturnRing.rotation.x = Math.PI / 2.4;
saturnMesh.add(saturnRing);

// Starfield
const starGeometry = new THREE.BufferGeometry();
const starCount = 1200;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 90 * Math.pow(Math.random(), 0.8) + 40;
  positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[i * 3 + 2] = radius * Math.cos(phi);
}
starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0x6de5ff,
  size: 0.45,
  sizeAttenuation: true,
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  planets.forEach((orbit) => {
    const { mesh, speed, distance } = orbit.userData;
    const angle = elapsed * speed;
    mesh.position.set(
      Math.cos(angle) * distance,
      Math.sin(angle * 0.2),
      Math.sin(angle) * distance
    );
    mesh.rotation.y += 0.01;
  });

  stars.rotation.y += 0.0006;
  stars.rotation.x += 0.0003;

  if (sun.userData.shader) {
    sun.userData.shader.uniforms.time.value = elapsed;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

function onResize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", onResize);

// Scroll reveal animations
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.35 }
);

document
  .querySelectorAll(".panel__content")
  .forEach((panel) => observer.observe(panel));

// Custom cursor logic
const cursorDot = document.getElementById("cursor-dot");
const cursorRing = document.getElementById("cursor-ring");

let cursorVisible = true;
const cursorPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let ringScale = 1;

const updateCursor = () => {
  if (!cursorVisible) return;
  const translate = `translate(calc(${cursorPosition.x}px - 50%), calc(${cursorPosition.y}px - 50%))`;
  cursorDot.style.transform = translate;
  cursorRing.style.transform = `${translate} scale(${ringScale})`;
  requestAnimationFrame(updateCursor);
};

updateCursor();

document.addEventListener("pointermove", (event) => {
  cursorVisible = true;
  cursorPosition.x = event.clientX;
  cursorPosition.y = event.clientY;
});

document.addEventListener("pointerdown", () => {
  ringScale = 0.75;
  cursorRing.style.transition = "transform 0.08s ease";
});

document.addEventListener("pointerup", () => {
  ringScale = 1;
  cursorRing.style.transition = "transform 0.25s ease";
});

// Parallax effect on scroll
const heroContent = document.querySelector(".hero__content");
const heroSection = document.getElementById("hero");

window.addEventListener("scroll", () => {
  const rect = heroSection.getBoundingClientRect();
  const offset = Math.max(0, 1 - rect.top / window.innerHeight);
  heroContent.style.setProperty("--offset", offset.toString());
  heroContent.style.transform = `translateY(${(1 - offset) * 30}px)`;
  heroContent.style.opacity = Math.min(1, offset + 0.2);
});

// Smooth background pulse based on scroll depth
const body = document.body;
window.addEventListener("scroll", () => {
  const progress = Math.min(
    1,
    window.scrollY / (document.body.scrollHeight - window.innerHeight)
  );
  const hue = 210 + progress * 100;
  body.style.setProperty("--accent", `hsl(${hue}, 100%, 75%)`);
  body.style.setProperty("--accent-strong", `hsl(${hue + 40}, 100%, 80%)`);
});

// Accessibility fallback for mobile
const mediaQuery = window.matchMedia("(max-width: 720px)");
const toggleCursor = (event) => {
  if (event.matches) {
    cursorDot.style.display = "none";
    cursorRing.style.display = "none";
    cursorVisible = false;
  } else {
    cursorDot.style.display = "";
    cursorRing.style.display = "";
    cursorVisible = true;
    ringScale = 1;
    updateCursor();
  }
};

mediaQuery.addEventListener("change", toggleCursor);
toggleCursor(mediaQuery);
