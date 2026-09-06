import { gsap } from "gsap";
import { initializeResearchScene } from "./research-scene.js";
import { createIcons, createElement, Menu, X, ArrowUpRight, ArrowUp, ArrowDown, Sun, Zap, Atom, Network, Pause, RotateCcw } from "lucide";

createIcons({ icons: { Menu, X, ArrowUpRight, ArrowUp, ArrowDown, Sun, Zap, Atom, Network, Pause, RotateCcw } });

// Share the palette with the controls so every model mode stays visually consistent.
const theme = getComputedStyle(document.documentElement);
const researchColors = Object.fromEntries(["light", "plasma", "carbon", "data"].map(name => [name, theme.getPropertyValue(`--${name}`).trim()]));
const researchInk = Object.fromEntries(["light", "plasma", "carbon", "data"].map(name => [name, theme.getPropertyValue(`--${name}-ink`).trim()]));

const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
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

initializeResearchScene({
  colors: researchColors,
  background: theme.getPropertyValue("--graphite").trim(),
  oxygenColor: theme.getPropertyValue("--molecule-oxygen").trim(),
  motionPreference,
});

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
