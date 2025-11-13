AOS.init({ duration: 900, once: true, offset: 80 });

function starfield(canvasId, density=0.00012, speed=0.02, size=2){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const init = () => {
    stars = [];
    const count = Math.floor(canvas.width * canvas.height * density);
    for(let i=0;i<count;i++){
      stars.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        z: Math.random()*1,
        r: Math.random()*size + .2,
        o: Math.random()*.8 + .2
      });
    }
  };
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    init();
  };
  const tick = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const star of stars){
      star.x += speed*(star.z + .2);
      if(star.x > canvas.width + 10){
        star.x = -10;
        star.y = Math.random()*canvas.height;
      }
      ctx.globalAlpha = star.o;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  };
  addEventListener('resize', resize);
  resize();
  tick();
}
starfield('stars', 0.00010, 0.05, 1.3);
starfield('stars2',0.00006, 0.025,1.8);
starfield('stars3',0.00003, 0.010,2.2);

(function setupNav(){
  const navLinks = document.querySelector('.nav-links');
  const hamburger = document.querySelector('.hamburger');
  if(!hamburger || !navLinks) return;
  const setNavOpen = open => {
    navLinks.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  };
  hamburger.addEventListener('click', () => setNavOpen(!navLinks.classList.contains('open')));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNavOpen(false)));
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape'){
      setNavOpen(false);
    }
  });
})();

(function setupFeedbackPage(){
  const form = document.getElementById('feedbackForm');
  const alertBox = document.getElementById('feedbackAlert');
  if(!form){
    return;
  }
  const ratingStars = form.querySelector('.rating-stars');
  const ratingButtons = ratingStars ? Array.from(ratingStars.querySelectorAll('button[data-value]')) : [];
  const ratingInput = document.getElementById('ratingValue');
  if(!ratingInput){
    console.warn('Rating input is missing; feedback form is disabled.');
    return;
  }
  const ratingHint = document.getElementById('ratingHint');
  const honeypotField = form.querySelector('[data-honeypot]');
  const submitButton = form.querySelector('.order-submit');
  const listEl = document.getElementById('feedbackList');
  const summaryScore = document.getElementById('feedbackScore');
  const summaryStars = document.getElementById('feedbackSummaryStars');
  const summaryCaption = document.getElementById('feedbackSummaryCaption');
  const summaryCount = document.getElementById('feedbackCount');
  const positiveShare = document.getElementById('positiveShare');
  const heroValue = document.getElementById('heroRatingValue');
  const heroStars = document.getElementById('heroStars');
  const heroCount = document.getElementById('heroRatingCount');
  const fullNameField = form.querySelector('[name="fullName"]');
  const defaultTitle = document.title;
  const lastSubmitKey = 'catchyFeedbackLastSubmit';
  const rateLimitMs = 20000;
  const maxVisible = 20;
  let feedbackItems = [];

  const setDocumentTitle = value => {
    const trimmed = (value || '').trim();
    document.title = trimmed ? `Catchy - Feedback from ${trimmed}` : defaultTitle;
  };
  if(fullNameField){
    fullNameField.addEventListener('input', event => setDocumentTitle(event.target.value));
  }

  const showAlert = (message, type='success') => {
    if(!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.toggle('error', type !== 'success');
    alertBox.classList.add('show');
    clearTimeout(showAlert._timer);
    showAlert._timer = setTimeout(() => alertBox.classList.remove('show'), 5000);
  };

  const setSubmitting = isSubmitting => {
    if(!submitButton) return;
    if(isSubmitting){
      if(!submitButton.dataset.originalText){
        submitButton.dataset.originalText = submitButton.textContent.trim();
      }
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;
    }else{
      submitButton.textContent = submitButton.dataset.originalText || submitButton.textContent;
      submitButton.disabled = false;
    }
  };

  const readLastSubmit = () => {
    try{
      return Number(localStorage.getItem(lastSubmitKey) || 0);
    }catch(err){
      console.warn('Unable to read rate-limit marker', err);
      return 0;
    }
  };

  const writeLastSubmit = value => {
    try{
      localStorage.setItem(lastSubmitKey, String(value));
    }catch(err){
      console.warn('Unable to write rate-limit marker', err);
    }
  };

  const setRatingSelection = value => {
    const safeValue = Math.max(1, Math.min(5, Number(value) || 0));
    ratingInput.value = safeValue ? String(safeValue) : '';
    ratingButtons.forEach(btn => {
      const btnValue = Number(btn.dataset.value);
      const isActive = safeValue && btnValue <= safeValue;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', String(btnValue === safeValue));
    });
    if(ratingHint){
      ratingHint.textContent = safeValue
        ? `You selected ${safeValue} star${safeValue > 1 ? 's' : ''}`
        : 'Pick the number of stars';
    }
  };

  const setRatingPreview = value => {
    const previewValue = Number(value) || 0;
    ratingButtons.forEach(btn => {
      const btnValue = Number(btn.dataset.value);
      btn.classList.toggle('preview', previewValue && btnValue <= previewValue);
    });
  };

  const focusButton = value => {
    const target = ratingButtons.find(btn => Number(btn.dataset.value) === value);
    if(target){
      target.focus();
    }
  };

  ratingButtons.forEach(btn => {
    const buttonValue = Number(btn.dataset.value);
    btn.addEventListener('click', () => setRatingSelection(buttonValue));
    btn.addEventListener('mouseenter', () => setRatingPreview(buttonValue));
    btn.addEventListener('mouseleave', () => setRatingPreview(0));
    btn.addEventListener('keydown', event => {
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
        return;
      }
      event.preventDefault();
      const current = Number(ratingInput.value) || 1;
      let nextValue = current;
      if(event.key === 'ArrowLeft' || event.key === 'ArrowDown'){
        nextValue = Math.max(1, current - 1);
      }else if(event.key === 'ArrowRight' || event.key === 'ArrowUp'){
        nextValue = Math.min(5, current + 1);
      }else if(event.key === 'Home'){
        nextValue = 1;
      }else if(event.key === 'End'){
        nextValue = 5;
      }
      setRatingSelection(nextValue);
      focusButton(nextValue);
    });
  });

  setRatingSelection(Number(ratingInput.value) || 5);

  const createInitials = name => {
    const parts = (name || '').split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase() || '');
    return initials.join('') || 'C';
  };

  const formatDate = value => {
    if(!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' });
  };

  const createStarsMarkup = rating => {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
    const rounded = Math.round(safeRating);
    const stars = [];
    for(let index=1; index<=5; index++){
      stars.push(`<span class="star${index <= rounded ? ' filled' : ''}">★</span>`);
    }
    return stars.join('');
  };

  const renderStars = (element, rating) => {
    if(!element) return;
    element.innerHTML = createStarsMarkup(rating);
  };

  const renderFallback = message => {
    if(!listEl) return;
    listEl.innerHTML = '';
    const paragraph = document.createElement('p');
    paragraph.className = 'feedback-empty';
    paragraph.textContent = message;
    listEl.appendChild(paragraph);
  };

  const createFeedbackCard = item => {
    const card = document.createElement('article');
    card.className = 'feedback-card';
    const header = document.createElement('header');
    const avatar = document.createElement('div');
    avatar.className = 'feedback-avatar';
    avatar.textContent = createInitials(item.name);
    const meta = document.createElement('div');
    meta.className = 'feedback-meta';
    const nameEl = document.createElement('p');
    nameEl.className = 'feedback-name';
    nameEl.textContent = item.name;
    const dateEl = document.createElement('p');
    dateEl.className = 'feedback-date';
    const dateText = formatDate(item.createdAt);
    dateEl.textContent = dateText ? `${dateText} • ${item.rating} star${item.rating > 1 ? 's' : ''}` : `${item.rating} star${item.rating > 1 ? 's' : ''}`;
    const stars = document.createElement('div');
    stars.className = 'feedback-card-stars';
    stars.innerHTML = createStarsMarkup(item.rating);
    stars.setAttribute('aria-label', `${item.rating} out of 5 stars`);
    const message = document.createElement('p');
    message.className = 'feedback-message';
    message.textContent = item.message || 'This Catchy player did not leave a note.';
    meta.appendChild(nameEl);
    meta.appendChild(dateEl);
    header.appendChild(avatar);
    header.appendChild(meta);
    header.appendChild(stars);
    card.appendChild(header);
    card.appendChild(message);
    return card;
  };

  const renderFeedbackList = items => {
    if(!listEl) return;
    if(!items.length){
      renderFallback('Be the first to share your experience!');
      return;
    }
    const sorted = [...items].sort((a,b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });
    const fragment = document.createDocumentFragment();
    sorted.forEach(item => fragment.appendChild(createFeedbackCard(item)));
    listEl.innerHTML = '';
    listEl.appendChild(fragment);
  };

  const updateSummary = items => {
    const total = items.length;
    if(!total){
      if(summaryScore) summaryScore.textContent = '5.0';
      if(heroValue) heroValue.textContent = '5.0 ★';
      if(summaryCaption) summaryCaption.textContent = 'No reviews yet. Be the first to share!';
      if(summaryCount) summaryCount.textContent = '0';
      if(positiveShare) positiveShare.textContent = '0%';
      if(heroCount) heroCount.textContent = '0 reviews submitted';
      renderStars(summaryStars, 5);
      renderStars(heroStars, 5);
      return;
    }
    const sum = items.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
    const avg = sum / total;
    const rounded = Math.round(avg * 10) / 10;
    if(summaryScore) summaryScore.textContent = rounded.toFixed(1);
    if(heroValue) heroValue.textContent = `${rounded.toFixed(1)} ★`;
    if(summaryCaption) summaryCaption.textContent = `Based on the latest ${total} feedback entries.`;
    if(summaryCount) summaryCount.textContent = String(total);
    const positive = items.filter(item => Number(item.rating) >= 4).length;
    if(positiveShare){
      const share = Math.round((positive / total) * 100);
      positiveShare.textContent = `${Number.isFinite(share) ? share : 0}%`;
    }
    if(heroCount) heroCount.textContent = `${total} reviews submitted`;
    renderStars(summaryStars, avg);
    renderStars(heroStars, avg);
    if(summaryStars){
      summaryStars.setAttribute('aria-label', `Average rating ${rounded.toFixed(1)} out of 5 stars`);
    }
    if(heroStars){
      heroStars.setAttribute('aria-label', `Average rating ${rounded.toFixed(1)} out of 5 stars`);
    }
  };

  const firebaseApp = (() => {
    if(typeof firebase === 'undefined'){
      console.warn('Firebase SDK is not loaded.');
      return null;
    }
    const config = window.CATCHY_FIREBASE_CONFIG;
    if(!config || typeof config !== 'object'){
      console.warn('Firebase config is missing.');
      return null;
    }
    const hasPlaceholder = Object.values(config).some(value => typeof value === 'string' && value.includes('YOUR_'));
    if(hasPlaceholder){
      console.warn('Firebase config still contains placeholder values.');
      return null;
    }
    try{
      return firebase.apps?.length ? firebase.app() : firebase.initializeApp(config);
    }catch(err){
      console.error('Failed to initialise Firebase', err);
      return null;
    }
  })();

  const firestore = firebaseApp ? firebaseApp.firestore() : null;
  const feedbackCollection = firestore ? firestore.collection('feedback') : null;

  const normaliseDoc = doc => {
    const data = typeof doc?.data === 'function' ? doc.data() : {};
    const createdAtValue = data.createdAt && typeof data.createdAt.toDate === 'function'
      ? data.createdAt.toDate()
      : data.clientTimestamp
        ? new Date(data.clientTimestamp)
        : data.createdAt
          ? new Date(data.createdAt)
          : null;
    return {
      id: doc?.id || data.id || String(Date.now()),
      name: (data.name || data.fullName || '').toString().trim() || 'Catchy player',
      message: (data.message || data.feedback || '').toString().trim(),
      rating: Number(data.rating) || 5,
      createdAt: createdAtValue && !Number.isNaN(createdAtValue.getTime()) ? createdAtValue : null
    };
  };

  const applySnapshot = docs => {
    const items = docs
      .map(normaliseDoc)
      .filter(item => item.message || item.rating)
      .slice(0, maxVisible);
    feedbackItems = items;
    renderFeedbackList(items);
    updateSummary(items);
  };

  const loadFeedbackOnce = async () => {
    if(!feedbackCollection) return;
    try{
      const snapshot = await feedbackCollection.orderBy('createdAt', 'desc').limit(maxVisible).get();
      applySnapshot(snapshot.docs);
    }catch(err){
      console.error('Unable to load feedback list', err);
      renderFallback('Unable to load feedback right now. Please try again shortly.');
    }
  };

  if(feedbackCollection?.orderBy){
    try{
      feedbackCollection
        .orderBy('createdAt', 'desc')
        .limit(maxVisible)
        .onSnapshot(snapshot => applySnapshot(snapshot.docs), err => {
          console.error('Realtime feedback listener failed', err);
          loadFeedbackOnce();
        });
    }catch(err){
      console.error('Unable to start feedback listener', err);
      loadFeedbackOnce();
    }
  }else{
    renderFallback('Feedback form is not connected yet. Please contact the Catchy admin.');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(form);
    const fullName = (formData.get('fullName') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const message = (formData.get('message') || '').toString().trim();
    const rating = Number(formData.get('rating') || ratingInput.value || 0);

    if(honeypotField && honeypotField.value.trim()){
      showAlert('Unable to submit feedback right now.', 'error');
      return;
    }

    if(!fullName || !message || !Number.isFinite(rating) || rating < 1){
      showAlert('Please add your name, message, and star rating.', 'error');
      return;
    }

    const now = Date.now();
    if(now - readLastSubmit() < rateLimitMs){
      showAlert('You just sent feedback. Please wait a moment before trying again.', 'error');
      return;
    }

    if(!feedbackCollection){
      showAlert('Feedback form is not connected to Firebase yet. Please contact the site admin.', 'error');
      return;
    }

    setSubmitting(true);
    try{
      writeLastSubmit(now);
      await feedbackCollection.add({
        name: fullName,
        email: email || null,
        message,
        rating,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        clientTimestamp: new Date().toISOString()
      });
      showAlert('Thank you! Your feedback has been received.');
      form.reset();
      setDocumentTitle('');
      setRatingSelection(5);
    }catch(err){
      console.error('Unable to send feedback', err);
      writeLastSubmit(now - rateLimitMs);
      const messageText = err?.code === 'firebase-unavailable'
        ? 'Feedback form is not enabled yet. Please let the admin know.'
        : 'We could not submit your feedback. Please try again shortly.';
      showAlert(messageText, 'error');
    }finally{
      setSubmitting(false);
    }
  });

  renderFeedbackList([]);
  updateSummary([]);
})();
