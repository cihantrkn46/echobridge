// ==================== DİL VERİSİ ====================
const LANG_DATA = {
    'tr-TR': { name: 'Türkçe', flag: '🇹🇷', label: 'TR', api: 'tr', voice: 'tr-TR' },
    'en-US': { name: 'İngilizce', flag: '🇺🇸', label: 'EN', api: 'en', voice: 'en-US' },
    'es-ES': { name: 'İspanyolca', flag: '🇪🇸', label: 'ES', api: 'es', voice: 'es-ES' },
    'fr-FR': { name: 'Fransızca', flag: '🇫🇷', label: 'FR', api: 'fr', voice: 'fr-FR' },
    'de-DE': { name: 'Almanca', flag: '🇩🇪', label: 'DE', api: 'de', voice: 'de-DE' },
    'zh-CN': { name: 'Çince',  flag: '🇨🇳', label: 'ZH', api: 'zh', voice: 'zh-CN' },
    'ru-RU': { name: 'Rusça', flag: '🇷🇺', label: 'RU', api: 'ru', voice: 'ru-RU' },
    'ja-JP': { name: 'Japonca', flag: '🇯🇵', label: 'JA', api: 'ja', voice: 'ja-JP' },
    'ko-KR': { name: 'Korece', flag: '🇰🇷', label: 'KO', api: 'ko', voice: 'ko-KR' },
    'ar-SA': { name: 'Arapça', flag: '🇸🇦', label: 'AR', api: 'ar', voice: 'ar-SA' },
    'hi-IN': { name: 'Hintçe', flag: '🇮🇳', label: 'HI', api: 'hi', voice: 'hi-IN' },
    'pl-PL': { name: 'Lehçe',  flag: '🇵🇱', label: 'PL', api: 'pl', voice: 'pl-PL' }
};

// ==================== STATE ====================
let currentSource = 'tr-TR';
let currentTarget = 'en-US';
let debounceTimer = null;
let isTranslating = false;
let lastSourceText = '';
let currentTranslationId = 0;
let historyData = JSON.parse(localStorage.getItem('echobridge_history')) || [];
let currentVoiceSpeed = 1.0;
let selectionMode = 'target'; // 'source' or 'target'

// ==================== TOAST SİSTEMİ ====================
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container') || (() => {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    })();

    const icons = {
        success: 'fa-solid fa-circle-check',
        error: 'fa-solid fa-circle-xmark',
        warning: 'fa-solid fa-triangle-exclamation',
        info: 'fa-solid fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="${icons[type] || icons.info} toast-icon"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== SES TANIMAMA (GELİŞTİRİLMİŞ) ====================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
}

// ==================== SESLENDİRME ====================
const synth = window.speechSynthesis;
let voicesLoaded = false;
let voices = [];

function initVoices() {
    voices = synth.getVoices() || [];
    if (voices.length > 0) voicesLoaded = true;
}
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = initVoices;
}
initVoices();
setTimeout(initVoices, 1000);

function getVoice(langCode) {
    const prefix = langCode.split('-')[0];
    let v = voices.find(x => x.lang === langCode);
    if (!v) v = voices.find(x => x.lang.startsWith(prefix + '-'));
    if (!v) v = voices.find(x => x.lang.startsWith(prefix));
    return v || null;
}

function speak(text, langCode) {
    return new Promise((resolve, reject) => {
        if (!text || !synth) {
            reject('Seslendirme desteklenmiyor');
            return;
        }

        let attempts = 0;
        const maxAttempts = 3;

        function trySpeak() {
            if (!voicesLoaded || voices.length === 0) {
                initVoices();
                if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(trySpeak, 300);
                } else {
                    reject('Ses motoru yüklenemedi');
                }
                return;
            }

            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = LANG_DATA[langCode]?.voice || langCode;
            utterance.rate = currentVoiceSpeed;
            utterance.pitch = 1;
            utterance.volume = 1;

            const voice = getVoice(utterance.lang);
            if (voice) utterance.voice = voice;

            utterance.onend = () => resolve();
            utterance.onerror = (e) => {
                console.warn('Seslendirme hatası:', e.error);
                if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(trySpeak, 300);
                } else {
                    reject('Seslendirme başarısız');
                }
            };

            synth.speak(utterance);
        }

        trySpeak();
    });
}

// ==================== UI GÜNCELLEME ====================
function renderLanguageList(filterText = '') {
    const list = document.getElementById('lang-list');
    if (!list) return;
    
    const filter = filterText.toLowerCase();
    
    list.innerHTML = Object.keys(LANG_DATA)
        .filter(code => {
            const lang = LANG_DATA[code];
            return lang.name.toLowerCase().includes(filter);
        })
        .map(code => {
            const lang = LANG_DATA[code];
            const isActive = (selectionMode === 'source' ? code === currentSource : code === currentTarget);
            return `
                <div class="lang-item" data-code="${code}">
                    <span>${lang.flag} ${lang.name}</span>
                    <button class="dl-btn ${isActive ? 'downloaded' : ''}">${isActive ? 'Aktif' : 'Seç'}</button>
                </div>
            `;
        }).join('');
        
    // Buton eventlerini bağla
    list.querySelectorAll('.lang-item .dl-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = e.target.closest('.lang-item').dataset.code;
            selectLang(code);
        });
    });
}

function updateUI() {
    const s = LANG_DATA[currentSource];
    const t = LANG_DATA[currentTarget];
    
    document.getElementById('flag-source').textContent = s.flag;
    document.getElementById('title-source').textContent = s.name;
    document.getElementById('label-source').textContent = s.label;
    document.getElementById('text-source').placeholder = s.name + ' yazın veya mikrofona basın...';
    
    document.getElementById('flag-target').textContent = t.flag;
    document.getElementById('title-target').textContent = t.name;
    document.getElementById('label-target').textContent = t.label;
    document.getElementById('text-target').placeholder = t.name + ' çevirisi burada görünecek...';
    
    const searchEl = document.getElementById('lang-search');
    renderLanguageList(searchEl ? searchEl.value : '');
}

// ==================== SWAP ====================
function swapLanguages() {
    const tmp = currentSource;
    currentSource = currentTarget;
    currentTarget = tmp;
    
    const srcEl = document.getElementById('text-source');
    const tgtEl = document.getElementById('text-target');
    const tmpText = srcEl.value;
    srcEl.value = tgtEl.value;
    tgtEl.value = tmpText;
    
    lastSourceText = srcEl.value;
    
    const btn = document.querySelector('.swap-btn');
    btn.style.transform = 'rotate(180deg) scale(0.9)';
    setTimeout(() => btn.style.transform = '', 350);
    
    updateUI();
    
    if (srcEl.value.trim()) {
        doTranslate(srcEl.value.trim(), currentSource, currentTarget);
    }
}

// ==================== MİKROFON (SES TANIMA & BAS KONUŞ) ====================
// Başlangıç bip sesini engellemek için mikrofon hardware'ini önceden açıp uyanık tutma (Warm-up hack)
let micStream = null;

async function keepMicWarm() {
    try {
        if (!micStream && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Hardware'i aktif tutarak SpeechRecognition bip sesini çoğu cihazda engeller.
        }
    } catch (e) {
        console.warn('Sessiz mikrofon önbelleği başarısız:', e);
    }
}

function startListening(which) {
    if (!recognition) {
        showToast('Tarayıcınız ses tanımayı desteklemiyor. Chrome/Edge kullanın.', 'error');
        return;
    }
    
    keepMicWarm(); // Güvence için tekrar çağır
    
    const langCode = which === 'source' ? currentSource : currentTarget;
    const btnId = which === 'source' ? 'btn-source' : 'btn-target';
    
    const supportedLangs = ['tr-TR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ru-RU', 'ja-JP', 'ko-KR', 'ar-SA', 'hi-IN', 'pl-PL'];
    let useLang = langCode;
    if (!supportedLangs.includes(langCode)) {
        useLang = 'tr-TR';
    }
    
    try {
        recognition.lang = useLang;
        recognition.start();
        document.getElementById(btnId).classList.add('listening');
    } catch (e) {
        // Zaten çalışıyorsa yoksay
        document.getElementById(btnId).classList.add('listening');
    }
}

function stopListening() {
    if (recognition) {
        try {
            recognition.stop();
        } catch(e) {}
    }
    resetMic();
}

if (recognition) {
    recognition.onstart = () => {
        console.log('Dinleniyor...');
    };

    recognition.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
        }
        document.getElementById('text-source').value = text;
        autoTranslate(); // Trigger char count & translate
    };
    
    recognition.onerror = (e) => {
        if (e.error !== 'aborted') {
            console.error('Mic error:', e.error);
        }
        resetMic();
    };
    
    recognition.onend = () => {
        resetMic();
    };
}

function resetMic() {
    document.getElementById('btn-source').classList.remove('listening');
    document.getElementById('btn-target').classList.remove('listening');
}

function initPushToTalk(btnId, type) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const start = (e) => {
        if (e.cancelable) e.preventDefault();
        keepMicWarm();
        btn.classList.add('pressing');
        startListening(type);
    };

    const stop = (e) => {
        if (e.cancelable) e.preventDefault();
        btn.classList.remove('pressing');
        stopListening();
    };

    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: false });
    
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    btn.addEventListener('touchend', stop);
}

// ==================== ÇEVİRİ ====================
function autoTranslate() {
    clearTimeout(debounceTimer);
    const srcEl = document.getElementById('text-source');
    const text = srcEl.value;
    
    // Karakter Sayacı Güncelleme
    const counter = document.getElementById('char-count');
    counter.textContent = `${text.length}/500`;
    if (text.length >= 500) {
        counter.className = 'char-count limit-reached';
    } else if (text.length >= 450) {
        counter.className = 'char-count limit-near';
    } else {
        counter.className = 'char-count';
    }

    const trimmed = text.trim();
    if (!trimmed) {
        document.getElementById('text-target').value = '';
        lastSourceText = '';
        currentTranslationId++; // İptal için
        document.getElementById('loading-target').classList.add('hidden');
        isTranslating = false;
        return;
    }
    
    debounceTimer = setTimeout(() => {
        doTranslate(trimmed, currentSource, currentTarget);
    }, 250);
}

async function doTranslate(text, from, to) {
    if (!text) return;
    if (lastSourceText === text && document.getElementById('text-target').value) return;
    
    isTranslating = true;
    document.getElementById('loading-target').classList.remove('hidden');
    
    currentTranslationId++;
    const translationId = currentTranslationId;
    
    const fromApi = LANG_DATA[from].api;
    const toApi = LANG_DATA[to].api;
    
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromApi}|${toApi}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (translationId !== currentTranslationId) return; // Race condition önleme
        
        if (data.responseData?.translatedText) {
            let t = data.responseData.translatedText;
            if (t.includes('MYMEMORY WARNING') || t.includes('NO INTERNET')) {
                throw new Error('API limit aşımı veya bağlantı sorunu');
            }
            document.getElementById('text-target').value = t;
            lastSourceText = text;
            saveToHistory(text, t, from, to);
        } else {
            throw new Error('API yanıtı boş');
        }
    } catch (err) {
        if (translationId !== currentTranslationId) return; // Eski isteğin hatasını gösterme
        console.error('Çeviri hatası:', err);
        showToast(`Çeviri başarısız: ${err.message || 'Bilinmeyen hata'}`, 'error');
        // Hedef metni temizleme, kullanıcının son çevirisini koru
    } finally {
        if (translationId === currentTranslationId) {
            isTranslating = false;
            document.getElementById('loading-target').classList.add('hidden');
        }
    }
}

// ==================== SESLENDİRME BUTONLARI ====================
async function speakText(which) {
    const id = which === 'source' ? 'text-source' : 'text-target';
    const lang = which === 'source' ? currentSource : currentTarget;
    const text = document.getElementById(id).value.trim();
    if (!text) {
        showToast('Seslendirilecek metin yok', 'warning', 1500);
        return;
    }

    const btn = document.querySelector(`#card-${which} .action-btn:first-child i`);
    btn.className = 'fa-solid fa-volume-off';
    
    try {
        await speak(text, lang);
        showToast('Seslendirme tamamlandı', 'success', 2000);
    } catch (err) {
        showToast(`Seslendirme hatası: ${err}`, 'error');
    } finally {
        btn.className = 'fa-solid fa-volume-high';
    }
}

// ==================== TEMİZLE / KOPYALA ====================
function clearAll() {
    document.getElementById('text-source').value = '';
    document.getElementById('text-target').value = '';
    lastSourceText = '';
    showToast('Metin temizlendi', 'info', 1500);
}

function copyTarget() {
    const el = document.getElementById('text-target');
    if (!el.value) {
        showToast('Kopyalanacak metin yok', 'warning', 1500);
        return;
    }
    
    const onCopySuccess = () => {
        showToast('Kopyalandı!', 'success', 1500);
        const btn = document.querySelector('.btn-copy i');
        btn.className = 'fa-solid fa-check';
        setTimeout(() => btn.className = 'fa-solid fa-copy', 1200);
    };

    const fallbackCopy = () => {
        el.select();
        el.setSelectionRange(0, 99999);
        try {
            document.execCommand('copy');
            onCopySuccess();
        } catch (err) {
            showToast('Kopyalama başarısız', 'error', 1500);
        }
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(el.value)
            .then(onCopySuccess)
            .catch(fallbackCopy);
    } else {
        fallbackCopy();
    }
}

// ==================== PAYLAŞ ====================
function shareTarget() {
    const text = document.getElementById('text-target').value;
    if (!text) {
        showToast('Paylaşılacak metin yok', 'warning', 1500);
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: 'EchoBridge Çeviri',
            text: text
        }).catch(err => {
            console.log('Paylaşım iptal edildi veya hata:', err);
        });
    } else {
        copyTarget();
        showToast('Paylaşım desteklenmiyor, metin kopyalandı.', 'info');
    }
}

// ==================== GEÇMİŞ (HISTORY) ====================
function saveToHistory(sourceText, targetText, from, to) {
    if (!sourceText || !targetText) return;
    if (historyData.length > 0 && historyData[0].sourceText === sourceText && historyData[0].targetText === targetText) return;

    const entry = {
        id: Date.now(),
        sourceText,
        targetText,
        from,
        to,
        date: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute:'2-digit' })
    };
    
    historyData.unshift(entry);
    if (historyData.length > 30) historyData.pop(); // Son 30 çeviriyi tut
    localStorage.setItem('echobridge_history', JSON.stringify(historyData));
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (historyData.length === 0) {
        list.innerHTML = '<div class="history-empty">Henüz çeviri yapılmadı.</div>';
        return;
    }
    
    list.innerHTML = historyData.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-langs">
                <span>${LANG_DATA[item.from].label} ➔ ${LANG_DATA[item.to].label}</span>
                <span class="history-date">${item.date}</span>
            </div>
            <div class="history-source">${item.sourceText}</div>
            <div class="history-target">${item.targetText}</div>
        </div>
    `).join('');
    
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
    
    updateUI();
    
    // Karakter sayacını manuel güncelle
    const text = item.sourceText;
    const counter = document.getElementById('char-count');
    counter.textContent = `${text.length}/500`;
    if (text.length >= 500) counter.className = 'char-count limit-reached';
    else if (text.length >= 450) counter.className = 'char-count limit-near';
    else counter.className = 'char-count';
    
    toggleHistory();
}

function toggleHistory() {
    const modal = document.getElementById('history-modal');
    if (modal.classList.contains('hidden')) {
        renderHistory();
    }
    modal.classList.toggle('hidden');
}

// ==================== AYARLAR (DİL SEÇİMİ) ====================
function openSettingsModal(mode = 'target') {
    selectionMode = mode;
    const modal = document.getElementById('settings-modal');
    document.getElementById('modal-title').textContent = mode === 'source' ? 'Kaynak Dil Seç' : 'Hedef Dil Seç';
    
    // Ses hızı kontrolünü sadece target veya genel modda göster (İsteğe bağlı gizlenebilir, şimdilik kalabilir)
    document.querySelector('.settings-section').style.display = mode === 'source' ? 'none' : 'block';
    
    renderLanguageList(document.getElementById('lang-search').value);
    modal.classList.remove('hidden');
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal.classList.contains('hidden')) {
        openSettingsModal('target');
    } else {
        modal.classList.add('hidden');
    }
}

function selectLang(code) {
    if (selectionMode === 'source') {
        if (code === currentTarget) swapLanguages();
        else currentSource = code;
    } else {
        if (code === currentSource) swapLanguages();
        else currentTarget = code;
    }
    
    updateUI();
    document.getElementById('settings-modal').classList.add('hidden');
    
    const txt = document.getElementById('text-source').value.trim();
    if (txt) doTranslate(txt, currentSource, currentTarget);
}

// ==================== OLAY YÖNETİMİ ====================
document.addEventListener('DOMContentLoaded', () => {
    updateUI();

    // Butonlar
    document.querySelector('.swap-btn').addEventListener('click', swapLanguages);
    
    // Ayarlar & Dil Modalı
    document.querySelector('.icon-btn[title="Ayarlar"]').addEventListener('click', toggleSettings);
    document.getElementById('badge-source').addEventListener('click', () => openSettingsModal('source'));
    document.getElementById('badge-target').addEventListener('click', () => openSettingsModal('target'));
    
    document.querySelector('.btn-history').addEventListener('click', toggleHistory);
    
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });

    // Bas konuş butonlarını kur (Tıkla değil, basılı tut)
    initPushToTalk('btn-source', 'source');
    initPushToTalk('btn-target', 'target');

    document.querySelector('.btn-clear').addEventListener('click', clearAll);
    document.querySelector('.btn-copy').addEventListener('click', copyTarget);
    document.querySelector('.btn-share').addEventListener('click', shareTarget);
    
    // Ayarlar: Arama ve Hız
    const searchInput = document.getElementById('lang-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderLanguageList(e.target.value);
        });
    }

    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentVoiceSpeed = parseFloat(e.target.dataset.speed);
        });
    });
    
    // Seslendirme butonları
    document.querySelector('#card-source .action-btn:first-child').addEventListener('click', () => speakText('source'));
    document.querySelector('#card-target .action-btn:first-child').addEventListener('click', () => speakText('target'));
    
    // Metin girişi
    document.getElementById('text-source').addEventListener('input', autoTranslate);
    
    // Chrome speechSynthesis ısıtma & Mik sıcak tutma
    document.body.addEventListener('click', () => {
        keepMicWarm();
        if (synth) {
            const u = new SpeechSynthesisUtterance(' ');
            u.volume = 0;
            synth.speak(u);
            synth.cancel();
        }
    }, { once: true });
});