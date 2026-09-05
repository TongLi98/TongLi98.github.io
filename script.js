import { gsap } from "gsap";
import * as THREE from "three";
import { createIcons, createElement, Menu, X, ArrowUpRight, ArrowUp, ArrowDown, Sun, Zap, Atom, Network } from "lucide";

createIcons({ icons: { Menu, X, ArrowUpRight, ArrowUp, ArrowDown, Sun, Zap, Atom, Network } });

// Share the palette with the controls so every model mode stays visually consistent.
const theme = getComputedStyle(document.documentElement);
const researchColors = Object.fromEntries(["light", "plasma", "carbon", "data"].map(name => [name, theme.getPropertyValue(`--${name}`).trim()]));
const researchInk = Object.fromEntries(["light", "plasma", "carbon", "data"].map(name => [name, theme.getPropertyValue(`--${name}-ink`).trim()]));

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
const progress = document.querySelector(".reading-progress");
const updateHeader = () => {
  header.classList.toggle("is-scrolled", scrollY > 12);
  const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  progress.style.transform = `scaleX(${Math.min(1, scrollY / range)})`;
};
updateHeader();
addEventListener("scroll", updateHeader, { passive: true });
addEventListener("resize", updateHeader);

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
  renderer.setClearColor(theme.getPropertyValue("--graphite").trim(), 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);
  container.classList.add("scene-ready");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 80);
  camera.position.set(0, 4.2, 11);
  camera.lookAt(0, .2, 0);

  scene.add(new THREE.HemisphereLight(0xf2f0ed, 0x42464a, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-3, 7, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc4ced6, 1.4);
  rim.position.set(4, 2, -3);
  scene.add(rim);

  const model = new THREE.Group();
  scene.add(model);
  const sphere = new THREE.SphereGeometry(1, 28, 20);
  const bondShape = new THREE.CylinderGeometry(1, 1, 1, 12);
  const surfaceMaterial = new THREE.MeshStandardMaterial({ color: 0x7e9295, metalness: .08, roughness: .64 });
  const activeMaterial = new THREE.MeshStandardMaterial({ color: researchColors.carbon, emissive: researchColors.carbon, emissiveIntensity: .04, metalness: .06, roughness: .58 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0xc1c0bd, metalness: .1, roughness: .6 });
  const oxygen = new THREE.MeshStandardMaterial({ color: theme.getPropertyValue("--molecule-oxygen").trim(), metalness: .05, roughness: .64 });
  const bondMaterial = new THREE.MeshStandardMaterial({ color: 0x969f9e, metalness: .12, roughness: .58 });

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
      atom(surface, [x, -.5, z], active ? .23 : .18, active ? activeMaterial : surfaceMaterial);
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

  const floor = new THREE.GridHelper(9, 18, 0x69787b, 0x465154);
  floor.position.y = -.82;
  floor.material.transparent = true;
  floor.material.opacity = .55;
  model.add(floor);

  const lenses = Object.fromEntries(["light", "plasma", "carbon", "data"].map(name => {
    const group = new THREE.Group();
    group.visible = name === "carbon";
    model.add(group);
    return [name, group];
  }));
  const trace = (group, points, color, dashed = false) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point)));
    const options = { color, transparent: true, opacity: .8 };
    const material = dashed ? new THREE.LineDashedMaterial({ ...options, dashSize: .1, gapSize: .06 }) : new THREE.LineBasicMaterial(options);
    const line = new THREE.Line(geometry, material);
    if (dashed) line.computeLineDistances();
    group.add(line);
    return line;
  };

  // Each lens is a conceptual visual vocabulary, without calculated scientific values.
  const photonPoints = Array.from({ length: 110 }, (_, index) => {
    const t = index / 109;
    return [-3.3 + t * 3.2, 1.5 - t * 1.7 + Math.sin(t * Math.PI * 12) * .11, .2];
  });
  const photon = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(photonPoints.map(p => new THREE.Vector3(...p))), 110, .018, 6, false),
    new THREE.MeshBasicMaterial({ color: researchColors.light }),
  );
  lenses.light.add(photon);
  for (let strand = 0; strand < 3; strand++) {
    const points = Array.from({ length: 32 }, (_, index) => {
      const t = index / 31;
      return [-3 + t * 6, .55 + strand * .32 + Math.sin(index * 2.1 + strand) * .18, -.5];
    });
    trace(lenses.plasma, points, strand === 1 ? researchColors.light : researchColors.plasma);
  }
  trace(lenses.carbon, [[.18, -.3, -.3], [.3, .35, 0], [0, .75, 0]], researchColors.carbon, true);
  for (let index = 0; index < 5; index++) {
    const x = (index - 2) * 1.2;
    trace(lenses.data, [[x, -.2, .7], [x + .35, .55, -.3], [0, .8, 0]], researchColors.data, true);
  }
  const controls = document.querySelector(".scene-controls");
  const hero = document.querySelector(".hero");
  const topic = document.querySelector("#scene-topic");
  const lensLabels = {
    light: "Photocatalysis / Concept model",
    plasma: "Plasma catalysis / Concept model",
    carbon: "CO2 utilization / Concept model",
    data: "Machine learning / Concept model",
  };
  const surfaceColors = { light: 0x969087, plasma: 0x918596, carbon: 0x7e9295, data: 0x8a9785 };

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
    photon.material.color.set(researchColors.light).multiplyScalar(moving ? .96 + Math.sin(elapsed * 2) * .04 : 1);
    lenses.plasma.children.forEach((line, index) => {
      line.material.opacity = moving ? .65 + Math.sin(elapsed * 2 + index) * .18 : .8;
    });
    activeMaterial.emissiveIntensity = moving ? .04 + Math.sin(elapsed * 1.2) * .015 : .04;
    renderer.render(scene, camera);
    if (moving) frame = requestAnimationFrame(render);
  };
  const resume = () => {
    if (frame) cancelAnimationFrame(frame);
    previousTime = 0;
    render();
  };
  controls.disabled = false;
  controls.addEventListener("change", (event) => {
    const name = event.target.value;
    if (!Object.hasOwn(lenses, name)) return;
    hero.dataset.lens = name;
    topic.textContent = lensLabels[name];
    container.setAttribute("aria-label", `Conceptual three-dimensional ${lensLabels[name].split(" / ")[0]} illustration above a catalyst surface`);
    Object.entries(lenses).forEach(([key, group]) => { group.visible = key === name; });
    activeMaterial.color.set(researchColors[name]);
    activeMaterial.emissive.set(researchColors[name]);
    surfaceMaterial.color.setHex(surfaceColors[name]);
    resume();
  });
  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    // Frame the complete model even on narrow screens.
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const distance = Math.max(7.2, 9.5 / (2 * Math.tan(verticalFov / 2) * camera.aspect));
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
    controls.disabled = true;
    renderer.domElement.hidden = true;
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    container.classList.add("scene-ready");
    controls.disabled = false;
    renderer.domElement.hidden = false;
    resume();
  });
  resize();
}
initializeMolecules();

function drawResearchDiagrams() {
  document.querySelectorAll(".research-diagram").forEach(canvas => {
    const context = canvas.getContext("2d");
    if (!context) return;
    const line = (points, color, width = 2) => {
      context.beginPath();
      context.strokeStyle = color;
      context.lineWidth = width;
      points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
      context.stroke();
    };
    const circle = (x, y, radius, color) => {
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    };
    context.lineCap = "round";
    const name = canvas.dataset.diagram;
    const accent = researchInk[name];
    if (name === "light") {
      line([[12, 80], [388, 80]], "#d8d9df", 1);
      [35, 80, 125].forEach(y => line([[12, y], [388, y]], "#d8d9df", 1));
      const points = Array.from({ length: 180 }, (_, i) => [12 + i * 2.1, 80 + Math.sin(i / 10) * 32]);
      line(points, accent, 4);
      line([[325, 27], [364, 27], [364, 55]], accent, 2);
    } else if (name === "plasma") {
      line([[24, 28], [24, 130]], "#a5acb3", 5);
      line([[376, 28], [376, 130]], "#a5acb3", 5);
      [0, 1, 2].forEach(strand => {
        const points = Array.from({ length: 35 }, (_, i) => [26 + i * 10.2, 53 + strand * 29 + Math.sin(i * 1.3 + strand) * 13]);
        line(points, strand === 1 ? accent : researchColors.plasma, strand === 1 ? 4 : 2);
      });
    } else if (name === "carbon") {
      [73, 87].forEach(y => line([[86, y], [314, y]], researchColors.carbon, 3));
      const oxygenInk = theme.getPropertyValue("--oxygen-ink").trim();
      [[80, "O", oxygenInk], [200, "C", accent], [320, "O", oxygenInk]].forEach(([x, label, color]) => {
        circle(x, 80, 31, color);
        context.fillStyle = "#fff";
        context.font = "22px -apple-system, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(label, x, 81);
      });
    } else {
      const layers = [[55, [50, 110]], [150, [27, 80, 133]], [250, [27, 80, 133]], [345, [50, 110]]];
      layers.slice(0, -1).forEach(([x, rows], layer) => {
        const [nextX, nextRows] = layers[layer + 1];
        rows.forEach(y => nextRows.forEach(nextY => line([[x, y], [nextX, nextY]], researchColors.data, 1.5)));
      });
      layers.forEach(([x, rows]) => rows.forEach(y => circle(x, y, 7, accent)));
      line([[55, 50], [150, 80], [250, 27], [345, 110]], accent, 3);
    }
  });
}
drawResearchDiagrams();
