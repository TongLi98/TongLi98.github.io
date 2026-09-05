import { gsap } from "gsap";
import * as THREE from "three";
import { createIcons, createElement, Menu, X, ArrowUpRight, ArrowUp, ArrowDown, Sun, Zap, Atom, Network } from "lucide";

createIcons({ icons: { Menu, X, ArrowUpRight, ArrowUp, ArrowDown, Sun, Zap, Atom, Network } });

const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const header = document.querySelector(".site-header");
const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const mobileLayout = matchMedia("(max-width: 760px)");
const setMenu = (open) => {
  nav.classList.toggle("is-open", open);
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  const icon = createElement(open ? X : Menu);
  icon.classList.add("lucide");
  icon.setAttribute("aria-hidden", "true");
  menu.replaceChildren(icon);
};
menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.composedPath().includes(header) && menu.getAttribute("aria-expanded") === "true") setMenu(false);
});
mobileLayout.addEventListener("change", () => setMenu(false));
const updateHeader = () => header.classList.toggle("is-scrolled", scrollY > 12);
updateHeader();
addEventListener("scroll", updateHeader, { passive: true });

// Content stays visible without JavaScript; only entering items receive animation.
const motion = gsap.matchMedia();
motion.add("(prefers-reduced-motion: no-preference)", () => {
  gsap.from(".profile-line, .hero h1, .hero-tagline, .hero-copy, .hero-actions", {
    y: 18, opacity: 0, duration: .85, stagger: .09, ease: "power3.out", clearProps: "all",
  });
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting) return;
      gsap.fromTo(entry.target, { y: 22, opacity: .3 }, {
        y: 0, opacity: 1, duration: .75, delay: Math.min(index * .06, .18),
        ease: "power3.out", clearProps: "transform,opacity",
      });
      reveal.unobserve(entry.target);
    });
  }, { threshold: .08 });
  document.querySelectorAll(".section-grid, .section-kicker, .feature-card, .publication, .timeline article, .clean-list li, .contact-section h2")
    .forEach((element) => reveal.observe(element));
  return () => reveal.disconnect();
});

const navSections = Array.from(nav.querySelectorAll('a[href^="#"]'))
  .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
  .filter(({ section }) => section);
const activeSection = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navSections.forEach(({ link, section }) => {
      if (section === entry.target) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  });
}, { rootMargin: "-15% 0px -60% 0px" });
navSections.forEach(({ section }) => activeSection.observe(section));

function initializeMolecules() {
  const container = document.querySelector(".molecular-scene");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0xf5f5f7, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);
  container.classList.add("scene-ready");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 80);
  camera.position.set(0, 4.2, 11);
  camera.lookAt(0, .2, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x737b89, 3));
  const key = new THREE.DirectionalLight(0xffffff, 5);
  key.position.set(-3, 7, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc4dcff, 3);
  rim.position.set(4, 2, -3);
  scene.add(rim);

  const model = new THREE.Group();
  scene.add(model);
  const sphere = new THREE.SphereGeometry(1, 28, 20);
  const bondShape = new THREE.CylinderGeometry(1, 1, 1, 12);
  const silver = new THREE.MeshStandardMaterial({ color: 0xb5bbc4, metalness: .68, roughness: .26 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x0071e3, metalness: .48, roughness: .23 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x33343a, metalness: .4, roughness: .25 });
  const oxygen = new THREE.MeshStandardMaterial({ color: 0xe4474a, metalness: .18, roughness: .28 });
  const bondMaterial = new THREE.MeshStandardMaterial({ color: 0xaeb5c0, metalness: .65, roughness: .32 });

  const atom = (group, position, radius, material) => {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(...position);
    mesh.scale.setScalar(radius);
    group.add(mesh);
    return mesh;
  };
  const bond = (group, start, end, radius = .035) => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = b.clone().sub(a);
    const mesh = new THREE.Mesh(bondShape, bondMaterial);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    mesh.scale.set(radius, direction.length(), radius);
    group.add(mesh);
  };

  const surface = new THREE.Group();
  model.add(surface);
  // A conceptual surface, not a crystallographic or reaction simulation.
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 9; col++) {
      const x = (col - 4) * .74 + (row % 2) * .18;
      const z = (row - 1.5) * .65;
      const active = row === 1 && col === 4;
      atom(surface, [x, -.5, z], active ? .23 : .18, active ? blue : silver);
      if (col < 8) bond(surface, [x, -.5, z], [x + .74, -.5, z], .028);
      if (row < 3) bond(surface, [x, -.5, z], [x + (row % 2 ? -.18 : .18), -.5, z + .65], .028);
    }
  }
  const molecule = new THREE.Group();
  model.add(molecule);
  atom(molecule, [0, 0, 0], .36, carbon);
  atom(molecule, [-.92, 0, 0], .39, oxygen);
  atom(molecule, [.92, 0, 0], .39, oxygen);
  [-.085, .085].forEach((offset) => {
    bond(molecule, [-.92, offset, 0], [0, offset, 0], .042);
    bond(molecule, [0, offset, 0], [.92, offset, 0], .042);
  });
  molecule.position.set(0, 1.15, 0);
  molecule.rotation.set(.1, .25, -.14);
  model.rotation.y = -.2;

  let frame = 0;
  let inView = false;
  let contextLost = false;
  let previousTime = 0;
  let elapsed = 0;
  const pointer = { x: 0, y: 0 };
  const render = (time = 0) => {
    frame = 0;
    if (contextLost) return;
    const moving = !motionPreference.matches && inView && !document.hidden;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    if (moving) elapsed += delta;
    model.rotation.y = -.2 + (moving ? Math.sin(elapsed * .28) * .12 : 0) + pointer.x * .14;
    model.rotation.x = pointer.y * .06;
    molecule.position.y = 1.15 + (moving ? Math.sin(elapsed * .9) * .09 : 0);
    molecule.rotation.y = .25 + (moving ? Math.sin(elapsed * .45) * .2 : 0);
    renderer.render(scene, camera);
    if (moving) frame = requestAnimationFrame(render);
  };
  const resume = () => {
    if (frame) cancelAnimationFrame(frame);
    previousTime = 0;
    render();
  };
  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    // Frame the complete model even on narrow screens.
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const distance = Math.max(7.2, 7.6 / (2 * Math.tan(verticalFov / 2) * camera.aspect));
    camera.position.set(0, distance * .35, distance);
    camera.lookAt(0, .25, 0);
    camera.updateProjectionMatrix();
    resume();
  };
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    resume();
  }, { rootMargin: "60px" }).observe(container);
  document.addEventListener("visibilitychange", resume);
  motionPreference.addEventListener("change", () => {
    pointer.x = pointer.y = 0;
    resume();
  });
  container.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || motionPreference.matches) return;
    const rect = container.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width - .5;
    pointer.y = (event.clientY - rect.top) / rect.height - .5;
  });
  container.addEventListener("pointerleave", () => {
    pointer.x = pointer.y = 0;
  });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    container.classList.remove("scene-ready");
    renderer.domElement.hidden = true;
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    container.classList.add("scene-ready");
    renderer.domElement.hidden = false;
    resume();
  });
  resize();
}
initializeMolecules();
