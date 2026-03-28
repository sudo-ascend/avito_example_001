const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const scrollLinks = document.querySelectorAll("[data-scroll]");
const revealItems = document.querySelectorAll("[data-reveal]");
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav a");
const stage = document.querySelector(".hero-stage");
const stageCard = document.querySelector(".stage-card");
const priceButtons = document.querySelectorAll(".price-book");
const gameSelect = document.getElementById("gameType");
const bookingForm = document.getElementById("bookingForm");
const formStatus = document.getElementById("formStatus");
const reviewShell = document.querySelector(".review-shell");
const reviewSlides = Array.from(document.querySelectorAll(".review-slide"));
const reviewPrev = document.querySelector(".review-prev");
const reviewNext = document.querySelector(".review-next");
const reviewDots = document.querySelector(".review-dots");

let currentReview = 0;
let reviewTimer = null;

function setPointerGlow(event) {
    const x = `${(event.clientX / window.innerWidth) * 100}%`;
    const y = `${(event.clientY / window.innerHeight) * 100}%`;

    document.documentElement.style.setProperty("--pointer-x", x);
    document.documentElement.style.setProperty("--pointer-y", y);
}

function updateTopbar() {
    topbar.classList.toggle("is-scrolled", window.scrollY > 24);
}

function closeMenu() {
    nav.classList.remove("is-open");
    menuToggle.classList.remove("is-active");
    menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
    const isOpen = nav.classList.toggle("is-open");
    menuToggle.classList.toggle("is-active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function handleScrollLink(event) {
    const href = event.currentTarget.getAttribute("href");
    if (!href || !href.startsWith("#")) {
        return;
    }

    const target = document.querySelector(href);
    if (!target) {
        return;
    }

    event.preventDefault();
    closeMenu();

    target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
    });
}

function revealOnScroll() {
    if (prefersReducedMotion) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px"
    });

    revealItems.forEach((item) => observer.observe(item));
}

function activateNav() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            navLinks.forEach((link) => {
                const targetId = link.getAttribute("href");
                link.classList.toggle("is-active", targetId === `#${entry.target.id}`);
            });
        });
    }, {
        threshold: 0.45
    });

    sections.forEach((section) => observer.observe(section));
}

function addStageParallax() {
    if (!stage || !stageCard || prefersReducedMotion) {
        return;
    }

    stage.addEventListener("mousemove", (event) => {
        const rect = stage.getBoundingClientRect();
        const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
        const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -10;

        stageCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    stage.addEventListener("mouseleave", () => {
        stageCard.style.transform = "";
    });
}

function setTariff(plan) {
    if (!gameSelect || !plan) {
        return;
    }

    const matchingOption = Array.from(gameSelect.options).find((option) => option.text === plan);
    if (matchingOption) {
        gameSelect.value = matchingOption.value;
    }
}

function buildReviewDots() {
    if (!reviewDots || reviewSlides.length === 0) {
        return;
    }

    reviewSlides.forEach((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "review-dot";
        button.setAttribute("aria-label", `Показать отзыв ${index + 1}`);
        button.addEventListener("click", () => {
            goToReview(index, true);
        });
        reviewDots.append(button);
    });
}

function goToReview(index, userInitiated = false) {
    if (reviewSlides.length === 0) {
        return;
    }

    currentReview = (index + reviewSlides.length) % reviewSlides.length;

    reviewSlides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === currentReview);
    });

    Array.from(reviewDots.children).forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === currentReview);
    });

    if (userInitiated) {
        restartReviewAutoplay();
    }
}

function stopReviewAutoplay() {
    if (reviewTimer) {
        window.clearInterval(reviewTimer);
        reviewTimer = null;
    }
}

function startReviewAutoplay() {
    if (prefersReducedMotion || reviewSlides.length < 2) {
        return;
    }

    stopReviewAutoplay();
    reviewTimer = window.setInterval(() => {
        goToReview(currentReview + 1);
    }, 6500);
}

function restartReviewAutoplay() {
    stopReviewAutoplay();
    startReviewAutoplay();
}

function bindReviewControls() {
    if (reviewSlides.length === 0) {
        return;
    }

    buildReviewDots();
    goToReview(0);
    startReviewAutoplay();

    reviewPrev?.addEventListener("click", () => {
        goToReview(currentReview - 1, true);
    });

    reviewNext?.addEventListener("click", () => {
        goToReview(currentReview + 1, true);
    });

    reviewShell?.addEventListener("mouseenter", stopReviewAutoplay);
    reviewShell?.addEventListener("mouseleave", startReviewAutoplay);
}

function handleFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const name = (formData.get("name") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const game = (formData.get("game") || "выбранный формат").toString();

    formStatus.textContent = name
        ? `${name}, заявка принята. Менеджер клуба «Триумф» свяжется с вами по номеру ${phone} и подтвердит бронь на формат «${game}».`
        : `Заявка принята. Менеджер клуба «Триумф» свяжется с вами по номеру ${phone} и подтвердит бронь на формат «${game}».`;
    bookingForm.reset();
}

window.addEventListener("scroll", updateTopbar, { passive: true });
window.addEventListener("mousemove", setPointerGlow, { passive: true });
updateTopbar();
revealOnScroll();
activateNav();
addStageParallax();
bindReviewControls();

menuToggle?.addEventListener("click", toggleMenu);

scrollLinks.forEach((link) => {
    link.addEventListener("click", handleScrollLink);
});

priceButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setTariff(button.dataset.plan);
    });
});

bookingForm?.addEventListener("submit", handleFormSubmit);
