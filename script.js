const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const scrollLinks = document.querySelectorAll("[data-scroll]");
const revealItems = document.querySelectorAll("[data-reveal]");
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav a");
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

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
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
    if (!stageCard || prefersReducedMotion || !window.matchMedia("(hover: hover)").matches) {
        return;
    }

    const maxRotateX = 4.5;
    const maxRotateY = 5.5;
    const maxLift = -4;

    let currentRotateX = 0;
    let currentRotateY = 0;
    let currentLift = 0;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let targetLift = 0;
    let frameId = 0;

    function renderStageTilt() {
        currentRotateX += (targetRotateX - currentRotateX) * 0.16;
        currentRotateY += (targetRotateY - currentRotateY) * 0.16;
        currentLift += (targetLift - currentLift) * 0.18;

        const isResting = Math.abs(currentRotateX - targetRotateX) < 0.02
            && Math.abs(currentRotateY - targetRotateY) < 0.02
            && Math.abs(currentLift - targetLift) < 0.02;

        if (isResting) {
            currentRotateX = targetRotateX;
            currentRotateY = targetRotateY;
            currentLift = targetLift;
        }

        if (currentRotateX === 0 && currentRotateY === 0 && currentLift === 0) {
            stageCard.style.transform = "";
            frameId = 0;
            return;
        }

        stageCard.style.transform = `perspective(1200px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) translateY(${currentLift.toFixed(2)}px)`;
        frameId = isResting ? 0 : window.requestAnimationFrame(renderStageTilt);
    }

    function queueTiltRender() {
        if (!frameId) {
            frameId = window.requestAnimationFrame(renderStageTilt);
        }
    }

    function updateStageTilt(clientX, clientY) {
        const rect = stageCard.getBoundingClientRect();
        const offsetX = clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
        const offsetY = clamp(((clientY - rect.top) / rect.height) * 2 - 1, -1, 1);

        targetRotateY = offsetX * maxRotateY;
        targetRotateX = offsetY * -maxRotateX;
        targetLift = maxLift;
        queueTiltRender();
    }

    function resetStageTilt() {
        targetRotateX = 0;
        targetRotateY = 0;
        targetLift = 0;
        queueTiltRender();
    }

    stageCard.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") {
            return;
        }

        updateStageTilt(event.clientX, event.clientY);
    }, { passive: true });

    stageCard.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") {
            return;
        }

        updateStageTilt(event.clientX, event.clientY);
    }, { passive: true });

    stageCard.addEventListener("pointerleave", resetStageTilt);
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
        ? `${name}, заявка получена. Менеджер клуба свяжется с вами по номеру ${phone} или в WhatsApp, уточнит детали и подтвердит бронь на формат «${game}».`
        : `Заявка получена. Менеджер клуба свяжется с вами по номеру ${phone} или в WhatsApp, уточнит детали и подтвердит бронь на формат «${game}».`;
    bookingForm.reset();
}

window.addEventListener("scroll", updateTopbar, { passive: true });
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
