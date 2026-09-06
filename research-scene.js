import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createElement, Pause, Play } from "lucide";

export function initializeResearchScene({ colors, background, oxygenColor, motionPreference }) {
  const container = document.querySelector(".molecular-scene");
  const controls = document.querySelector(".scene-controls");
  const pause = document.querySelector(".scene-pause");
  const reset = document.querySelector(".scene-reset");
  const hero = document.querySelector(".hero");
  const topic = document.querySelector("#scene-topic");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(background, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 80);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enablePan = false;
  orbit.enableZoom = false;
  orbit.minPolarAngle = Math.PI * .25;
  orbit.maxPolarAngle = Math.PI * .51;
  orbit.minAzimuthAngle = -.6;
  orbit.maxAzimuthAngle = .6;
  orbit.rotateSpeed = .55;
  // Keep one-finger page scrolling available; two fingers can rotate the model.
  orbit.touches.ONE = null;
  orbit.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  renderer.domElement.style.touchAction = "pan-y";
  scene.add(new THREE.HemisphereLight(0xf2f0ed, 0x41464a, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-3, 7, 4);
  const rim = new THREE.DirectionalLight(0xc4ced6, 1.4);
  rim.position.set(4, 3, -3);
  scene.add(key, rim);

  const sphere = new THREE.SphereGeometry(1, 22, 16);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const vector = (point) => new THREE.Vector3(...point);
  const matte = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .66, metalness: .08, ...options });
  const carbonMaterial = matte(0xc1c0bd);
  const oxygenMaterial = matte(oxygenColor);
  const bondMaterial = matte(0x8b9697);
  const accentMaterials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name, matte(color, { emissive: color, emissiveIntensity: .06 })]));

  function atom(group, point, radius, material) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(...point);
    mesh.scale.setScalar(radius);
    group.add(mesh);
    return mesh;
  }
  function positionBond(mesh, a, b, radius) {
    const direction = b.clone().sub(a);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(up, direction.clone().normalize());
    mesh.scale.set(radius, direction.length(), radius);
  }
  function bond(group, a, b, radius = .025, material = bondMaterial) {
    const mesh = new THREE.Mesh(cylinder, material);
    positionBond(mesh, vector(a), vector(b), radius);
    group.add(mesh);
    return mesh;
  }
  function label(group, text, point, color = "#c5cdcd", width = 1.6) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const font = "500 32px -apple-system, sans-serif";
    context.font = font;
    canvas.width = Math.ceil(context.measureText(text).width + 32);
    canvas.height = 64;
    context.font = font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, toneMapped: false }));
    sprite.position.set(...point);
    sprite.scale.set(width, width * canvas.height / canvas.width, 1);
    group.add(sprite);
    return sprite;
  }
  function path(group, points, color, { radius = .013, opacity = .65, dashed = false } = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map(vector));
    let object;
    if (dashed) {
      object = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), new THREE.LineDashedMaterial({ color, dashSize: .065, gapSize: .065, transparent: true, opacity }));
      object.computeLineDistances();
    } else {
      object = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 5, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
    }
    group.add(object);
    return { curve, object };
  }
  function traveler(group, curve, color, radius = .065) {
    const bead = atom(group, [0, 0, 0], radius, accentMaterials[color] || matte(color));
    return (phase) => bead.position.copy(curve.getPoint(((phase % 1) + 1) % 1));
  }
  function ring(group, point, radius, color, thickness = .025) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 8, 64), matte(color));
    mesh.position.set(...point);
    group.add(mesh);
    return mesh;
  }
  function surface(group, name, { scale = 1, y = 0 } = {}) {
    const crystal = new THREE.Group();
    const sites = [];
    const pairs = [];
    for (let layer = 0; layer < 3; layer++) {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 7; col++) {
          const point = [(col - 3) * .7 + (row % 2) * .18, -.65 - layer * .31, (row - 2) * .56];
          const index = sites.length;
          sites.push(point);
          if (col > 0) pairs.push([index - 1, index]);
          if (row > 0) pairs.push([index - 7, index]);
          if (layer > 0) pairs.push([index - 35, index]);
        }
      }
    }
    const material = matte({ light: 0x999087, plasma: 0x918596, carbon: 0x7e9295, data: 0x8a9785 }[name]);
    const atoms = new THREE.InstancedMesh(sphere, material, sites.length);
    sites.forEach((point, index) => {
      dummy.position.set(...point);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(index < 35 ? .14 : .115);
      dummy.updateMatrix();
      atoms.setMatrixAt(index, dummy.matrix);
      atoms.setColorAt(index, new THREE.Color(index < 35 ? 0xffffff : index < 70 ? 0xc4c8ca : 0x909a9e));
    });
    const bonds = new THREE.InstancedMesh(cylinder, bondMaterial, pairs.length);
    pairs.forEach(([a, b], index) => {
      positionBond(dummy, vector(sites[a]), vector(sites[b]), .018);
      dummy.updateMatrix();
      bonds.setMatrixAt(index, dummy.matrix);
    });
    crystal.add(atoms, bonds);
    const site = atom(crystal, [0, -.38, 0], .23, accentMaterials[name]);
    [[-.7, -.65, 0], [.7, -.65, 0], [0, -.65, -.56], [0, -.65, .56]].forEach(point => bond(crystal, point, [0, -.38, 0]));
    const activeRing = ring(crystal, [0, -.62, 0], .43, colors[name], .018);
    activeRing.rotation.x = Math.PI / 2;
    crystal.position.y = y;
    crystal.scale.setScalar(scale);
    group.add(crystal);
    return { group: crystal, site, activeRing };
  }
  function co2(group, { scale = 1, point = [0, 0, 0] } = {}) {
    const molecule = new THREE.Group();
    atom(molecule, [0, 0, 0], .26, carbonMaterial);
    const oxygens = [-1, 1].map(side => atom(molecule, [side * .67, 0, 0], .28, oxygenMaterial));
    const bonds = [-1, 1].map(side => [-.055, .055].map(offset => bond(molecule, [0, offset, 0], [side * .67, offset, 0], .027)));
    molecule.position.set(...point);
    molecule.scale.setScalar(scale);
    group.add(molecule);
    return { group: molecule, bend(amount) {
      oxygens.forEach((oxygen, index) => {
        oxygen.position.y = amount;
        bonds[index].forEach((mesh, offset) => {
          const shift = offset === 0 ? -.055 : .055;
          positionBond(mesh, new THREE.Vector3(0, shift, 0), new THREE.Vector3(oxygen.position.x, amount + shift, 0), .027);
        });
      });
    } };
  }

  // These are illustrative stages, not calculated trajectories or a kinetic model.
  const stages = {};
  for (const name of Object.keys(colors)) {
    const group = new THREE.Group();
    const floor = new THREE.GridHelper(7.2, 24, 0x59686b, 0x3c474a);
    floor.position.y = -1.48;
    floor.material.transparent = true;
    floor.material.opacity = .3;
    group.add(floor);
    scene.add(group);
    stages[name] = { group, update: () => {} };
  }

  {
    const { group } = stages.light;
    const crystal = surface(group, "light");
    const waves = [0, 1, 2].map(index => {
      const points = Array.from({ length: 48 }, (_, step) => {
        const t = step / 47;
        return [-3.05 + 2.8 * t, 1.85 - 1.9 * t + Math.sin(t * Math.PI * 10) * .095, -.5 + index * .38];
      });
      const line = path(group, points, colors.light, { opacity: .65, radius: .018 });
      return traveler(group, line.curve, "light", .075);
    });
    const electron = path(group, [[-.2, -.15, 0], [.4, .55, .25], [1.25, .55, .45], [1.9, -.46, .56]], colors.carbon, { opacity: .8, radius: .018 });
    const hole = path(group, [[-.2, -.15, 0], [-.9, .45, .5], [-1.65, .28, .8], [-1.8, -.5, .8]], oxygenColor, { opacity: .8, radius: .018 });
    const charges = [traveler(group, electron.curve, "carbon", .09), traveler(group, hole.curve, oxygenColor, .09)];
    label(group, "PHOTONS", [-2.1, 2.14, 0], colors.light, 1.7);
    label(group, "e-", [1.3, .88, .5], colors.carbon, .8);
    label(group, "h+", [-1.6, .77, .7], oxygenColor, .8);
    label(group, "CHARGE SEPARATION", [.2, 1.5, 0], "#c5cdcd", 2.5);
    stages.light.update = (time) => {
      waves.forEach((update, index) => update(time * .24 + index / 3));
      charges.forEach((update, index) => update(time * .21 + index * .4));
      crystal.site.scale.setScalar(.23 + Math.sin(time * 1.5) * .012);
    };
  }
  {
    const { group } = stages.plasma;
    surface(group, "plasma", { scale: .82, y: -.22 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.13, 1.13, 5.45, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xb9b6c1, transparent: true, opacity: .07, roughness: .45, metalness: 0, depthWrite: false, side: THREE.DoubleSide }));
    glass.rotation.z = Math.PI / 2;
    glass.position.y = .15;
    group.add(glass);
    [-2.65, 2.65].forEach(x => {
      [-.075, .075].forEach(offset => {
        const electrode = ring(group, [x + offset, .15, 0], 1.13, colors.plasma, .055);
        electrode.rotation.y = Math.PI / 2;
      });
      bond(group, [x, -1.0, 0], [x, -1.4, 0], .075);
    });
    [0, Math.PI].forEach(angle => path(group, [[-2.65, .15 + Math.cos(angle) * 1.13, Math.sin(angle) * 1.13], [0, .15 + Math.cos(angle) * 1.13, Math.sin(angle) * 1.13], [2.65, .15 + Math.cos(angle) * 1.13, Math.sin(angle) * 1.13]], colors.plasma, { opacity: .25, radius: .009 }));
    const discharges = [0, 1, 2, 3].map(index => {
      const points = Array.from({ length: 28 }, (_, step) => {
        const t = step / 27;
        return [-2.5 + t * 5, .25 + index * .17 + Math.sin(step * 2.1 + index) * .15 * Math.sin(t * Math.PI), (index - 1.5) * .27];
      });
      const discharge = path(group, points, index === 1 ? colors.light : colors.plasma, { opacity: .6, radius: .016 });
      return { ...discharge, travel: traveler(group, discharge.curve, "plasma", .06) };
    });
    const species = new THREE.InstancedMesh(sphere, accentMaterials.plasma, 42);
    species.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    species.frustumCulled = false;
    group.add(species);
    const gas = [co2(group, { scale: .32 }), co2(group, { scale: .27 })];
    label(group, "PLASMA", [0, 1.62, 0], colors.plasma, 1.6);
    label(group, "ELECTRODE", [-2.55, 1.62, 0], "#b8c0c1", 1.6);
    label(group, "CATALYST", [1.6, -1.35, 1.35], "#b8c0c1", 1.5);
    stages.plasma.update = (time) => {
      discharges.forEach((line, index) => {
        line.object.material.opacity = .5 + Math.sin(time * 1.4 + index) * .16;
        line.travel(time * .17 + index * .23);
      });
      for (let index = 0; index < 42; index++) {
        const phase = (index / 42 + time * (.035 + index % 3 * .008)) % 1;
        dummy.position.set(-2.5 + phase * 5, .3 + Math.sin(index * 2.4 + time * .5) * .52, Math.cos(index * 1.7 + time * .35) * .68);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(index % 5 === 0 ? .055 : .035);
        dummy.updateMatrix();
        species.setMatrixAt(index, dummy.matrix);
      }
      species.instanceMatrix.needsUpdate = true;
      gas.forEach((molecule, index) => {
        molecule.group.position.set(-2.15 + ((time * .075 + index * .55) % 1) * 4.3, .74, index ? -.55 : .5);
        molecule.group.rotation.z = Math.sin(time * .4 + index) * .2;
      });
    };
  }
  {
    const { group } = stages.carbon;
    const crystal = surface(group, "carbon");
    const molecule = co2(group);
    const approach = new THREE.CatmullRomCurve3([[-2.65, 1.55, 0], [-1.6, 1.3, 0], [-.5, .65, 0], [0, .36, 0]].map(vector));
    const departure = new THREE.CatmullRomCurve3([[0, .36, 0], [.65, .75, 0], [1.8, 1.4, 0], [2.65, 1.65, 0]].map(vector));
    path(group, [[-2.65, 1.55, 0], [-1.6, 1.3, 0], [0, .36, 0], [1.8, 1.4, 0], [2.65, 1.65, 0]], colors.carbon, { dashed: true, opacity: .28 });
    const attachment = path(group, [[0, -.18, 0], [0, .08, 0], [0, .31, 0]], colors.carbon, { dashed: true, opacity: .7 });
    label(group, "CO2", [-2.7, 2.05, 0], oxygenColor, 1.0);
    label(group, "ADSORPTION", [0, 1.66, 0], colors.carbon, 2);
    label(group, "ACTIVE SITE", [2.6, .38, 0], colors.carbon, 1.6);
    path(group, [[.42, -.38, .05], [1.2, .12, 0], [1.8, .3, 0]], colors.carbon, { opacity: .38, radius: .008 });
    stages.carbon.update = (time) => {
      const phase = (time % 12) / 12;
      let binding = 0;
      if (phase < .3) molecule.group.position.copy(approach.getPoint(THREE.MathUtils.smoothstep(phase / .3, 0, 1)));
      else if (phase < .72) {
        molecule.group.position.set(0, .36, 0);
        binding = Math.sin((phase - .3) / .42 * Math.PI);
      } else molecule.group.position.copy(departure.getPoint(THREE.MathUtils.smoothstep((phase - .72) / .28, 0, 1)));
      molecule.bend(binding * .27);
      molecule.group.rotation.z = Math.sin(phase * Math.PI * 2) * .12 * (1 - binding);
      const fade = Math.min(1, phase / .06, (1 - phase) / .06);
      molecule.group.scale.setScalar(.001 + fade * .999);
      attachment.object.visible = phase >= .3 && phase < .72;
      crystal.activeRing.scale.setScalar(1 + binding * .14);
    };
  }
  {
    const { group } = stages.data;
    const layers = [3, 5, 5, 2].map((count, layer) => Array.from({ length: count }, (_, index) => [layer * 1.8 - 2.7, (index - (count - 1) / 2) * .63 + .25, (index % 2 ? .18 : -.18)]));
    const nodes = layers.map((points, layer) => points.map(point => atom(group, point, layer === 3 ? .21 : .16, accentMaterials[layer === 0 ? "carbon" : layer === 3 ? "light" : "data"])));
    const signals = [];
    layers.slice(0, -1).forEach((points, layer) => points.forEach((start, index) => layers[layer + 1].forEach((end, next) => {
      const connection = path(group, [start, [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, -.12], end], colors.data, { opacity: .19, radius: .008 });
      if ((index + next) % 3 === 0) signals.push({ layer, offset: next * .11, update: traveler(group, connection.curve, "data", .044) });
    })));
    nodes[3].forEach(mesh => {
      const outline = ring(group, mesh.position.toArray(), .31, colors.light, .014);
      outline.rotation.y = -.1;
    });
    label(group, "DESCRIPTORS", [-2.7, 1.9, 0], colors.carbon, 1.8);
    label(group, "REPRESENTATION", [0, 2.05, 0], colors.data, 2.5);
    label(group, "PREDICTION", [2.7, 1.9, 0], colors.light, 1.8);
    stages.data.update = (time) => {
      signals.forEach(signal => signal.update(time * .25 - signal.layer * .28 + signal.offset));
      nodes.forEach((points, layer) => points.forEach((mesh, index) => mesh.scale.setScalar((layer === 3 ? .21 : .16) * (1 + Math.sin(time * 1.5 - layer * .8 + index * .4) * .07))));
    };
  }

  const descriptions = {
    light: ["Photon absorption / Charge separation", "Photons reach a layered photocatalyst and illustrative electron and hole carriers travel along separate paths."],
    plasma: ["Plasma-catalyst interface", "A transparent dielectric discharge tube with ring electrodes, traveling discharges, reactive species and a catalyst bed."],
    carbon: ["CO2 adsorption / Surface activation", "A carbon dioxide molecule approaches an active site, bends during illustrative adsorption and leaves the surface."],
    data: ["Descriptors / Representation / Prediction", "A layered neural network with signals traveling from material descriptors through hidden representations to a prediction."],
  };
  let current = "carbon";
  let elapsed = 5;
  let paused = motionPreference.matches;
  let inView = false;
  let contextLost = false;
  let previousTime = 0;
  let frame = 0;

  function draw() {
    if (contextLost) return;
    stages[current].update(elapsed);
    renderer.render(scene, camera);
  }
  function animate(time) {
    frame = 0;
    if (contextLost || paused || !inView || document.hidden) return;
    if (previousTime) elapsed += Math.min((time - previousTime) / 1000, .05);
    previousTime = time;
    draw();
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    draw();
    if (!paused && inView && !document.hidden && !contextLost) frame = requestAnimationFrame(animate);
  }
  function updatePause() {
    const text = paused ? "Play animation" : "Pause animation";
    pause.setAttribute("aria-label", text);
    pause.title = text;
    pause.dataset.tooltip = text;
    const icon = createElement(paused ? Play : Pause);
    icon.classList.add("lucide");
    icon.setAttribute("aria-hidden", "true");
    pause.replaceChildren(icon);
    container.dataset.paused = String(paused);
  }
  function resetView() {
    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    const distance = Math.max(7.15, 8.1 / (2 * Math.tan(THREE.MathUtils.degToRad(35) / 2) * aspect));
    orbit.target.set(0, .2, 0);
    camera.position.set(0, .2 + distance * .28, distance);
    orbit.update();
    draw();
  }
  function select(name) {
    current = name;
    elapsed = 5;
    Object.entries(stages).forEach(([key, stage]) => { stage.group.visible = key === name; });
    hero.dataset.lens = name;
    topic.textContent = `${descriptions[name][0]} / Concept model`;
    container.setAttribute("aria-label", `${descriptions[name][1]} Conceptual illustration, not a calculated simulation.`);
    controls.querySelector(`input[value="${name}"]`).checked = true;
    resetView();
    resume();
  }
  function setAvailable(available) {
    container.classList.toggle("scene-ready", available);
    controls.disabled = pause.disabled = reset.disabled = !available;
    orbit.enabled = available;
    renderer.domElement.hidden = !available;
  }
  orbit.addEventListener("change", draw);
  controls.addEventListener("change", event => {
    if (Object.hasOwn(stages, event.target.value)) select(event.target.value);
  });
  pause.addEventListener("click", () => {
    paused = !paused;
    updatePause();
    resume();
  });
  reset.addEventListener("click", resetView);
  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    resetView();
    resume();
  };
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    resume();
  }).observe(container);
  document.addEventListener("visibilitychange", resume);
  motionPreference.addEventListener("change", () => {
    paused = motionPreference.matches;
    updatePause();
    resume();
  });
  renderer.domElement.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    setAvailable(false);
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    setAvailable(true);
    resume();
  });
  setAvailable(true);
  updatePause();
  select(current);
  resize();
}
