// script.js – English Boardgame (with Pronounce via Web Speech API)
// ---------------------------------------------------------------
// No external keys/libs needed. Works on Chrome/Edge/Safari.

// =====================
// 0) Web Speech helpers
// =====================
let _voices = [];
function loadVoices() {
  _voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  return _voices;
}
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickEnglishVoice(pref = "auto") {
  if (!_voices || !_voices.length) return null;
  const isEn = v => /\ben(-|_|$)/i.test(v.lang || "") || /(en-GB|en-US|English)/i.test(`${v.lang} ${v.name}`);
  const english = _voices.filter(isEn);
  if (!english.length) return null;

  const byName = namePart => english.find(v => new RegExp(namePart, "i").test(v.name));
  const byLang = lang => english.find(v => new RegExp(`^${lang}$`, "i").test(v.lang));

  if (pref === "us") return byLang("en-US") || byName("US|American") || english[0];
  if (pref === "uk") return byLang("en-GB") || byName("UK|British") || english[0];
  return english.find(v => v.default) || english[0];
}

function getURLTTSOpts() {
  const p = new URLSearchParams(window.location.search);
  const voice = (p.get("voice") || "auto").toLowerCase();
  const rate  = Math.min(2, Math.max(0.5, parseFloat(p.get("rate") || "1")));
  const pitch = Math.min(2, Math.max(0.5, parseFloat(p.get("pitch") || "1")));
  const vol   = Math.min(1, Math.max(0,   parseFloat(p.get("vol")  || "1")));
  return { voicePref: voice, rate, pitch, volume: vol };
}

function pronounceText(text, opts = {}) {
  if (!("speechSynthesis" in window)) return false;
  if (!text || !text.trim()) return false;

  const { voicePref = "auto", rate = 1, pitch = 1, volume = 1 } = opts;
  const voice = pickEnglishVoice(voicePref);
  if (!voice) return false;

  // Stop anything speaking
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.voice = voice;
  utt.rate = rate;
  utt.pitch = pitch;
  utt.volume = volume;
  window.speechSynthesis.speak(utt);
  return true;
}

// =====================
// 1) Auto scroll helper
// =====================
function startAutoScroll() {
  const list = document.getElementById('card-list');
  clearInterval(window._autoScrollInterval);

  if (!list || list.scrollWidth <= list.clientWidth + 2) return;

  window._autoScrollInterval = setInterval(() => {
    if (list.scrollLeft + list.clientWidth >= list.scrollWidth - 1) {
      list.scrollLeft = 0;
    } else {
      list.scrollLeft += 1;
    }
  }, 16);

  if (!list.dataset._binded) {
    list.addEventListener('mouseenter', () => clearInterval(window._autoScrollInterval));
    list.addEventListener('mouseleave', startAutoScroll);
    list.dataset._binded = "true";
  }
}

// =====================
// 2) App boot
// =====================
document.addEventListener('DOMContentLoaded', function () {
  // Hamburger logic
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function (event) {
      if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // =====================
  // Cards data
  // =====================
  const cards = [
    // Function
    { type: 'Function', name: 'Function Cards', img: 'function/skip.jpg', desc: 'Skip turns, reverse order, attack, defend points, and more.', detail: 'Function cards add strategy and excitement. Use them to change the flow of the game!', qr: 'QRCode.svg', link: 'card-detail/function-cards.html', slug: 'Function:Function_Cards' },
    { type: 'Function', name: 'Attack Cat', img: 'function/attack.jpg', desc: 'Launch a bold move against others!', detail: 'Attack cards allow you to surprise and challenge opponents directly!', qr: 'QRCode.svg', link: 'card-detail/attack-cat.html', slug: 'Function:Attack_Cat' },
    { type: 'Function', name: 'Chill Cat', img: 'function/Chill cat.png', desc: 'Take it easy and vibe!', detail: 'Chill Cat lets you relax and keep the game calm and fun.', qr: 'QRCode.svg', link: 'card-detail/chill-cat.html', slug: 'Function:Chill_Cat' },
    { type: 'Function', name: 'Confused Cat', img: 'function/Confused cat.png', desc: 'What’s going on?', detail: 'Play this to add mystery and unpredictability to the round!', qr: 'QRCode.svg', link: 'card-detail/confused-cat.html', slug: 'Function:Confused_Cat' },
    { type: 'Function', name: 'Double Trouble', img: 'function/double trouble.jpg', desc: 'Double the action!', detail: 'Double Trouble lets you repeat your last action or power up a move!', qr: 'QRCode.svg', link: 'card-detail/double-trouble.html', slug: 'Function:Double_Trouble' },
    { type: 'Function', name: 'Joker Cat', img: 'function/joker cat.png', desc: 'Wild and unpredictable!', detail: 'Joker Cat can imitate any card. Perfect for twists and chaos!', qr: 'QRCode.svg', link: 'card-detail/joker-cat.html', slug: 'Function:Joker_Cat' },
    { type: 'Function', name: 'Mirror', img: 'function/mirror.jpg', desc: 'Reflect the play!', detail: 'Use Mirror to bounce the effect of a card back at another player!', qr: 'QRCode.svg', link: 'card-detail/mirror.html', slug: 'Function:Mirror' },
    { type: 'Function', name: 'Point Block', img: 'function/point block.jpg', desc: 'Stop a score!', detail: 'Block opponents from gaining points with this defensive card.', qr: 'QRCode.svg', link: 'card-detail/point-block.html', slug: 'Function:Point_Block' },
    { type: 'Function', name: 'Point Steal', img: 'function/point steal.jpg', desc: 'Take what’s not yours!', detail: 'Steal points from others and get ahead in the game.', qr: 'QRCode.svg', link: 'card-detail/point-steal.html', slug: 'Function:Point_Steal' },
    { type: 'Function', name: 'Reverse', img: 'function/reverse.jpg', desc: 'Flip the order!', detail: 'Reverse the turn direction and keep players on their toes!', qr: 'QRCode.svg', link: 'card-detail/reverse.html', slug: 'Function:Reverse' },
    { type: 'Function', name: 'Shield', img: 'function/shield.jpg', desc: 'Protect yourself!', detail: 'Use the Shield to block any effect targeted at you.', qr: 'QRCode.svg', link: 'card-detail/shield.html', slug: 'Function:Shield' },
    { type: 'Function', name: 'Skip', img: 'function/skip.jpg', desc: 'Bye for now!', detail: 'Skip your turn and avoid taking actions or penalties.', qr: 'QRCode.svg', link: 'card-detail/skip.html', slug: 'Function:Skip' },
    { type: 'Function', name: 'Sleepy Cat', img: 'function/Sleepy cat.png', desc: 'Time to nap!', detail: 'Sleepy Cat lets you rest while forcing others to continue.', qr: 'QRCode.svg', link: 'card-detail/sleepy-cat.html', slug: 'Function:Sleepy_Cat' },
    { type: 'Function', name: 'Wild Dare', img: 'function/wild dare.jpg', desc: 'Unpredictable challenge!', detail: 'Wild Dare can be anything! Use it creatively!', qr: 'QRCode.svg', link: 'card-detail/wild-dare.html', slug: 'Function:Wild_Dare' },

    // Vocabulary A1
    { type: 'Vocabulary', name: 'Book',   img: 'A1Vocab/Book.png',   desc: 'A thing you read.',  pronounce: '/bʊk/',  audio: 'A1Vocab/Book.mp3',   meaning: 'Sách',       example: 'I like reading a book before bed.', level: 'A1', qr: 'QRCode.svg', slug: 'Vocab:A1:Book' },
    { type: 'Vocabulary', name: 'Cat',    img: 'A1Vocab/Cat.png',    desc: 'A small animal that purrs.', pronounce: '/kæt/', audio: 'A1Vocab/Cat.mp3',    meaning: 'Con mèo',  example: 'My cat is very cute.',            level: 'A1', qr: 'QRCode.svg', slug: 'Vocab:A1:Cat' },
    { type: 'Vocabulary', name: 'Friend', img: 'A1Vocab/Friend.png', desc: 'Someone you like and trust.', pronounce: '/frɛnd/', audio: 'A1Vocab/Friend.mp3', meaning: 'Bạn bè',   example: 'Anna is my best friend.',        level: 'A1', qr: 'QRCode.svg', slug: 'Vocab:A1:Friend' },
    { type: 'Vocabulary', name: 'Happy',  img: 'A1Vocab/Happy.png',  desc: 'Feeling good or joyful.', pronounce: '/ˈhæpi/', audio: 'A1Vocab/Happy.mp3',  meaning: 'Vui vẻ',   example: 'She is always happy.',           level: 'A1', qr: 'QRCode.svg', slug: 'Vocab:A1:Happy' },
    { type: 'Vocabulary', name: 'Mother', img: 'A1Vocab/Mother.png', desc: 'Your female parent.', pronounce: '/ˈmʌðər/', audio: 'A1Vocab/Mother.mp3', meaning: 'Mẹ',       example: 'My mother cooks very well.',     level: 'A1', qr: 'QRCode.svg', slug: 'Vocab:A1:Mother' },
    { type: 'Vocabulary', name: 'Run',    img: 'A1Vocab/Run.png',    desc: 'To move fast on your feet.', pronounce: '/rʌn/', audio: 'A1Vocab/Run.mp3',    meaning: 'Chạy',     example: 'I run to school every day.',     level: 'A1', qr: 'QRCode.svg', slug: 'Vocab:A1:Run' },
    { type: 'Vocabulary', name: 'School', img: 'A1Vocab/School.png', desc: 'A place to learn.', pronounce: '/skuːl/', audio: 'A1Vocab/School.mp3', meaning: 'Trường học', example: 'School starts at 7 AM.',          level: 'A1', qr: 'QRCode.svg', slug: 'Vocab:A1:School' },
    { type: 'Vocabulary', name: 'Water',  img: 'A1Vocab/Water.png',  desc: 'A liquid we drink.', pronounce: '/ˈwɔːtə(r)/', audio: 'A1Vocab/Water.mp3', meaning: 'Nước', example: 'Drink water every day.', level: 'A1', qr: 'QRCode.svg', slug: 'Vocab:A1:Water' },

    // Idioms
    { type: 'Idioms', name: 'Break a leg', img: 'idiom/Let the cat out of the bag.jpg', desc: 'Wish someone good luck!', detail: 'Used to wish someone good luck, especially before a performance.', meaning: 'Chúc ai đó may mắn', example: 'You have a big show tonight? Break a leg!', qr: 'QRCode.svg', slug: 'break-a-leg' }
  ];

  // =====================
  // DOM refs
  // =====================
  const cardList = document.getElementById('card-list');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  let currentType = 'All';

  // =====================
  // Render
  // =====================
  function renderCards() {
    let searchVal = (searchInput?.value || '').toLowerCase();
    cardList.innerHTML = "";
    let filtered = [];

    cards.forEach((card, idx) => {
      if (
        (currentType === "All" || card.type === currentType) &&
        (
          (card.name && card.name.toLowerCase().includes(searchVal)) ||
          (card.desc && card.desc.toLowerCase().includes(searchVal)) ||
          (card.slug && card.slug.toLowerCase().includes(searchVal))
        )
      ) {
        filtered.push({ card, idx });
      }
    });

    if (filtered.length === 0) {
      cardList.innerHTML = "<div style='color:#aa3366;font-size:1.1em;margin:2rem auto;'>No cards found.</div>";
      return;
    }

    filtered.forEach(({ card, idx }) => {
      const div = document.createElement('div');
      div.className = 'card-box';
      div.innerHTML = `<div class="card-art"><img src="${card.img}" alt="${card.name}" loading="lazy"></div>`;
      div.onclick = () => showModal(idx);
      cardList.appendChild(div);
    });

    setTimeout(() => startAutoScroll(), 250);
  }

  searchInput?.addEventListener('input', renderCards);
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.getAttribute('data-type');
      renderCards();
    };
  });

  renderCards();

  // =====================
  // Modal
  // =====================
  window.showModal = function (idx) {
    if (typeof idx !== 'number' || idx < 0 || idx >= cards.length) return;
    const card = cards[idx];

    const bg = document.getElementById('modal-bg');
    const img = document.getElementById('modal-img');
    const title = document.getElementById('modal-title');

    const elDesc = document.getElementById('modal-desc');
    const elExtra = document.getElementById('modal-extra');
    const elAudio = document.getElementById('modal-audio');
    const elQR = document.getElementById('modal-qr');
    const elExample = document.getElementById('modal-example');
    const elPron = document.getElementById('modal-pronounce');
    const elMeaning = document.getElementById('modal-meaning');

    bg.classList.add('active');
    img.src = card.img || "";
    img.alt = card.name || "";
    title.textContent = card.name || "";

    // clear all fields first
    elDesc.innerHTML = '';
    elExtra.innerHTML = '';
    elAudio.innerHTML = '';
    elQR.innerHTML = '';
    elExample.innerHTML = '';
    elPron.innerHTML = '';
    elMeaning.innerHTML = '';

    if (card.type === 'Vocabulary') {
      const ttsOpts = getURLTTSOpts();

      if (card.pronounce) {
        elPron.innerHTML = `<b>Phiên âm:</b> <span style="font-family:monospace">${card.pronounce}</span>`;
      }

      // Pronounce button + optional audio fallback
      const btnHTML = `
        <button class="pronounce-btn" id="btn-pronounce" title="Click: speak word | Long‑press: word + example" style="margin-bottom:.5rem;">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 10v4h3l4 3V7L6 10H3z" fill="currentColor"/>
            <path d="M14 10a4 4 0 010 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M16.5 7a7 7 0 010 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Pronounce
        </button>`;
      const fallbackAudio = card.audio ?
        `<div style="margin-top:.4rem"><audio controls style="width:98%"><source src="${card.audio}" type="audio/mp3"></audio></div>` : '';
      elAudio.innerHTML = btnHTML + fallbackAudio;

      const btn = document.getElementById('btn-pronounce');
      if (!window.speechSynthesis || !pickEnglishVoice(ttsOpts.voicePref)) {
        btn.setAttribute('disabled', 'true');
        btn.title = 'Text-to-speech is unavailable on this device/browser';
      } else {
        let pressTimer = null;
        const speakWord = () => pronounceText(card.name, ttsOpts);
        const speakWordPlusExample = () => {
          const full = card.example ? `${card.name}. ${card.example}` : card.name;
          pronounceText(full, ttsOpts);
        };
        btn.addEventListener('click', (e) => { e.preventDefault(); speakWord(); });
        const startPress = () => { pressTimer = setTimeout(speakWordPlusExample, 450); };
        const endPress = () => { clearTimeout(pressTimer); };
        btn.addEventListener('mousedown', startPress);
        btn.addEventListener('touchstart', startPress, { passive: true });
        ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev => btn.addEventListener(ev, endPress));
      }

      // Optional mini TTS settings (voice/rate) injected below modal-extra
      const settingsHTML = `
        <div id="tts-settings" style="margin:.6rem 0 .1rem; font-size:.95rem; text-align:center;">
          <label>Voice:
            <select id="tts-voice">
              <option value="auto">Auto</option>
              <option value="us">US</option>
              <option value="uk">UK</option>
            </select>
          </label>
          <label style="margin-left:.6rem;">Rate:
            <input id="tts-rate" type="range" min="0.5" max="1.5" step="0.05" value="1" style="vertical-align:middle;">
          </label>
        </div>`;

      // details
      if (card.meaning) elMeaning.innerHTML = `<b>Nghĩa:</b> ${card.meaning}`;
      if (card.example) elExample.innerHTML = `<b>Ví dụ:</b> <i>${card.example}</i>`;
      elExtra.innerHTML = `<b>Type:</b> ${card.type}` + (card.level ? `<br><b>Level:</b> ${card.level}` : '') + settingsHTML;
      elDesc.innerHTML = card.desc || card.detail || '';

      // Bind settings → write to URL so subsequent clicks use same options
      (function bindTTSSettings(){
        const sel = document.getElementById('tts-voice');
        const rate = document.getElementById('tts-rate');
        if (!sel || !rate) return;
        const url = new URL(window.location);
        const params = new URLSearchParams(url.search);
        sel.value = (params.get('voice')) || 'auto';
        rate.value = (params.get('rate')) || '1';
        const update = () => {
          const p = new URLSearchParams(url.search);
          p.set('voice', sel.value);
          p.set('rate', rate.value);
          url.search = p.toString();
          history.replaceState({}, '', url);
        };
        sel.addEventListener('change', update);
        rate.addEventListener('input', update);
      })();

    } else if (card.type === 'Dare') {
      elDesc.innerHTML = card.challenge ? `<b>Challenge:</b> ${card.challenge}` : (card.desc || '');
      elExtra.innerHTML = card.hint ? `<b>Hint:</b> ${card.hint}` : '';

    } else if (card.type === 'Idioms') {
      elDesc.innerHTML = card.meaning ? `<b>Nghĩa:</b> ${card.meaning}` : (card.desc || '');
      if (card.example) elExample.innerHTML = `<b>Ví dụ:</b> <i>${card.example}</i>`;
      elExtra.innerHTML = `<b>Type:</b> ${card.type}<br><b>Description:</b> ${card.desc || ''}`;

    } else {
      elDesc.innerHTML = card.detail || card.desc || '';
      elExtra.innerHTML = `<b>Type:</b> ${card.type}<br><b>Description:</b> ${card.desc || ''}`;
    }

  
  };

  window.closeModal = function () {
    document.getElementById('modal-bg')?.classList.remove('active');
    // also stop TTS when closing
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  document.getElementById('modal-bg')?.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // Auto open modal if ?card=slug
  setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('card');
    if (slug && slug.trim() !== "") {
      const idx = cards.findIndex(c => c.slug === slug);
      if (idx >= 0) {
        const searchInputEl = document.getElementById('search-input');
        if (searchInputEl) searchInputEl.value = cards[idx].slug;
        renderCards();
        showModal(idx);
      }
    }
  }, 350);
});
