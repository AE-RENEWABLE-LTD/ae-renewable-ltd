"use strict";

/* =========================================================
   AE RENEWABLE LTD
   INSTALLER NETWORK
   LANDING PAGE JAVASCRIPT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =================================================
           PAGE LOADER
        ================================================= */

        const pageLoader =
            document.getElementById(
                "pageLoader"
            );


        let loaderRemoved = false;


        function removeLoader() {

            if (
                !pageLoader ||
                loaderRemoved
            ) {
                return;
            }


            loaderRemoved = true;


            pageLoader.classList.add(
                "is-loaded"
            );

        }


        /*
         * Remove loader shortly after the page
         * and its assets have finished loading.
         */

        if (
            document.readyState ===
            "complete"
        ) {

            window.setTimeout(
                removeLoader,
                350
            );

        } else {

            window.addEventListener(
                "load",
                () => {

                    window.setTimeout(
                        removeLoader,
                        350
                    );

                },
                {
                    once: true
                }
            );

        }


        /*
         * Safety fallback.
         *
         * The loader must never remain visible
         * because of a failed asset.
         */

        window.setTimeout(
            removeLoader,
            2500
        );



        /* =================================================
           HEADER
        ================================================= */

        const header =
            document.getElementById(
                "siteHeader"
            );


        function updateHeader() {

            if (!header) {
                return;
            }


            const shouldScroll =
                window.scrollY > 25;


            header.classList.toggle(
                "is-scrolled",
                shouldScroll
            );

        }


        window.addEventListener(
            "scroll",
            updateHeader,
            {
                passive: true
            }
        );


        updateHeader();



        /* =================================================
           MOBILE MENU
        ================================================= */

        const menuButton =
            document.getElementById(
                "mobileMenuButton"
            );


        const mobileNavigation =
            document.getElementById(
                "mobileNavigation"
            );


        function closeMobileNavigation() {

            if (
                !menuButton ||
                !mobileNavigation
            ) {
                return;
            }


            mobileNavigation.classList.remove(
                "is-open"
            );


            menuButton.classList.remove(
                "is-active"
            );


            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );


            menuButton.setAttribute(
                "aria-label",
                "Open navigation"
            );

        }


        function openMobileNavigation() {

            if (
                !menuButton ||
                !mobileNavigation
            ) {
                return;
            }


            mobileNavigation.classList.add(
                "is-open"
            );


            menuButton.classList.add(
                "is-active"
            );


            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );


            menuButton.setAttribute(
                "aria-label",
                "Close navigation"
            );

        }


        if (
            menuButton &&
            mobileNavigation
        ) {

            menuButton.addEventListener(
                "click",
                () => {

                    const isOpen =
                        mobileNavigation.classList.contains(
                            "is-open"
                        );


                    if (isOpen) {

                        closeMobileNavigation();

                    } else {

                        openMobileNavigation();

                    }

                }
            );


            const mobileLinks =
                mobileNavigation.querySelectorAll(
                    "a"
                );


            mobileLinks.forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            closeMobileNavigation();

                        }
                    );

                }
            );

        }



        /* =================================================
           INTERNAL NAVIGATION
        ================================================= */

        const internalLinks =
            document.querySelectorAll(
                'a[href^="#"]'
            );


        internalLinks.forEach(
            link => {

                link.addEventListener(
                    "click",
                    event => {

                        const targetId =
                            link.getAttribute(
                                "href"
                            );


                        if (
                            !targetId ||
                            targetId === "#"
                        ) {

                            return;

                        }


                        let target = null;


                        try {

                            target =
                                document.querySelector(
                                    targetId
                                );

                        } catch (
                            error
                        ) {

                            return;

                        }


                        if (!target) {

                            return;

                        }


                        event.preventDefault();


                        const headerHeight =
                            header
                                ? header.offsetHeight
                                : 0;


                        const targetPosition =
                            target
                                .getBoundingClientRect()
                                .top +
                            window.scrollY -
                            headerHeight;


                        window.scrollTo(
                            {
                                top:
                                    Math.max(
                                        0,
                                        targetPosition
                                    ),

                                behavior:
                                    "smooth"
                            }
                        );

                    }
                );

            }
        );



        /* =================================================
           SCROLL REVEAL
        ================================================= */

        const revealElements =
            document.querySelectorAll(
                "[data-reveal]"
            );


        if (
            revealElements.length
        ) {

            /*
             * Respect users who prefer reduced motion.
             */

            const prefersReducedMotion =
                window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches;


            if (
                prefersReducedMotion
            ) {

                revealElements.forEach(
                    element => {

                        element.classList.add(
                            "is-visible"
                        );

                    }
                );

            } else if (
                "IntersectionObserver" in window
            ) {

                const revealObserver =
                    new IntersectionObserver(
                        entries => {

                            entries.forEach(
                                entry => {

                                    if (
                                        !entry.isIntersecting
                                    ) {

                                        return;

                                    }


                                    entry.target.classList.add(
                                        "is-visible"
                                    );


                                    revealObserver.unobserve(
                                        entry.target
                                    );

                                }
                            );

                        },
                        {
                            threshold:
                                0.10,

                            rootMargin:
                                "0px 0px -35px 0px"
                        }
                    );


                revealElements.forEach(
                    element => {

                        revealObserver.observe(
                            element
                        );

                    }
                );

            } else {

                /*
                 * Older browsers without
                 * IntersectionObserver.
                 */

                revealElements.forEach(
                    element => {

                        element.classList.add(
                            "is-visible"
                        );

                    }
                );

            }

        }



        /* =================================================
           CURRENT YEAR
        ================================================= */

        const currentYear =
            document.querySelector(
                "[data-current-year]"
            );


        if (currentYear) {

            currentYear.textContent =
                String(
                    new Date()
                        .getFullYear()
                );

        }



        /* =================================================
           ESCAPE KEY
        ================================================= */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Escape"
                ) {

                    return;

                }


                closeMobileNavigation();

            }
        );



        /* =================================================
           PREVENT BROKEN IMAGE EXPERIENCE
        ================================================= */

        document
            .querySelectorAll(
                "img"
            )
            .forEach(
                image => {

                    image.addEventListener(
                        "error",
                        () => {

                            image.style.visibility =
                                "hidden";

                        },
                        {
                            once: true
                        }
                    );

                }
            );


    }
);