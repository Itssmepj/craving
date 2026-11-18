document.addEventListener('DOMContentLoaded', () => {
    const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animate = hasGsap && !reduceMotion;
    const isDesktop = () => window.innerWidth > 768;
    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    /* ---------- Smooth scroll ---------- */
    let lenis = null;
    if (animate && typeof Lenis !== 'undefined') {
        lenis = new Lenis();
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        lenis.stop();
    }

    $$('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('href').length > 1 ? $(link.getAttribute('href')) : null;
            if (!target) return;
            e.preventDefault();
            closeMenu();
            if (lenis) lenis.scrollTo(target, { duration: 1.4 });
            else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    });

    /* ---------- Menu ---------- */
    const menuToggle = $('#menu-toggle');
    const mainMenu = $('#main-menu');
    const backdrop = $('#menu-backdrop');

    function setMenu(open) {
        mainMenu.classList.toggle('open', open);
        backdrop.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
    }
    function closeMenu() { setMenu(false); }

    menuToggle.addEventListener('click', () => setMenu(!mainMenu.classList.contains('open')));
    backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

    /* ---------- Navbar hide on scroll down ---------- */
    const navbar = $('#navbar');
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        const menuOpen = mainMenu.classList.contains('open');
        if (!menuOpen && y > lastY && y > 120) navbar.classList.add('nav-hidden');
        else if (y < lastY) navbar.classList.remove('nav-hidden');
        lastY = y;
    }, { passive: true });

    /* ---------- Split headings into popping words / chars ---------- */
    function splitPop(el) {
        const byChars = el.dataset.pop === 'chars';
        const label = el.textContent.replace(/\s+/g, ' ').trim();
        const frag = document.createDocumentFragment();
        el.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const parts = byChars ? node.textContent.trim().split('') : node.textContent.split(/(\s+)/);
                parts.forEach((part) => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                    const span = document.createElement('span');
                    span.className = 'pop-word';
                    span.textContent = part;
                    frag.appendChild(span);
                });
            } else {
                frag.appendChild(node.cloneNode(true));
            }
        });
        el.textContent = '';
        el.appendChild(frag);
        el.setAttribute('aria-label', label);
        return $$('.pop-word', el);
    }

    const popGroups = [];
    if (animate) {
        $$('[data-pop]').forEach((el) => {
            const words = splitPop(el);
            gsap.set(words, { yPercent: 80, scale: 0.4, rotation: () => gsap.utils.random(-12, 12), opacity: 0 });
            popGroups.push({ el, words });
        });
        gsap.set('[data-reveal]', { y: 30, opacity: 0 });
        gsap.set('.hero-image', { y: 80, scale: 0.7, opacity: 0 });
    }

    function startAnimations() {
        if (!animate) return;

        popGroups.forEach(({ el, words }) => {
            gsap.to(words, {
                yPercent: 0, scale: 1, rotation: 0, opacity: 1,
                duration: 0.8, ease: 'back.out(2)', stagger: 0.07,
                scrollTrigger: { trigger: el.closest('.footer-brand') || el, start: 'top 95%', once: true },
            });
        });

        $$('[data-reveal]').forEach((el) => {
            gsap.to(el, {
                y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.15,
                scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            });
        });

        // Hero burger: drop in, then drift up slightly while scrolling away
        gsap.to('.hero-image', { y: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'back.out(1.6)', delay: 0.15 });
        gsap.to('.hero-image-wrapper', {
            yPercent: -12, ease: 'none',
            scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
        });

        // About photos fan in
        gsap.from('.about-img-item', {
            y: 120, opacity: 0, duration: 0.9, ease: 'back.out(1.4)', stagger: 0.12, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: '.about-grid', start: 'top 88%', once: true },
        });

        // Experience burger rises from below
        gsap.from('.exp-burger', {
            yPercent: 35, ease: 'none',
            scrollTrigger: { trigger: '.exp-stage', start: 'top bottom', end: 'top 35%', scrub: true },
        });

        // Full-bleed image parallax
        gsap.fromTo('.cheesy-img', { yPercent: -6 }, {
            yPercent: 6, ease: 'none',
            scrollTrigger: { trigger: '.cheesy-section', start: 'top bottom', end: 'bottom top', scrub: true },
        });

        // Ingredient parallax
        $$('[data-parallax]').forEach((el) => {
            const amount = Number(el.dataset.parallax);
            gsap.fromTo(el, { y: amount, rotation: gsap.utils.random(-10, 10) }, {
                y: -amount, rotation: gsap.utils.random(-10, 10), ease: 'none',
                scrollTrigger: { trigger: '#ingredients', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
            });
        });

        // City cards pop in
        $$('.city').forEach((card) => {
            gsap.from(card, {
                scale: 0.5, opacity: 0, duration: 0.7, ease: 'back.out(1.8)', clearProps: 'transform,opacity',
                scrollTrigger: { trigger: card, start: 'top 85%', once: true },
            });
        });

        gsap.from('.cta-img', {
            xPercent: 30, opacity: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: '.cta-inner', start: 'top 75%', once: true },
        });

        initPlane();
        initJuggle();
        ScrollTrigger.refresh();
    }

    /* ---------- Plane following the dashed route ---------- */
    function initPlane() {
        const path = $('#flight-path');
        const plane = $('.plane');
        const section = $('#map');
        if (!path || !plane) return;
        const length = path.getTotalLength();
        // plane.png is drawn with its nose pointing straight down (+90deg in screen space),
        // so rotate it by -90deg to put the nose along the direction of travel
        const NOSE_OFFSET = -90;
        // sample the route so the plane can be kept level with the middle of the viewport
        const SAMPLES = 400;
        const sampleY = Array.from({ length: SAMPLES + 1 }, (_, i) => path.getPointAtLength((i / SAMPLES) * length).y);
        const state = { progress: 0 };

        const toScreen = (d) => {
            const p = path.getPointAtLength(d);
            const box = section.getBoundingClientRect();
            return { x: (p.x / 1728) * box.width, y: (p.y / 2176) * box.height };
        };

        const place = (progress) => {
            const d = progress * length;
            const a = toScreen(d);
            const b = toScreen(Math.min(d + 8, length));
            const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
            gsap.set(plane, { x: a.x, y: a.y, xPercent: -50, yPercent: -50, rotation: angle + NOSE_OFFSET });
        };

        const follow = () => {
            const box = section.getBoundingClientRect();
            const targetY = ((window.innerHeight * 0.55 - box.top) / box.height) * 2176;
            let i = sampleY.findIndex((y) => y >= targetY);
            if (i === -1) i = SAMPLES;
            gsap.to(state, {
                progress: i / SAMPLES, duration: 0.9, ease: 'power2.out', overwrite: true,
                onUpdate: () => place(state.progress),
            });
        };

        place(0);
        ScrollTrigger.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: follow,
            onRefresh: follow,
        });
    }

    /* ---------- Footer: ingredients tossed up behind the wordmark ---------- */
    function initJuggle() {
        $$('.juggle img').forEach((img, i) => {
            const toss = () => {
                const peak = -gsap.utils.random(16, 30);
                const drift = gsap.utils.random(-14, 14);
                const spin = gsap.utils.random(-360, 360);
                gsap.timeline({ onComplete: toss, delay: gsap.utils.random(0.2, 1.6) })
                    .set(img, { xPercent: -50, x: 0, y: '22vh', rotation: 0, opacity: 0 })
                    .to(img, { opacity: 1, duration: 0.15 })
                    .to(img, { y: `${peak}vh`, duration: 1.1, ease: 'power2.out' }, '<')
                    .to(img, { y: '22vh', duration: 1.1, ease: 'power2.in' })
                    .to(img, { x: `${drift}vw`, rotation: spin, duration: 2.2, ease: 'none' }, 0.0)
                    .to(img, { opacity: 0, duration: 0.2 }, '-=0.2');
            };
            gsap.delayedCall(i * 0.5, toss);
        });
    }

    /* ---------- Waves stretch with scroll speed ---------- */
    if (animate) {
        const waves = $$('.wave svg');
        const setters = waves.map((w) => gsap.quickTo(w, 'scaleY', { duration: 0.6, ease: 'power3.out' }));
        let prev = window.scrollY;
        gsap.ticker.add(() => {
            const y = window.scrollY;
            const stretch = 1 + Math.min(Math.abs(y - prev) / 60, 0.5);
            prev = y;
            setters.forEach((set) => set(stretch));
        });
    }

    /* ---------- Burger eyes follow the pointer ---------- */
    const pupils = $$('.pupil');
    if (pupils.length && !reduceMotion) {
        window.addEventListener('pointermove', (e) => {
            pupils.forEach((pupil) => {
                const ball = pupil.parentElement.getBoundingClientRect();
                const cx = ball.left + ball.width / 2;
                const cy = ball.top + ball.height / 2;
                const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
                const reach = Math.min(1, Math.hypot(e.clientX - cx, e.clientY - cy) / 200);
                const x = Math.cos(angle) * ball.width * 0.26 * reach;
                const y = Math.sin(angle) * ball.height * 0.28 * reach;
                pupil.style.transform = `translate(${x}px, ${y}px)`;
            });
        }, { passive: true });
    }

    /* ---------- Cursor trail ---------- */
    const trail = $('.cursor-trail');
    const dots = $$('.trail-dot');
    if (trail && animate && window.matchMedia('(pointer: fine)').matches) {
        const pos = dots.map(() => ({ x: 0, y: 0 }));
        const mouse = { x: 0, y: 0 };
        let seen = false;
        window.addEventListener('pointermove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            if (!seen) {
                seen = true;
                pos.forEach((p) => { p.x = mouse.x; p.y = mouse.y; });
                trail.classList.add('active');
            }
        }, { passive: true });
        document.addEventListener('pointerleave', () => trail.classList.remove('active'));
        document.addEventListener('pointerenter', () => seen && trail.classList.add('active'));

        gsap.ticker.add(() => {
            if (!seen || !isDesktop()) return;
            pos.forEach((p, i) => {
                const lead = i === 0 ? mouse : pos[i - 1];
                const ease = i === 0 ? 0.35 : 0.22;
                p.x += (lead.x - p.x) * ease;
                p.y += (lead.y - p.y) * ease;
                dots[i].style.transform = `translate(${p.x}px, ${p.y}px)`;
                dots[i].style.zIndex = String(dots.length - i);
            });
        });
    }

    /* ---------- Preloader ---------- */
    const preloader = $('#preloader');
    const loaderBar = $('.loader-bar');
    const loaderText = $('.preloader-text');
    const layers = ['.pl-bun-bottom', '.pl-patty', '.pl-cheese', '.pl-lettuce', '.pl-bun-top'].map((s) => $(s));
    const messages = [
        'Heating the flat top...',
        'Smashing the patty...',
        'Melting the cheddar...',
        'Searing the glazed patty...',
        'Ready to CRAVING!',
    ];

    function finishLoading() {
        preloader.classList.add('hidden');
        document.body.classList.remove('is-loading');
        if (lenis) lenis.start();
        setTimeout(startAnimations, 350);
        setTimeout(() => preloader.remove(), 1200);
    }

    if (reduceMotion) {
        finishLoading();
    } else {
        let step = 0;
        const tick = () => {
            layers[step].classList.add('in');
            loaderText.textContent = messages[step];
            loaderBar.style.width = `${((step + 1) / layers.length) * 100}%`;
            step += 1;
            if (step < layers.length) setTimeout(tick, 420);
            else setTimeout(finishLoading, 750);
        };
        setTimeout(tick, 200);
    }
});
