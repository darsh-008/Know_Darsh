const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sections = navLinks
  .map((link) => document.querySelector(link.hash))
  .filter(Boolean);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (menuToggle && siteNav && header) {
  header.classList.add("nav-enhanced");
  menuToggle.hidden = false;

  const closeMenu = () => {
    siteNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  };

  menuToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
      closeMenu();
      menuToggle.focus();
    }
  });
  window.matchMedia("(min-width: 781px)").addEventListener("change", closeMenu);
}

// Employer links expose the experience bullets supporting the selected result.
const revealLinkedExperience = () => {
  if (!window.location.hash) return;
  const target = document.getElementById(window.location.hash.slice(1));
  const details = target?.querySelector(".work-details");
  if (details) details.open = true;
};
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    const target = document.getElementById(link.hash.slice(1));
    const details = target?.querySelector(".work-details");
    if (details) details.open = true;
  });
});
window.addEventListener("hashchange", revealLinkedExperience);
revealLinkedExperience();

if ("IntersectionObserver" in window) {
  const visibleSections = new Set();
  let sectionObserver;
  const observeSections = () => {
    sectionObserver?.disconnect();
    visibleSections.clear();
    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.add(entry.target);
          else visibleSections.delete(entry.target);
        });
        const active = sections.find((section) => visibleSections.has(section));
        navLinks.forEach((link) => {
          const matches = Boolean(active && link.hash === "#" + active.id);
          link.classList.toggle("is-active", matches);
          if (matches) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      {
        // Pixel margins keep the reading zone consistent on wide, short screens.
        rootMargin:
          "-" +
          Math.min(110, window.innerHeight * 0.2) +
          "px 0px -" +
          window.innerHeight * 0.55 +
          "px 0px",
        threshold: 0,
      },
    );
    sections.forEach((section) => sectionObserver.observe(section));
  };
  observeSections();
  window.addEventListener("resize", observeSections);

  const runningAnimations = new Set();
  const revealObserver = new IntersectionObserver(
    (entries) => {
      let stagger = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        element.classList.add("has-entered");
        if (!reducedMotion.matches && typeof element.animate === "function") {
          const animation = element.animate(
            [
              { opacity: 0, transform: "translateY(20px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 580,
              delay: stagger * 65,
              easing: "cubic-bezier(.2,.75,.25,1)",
              fill: "backwards",
            },
          );
          runningAnimations.add(animation);
          animation.onfinish = () => runningAnimations.delete(animation);
          animation.oncancel = () => runningAnimations.delete(animation);
          stagger += 1;
        }
        revealObserver.unobserve(element);
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll("[data-reveal]")
    .forEach((element) => revealObserver.observe(element));
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches)
      runningAnimations.forEach((animation) => animation.cancel());
  });
}

const copyButton = document.querySelector(".copy-email");
const copyStatus = document.querySelector(".copy-status");
if (copyButton && copyStatus && navigator.clipboard?.writeText) {
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    copyStatus.textContent = "";
    try {
      await navigator.clipboard.writeText(copyButton.dataset.email);
      copyStatus.textContent = "Email copied.";
    } catch {
      copyStatus.textContent = "Please use the email link above.";
    }
  });
}

// Include collapsed experience content when printing or saving the page as PDF.
let closedBeforePrint = [];
window.addEventListener("beforeprint", () => {
  closedBeforePrint = [
    ...document.querySelectorAll(".work-details:not([open])"),
  ];
  closedBeforePrint.forEach((details) => {
    details.open = true;
  });
});
window.addEventListener("afterprint", () => {
  closedBeforePrint.forEach((details) => {
    details.open = false;
  });
  closedBeforePrint = [];
});
