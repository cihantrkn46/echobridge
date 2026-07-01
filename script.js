// ==================== DİL VERİSİ ====================
const LANG_DATA = {
    'tr-TR': { name: 'Türkçe',     flag: '🇹🇷', label: 'TR', api: 'tr', voice: 'tr-TR' },
    'en-US': { name: 'İngilizce',  flag: '🇺🇸', label: 'EN', api: 'en', voice: 'en-US' },
    'es-ES': { name: 'İspanyolca', flag: '🇪🇸', label: 'ES', api: 'es', voice: 'es-ES' },
    'fr-FR': { name: 'Fransızca',  flag: '🇫🇷', label: 'FR', api: 'fr', voice: 'fr-FR' },
    'de-DE': { name: 'Almanca',    flag: '🇩🇪', label: 'DE', api: 'de', voice: 'de-DE' },
    'it-IT': { name: 'İtalyanca',  flag: '🇮🇹', label: 'IT', api: 'it', voice: 'it-IT' },
    'pt-BR': { name: 'Portekizce', flag: '🇧🇷', label: 'PT', api: 'pt', voice: 'pt-BR' },
    'nl-NL': { name: 'Felemenkçe', flag: '🇳🇱', label: 'NL', api: 'nl', voice: 'nl-NL' },
    'zh-CN': { name: 'Çince',      flag: '🇨🇳', label: 'ZH', api: 'zh-CN', voice: 'zh-CN' },
    'ru-RU': { name: 'Rusça',      flag: '🇷🇺', label: 'RU', api: 'ru', voice: 'ru-RU' },
    'ja-JP': { name: 'Japonca',    flag: '🇯🇵', label: 'JA', api: 'ja', voice: 'ja-JP' },
    'ko-KR': { name: 'Korece',     flag: '🇰🇷', label: 'KO', api: 'ko', voice: 'ko-KR' },
    'ar-SA': { name: 'Arapça',     flag: '🇸🇦', label: 'AR', api: 'ar', voice: 'ar-SA' },
    'hi-IN': { name: 'Hintçe',     flag: '🇮🇳', label: 'HI', api: 'hi', voice: 'hi-IN' },
    'pl-PL': { name: 'Lehçe',      flag: '🇵🇱', label: 'PL', api: 'pl', voice: 'pl-PL' },
    'uk-UA': { name: 'Ukraynaca',  flag: '🇺🇦', label: 'UK', api: 'uk', voice: 'uk-UA' }
};

// ==================== SVG ICONS (Font Awesome Yerine) ====================
const ICONS = {
    check: '<svg class="icon toast-icon" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    xmark: '<svg class="icon toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ff6b81" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    warning: '<svg class="icon toast-icon" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg class="icon toast-icon" viewBox="0 0 24 24" fill="none" stroke="#4facfe" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    volumeOff: '<svg class="icon speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><line x1="16" y1="8" x2="22" y2="14"/><line x1="22" y1="8" x2="16" y2="14"/></svg>',
    volumeOn: '<svg class="icon speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    copy: '<svg class="icon copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    checkCopy: '<svg class="icon copy-icon" viewBox="0 0 24 24" fill="none" stroke="#2ed573" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};

// ==================== STATE ====================
let currentSource = 'tr-TR';
let currentTarget = 'en-US';
let debounceTimer = null;
let isTranslating = false;
let lastSourceText = '';
let lastTranslatedPair = ''; 
let currentTranslationId = 0;
let historyData = JSON.parse(localStorage.getItem('echobridge_history') || '[]');
let currentVoiceSpeed = 1.0;
let selectionMode = 'target'; 

// ==================== TOAST ====================
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: ICONS.check,
        error:   ICONS.xmark,
        warning: ICONS.warning,
        info:    ICONS.info
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// ==================== SES TANIMA ====================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;
}

// ==================== SESLENDİRME ====================
const synth = window.speechSynthesis;
let voices = [];

function loadVoices() {
    voices = synth ? synth.getVoices() || [] : [];
}
if (synth) {
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
    loadVoices();
}

function findVoice(langCode) {
    const prefix = langCode.split('-')[0];
    return voices.find(v => v.lang === langCode)
        || voices.find(v => v.lang.startsWith(prefix + '-'))
        || voices.find(v => v.lang.startsWith(prefix))
        || null;
}

function speak(text, langCode) {
    return new Promise((resolve, reject) => {
        if (!text || !synth) return reject('Seslendirme desteklenmiyor');
        synth.cancel();

        const u = new SpeechSynthesisUtterance(text);
        u.lang = LANG_DATA[langCode]?.voice || langCode;
        u.rate = currentVoiceSpeed;
        u.pitch = 1;
        u.volume = 1;

        const v = findVoice(u.lang);
        if (v) u.voice = v;

        u.onend = () => resolve();
        u.onerror = (e) => reject(e.error || 'Hata');

        synth.speak(u);
    });
}

// ==================== UI GÜNCELLEME ====================
function renderLanguageList(filterText = '') {
    const list = document.getElementById('lang-list');
    if (!list) return;

    const filter = filterText.toLowerCase();
    const activeLang = selectionMode === 'source' ? currentSource : currentTarget;

    list.innerHTML = Object.keys(LANG_DATA)
        .filter(code => LANG_DATA[code].name.toLowerCase().includes(filter))
        .map(code => {
            const lang = LANG_DATA[code];
            const active = code === activeLang;
            return `<div class="lang-item" data-code="${code}">
                <span>${lang.flag} ${lang.name}</span>
                <button class="dl-btn${active ? ' downloaded' : ''}" aria-label="${lang.name} Seç">${active ? 'Aktif' : 'Seç'}</button>
            </div>`;
        }).join('');

    list.querySelectorAll('.lang-item .dl-btn').forEach(btn => {
        btn.addEventListener('click', (e) => selectLang(e.target.closest('.lang-item').dataset.code));
    });
}

function updateUI() {
    const s = LANG_DATA[currentSource];
    const t = LANG_DATA[currentTarget];

    document.getElementById('flag-source').textContent = s.flag;
    document.getElementById('name-source').textContent = s.name;
    document.getElementById('label-source').textContent = s.label;
    document.getElementById('text-source').placeholder = s.name + ' yazın veya mikrofona basın...';

    document.getElementById('flag-target').textContent = t.flag;
    document.getElementById('name-target').textContent = t.name;
    document.getElementById('label-target').textContent = t.label;
    document.getElementById('text-target').placeholder = t.name + ' çevirisi burada görünecek...';

    const search = document.getElementById('lang-search');
    renderLanguageList(search ? search.value : '');
}

// ==================== DİL DEĞİŞTİRME (SWAP) ====================
function swapLanguages() {
    [currentSource, currentTarget] = [currentTarget, currentSource];

    const src = document.getElementById('text-source');
    const tgt = document.getElementById('text-target');
    [src.value, tgt.value] = [tgt.value, src.value];
    lastSourceText = src.value;
    lastTranslatedPair = ''; 

    const btn = document.querySelector('.swap-btn');
    btn.style.transform = 'rotate(180deg) scale(0.88)';
    setTimeout(() => btn.style.transform = '', 350);

    updateUI();
    updateCharCount();
    
    if (src.value.trim()) doTranslate(src.value.trim(), currentSource, currentTarget);
}

// ==================== MİKROFON İŞLEMLERİ ====================
let micStream = null;

async function warmUpMic() {
    try {
        if (!micStream && navigator.mediaDevices?.getUserMedia) {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
    } catch (e) { console.warn("Mikrofon izni alınamadı."); }
}

function startListening(which) {
    if (!recognition) return;
    warmUpMic();

    const langCode = which === 'source' ? currentSource : currentTarget;
    const btnId = which === 'source' ? 'btn-source' : 'btn-target';

    try {
        recognition.lang = LANG_DATA[langCode]?.voice || langCode;
        recognition.start();
        document.getElementById(btnId).classList.add('listening');
    } catch (e) { document.getElementById(btnId).classList.add('listening'); }
}

function stopListening() {
    try { recognition?.stop(); } catch(e) {}
    resetMicUI();
    if (micStream) { micStream.getTracks().forEach(track => track.stop()); micStream = null; }
}

if (recognition) {
    recognition.onresult = (event) => {
        let text = '';
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
            if (event.results[i].isFinal) hasFinal = true;
        }

        document.getElementById('text-source').value = text;
        updateCharCount();

        if (hasFinal) {
            clearTimeout(debounceTimer);
            const trimmed = text.trim();
            // Mikrofondan gelen çeviri sonrası OTOMATİK seslendirme aktif (4. parametre: true)
            if (trimmed) doTranslate(trimmed, currentSource, currentTarget, true);
        }
    };

    recognition.onerror = () => resetMicUI();
    recognition.onend = () => resetMicUI();
}

function resetMicUI() {
    document.getElementById('btn-source')?.classList.remove('listening', 'pressing');
    document.getElementById('btn-target')?.classList.remove('listening', 'pressing');
}

function initPushToTalk(btnId, type) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const start = (e) => {
        if (e.cancelable) e.preventDefault();
        if (btn.disabled) return;
        warmUpMic();
        btn.classList.add('pressing');
        startListening(type);
    };

    const stop = (e) => {
        if (e.cancelable) e.preventDefault();
        if (btn.disabled) return;
        btn.classList.remove('pressing');
        stopListening();
    };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('pointerleave', stop);
}

// ==================== KARAKTER SAYACI ====================
function updateCharCount() {
    const text = document.getElementById('text-source').value;
    const counter = document.getElementById('char-count');
    if (!counter) return;
    counter.textContent = `${text.length}/5000`;
    counter.classList.remove('warn', 'danger');
    if (text.length >= 5000) counter.classList.add('danger');
    else if (text.length >= 4500) counter.classList.add('warn');
}

// ==================== ÇEVİRİ ALTYAPISI (GOOGLE API) ====================
function autoTranslate() {
    clearTimeout(debounceTimer);
    updateCharCount();

    const trimmed = document.getElementById('text-source').value.trim();
    if (!trimmed) {
        document.getElementById('text-target').value = '';
        lastSourceText = '';
        lastTranslatedPair = '';
        currentTranslationId++;
        document.getElementById('loader-target').classList.add('hidden');
        isTranslating = false;
        return;
    }

    // Klavye ile yazarken otomatik seslendirme YOK (4. parametre yok = false)
    debounceTimer = setTimeout(() => { doTranslate(trimmed, currentSource, currentTarget); }, 600);
}

// YENİ: autoSpeak parametresi eklendi — mikrofondan true, yazıdan false
async function doTranslate(text, from, to, autoSpeak = false) {
    if (!text) return;

    const pairKey = `${text}|${from}|${to}`;
    if (pairKey === lastTranslatedPair) return;

    isTranslating = true;
    document.getElementById('loader-target').classList.remove('hidden');

    currentTranslationId++;
    const myId = currentTranslationId;

    const fromApi = LANG_DATA[from]?.api || from.split('-')[0];
    const toApi   = LANG_DATA[to]?.api   || to.split('-')[0];
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromApi}&tl=${toApi}&dt=t&q=${encodeURIComponent(text)}`;

    let attempts = 2;
    let finalError = null;

    while (attempts > 0) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (myId !== currentTranslationId) return;

            if (data && data[0]) {
                let translatedText = '';
                data[0].forEach(item => {
                    if (item[0]) translatedText += item[0];
                });
                
                document.getElementById('text-target').value = translatedText;
                lastSourceText = text;
                lastTranslatedPair = pairKey;
                saveToHistory(text, translatedText, from, to);
                
                // 🎙️ YENİ: Mikrofondan gelen metin çevrildikten sonra OTOMATİK seslendir
                if (autoSpeak && myId === currentTranslationId) {
                    try {
                        await speakText('target');
                    } catch (e) {
                        console.log('Otomatik seslendirme hatası:', e);
                    }
                }
                
                finalError = null;
                break;
            } else {
                throw new Error('API yanıtı hatalı');
            }
        } catch (err) {
            finalError = err;
            attempts--;
            if (attempts > 0) await new Promise(r => setTimeout(r, 800));
        }
    }

    if (finalError && myId === currentTranslationId) {
        console.error('Çeviri hatası:', finalError);
        showToast('Bağlantı hatası, lütfen tekrar deneyin.', 'error');
    }
    
    if (myId === currentTranslationId) {
        isTranslating = false;
        document.getElementById('loader-target').classList.add('hidden');
    }
}

// ==================== AKSİYON BUTONLARI ====================
async function speakText(which) {
    const id   = which === 'source' ? 'text-source' : 'text-target';
    const lang = which === 'source' ? currentSource  : currentTarget;
    const text = document.getElementById(id).value.trim();
    if (!text) { showToast('Seslendirilecek metin yok', 'warning', 1500); return; }

    const iconContainer = document.querySelector(`.btn-speak-${which}`);
    if (iconContainer) {
        const oldHtml = iconContainer.innerHTML;
        iconContainer.innerHTML = ICONS.volumeOff;
        try { 
            await speak(text, lang); 
        } catch (err) { 
            showToast(`Seslendirme hatası: ${err}`, 'error'); 
        } finally { 
            iconContainer.innerHTML = ICONS.volumeOn; 
        }
    }
}

function clearAll() {
    document.getElementById('text-source').value = '';
    document.getElementById('text-target').value = '';
    lastSourceText = '';
    lastTranslatedPair = '';
    updateCharCount();
    showToast('Temizlendi', 'info', 1200);
}

function copyTarget() {
    const el = document.getElementById('text-target');
    if (!el.value) { showToast('Kopyalanacak metin yok', 'warning', 1500); return; }

    const onOk = () => {
        showToast('Kopyalandı!', 'success', 1200);
        const btn = document.querySelector('.btn-copy');
        if (btn) { 
            const oldHtml = btn.innerHTML;
            btn.innerHTML = ICONS.checkCopy;
            setTimeout(() => btn.innerHTML = ICONS.copy, 1200); 
        }
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(el.value).then(onOk).catch(() => fallbackCopy(el, onOk));
    } else { fallbackCopy(el, onOk); }
}

function fallbackCopy(el, onOk) {
    el.select(); el.setSelectionRange(0, 99999);
    try { document.execCommand('copy'); onOk(); } catch(e) { showToast('Kopyalama başarısız', 'error'); }
    window.getSelection?.().removeAllRanges();
}

function shareTarget() {
    const text = document.getElementById('text-target').value;
    if (!text) { showToast('Paylaşılacak metin yok', 'warning', 1500); return; }

    if (navigator.share) { navigator.share({ title: 'EchoBridge Çeviri', text }).catch(() => {}); } 
    else { copyTarget(); showToast('Metin panoya kopyalandı.', 'info'); }
}

// ==================== GEÇMİŞ YÖNETİMİ ====================
function saveToHistory(sourceText, targetText, from, to) {
    if (!sourceText || !targetText) return;
    if (historyData.length > 0 && historyData[0].sourceText === sourceText && historyData[0].from === from && historyData[0].to === to) return;

    historyData.unshift({
        id: Date.now(),
        sourceText, targetText, from, to,
        date: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    });

    if (historyData.length > 50) historyData = historyData.slice(0, 50);
    try { localStorage.setItem('echobridge_history', JSON.stringify(historyData)); } catch(e) {}
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const clearBtn = document.getElementById('btn-clear-history');
    
    if (!historyData.length) {
        list.innerHTML = '<div class="empty-state">Henüz çeviri yapılmadı.</div>';
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    
    if (clearBtn) clearBtn.style.display = 'flex';

    list.innerHTML = historyData.map(item => {
        const fromLang = LANG_DATA[item.from];
        const toLang = LANG_DATA[item.to];
        if (!fromLang || !toLang) return ''; 
        
        return `<div class="history-item" data-id="${item.id}">
            <div class="history-langs">
                <span>${fromLang.flag} ${fromLang.label} → ${toLang.flag} ${toLang.label}</span>
                <span class="history-date">${item.date}</span>
            </div>
            <div class="history-source">${item.sourceText}</div>
            <div class="history-target">${item.targetText}</div>
        </div>`;
    }).join('');

    list.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => loadHistoryItem(el.dataset.id));
    });
}

function loadHistoryItem(id) {
    const item = historyData.find(x => x.id == id);
    if (!item) return;

    currentSource = item.from;
    currentTarget = item.to;
    document.getElementById('text-source').value = item.sourceText;
    document.getElementById('text-target').value = item.targetText;
    lastSourceText = item.sourceText;
    lastTranslatedPair = `${item.sourceText}|${item.from}|${item.to}`;

    updateUI();
    updateCharCount();
    toggleHistory();
}

function clearAllHistory() {
    if (!historyData.length) return;
    if (!confirm('Tüm çeviri geçmişiniz silinecek. Emin misiniz?')) return;
    
    historyData = [];
    try { localStorage.removeItem('echobridge_history'); } catch(e) {}
    renderHistory();
    showToast('Geçmiş temizlendi', 'success', 2000);
}

function toggleHistory() {
    const modal = document.getElementById('history-modal');
    if (modal.classList.contains('hidden')) renderHistory();
    modal.classList.toggle('hidden');
}

// ==================== AYARLAR YÖNETİMİ ====================
function openLangModal(mode = 'target') {
    selectionMode = mode;
    const modal = document.getElementById('settings-modal');
    document.getElementById('modal-title').textContent = mode === 'source' ? 'Kaynak Dil Seç' : 'Hedef Dil Seç';
    document.getElementById('speed-section').style.display = mode === 'source' ? 'none' : '';
    document.getElementById('lang-search').value = '';
    renderLanguageList('');
    modal.classList.remove('hidden');
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal.classList.contains('hidden')) openLangModal('target');
    else modal.classList.add('hidden');
}

function selectLang(code) {
    if (selectionMode === 'source') {
        if (code === currentTarget) swapLanguages();
        else { currentSource = code; lastTranslatedPair = ''; }
    } else {
        if (code === currentSource) swapLanguages();
        else { currentTarget = code; lastTranslatedPair = ''; }
    }

    updateUI();
    document.getElementById('settings-modal').classList.add('hidden');

    const txt = document.getElementById('text-source').value.trim();
    if (txt) doTranslate(txt, currentSource, currentTarget);
}

// ==================== BAŞLATICI EVENTLER ====================
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    updateCharCount();

    if (!recognition) {
        const sourceMic = document.getElementById('btn-source');
        const targetMic = document.getElementById('btn-target');
        if (sourceMic) sourceMic.disabled = true;
        if (targetMic) targetMic.disabled = true;
        
        document.querySelector('.footer').addEventListener('click', () => {
             showToast('Tarayıcınız ses tanımayı desteklemiyor.', 'error');
        }, { once: true });
    }

    document.querySelector('.swap-btn').addEventListener('click', swapLanguages);
    document.getElementById('badge-source').addEventListener('click', () => openLangModal('source'));
    document.getElementById('badge-target').addEventListener('click', () => openLangModal('target'));
    document.querySelector('.btn-settings').addEventListener('click', toggleSettings);
    document.querySelector('.btn-history').addEventListener('click', toggleHistory);

    document.querySelectorAll('.modal-backdrop').forEach(el => {
        el.addEventListener('click', () => el.closest('.modal').classList.add('hidden'));
    });
    document.querySelectorAll('.done-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').classList.add('hidden'));
    });

    document.getElementById('btn-clear-history')?.addEventListener('click', clearAllHistory);

    initPushToTalk('btn-source', 'source');
    initPushToTalk('btn-target', 'target');

    document.querySelector('.btn-clear').addEventListener('click', clearAll);
    document.querySelector('.btn-copy').addEventListener('click', copyTarget);
    document.querySelector('.btn-share').addEventListener('click', shareTarget);
    document.querySelector('.btn-speak-source').addEventListener('click', () => speakText('source'));
    document.querySelector('.btn-speak-target').addEventListener('click', () => speakText('target'));

    document.getElementById('text-source').addEventListener('input', autoTranslate);
    document.getElementById('lang-search')?.addEventListener('input', (e) => renderLanguageList(e.target.value));

    document.querySelectorAll('.speed-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.speed-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentVoiceSpeed = parseFloat(btn.dataset.speed);
        });
    });

    document.body.addEventListener('click', () => {
        if (synth && synth.state === 'suspended') { synth.resume(); }
    }, { once: true });

    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) { e.preventDefault(); }
        lastTap = now;
    }, { passive: false });
});
