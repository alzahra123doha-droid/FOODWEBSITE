(function () {
    const STORAGE_KEY = 'karakShopDetails';
    const defaultDetails = { name: 'Karak Station', logo: 'logo/logo.png' };
    const baseTitle = document.title.replace(/^(?:Karak Station|KARAK STATION)\s*[|·-]\s*/i, '');

    function getLogoUrl(value) {
        const logo = String(value || '').trim();
        if (/^(?:https?:|data:|blob:|\/)/i.test(logo)) return logo;
        return `../${logo.replace(/^(?:\.\.\/|\.\/)+/, '')}`;
    }

    function applyBranding(value) {
        const details = value && typeof value === 'object' ? value : defaultDetails;
        const name = String(details.name || defaultDetails.name).trim() || defaultDetails.name;
        const logo = String(details.logo || defaultDetails.logo).trim();

        document.querySelectorAll('[data-shop-name]').forEach(element => {
            element.textContent = name;
        });
        document.querySelectorAll('[data-shop-logo]').forEach(image => {
            if (!logo) {
                image.hidden = true;
                return;
            }
            image.src = getLogoUrl(logo);
            image.alt = `${name} logo`;
            image.hidden = false;
            image.onerror = () => {
                if (logo !== defaultDetails.logo) {
                    image.onerror = () => { image.hidden = true; };
                    image.src = getLogoUrl(defaultDetails.logo);
                    return;
                }
                image.hidden = true;
            };
        });

        document.title = `${name} | ${baseTitle}`;
    }

    function readCachedBranding() {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            applyBranding(cached ? JSON.parse(cached) : defaultDetails);
        } catch (error) {
            console.error('Could not read cached admin shop branding:', error);
            applyBranding(defaultDetails);
        }
    }

    window.AdminShopBranding = { update: applyBranding };
    readCachedBranding();

    if (window.KarakDB && typeof window.KarakDB.getSetting === 'function') {
        window.KarakDB.getSetting('shop_details', null)
            .then(details => {
                if (!details) return;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
                applyBranding(details);
            })
            .catch(error => {
                console.error('Could not load admin shop branding:', error);
            });
    }

    window.addEventListener('storage', event => {
        if (event.key !== STORAGE_KEY) return;
        try {
            applyBranding(event.newValue ? JSON.parse(event.newValue) : defaultDetails);
        } catch (error) {
            console.error('Could not apply updated admin shop branding:', error);
        }
    });
})();
