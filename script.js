// ==================== DİL VERİSİ ====================
const LANG_DATA = {
    'tr-TR': { name: 'Türkçe', flag: '🇹🇷', label: 'TR', api: 'tr', voice: 'tr-TR' },
    'zh-CN': { name: 'Çince',  flag: '🇨🇳', label: 'ZH', api: 'zh', voice: 'zh-CN' },
    'ur-PK': { name: 'Urduca', flag: '🇵🇰', label: 'UR', api: 'ur', voice: 'ur-PK' },
    'ne-NP': { name: 'Nepalce', flag: '🇳🇵', label: 'NE', api: 'ne', voice: 'ne-NP' },
    'hi-IN': { name: 'Hintçe', flag: '🇮🇳', label: 'HI', api: 'hi', voice: 'hi-IN' },
    'pl-PL': { name: 'Lehçe',  flag: '🇵🇱', label: 'PL', api: 'pl', voice: 'pl-PL' }
};

// ==================== STATE ====================
let currentSource = 'tr-TR';
let currentTarget = 'zh-CN';
let debounceTimer = null;
let isTranslating = false;
let lastSourceText = '';

// ==================== SES TANIMAMA ====================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
}

// ==================== SESLENDİRME (KUSURSUZ) ====================
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
// Hemen dene
initVoices();
// 1sn sonra tekrar dene (Chrome fix)
setTimeout(initVoices, 1000);

function getVoice(langCode) {
    const prefix = langCode.split('-')[0];
    // Tam eşleşme
    let v = voices.find(x => x.lang === langCode);
    if (!v) v = voices.find(x => x.lang.startsWith(prefix + '-'));
    if (!v) v = voices.find(x => x.lang.startsWith(prefix));
    return v || null;
}

function speak(text, langCode) {
    if (!text || !synth) return;
    
    // Chrome fix: voices boşsa bekle
    if (!voicesLoaded || voices.length === 0) {
        initVoices();
        setTimeout(() => speak(text, langCode), 300);
        return;
    }
    
    synth.cancel();
    
    // Tarayıcıların speak() sorununu aşmak için kısa gecikme
    setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = LANG_DATA[langCode]?.voice || langCode;
        u.rate = 0.95;
        u.pitch = 1;
        u.volume = 1;
        
        const voice = getVoice(u.lang);
        if (voice) u.voice = voice;
        
        u.onerror = (e) => {
            console.warn('Seslendirme hatası:', e.error);
            // Fallback: varsayılan sesle dene
            const fallback = new SpeechSynthesisUtterance(text);
            fallback.lang = u.lang;
            synth.speak(fallback);
        };
        
        synth.speak(u);
    }, 60);
}

// ==================== UI GÜNCELLEME ====================
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
    
    // Ayarlar menüsü butonlarını güncelle
    document.querySelectorAll('.lang-item').forEach(item => {
        const code = item.dataset.code;
        const btn = item.querySelector('.dl-btn');
        if (code === currentTarget) {
            btn.textContent = 'Aktif';
            btn.classList.add('downloaded');
        } else {
            btn.textContent = 'Seç';
            btn.classList.remove('downloaded');
        }
    });
}

// ==================== SWAP ====================
function swapLanguages() {
    // Dilleri değiştir
    const tmp = currentSource;
    currentSource = currentTarget;
    currentTarget = tmp;
    
    // İçerikleri değiştir
    const srcEl = document.getElementById('text-source');
    const tgtEl = document.getElementById('text-target');
    const tmpText = srcEl.value;
    srcEl.value = tgtEl.value;
    tgtEl.value = tmpText;
    
    lastSourceText = srcEl.value;
    
    // Animasyon
    const btn = document.querySelector('.swap-btn');
    btn.style.transform = 'rotate(180deg) scale(0.9)';
    setTimeout(() => btn.style.transform = '', 350);
    
    updateUI();
    
    // Yeni source'da metin varsa hemen çevir
    if (srcEl.value.trim()) {
        doTranslate(srcEl.value.trim(), currentSource, currentTarget);
    }
}

// ==================== MİKROFON ====================
function startListening(which) {
    if (!recognition) {
        alert('Tarayıcınız ses tanımayı desteklemiyor. Chrome/Edge kullanın.');
        return;
    }
    
    const langCode = which === 'source' ? currentSource : currentTarget;
    const btnId = which === 'source' ? 'btn-source' : 'btn-target';
    
    try {
        recognition.lang = langCode;
        recognition.start();
        
        document.getElementById(btnId).classList.add('listening');
    } catch (e) {
        console.error('Mic start error:', e);
    }
}

if (recognition) {
    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        document.getElementById('text-source').value = text;
        doTranslate(text, currentSource, currentTarget);
    };
    
    recognition.onerror = (e) => {
        console.error('Mic error:', e.error);
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

// ==================== ÇEVİRİ ====================
function autoTranslate() {
    clearTimeout(debounceTimer);
    const text = document.getElementById('text-source').value.trim();
    
    if (!text) {
        document.getElementById('text-target').value = '';
        lastSourceText = '';
        return;
    }
    
    debounceTimer = setTimeout(() => {
        doTranslate(text, currentSource, currentTarget);
    }, 400);
}

async function doTranslate(text, from, to) {
    if (isTranslating || !text) return;
    if (lastSourceText === text && document.getElementById('text-target').value) return;
    
    isTranslating = true;
    document.getElementById('loading-target').classList.remove('hidden');
    
    const fromApi = LANG_DATA[from].api;
    const toApi = LANG_DATA[to].api;
    
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromApi}|${toApi}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.responseData?.translatedText) {
            let t = data.responseData.translatedText;
            // MyMemory hata mesajı filtrele
            if (t.includes('MYMEMORY WARNING') || t.includes('NO INTERNET')) {
                throw new Error('API limit');
            }
            document.getElementById('text-target').value = t;
            lastSourceText = text;
        } else {
            throw new Error('Empty response');
        }
    } catch (err) {
        console.error('Çeviri hatası:', err);
        // Hata durumunda hedefi temizleme, kullanıcı metni korusun
    } finally {
        isTranslating = false;
        document.getElementById('loading-target').classList.add('hidden');
    }
}

// ==================== SESLENDİRME BUTONLARI ====================
function speakText(which) {
    const id = which === 'source' ? 'text-source' : 'text-target';
    const lang = which === 'source' ? currentSource : currentTarget;
    const text = document.getElementById(id).value.trim();
    if (!text) return;
    speak(text, lang);
}

// ==================== TEMİZLE / KOPYALA ====================
function clearAll() {
    document.getElementById('text-source').value = '';
    document.getElementById('text-target').value = '';
    lastSourceText = '';
}

function copyTarget() {
    const el = document.getElementById('text-target');
    if (!el.value) return;
    el.select();
    el.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(el.value).catch(() => {
        document.execCommand('copy');
    });
    // Kısa geri bildirim
    const btn = document.querySelector('.btn-copy i');
    btn.className = 'fa-solid fa-check';
    setTimeout(() => btn.className = 'fa-solid fa-copy', 1200);
}

// ==================== AYARLAR ====================
function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('hidden');
}

function selectLang(code) {
    if (code === currentTarget) {
        toggleSettings();
        return;
    }
    if (code === currentSource) {
        // Kaynakla aynıysa swap yap
        swapLanguages();
        toggleSettings();
        return;
    }
    
    currentTarget = code;
    updateUI();
    toggleSettings();
    
    // Mevcut metni yeni dile çevir
    const txt = document.getElementById('text-source').value.trim();
    if (txt) doTranslate(txt, currentSource, currentTarget);
}

// ==================== BAŞLANGIÇ ====================
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    
    // Chrome speechSynthesis ısıtma
    if (synth) {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        synth.speak(u);
        synth.cancel();
    }
});
