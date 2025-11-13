(function visitTracker(){
  const seedValue = 1200;
  const storageKey = 'catchyVisitLastIncrementAt';
  const throttleMs = 1000 * 60 * 15; // 15 minutes between increments from the same browser

  const scheduleInit = () => {
    if(document.readyState === 'complete' || document.readyState === 'interactive'){
      init();
    }else{
      document.addEventListener('DOMContentLoaded', init, { once: true });
    }
  };

  const init = () => {
    if(typeof firebase === 'undefined'){
      console.warn('Visit tracker: Firebase SDK missing.');
      return;
    }
    const config = window.CATCHY_FIREBASE_CONFIG;
    if(!config || typeof config !== 'object'){
      console.warn('Visit tracker: Firebase config missing.');
      return;
    }
    let app;
    try{
      app = firebase.apps?.length ? firebase.app() : firebase.initializeApp(config);
    }catch(err){
      console.warn('Visit tracker: unable to initialise Firebase app.', err);
      return;
    }
    const firestore = typeof app.firestore === 'function' ? app.firestore() : firebase.firestore?.();
    if(!firestore){
      console.warn('Visit tracker: Firestore is unavailable.');
      return;
    }
    const visitDoc = firestore.collection('analytics').doc('siteVisits');

    const ensureSeeded = async () => {
      try{
        const snapshot = await visitDoc.get();
        if(snapshot.exists){
          const data = snapshot.data() || {};
          if(typeof data.count !== 'number'){
            await visitDoc.set({ count: seedValue }, { merge: true });
          }
        }else{
          await visitDoc.set({
            count: seedValue,
            seededAt: new Date().toISOString()
          }, { merge: true });
        }
      }catch(err){
        console.warn('Visit tracker: unable to seed visit counter.', err);
      }
    };

    const incrementVisit = async () => {
      const now = Date.now();
      const last = Number(localStorage.getItem(storageKey)) || 0;
      if(now - last < throttleMs){
        return;
      }
      localStorage.setItem(storageKey, String(now));
      try{
        await ensureSeeded();
        await visitDoc.set({
          count: firebase.firestore.FieldValue.increment(1),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastClientVisit: new Date().toISOString()
        }, { merge: true });
      }catch(err){
        console.warn('Visit tracker: unable to increment counter.', err);
      }
    };

    incrementVisit();
  };

  scheduleInit();
})();
