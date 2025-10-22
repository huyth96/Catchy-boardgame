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
  let voice = pickEnglishVoice(voicePref);
  if (!voice) {
    const voicesNow = loadVoices();
    if (voicesNow && voicesNow.length) {
      voice = pickEnglishVoice(voicePref);
    }
  }

  // Stop anything speaking
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  if (voice) utt.voice = voice;
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
  // Hamburger logic đồng bộ với Homepage
  const hamburgerBtn = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');

  if (hamburgerBtn && navLinks) {
    const setMenuOpen = (open) => {
      navLinks.classList.toggle('open', open);
      hamburgerBtn.setAttribute('aria-expanded', String(open));
      overlay?.classList.toggle('show', open);
      document.body.classList.toggle('menu-open', open);
    };

    hamburgerBtn.addEventListener('click', () => {
      setMenuOpen(!navLinks.classList.contains('open'));
    });
    overlay?.addEventListener('click', () => setMenuOpen(false));

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    });
  }

  // =====================
  // Cards data (loaded from JSON)
  // =====================
  let cards = [];
  let isCardsLoading = true;
  let cardsLoadError = null;

  // =====================
  // DOM refs
  // =====================
  const cardList = document.getElementById('card-list');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const loadMoreBtn = document.getElementById('card-load-more');
  const viewToggleBtn = document.getElementById('view-toggle');
  let currentType = 'All';
  let renderLimit = 0;
  let isGridView = false;
  const getBatchSize = () => (window.matchMedia && window.matchMedia('(max-width: 600px)').matches ? 12 : 24);

  const updateViewToggleUI = () => {
    if (!viewToggleBtn) return;
    const label = isGridView ? 'Switch to presentation view' : 'Switch to grid view';
    viewToggleBtn.dataset.view = isGridView ? 'grid' : 'presentation';
    viewToggleBtn.setAttribute('aria-label', label);
    viewToggleBtn.setAttribute('title', label);
  };

  const setViewMode = (grid) => {
    if (isGridView === grid) return;
    isGridView = grid;
    updateViewToggleUI();
    if (isGridView) {
      clearInterval(window._autoScrollInterval);
    }
    renderCards({ resetLimit: true });
  };

  viewToggleBtn?.addEventListener('click', () => {
    setViewMode(!isGridView);
  });

  updateViewToggleUI();

  // =====================
  // Render
  // =====================
  function renderCards(options = {}) {
    if (!cardList) return;
    const { resetLimit = false } = options;

    if (!isGridView) {
      if (resetLimit || !renderLimit) {
        renderLimit = getBatchSize();
      } else {
        const minBatch = getBatchSize();
        if (renderLimit < minBatch) renderLimit = minBatch;
      }
    }

    const shouldResetScroll = resetLimit || isGridView;
    const previousScrollLeft = shouldResetScroll ? 0 : cardList.scrollLeft;

    cardList.classList.toggle('grid-view', isGridView);
    cardList.innerHTML = "";
    if (loadMoreBtn) {
      loadMoreBtn.hidden = true;
      loadMoreBtn.disabled = false;
    }

    if (isCardsLoading) {
      cardList.innerHTML = "<div style='color:#aa3366;font-size:1.1em;margin:2rem auto;'>Loading cards...</div>";
      return;
    }

    if (cardsLoadError) {
      cardList.innerHTML = `<div style='color:#aa3366;font-size:1.1em;margin:2rem auto;'>${cardsLoadError}</div>`;
      return;
    }

    const searchVal = (searchInput?.value || '').toLowerCase();
    const filtered = [];

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

    const renderCount = isGridView ? filtered.length : Math.min(renderLimit, filtered.length);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < renderCount; i += 1) {
      const { card, idx } = filtered[i];
      const cardBox = document.createElement('div');
      cardBox.className = 'card-box';

      const art = document.createElement('div');
      art.className = 'card-art';

      const img = document.createElement('img');
      img.src = card.img;
      img.alt = card.name || 'Card image';
      img.loading = 'lazy';

      art.appendChild(img);
      cardBox.appendChild(art);
      cardBox.addEventListener('click', () => showModal(idx));
      fragment.appendChild(cardBox);
    }

    cardList.appendChild(fragment);
    cardList.scrollLeft = shouldResetScroll ? 0 : previousScrollLeft;

    if (loadMoreBtn) {
      if (isGridView) {
        loadMoreBtn.hidden = true;
      } else {
        const remaining = filtered.length - renderCount;
        if (remaining > 0) {
          loadMoreBtn.hidden = false;
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = `Load more cards (${remaining})`;
        } else {
          loadMoreBtn.hidden = true;
        }
      }
    }

    if (!isGridView && renderCount > 0) {
      setTimeout(() => startAutoScroll(), 250);
    } else if (isGridView) {
      clearInterval(window._autoScrollInterval);
    }
  }

  searchInput?.addEventListener('input', () => renderCards({ resetLimit: true }));
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.getAttribute('data-type');
      renderCards({ resetLimit: true });
    };
  });

  loadMoreBtn?.addEventListener('click', () => {
    if (isGridView) return;
    loadMoreBtn.disabled = true;
    renderLimit += getBatchSize();
    renderCards();
  });

  const mobileMedia = window.matchMedia ? window.matchMedia('(max-width: 600px)') : null;
  mobileMedia?.addEventListener?.('change', () => renderCards({ resetLimit: true }));

  renderCards();

  async function loadCards() {
    try {
      const response = await fetch('data/cards.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Cards JSON is malformed');
      cards = data;
      cardsLoadError = null;
    } catch (error) {
      console.error('Failed to load cards JSON:', error);
      cardsLoadError = 'Failed to load cards. Please try again later.';
    } finally {
      isCardsLoading = false;
      renderCards({ resetLimit: true });
      if (!cardsLoadError) openCardFromQuery();
    }
  }

  function openCardFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('card');
    if (!slug) return;

    const idx = cards.findIndex(card => card.slug === slug);
    if (idx < 0) return;

    if (searchInput) searchInput.value = cards[idx].slug;

    currentType = 'All';
    filterBtns.forEach(btn => {
      const type = btn.getAttribute('data-type');
      if (!type) return;
      btn.classList.toggle('active', type === 'All');
    });

    renderCards({ resetLimit: true });
    setTimeout(() => {
      window.showModal?.(idx);
    }, 150);
  }

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
      if (!window.speechSynthesis) {
        btn.setAttribute('disabled', 'true');
        btn.title = 'Text-to-speech is unavailable on this device/browser';
      } else {
        let pressTimer = null;
        const ensureVoicesReady = () => {
          if (!_voices.length) loadVoices();
        };
        const speakWord = () => pronounceText(card.name, ttsOpts);
        const speakWordPlusExample = () => {
          const full = card.example ? `${card.name}. ${card.example}` : card.name;
          pronounceText(full, ttsOpts);
        };
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          ensureVoicesReady();
          speakWord();
        });
        const startPress = () => {
          ensureVoicesReady();
          pressTimer = setTimeout(speakWordPlusExample, 450);
        };
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
      elDesc.innerHTML = card.detail || card.desc || '';
      let extraHtml = `<b>Type:</b> ${card.type}`;
      if (card.desc) extraHtml += `<br><b>Description:</b> ${card.desc}`;
      if (card.hint) extraHtml += `<br><b>Hint:</b> ${card.hint}`;
      elExtra.innerHTML = extraHtml;

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

  loadCards();
});
