(function () {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    if (!header || !footer) {
        throw new Error('The shared site header and footer containers are required.');
    }

    const page = window.location.pathname.split('/').pop() || 'index.html';
    const bookingHref = page === 'index.html' ? '#book-table' : 'index.html#book-table';
    const navLink = (href, label, pageName) => {
        const current = page === pageName ? ' aria-current="page"' : '';
        return '<li><a href="' + href + '"' + current + '>' + label + '</a></li>';
    };

    header.className = 'ks-site-header';
    header.id = 'top';
    header.innerHTML = `
        <div class="ks-header-inner header-sticky">
            <div class="ks-header-container">
                <a class="ks-header-brand" href="index.html" aria-label="Karak Station home">
                    <img class="ks-header-logo" src="logo/logo.png" alt="">
                    <i class="fas fa-coffee" aria-hidden="true"></i>
                    <span class="ks-header-shop-name">KARAK STATION</span>
                </a>
                <nav class="ks-desktop-nav" aria-label="Main navigation">
                    <ul id="navigation">
                        ${navLink('index.html', 'Home', 'index.html')}
                        ${navLink('about.html', 'About', 'about.html')}
                        ${navLink('menu.html', 'Menu', 'menu.html')}
                        <li class="ks-pages-menu">
                            <a href="special-deal.html"${page === 'special-deal.html' ? ' aria-current="page"' : ''}>Pages <i class="fas fa-chevron-down" aria-hidden="true"></i></a>
                            <ul class="ks-submenu">
                                <li><a href="special-deal.html">Today’s Special</a></li>
                                <li><a href="${bookingHref}">Book a Table</a></li>
                            </ul>
                        </li>
                        ${navLink('blog.html', 'Blog', 'blog.html')}
                        ${navLink('contact.html', 'Contact', 'contact.html')}
                    </ul>
                </nav>
                <button class="ks-theme-toggle" type="button" aria-pressed="false" aria-label="Switch to night mode" title="Switch to night mode">
                    <i class="fas fa-moon" aria-hidden="true"></i>
                </button>
                <div class="ks-header-mobile mobile_menu" aria-label="Mobile navigation"></div>
            </div>
        </div>`;

    const themeToggle = header.querySelector('.ks-theme-toggle');
    const savedTheme = localStorage.getItem('karakstation-theme');
    const applyTheme = (theme) => {
        const isNight = theme === 'night';
        document.body.dataset.theme = isNight ? 'night' : 'day';
        themeToggle.setAttribute('aria-pressed', String(isNight));
        themeToggle.setAttribute('aria-label', isNight ? 'Switch to day mode' : 'Switch to night mode');
        themeToggle.title = isNight ? 'Switch to day mode' : 'Switch to night mode';
        themeToggle.innerHTML = '<i class="fas ' + (isNight ? 'fa-sun' : 'fa-moon') + '" aria-hidden="true"></i>';
    };

    applyTheme(savedTheme === 'night' ? 'night' : 'day');
    themeToggle.addEventListener('click', () => {
        const nextTheme = document.body.dataset.theme === 'night' ? 'day' : 'night';
        localStorage.setItem('karakstation-theme', nextTheme);
        applyTheme(nextTheme);
    });

    footer.className = 'ks-site-footer';
    footer.setAttribute('aria-label', 'Karak Station site footer');
    footer.innerHTML = `
        <div class="ks-footer-panel">
            <div class="ks-footer-top">
                <a class="ks-footer-brand" href="index.html" aria-label="Karak Station home">
                    <img class="ks-footer-logo" src="logo/logo.png" alt="">
                    <span class="ks-footer-shop-name">KARAK STATION</span>
                </a>
                <form class="ks-footer-newsletter">
                    <label for="ks-footer-email">Get updates from us</label>
                    <div class="ks-footer-email-field">
                        <input id="ks-footer-email" name="email" type="email" placeholder="Enter your email" autocomplete="email" required>
                        <button type="submit" aria-label="Subscribe to Karak Station updates"><i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                    </div>
                </form>
            </div>
            <div class="ks-footer-divider"></div>
            <div class="ks-footer-links">
                <nav class="ks-footer-group" aria-label="Menu links">
                    <h2>Menu</h2>
                    <ul>
                        <li><a href="menu.html">Browse Menu</a></li>
                        <li><a href="special-deal.html">Today’s Special</a></li>
                        <li><a href="${bookingHref}">Book a Table</a></li>
                    </ul>
                </nav>
                <nav class="ks-footer-group" aria-label="Support links">
                    <h2>Support</h2>
                    <ul>
                        <li><a href="contact.html">Contact Us</a></li>
                        <li><a href="about.html">About Karak Station</a></li>
                        <li><a class="ks-footer-phone" href="tel:+97477821400">+974 77821400</a></li>
                    </ul>
                </nav>
                <nav class="ks-footer-group" aria-label="Explore links">
                    <h2>Explore</h2>
                    <ul>
                        <li><a href="blog.html">News &amp; Events</a></li>
                        <li><a class="ks-footer-location" href="contact.html">Umm Al Amad, Qatar</a></li>
                        <li><span class="ks-opening-hours">Open 24 hours</span></li>
                    </ul>
                </nav>
                <div class="ks-footer-social" aria-label="Social media links">
                    <a class="ks-social-facebook" href="https://www.facebook.com/profile.php?id=61590693355336" target="_blank" rel="noopener" aria-label="Karak Station on Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></a>
                    <a class="ks-social-instagram" href="https://www.instagram.com/karakstationqt/" target="_blank" rel="noopener" aria-label="Karak Station on Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a>
                    <a class="ks-social-whatsapp" href="https://wa.me/97477821400" target="_blank" rel="noopener" aria-label="Contact Karak Station on WhatsApp"><i class="fab fa-whatsapp" aria-hidden="true"></i></a>
                </div>
            </div>
            <div class="ks-footer-bottom">
                <p>Copyright &copy;<span class="ks-current-year"></span> All rights reserved | made with <i class="fa fa-heart" aria-hidden="true"></i> by Beeone Digital</p>
                <a href="admin/index.html">Admin</a>
            </div>
        </div>`;

    footer.querySelector('.ks-current-year').textContent = String(new Date().getFullYear());
    footer.querySelector('.ks-footer-newsletter').addEventListener('submit', function (event) {
        event.preventDefault();
        const email = footer.querySelector('#ks-footer-email').value.trim();
        const shopDetails = window.KarakShopDetails ? window.KarakShopDetails.get() : { contact: '+97477821400' };
        const phoneNumber = shopDetails.contact.replace(/\D/g, '');
        const message = 'Hello! I would like to subscribe to Karak Station updates. My email address: ' + email;
        window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
    });
})();
