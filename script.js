/* ============================================================
   RENUKA S — PORTFOLIO SCRIPTS
   1. Mobile menu toggle
   2. Smooth scroll navigation (with sticky-nav offset)
   3. Active nav link highlighting on scroll + back-to-top button
   4. Scroll fade-in (reveal) animations
   5. Contact form validation + Formspree submission (fetch, no page reload)
   6. Theme toggle (white <-> navy)
   7. Footer year
   ============================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* ============ 1. MOBILE DRAWER MENU ============ */
    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    const navClose = document.getElementById("navClose");
    const navOverlay = document.getElementById("navOverlay");

    const openMenu = () => {
        navLinks.classList.add("open");
        navOverlay.classList.add("show");
        navToggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden"; // prevent background scroll
    };

    const closeMenu = () => {
        navLinks.classList.remove("open");
        navOverlay.classList.remove("show");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    };

    navToggle.addEventListener("click", openMenu);
    if (navClose) navClose.addEventListener("click", closeMenu);
    if (navOverlay) navOverlay.addEventListener("click", closeMenu);

    // Close the drawer when a nav link is clicked (then smooth-scroll runs)
    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    // Close the drawer with the Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navLinks.classList.contains("open")) {
            closeMenu();
        }
    });

    /* ============ 2. SMOOTH SCROLL NAVIGATION ============ */
    const NAV_OFFSET = 80; // height of the sticky navbar

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const targetId = anchor.getAttribute("href");
            if (targetId === "#" || targetId.length < 2) return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const topPos =
                target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;

            window.scrollTo({
                top: Math.max(topPos, 0),
                behavior: "smooth",
            });

            // Update the URL hash without jumping
            history.replaceState(null, "", targetId);
        });
    });

    /* ============ 3. ACTIVE NAV LINK ON SCROLL ============ */
    const sections = document.querySelectorAll("section[id], header[id]");
    const navAnchors = document.querySelectorAll(".nav-links a");
    const backToTop = document.getElementById("backToTop");

    const onScroll = () => {
        const scrollPos = window.scrollY;

        // Highlight the nav link for the section currently in view
        let current = "";
        sections.forEach((section) => {
            if (scrollPos >= section.offsetTop - NAV_OFFSET - 10) {
                current = section.getAttribute("id");
            }
        });

        navAnchors.forEach((anchor) => {
            anchor.classList.toggle(
                "active",
                anchor.getAttribute("href") === "#" + current
            );
        });

        // Show/hide the back-to-top button
        backToTop.classList.toggle("show", scrollPos > 400);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on load

    /* ============ 4. SCROLL FADE-IN ANIMATIONS ============ */
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
        revealObserver.observe(el);
    });

    /* ============ 5. CONTACT FORM VALIDATION & FORMSPREE SUBMISSION ============ */
    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");

    // Validation rules
    const validators = {
        name: (value) =>
            value.length >= 2 ? "" : "Please enter your name (at least 2 characters).",
        email: (value) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ? ""
                : "Please enter a valid email address.",
        subject: (value) =>
            value.length >= 3 ? "" : "Please enter a subject (at least 3 characters).",
        message: (value) =>
            value.length >= 10
                ? ""
                : "Please enter a message (at least 10 characters).",
    };

    const showError = (field, message) => {
        // Remove any existing error for this field
        clearError(field);

        if (message) {
            field.classList.add("input-error");
            const errorEl = document.createElement("small");
            errorEl.className = "field-error";
            errorEl.textContent = message;
            field.parentElement.appendChild(errorEl);
        }
    };

    const clearError = (field) => {
        field.classList.remove("input-error");
        const existing = field.parentElement.querySelector(".field-error");
        if (existing) existing.remove();
    };

    const validateField = (field) => {
        const validator = validators[field.name];
        if (!validator) return true;

        const message = validator(field.value.trim());
        showError(field, message);
        return message === "";
    };

    if (contactForm) {
        const fields = ["name", "email", "subject", "message"].map((name) =>
            contactForm.elements[name]
        );

        // Live validation once the user has interacted with a field
        fields.forEach((field) => {
            field.addEventListener("blur", () => validateField(field));
            field.addEventListener("input", () => {
                if (field.classList.contains("input-error")) validateField(field);
            });
        });

        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Validate every field; stop at the first invalid one
            let firstInvalid = null;
            fields.forEach((field) => {
                const valid = validateField(field);
                if (!valid && !firstInvalid) firstInvalid = field;
            });

            if (firstInvalid) {
                firstInvalid.focus();
                formStatus.style.display = "none";
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            const setStatus = (text, type) => {
                formStatus.textContent = text;
                formStatus.classList.remove("success", "error");
                if (type) formStatus.classList.add(type);
                formStatus.style.display = "block";
            };

            try {
                // AJAX submission to Formspree so the page never reloads
                const response = await fetch(contactForm.action, {
                    method: "POST",
                    headers: { Accept: "application/json" },
                    body: new FormData(contactForm),
                });

                if (!response.ok) {
                    throw new Error(`Formspree error: ${response.status}`);
                }

                // Success — thank the visitor and clear the form
                setStatus(
                    "Thank you! Your message has been sent successfully.",
                    "success"
                );
                contactForm.reset();
                fields.forEach(clearError);
            } catch (error) {
                console.error("Contact form submission failed:", error);
                setStatus(
                    "Something went wrong. Please try again or email me directly.",
                    "error"
                );
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
        });
    }

    /* ============ 6. THEME TOGGLE (WHITE ↔ NAVY) ============ */
    const themeToggle = document.getElementById("themeToggle");
    const body = document.body;

    // Theme stored in a JS variable (session only — no localStorage)
    let currentTheme = "light"; // default: white background + navy text

    const applyTheme = (theme) => {
        currentTheme = theme;
        if (theme === "navy") {
            body.classList.add("navy-theme");
            if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.remove("navy-theme");
            if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    };

    if (themeToggle) {
        themeToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            applyTheme(currentTheme === "light" ? "navy" : "light");
        });
    }

    /* ============ 7. FOOTER YEAR ============ */
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});