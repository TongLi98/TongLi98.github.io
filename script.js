const yearTarget = document.querySelector("#year");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Staggered reveal on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const delay = prefersReducedMotion ? 0 : Math.min(index * 60, 240);
        setTimeout(() => entry.target.classList.add("is-visible"), delay);
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px",
  }
);

document.querySelectorAll(".reveal").forEach((section) => {
  observer.observe(section);
});

// Subtle parallax on the hero visual
const heroVisual = document.querySelector(".hero-visual");
if (heroVisual && !prefersReducedMotion) {
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(window.scrollY, 600);
      heroVisual.style.transform = `translateY(${y * -0.04}px)`;
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

// Tiny shadow boost on the sticky header once you scroll past the hero
const header = document.querySelector(".site-header");
if (header) {
  const toggleHeader = () => {
    if (window.scrollY > 24) {
      header.style.boxShadow = "0 1px 0 rgba(0,0,0,0.06)";
    } else {
      header.style.boxShadow = "none";
    }
  };
  toggleHeader();
  window.addEventListener("scroll", toggleHeader, { passive: true });
}
