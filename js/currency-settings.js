(function () {
    const STORAGE_KEY = 'karakPaymentCurrency';
    const DEFAULT_COUNTRY = 'QA';
    const CURRENCIES = {
        QA: { country: 'Qatar', code: 'QAR', symbol: 'QR' },
        IN: { country: 'India', code: 'INR', symbol: '₹' },
        US: { country: 'United States', code: 'USD', symbol: '$' },
        GB: { country: 'United Kingdom', code: 'GBP', symbol: '£' },
        AE: { country: 'United Arab Emirates', code: 'AED', symbol: 'د.إ' },
        SA: { country: 'Saudi Arabia', code: 'SAR', symbol: 'ر.س' },
        KW: { country: 'Kuwait', code: 'KWD', symbol: 'د.ك' },
        BH: { country: 'Bahrain', code: 'BHD', symbol: 'د.ب' },
        OM: { country: 'Oman', code: 'OMR', symbol: 'ر.ع.' },
        EU: { country: 'Eurozone', code: 'EUR', symbol: '€' },
        CA: { country: 'Canada', code: 'CAD', symbol: 'C$' },
        AU: { country: 'Australia', code: 'AUD', symbol: 'A$' },
        PK: { country: 'Pakistan', code: 'PKR', symbol: '₨' },
        BD: { country: 'Bangladesh', code: 'BDT', symbol: '৳' },
        JP: { country: 'Japan', code: 'JPY', symbol: '¥' },
        CN: { country: 'China', code: 'CNY', symbol: '¥' },
        TR: { country: 'Türkiye', code: 'TRY', symbol: '₺' },
        LK: { country: 'Sri Lanka', code: 'LKR', symbol: 'Rs' },
        NP: { country: 'Nepal', code: 'NPR', symbol: 'रू' },
        EG: { country: 'Egypt', code: 'EGP', symbol: 'E£' },
        MY: { country: 'Malaysia', code: 'MYR', symbol: 'RM' },
        SG: { country: 'Singapore', code: 'SGD', symbol: 'S$' },
        ID: { country: 'Indonesia', code: 'IDR', symbol: 'Rp' },
        ZA: { country: 'South Africa', code: 'ZAR', symbol: 'R' },
        NG: { country: 'Nigeria', code: 'NGN', symbol: '₦' },
        PH: { country: 'Philippines', code: 'PHP', symbol: '₱' },
        TH: { country: 'Thailand', code: 'THB', symbol: '฿' },
        NZ: { country: 'New Zealand', code: 'NZD', symbol: 'NZ$' },
        CH: { country: 'Switzerland', code: 'CHF', symbol: 'CHF' }
    };
    const KNOWN_PREFIX = /^(?:(?:QAR|QR)\s*:?\s*|(?:INR|USD|US\$|GBP|AED|SAR|KWD|BHD|OMR|EUR|CAD|C\$|AUD|A\$|PKR|BDT|JPY|CNY|TRY|LKR|NPR|EGP|MYR|SGD|IDR|ZAR|NGN|PHP|THB|NZD|CHF)\s*|[₹$£€₨৳¥₺₦₱฿]\s*|د\.إ\s*|ر\.س\s*|د\.ك\s*|د\.ب\s*|ر\.ع\.\s*)/i;
    const KNOWN_SUFFIX = /\s*(?:QAR|QR|INR|USD|US\$|GBP|AED|SAR|KWD|BHD|OMR|EUR|CAD|C\$|AUD|A\$|PKR|BDT|JPY|CNY|TRY|LKR|NPR|EGP|MYR|SGD|IDR|ZAR|NGN|PHP|THB|NZD|CHF)$/i;
    let currentCountry = DEFAULT_COUNTRY;

    function getCurrencyInfo(country) {
        return CURRENCIES[country] || CURRENCIES[DEFAULT_COUNTRY];
    }

    function normalize(value) {
        const details = value && typeof value === 'object' ? value : {};
        const country = CURRENCIES[details.currencyCountry] ? details.currencyCountry : DEFAULT_COUNTRY;
        const currency = getCurrencyInfo(country);
        return {
            ...details,
            currencyCountry: country,
            currencyCode: currency.code,
            currencySymbol: currency.symbol
        };
    }

    function formatAmount(value, country = currentCountry) {
        const amount = String(value == null ? '' : value).trim();
        if (!amount) return '';
        const unprefixedAmount = amount.replace(KNOWN_PREFIX, '').replace(KNOWN_SUFFIX, '').trim();
        return unprefixedAmount && /\d/.test(unprefixedAmount)
            ? `${getCurrencyInfo(country).symbol} ${unprefixedAmount}`
            : amount;
    }

    function applyToDocument() {
        document.querySelectorAll('[data-currency-amount]').forEach(element => {
            element.textContent = `${element.dataset.currencyPrefix || ''}${formatAmount(element.dataset.currencyAmount)}`;
        });
    }

    function setSettings(value) {
        const details = normalize(value);
        currentCountry = details.currencyCountry;
        applyToDocument();
        window.dispatchEvent(new CustomEvent('karak-currency-changed', {
            detail: { ...details }
        }));
        return { ...details };
    }

    window.KarakCurrency = {
        currencies: CURRENCIES,
        getCurrencyInfo,
        getSettings() {
            return getCurrencyInfo(currentCountry);
        },
        formatAmount,
        setSettings
    };

    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) setSettings(JSON.parse(cached));
    } catch (error) {
        console.error('Could not read saved currency settings:', error);
    }

    if (window.KarakDB && typeof window.KarakDB.getSetting === 'function') {
        window.KarakDB.getSetting('payment_currency', null)
            .then(details => {
                if (!details) return;
                const normalized = normalize(details);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
                setSettings(normalized);
            })
            .catch(error => {
                console.error('Could not load shared currency settings:', error);
            });
    }

    window.addEventListener('storage', event => {
        if (event.key !== STORAGE_KEY) return;
        try {
            setSettings(event.newValue ? JSON.parse(event.newValue) : null);
        } catch (error) {
            console.error('Could not apply updated currency settings:', error);
        }
    });
})();
