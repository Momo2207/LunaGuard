// script.js
document.addEventListener('DOMContentLoaded', () => {
    // ---- MODAL ----
    const modal = document.getElementById('waitlistModal');
    const openModalButtons = document.querySelectorAll('.open-modal-button');
    const modalCloseButton = document.querySelector('#waitlistModal .close-button');
    const waitlistForm = document.getElementById('waitlistForm');
    const emailInput = document.getElementById('emailInput');
    const nameInput = document.getElementById('nameInput'); 
    const gdprConsentCheckbox = document.getElementById('gdprConsent'); // Get GDPR checkbox for validation

    function openModal() { if (modal) modal.style.display = 'block'; }
    function closeModal() { if (modal) modal.style.display = 'none'; }
    openModalButtons.forEach(button => button.addEventListener('click', openModal));
    if (modalCloseButton) modalCloseButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

    if (waitlistForm) {
        const formStatusDiv = document.getElementById('form-status');

        waitlistForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 

            const formData = new FormData(waitlistForm);
            const nameValue = nameInput ? nameInput.value.trim() : '';
            const emailValue = emailInput.value.trim();
            
            const easyLangActive = accessibilitySettings.easyLanguage;
            let successMsgTmpl, invalidEmailMsg, nameRequiredMsg, gdprRequiredMsg;

            // Get translated messages
            if (easyLangActive && typeof easyTranslations !== 'undefined' && easyTranslations[currentLanguage]) {
                successMsgTmpl = easyTranslations[currentLanguage].modalAlertSuccess;
                invalidEmailMsg = easyTranslations[currentLanguage].modalAlertInvalidEmail;
                nameRequiredMsg = easyTranslations[currentLanguage].modalAlertNameRequired;
                gdprRequiredMsg = easyTranslations[currentLanguage].modalAlertGdprRequired; // New key
            } else if (currentTranslations) {
                successMsgTmpl = currentTranslations.modalAlertSuccess;
                invalidEmailMsg = currentTranslations.modalAlertInvalidEmail;
                nameRequiredMsg = currentTranslations.modalAlertNameRequired;
                gdprRequiredMsg = currentTranslations.modalAlertGdprRequired; // New key
            }
            
            // Fallback messages if translations are missing for the current language or if objects are undefined
            successMsgTmpl = successMsgTmpl || "Thank you ${name}! Your email ${email} has been added to the waitlist.";
            invalidEmailMsg = invalidEmailMsg || 'Please enter a valid email address.';
            nameRequiredMsg = nameRequiredMsg || "Please enter your name.";
            gdprRequiredMsg = gdprRequiredMsg || "Please agree to the terms and Privacy Policy to continue.";


            // Client-side validation for name
            if (nameInput && nameInput.hasAttribute('required') && !nameValue) { 
                if (formStatusDiv) formStatusDiv.textContent = nameRequiredMsg;
                if (formStatusDiv) formStatusDiv.style.color = 'red';
                if (nameInput) nameInput.focus();
                return;
            }
            
            // Client-side validation for email
            if (!emailValue || !validateEmail(emailValue)) {
                if (formStatusDiv) formStatusDiv.textContent = invalidEmailMsg;
                if (formStatusDiv) formStatusDiv.style.color = 'red';
                emailInput.focus();
                return;
            }

            // Client-side validation for GDPR checkbox
            if (gdprConsentCheckbox && gdprConsentCheckbox.hasAttribute('required') && !gdprConsentCheckbox.checked) {
                if (formStatusDiv) formStatusDiv.textContent = gdprRequiredMsg;
                if (formStatusDiv) formStatusDiv.style.color = 'red';
                // gdprConsentCheckbox.focus(); // Focusing a checkbox can be a bit jarring, optional
                return;
            }


            if (formStatusDiv) {
                formStatusDiv.textContent = 'Sending...'; 
                formStatusDiv.style.color = 'var(--text-color)';
            }

            try {
                const response = await fetch(waitlistForm.action, {
                    method: waitlistForm.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json' 
                    }
                });

                if (response.ok) {
                    const data = await response.json().catch(() => ({ success: true, message: "Submission received (non-JSON OK response)." })); 
                    console.log("FormSubmit Response:", data); 

                    if (formStatusDiv) {
                         const finalSuccessMsg = successMsgTmpl
                            .replace('${name}', nameValue || 'Friend') // Provide a fallback if name is somehow empty despite validation
                            .replace('${email}', emailValue);
                         formStatusDiv.textContent = finalSuccessMsg;
                         formStatusDiv.style.color = 'var(--positive-color)';
                    }
                    waitlistForm.reset(); 
                    setTimeout(() => {
                        closeModal();
                        if (formStatusDiv) formStatusDiv.textContent = ''; 
                    }, 3000); 
                } else {
                    const data = await response.json().catch(() => ({ message: "An error occurred. Please try again."})); 
                    console.error("FormSubmit Error Response:", data, "Status:", response.status, response.statusText);
                    let errorMessage = data.message || `Error: ${response.status} - ${response.statusText}`;
                    if (formStatusDiv) formStatusDiv.textContent = errorMessage;
                    if (formStatusDiv) formStatusDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Form submission fetch/network error:', error);
                if (formStatusDiv) {
                     formStatusDiv.textContent = 'Oops! There was a network problem. Please try again.';
                     formStatusDiv.style.color = 'red';
                }
            }
        });
    }
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    // ---- END MODAL ----

    // ---- ACCESSIBILITY MENU ----
    const accessibilityMenuElement = document.querySelector('.accessibility-menu');
    const accessibilityBtn = document.getElementById('accessibilityBtn');
    const accessibilityDropdown = document.getElementById('accessibilityDropdown');
    const accCheckboxInputs = {
        boldFont: document.getElementById('acc-bold-font'),
        bwMode: document.getElementById('acc-bw-mode'),
        largeLetters: document.getElementById('acc-large-letters'),
        easyLanguage: document.getElementById('acc-easy-language')
    };

    if (accessibilityBtn && accessibilityDropdown) {
        accessibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = accessibilityBtn.getAttribute('aria-expanded') === 'true';
            accessibilityBtn.setAttribute('aria-expanded', !isExpanded);
            accessibilityDropdown.hidden = isExpanded;
        });
        document.addEventListener('click', (e) => {
            if (accessibilityMenuElement && !accessibilityMenuElement.contains(e.target) && accessibilityBtn.getAttribute('aria-expanded') === 'true') {
                accessibilityBtn.setAttribute('aria-expanded', 'false');
                accessibilityDropdown.hidden = true;
            }
        });
    }

    let accessibilitySettings = { boldFont: false, bwMode: false, largeLetters: false, easyLanguage: false };
    const storedAccSettings = localStorage.getItem('accessibilitySettings');
    if (storedAccSettings) {
        try { accessibilitySettings = JSON.parse(storedAccSettings); } catch (e) { console.error("Error parsing accessibility settings from localStorage", e); }
    }

    function applyAccessibilitySetting(settingKey, value) {
        accessibilitySettings[settingKey] = value;
        document.body.classList.toggle(`acc-${settingKey}`, value);
        localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
        const checkboxInput = accCheckboxInputs[settingKey];
        if (checkboxInput) {
            checkboxInput.checked = value;
            const listItem = checkboxInput.closest('li[role="menuitemcheckbox"]');
            if (listItem) listItem.setAttribute('aria-checked', value);
        }
        if (settingKey === 'easyLanguage') {
            loadAllTranslations(); 
        }
    }

    function loadAccessibilitySettings() {
        for (const key in accessibilitySettings) {
            if (accessibilitySettings.hasOwnProperty(key)) {
                document.body.classList.toggle(`acc-${key}`, accessibilitySettings[key]);
                if (accCheckboxInputs[key]) {
                    accCheckboxInputs[key].checked = accessibilitySettings[key];
                    const listItem = accCheckboxInputs[key].closest('li[role="menuitemcheckbox"]');
                    if (listItem) listItem.setAttribute('aria-checked', accessibilitySettings[key]);
                }
            }
        }
    }

    for (const key in accCheckboxInputs) {
        if (accCheckboxInputs[key]) {
            accCheckboxInputs[key].addEventListener('change', (e) => {
                applyAccessibilitySetting(key, e.target.checked);
            });
        }
    }
    // ---- END ACCESSIBILITY MENU ----

    // ---- LANGUAGE SWITCHER ----
    const langButtons = document.querySelectorAll('.lang-btn');
    let currentLanguage = 'en';
    let currentTranslations = {}; 

    function setLanguage(lang) {
        if (typeof translations === 'undefined' || !translations[lang]) {
            console.warn(`Standard translations for '${lang}' not found. Defaulting.`);
            currentLanguage = (typeof translations !== 'undefined' && translations.en) ? 'en' : (document.documentElement.lang || 'en');
            currentTranslations = (typeof translations !== 'undefined' && translations[currentLanguage]) ? translations[currentLanguage] : {};
        } else {
            currentLanguage = lang;
            currentTranslations = translations[lang];
        }
        document.documentElement.lang = currentLanguage;
        localStorage.setItem('preferredLanguage', currentLanguage);
        langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLanguage));
        loadAllTranslations();
    }

    function getTranslationForKey(key) {
        const easyLangActive = accessibilitySettings.easyLanguage;
        let text;

        if (easyLangActive && typeof easyTranslations !== 'undefined' && easyTranslations[currentLanguage] && easyTranslations[currentLanguage][key]) {
            text = easyTranslations[currentLanguage][key];
        } 
        else if (currentTranslations && currentTranslations[key]) {
            text = currentTranslations[key];
        } 
        else if (easyLangActive && typeof easyTranslations !== 'undefined' && easyTranslations.en && easyTranslations.en[key]) {
            text = easyTranslations.en[key];
        } 
        else if (typeof translations !== 'undefined' && translations.en && translations.en[key]) {
            text = translations.en[key];
        }
        return text;
    }

    function loadAllTranslations() {
        const pageTitleText = getTranslationForKey("pageTitle") || document.title;
        document.title = pageTitleText;

        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            let translationText = getTranslationForKey(key);
            if (translationText === undefined) translationText = el.innerHTML; 

            const keysWithHTML = [
                "tableLunaGuardCam", "tableLunaGuardWearables", "tableLunaGuardWifi",
                "tableLunaGuardCloud", "tableLunaGuardFees", "tableLunaGuardSetup",
                "tableLunaGuardAlerts",
                "glance1", "glance2", "glance3", "glance4", "glance5", "glance6",
                "earlyL1", "earlyL2", "earlyL3", "earlyL4", 
                "footerCopyright", 
                "navAccessibilityText", "accBoldFont", "accBWMode", "accLargeLetters", "accEasyLanguage",
                "modalGdprConsentText" // Added as it contains an <a> tag
            ];

            if (keysWithHTML.includes(key)) {
                el.innerHTML = translationText;
            } else {
                el.textContent = translationText;
            }
        });

        document.querySelectorAll('[data-lang-alt-key]').forEach(el => {
            const key = el.dataset.langAltKey;
            el.alt = getTranslationForKey(key) || el.alt;
        });

        document.querySelectorAll('[data-lang-placeholder-key]').forEach(el => {
            const key = el.dataset.langPlaceholderKey;
            el.placeholder = getTranslationForKey(key) || el.placeholder;
        });

        const currentYearSpan = document.getElementById('currentYear');
        if (currentYearSpan) {
            const footerText = getTranslationForKey("footerCopyright") || "";
            if (footerText.includes("currentYear")) { 
                const newYearSpanInFooter = document.querySelector(".site-footer #currentYear"); 
                if (newYearSpanInFooter) newYearSpanInFooter.textContent = new Date().getFullYear();
            } else { 
                 currentYearSpan.textContent = new Date().getFullYear(); 
            }
        }
    }

    langButtons.forEach(button => {
        button.addEventListener('click', () => setLanguage(button.dataset.lang));
    });

    function initializeSite() {
        if (typeof translations === 'undefined') {
            console.error("FATAL: translations.js is not loaded. Site text will not be internationalized.");
            loadAccessibilitySettings(); 
            const cy = document.getElementById('currentYear');
            if(cy) cy.textContent = new Date().getFullYear();
            return;
        }
        if (typeof easyTranslations === 'undefined') {
            console.warn("Easy language translations (easyTranslations.js) not loaded. Easy language mode will fall back to standard text.");
        }

        const preferredLanguage = localStorage.getItem('preferredLanguage');
        const browserLanguage = navigator.language.split('-')[0];
        let initialLang = 'en';

        if (preferredLanguage && translations[preferredLanguage]) {
            initialLang = preferredLanguage;
        } else if (translations[browserLanguage]) {
            initialLang = browserLanguage;
        }
        
        currentTranslations = translations[initialLang] || translations.en || {};
        loadAccessibilitySettings(); 
        setLanguage(initialLang);   
    }
    // ---- END LANGUAGE SWITCHER ----

    initializeSite();
});
