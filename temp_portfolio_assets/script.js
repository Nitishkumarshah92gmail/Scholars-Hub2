/* ============================================
   NITISH KUMAR SAHU — PORTFOLIO SCRIPTS
   Scroll animations, Marquee, Contact Modal,
   Typing Effect, Nav behavior
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ============================
    // 1. SCROLL REVEAL ANIMATIONS
    // ============================
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0,
        rootMargin: '0px 0px -60px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ============================
    // 2. NAVBAR SCROLL BEHAVIOR
    // ============================
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, {
        passive: true
    });


    // ============================
    // 3. MOBILE NAVIGATION
    // ============================
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileLinks = mobileNav.querySelectorAll('a');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('open');
        document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });


    // ============================
    // 4. SMOOTH SCROLL FOR NAV
    // ============================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });


    // ============================
    // 5. HERO AVATAR MOUSE PARALLAX
    // ============================
    const heroAvatar = document.getElementById('hero-avatar');
    const heroSection = document.querySelector('.hero');

    if (heroAvatar && heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            // Normalize cursor position to -1 to 1
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

            // Noticeable movement (max ~35px)
            const moveX = x * 35;
            const moveY = y * 25;

            heroAvatar.style.setProperty('--mouse-x', `${moveX}px`);
            heroAvatar.style.setProperty('--mouse-y', `${moveY}px`);
        });

        heroSection.addEventListener('mouseleave', () => {
            heroAvatar.style.setProperty('--mouse-x', `0px`);
            heroAvatar.style.setProperty('--mouse-y', `0px`);
        });
    }


    // ============================
    // 6. SCROLLING MARQUEE
    // ============================
    const showcaseSection = document.querySelector('.showcase-section');
    const marqueeRow1 = document.getElementById('marquee-row-1');
    const marqueeRow2 = document.getElementById('marquee-row-2');

    if (showcaseSection && marqueeRow1 && marqueeRow2) {
        window.addEventListener('scroll', () => {
            const rect = showcaseSection.getBoundingClientRect();
            const sectionTop = window.scrollY + rect.top;
            const scrollOffset = (window.scrollY - sectionTop + window.innerHeight) * 0.3;

            marqueeRow1.style.transform = `translateX(${scrollOffset - 300}px)`;
            marqueeRow2.style.transform = `translateX(${-(scrollOffset - 300)}px)`;
        }, {
            passive: true
        });
    }


    // ============================
    // 7. ABOUT TEXT SCROLL REVEAL
    // ============================
    const aboutWords = document.querySelectorAll('.about-text .word');

    if (aboutWords.length > 0) {
        const aboutObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const words = entry.target.querySelectorAll('.word');
                if (entry.isIntersecting) {
                    words.forEach((word, i) => {
                        word.timeoutId = setTimeout(() => {
                            word.style.opacity = '1';
                        }, i * 40);
                    });
                } else {
                    words.forEach(word => {
                        clearTimeout(word.timeoutId);
                        word.style.opacity = '0.2';
                    });
                }
            });
        }, {
            threshold: 0.3
        });

        const aboutText = document.querySelector('.about-text');
        if (aboutText) {
            aboutObserver.observe(aboutText);
        }
    }


    // ============================
    // 8. CONTACT MODAL
    // ============================
    const modalOverlay = document.getElementById('contact-modal');
    const modalBackdrop = modalOverlay.querySelector('.modal-backdrop');
    const modalClose = modalOverlay.querySelector('.modal-close');
    const contactForm = document.getElementById('contact-form');
    const formContent = document.getElementById('modal-form-content');
    const successContent = document.getElementById('modal-success');

    // Open modal buttons
    document.querySelectorAll('[data-open-contact]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modalOverlay) {
                modalOverlay.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close modal
    function closeModal() {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
        // Reset after animation
        setTimeout(() => {
            formContent.style.display = 'block';
            successContent.classList.remove('show');
            contactForm.reset();
        }, 400);
    }

    modalBackdrop.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);

    // Form submission via Formspree
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('contact-submit-btn');
        const submitText = document.getElementById('contact-submit-text');
        const originalText = submitText.innerText;

        // Show loading state
        submitText.innerText = 'Sending...';
        submitBtn.style.opacity = '0.7';
        submitBtn.style.pointerEvents = 'none';

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Success
                formContent.style.display = 'none';
                successContent.classList.add('show');
                setTimeout(closeModal, 2500);
            } else {
                alert("Oops! There was a problem submitting your form");
            }
        } catch (error) {
            alert("Oops! There was a problem submitting your form");
        } finally {
            // Reset button state
            submitText.innerText = originalText;
            submitBtn.style.opacity = '1';
            submitBtn.style.pointerEvents = 'all';
        }
    });


    // ============================
    // 9. STICKY STACKING PROJECTS
    // ============================
    const projectsStack = document.getElementById('projects-stack');
    const stickyWraps = document.querySelectorAll('.project-sticky-wrap');
    const totalCards = stickyWraps.length;

    if (projectsStack && totalCards > 0) {
        // Set initial top offsets for each card (creates the stacking peek)
        stickyWraps.forEach((wrap, i) => {
            const card = wrap.querySelector('.project-card');
            if (card) {
                card.style.top = `${i * 24}px`;
                card.style.position = 'relative';
            }
        });

        // Scroll-driven scale animation
        function updateProjectScales() {
            const containerRect = projectsStack.getBoundingClientRect();
            const containerTop = containerRect.top + window.scrollY;
            const containerHeight = projectsStack.scrollHeight;
            const scrollY = window.scrollY;

            // Overall progress through the projects section (0 to 1)
            const sectionStart = containerTop;
            const sectionEnd = containerTop + containerHeight - window.innerHeight;
            const overallProgress = Math.max(0, Math.min(1,
                (scrollY - sectionStart) / (sectionEnd - sectionStart)
            ));

            stickyWraps.forEach((wrap, index) => {
                const card = wrap.querySelector('.project-card');
                if (!card) return;

                // Target scale: last card stays 1, earlier cards scale down slightly
                const targetScale = 1 - (totalCards - 1 - index) * 0.03;

                // Each card's scroll range
                const cardStart = index / totalCards;
                const cardProgress = Math.max(0, Math.min(1,
                    (overallProgress - cardStart) / (1 - cardStart)
                ));

                // Interpolate scale: starts at 1, ends at targetScale
                const scale = 1 - (1 - targetScale) * cardProgress;

                card.style.transform = `scale(${scale})`;
            });
        }

        window.addEventListener('scroll', updateProjectScales, {
            passive: true
        });
        updateProjectScales(); // Initialize
    }


    // ============================
    // 10. SKILL TAG COUNTING ANIM
    // ============================
    const skillTags = document.querySelectorAll('.skill-tag');
    skillTags.forEach((tag, i) => {
        tag.style.transitionDelay = `${i * 30}ms`;
    });

});