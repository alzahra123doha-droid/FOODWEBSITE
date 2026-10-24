(function () {
    const STORAGE_KEY = 'karakShopDetails';
    const DEFAULTS = {
        name: 'Karak Station',
        address: 'Umm Al Amad, Qatar',
        contact: '+974 77821400',
        openingHours: 'Open 24 hours',
        logo: 'logo/logo.png',
        locationUrl: 'https://maps.google.com/?q=Umm+Al+Amad,+Qatar',
        facebook: 'https://www.facebook.com/profile.php?id=61590693355336',
        instagram: 'https://www.instagram.com/karakstationqt/',
        whatsapp: ''
    };

    function normalizeDetails(value) {
        const optionalUrl = (key, fallback) => value && Object.prototype.hasOwnProperty.call(value, key)
            ? String(value[key] || '').trim()
            : fallback;
        const contact = String(value && value.contact || DEFAULTS.contact).trim();
        const digits = contact.replace(/\D/g, '');
        const normalizedContact = !digits
            ? DEFAULTS.contact
            : contact.startsWith('+')
                ? `+${digits}`
                : digits.startsWith('00')
                    ? `+${digits.slice(2)}`
                    : digits.startsWith('974')
                        ? `+${digits}`
                        : `+974 ${digits}`;
        return {
            name: String(value && value.name || DEFAULTS.name).trim() || DEFAULTS.name,
            address: String(value && value.address || DEFAULTS.address).trim() || DEFAULTS.address,
            contact: normalizedContact,
            openingHours: String(value && value.openingHours || DEFAULTS.openingHours).trim() || DEFAULTS.openingHours,
            logo: String(value && value.logo || DEFAULTS.logo).trim() || DEFAULTS.logo,
            locationUrl: String(value && value.locationUrl || DEFAULTS.locationUrl).trim() || DEFAULTS.locationUrl,
            facebook: optionalUrl('facebook', DEFAULTS.facebook),
            instagram: optionalUrl('instagram', DEFAULTS.instagram),
            whatsapp: optionalUrl('whatsapp', '')
        };
    }

    function safeWebUrl(value, fallback = '') {
        try {
            const url = new URL(value, window.location.href);
            return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function readCachedDetails() {
        try {
            return normalizeDetails(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
        } catch (error) {
            console.error('Could not read cached shop details:', error);
            return { ...DEFAULTS };
        }
    }

    function phoneLink(contact) {
        const digits = String(contact || '').replace(/\D/g, '');
        if (!digits) return '';
        if (String(contact).trim().startsWith('+')) return `tel:+${digits}`;
        return digits.startsWith('00') ? `tel:+${digits.slice(2)}` : `tel:+${digits}`;
    }

    function applyDetails(value) {
        const details = normalizeDetails(value);
        const logoUrl = safeWebUrl(details.logo, details.logo);
        document.querySelectorAll('.ks-header-logo, .ks-footer-logo').forEach(image => {
            image.src = logoUrl;
            image.alt = `${details.name} logo`;
            image.hidden = false;
            image.onerror = () => {
                image.hidden = true;
                const icon = image.parentElement && image.parentElement.querySelector('.ks-header-brand > i');
                if (icon) icon.hidden = false;
            };
        });
        document.querySelectorAll('.ks-header-shop-name, .ks-footer-shop-name').forEach(name => {
            name.textContent = details.name;
        });
        document.querySelectorAll('.ks-board-shop-name').forEach(name => {
            name.textContent = details.name;
        });
        document.querySelectorAll('.ks-chalkboard').forEach(board => {
            board.setAttribute('aria-label', `${details.name} daily menu board`);
        });
        document.querySelectorAll('.ks-opening-hours').forEach(hours => {
            hours.textContent = details.openingHours;
        });
        document.querySelectorAll('.ks-header-brand > i').forEach(icon => {
            icon.hidden = Boolean(logoUrl);
        });

        document.querySelectorAll('.footer-contact h4').forEach(heading => {
            heading.textContent = details.name;
        });
        document.querySelectorAll('.footer-contact').forEach(footer => {
            const address = Array.from(footer.querySelectorAll('p'))
                .find(paragraph => /Umm Al Amad|Qatar|Doha/i.test(paragraph.textContent));
            if (address) address.textContent = details.address;
            const contactLink = footer.querySelector('a[href^="tel:"]');
            if (contactLink) {
                contactLink.textContent = details.contact;
                const href = phoneLink(details.contact);
                if (href) contactLink.href = href;
                else contactLink.removeAttribute('href');
            }
        });

        document.querySelectorAll('.contact-info').forEach(card => {
            const heading = card.querySelector('.media-body h3');
            if (!heading) return;
            if (card.querySelector('.ti-home')) {
                heading.textContent = details.address;
                const outdatedArabicAddress = card.querySelector('.media-body p');
                if (outdatedArabicAddress) outdatedArabicAddress.hidden = true;
            } else if (card.querySelector('.ti-tablet')) {
                heading.textContent = details.contact;
            }
        });

        document.querySelectorAll('footer a[href^="tel:"]').forEach(link => {
            const footerLine = link.closest('p');
            if (!footerLine || !/Karak Station|Karak/i.test(footerLine.textContent)) return;
            const href = phoneLink(details.contact);
            if (href) link.href = href;
            else link.removeAttribute('href');
            link.textContent = details.contact;
            const prefix = document.createTextNode(`${details.name} · ${details.address} · `);
            footerLine.replaceChildren(prefix, link);
        });

        const locationUrl = safeWebUrl(details.locationUrl, 'contact.html');
        document.querySelectorAll('.ks-footer-location').forEach(link => {
            link.href = locationUrl;
            link.textContent = details.address;
            link.target = locationUrl === 'contact.html' ? '' : '_blank';
            if (link.target) link.rel = 'noopener';
            else link.removeAttribute('rel');
        });
        document.querySelectorAll('.ks-footer-phone').forEach(link => {
            link.textContent = details.contact;
            const href = phoneLink(details.contact);
            if (href) link.href = href;
            else link.removeAttribute('href');
        });
        const phoneNumber = details.contact.replace(/\D/g, '');
        const socialLinks = {
            '.ks-social-facebook': details.facebook,
            '.ks-social-instagram': details.instagram,
            '.ks-social-whatsapp': details.whatsapp || `https://wa.me/${phoneNumber}`
        };
        Object.entries(socialLinks).forEach(([selector, href]) => {
            const link = document.querySelector(selector);
            if (!link) return;
            const safeUrl = safeWebUrl(href);
            link.hidden = !safeUrl;
            if (safeUrl) link.href = safeUrl;
            else link.removeAttribute('href');
        });

        window.KarakShopDetails.current = details;
    }

    window.KarakShopDetails = {
        current: readCachedDetails(),
        get() {
            return { ...this.current };
        }
    };

    applyDetails(window.KarakShopDetails.current);

    if (window.KarakDB && typeof window.KarakDB.getSetting === 'function') {
        window.KarakDB.getSetting('shop_details', null)
            .then(settings => {
                if (!settings) return;
                const details = normalizeDetails(settings);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
                applyDetails(details);
            })
            .catch(error => {
                console.error('Could not load shared shop details:', error);
            });
    }

    window.addEventListener('storage', event => {
        if (event.key !== STORAGE_KEY) return;
        try {
            applyDetails(event.newValue ? JSON.parse(event.newValue) : null);
        } catch (error) {
            console.error('Could not apply updated shop details:', error);
        }
    });
})();
