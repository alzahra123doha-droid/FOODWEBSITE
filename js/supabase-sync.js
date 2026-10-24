/*
 * Sync only legacy admin cache keys to app_store while an authorized admin is
 * signed in. Business records are persisted through KarakDB's typed tables.
 */
(function () {
  const LEGACY_KEYS = new Set([
    'adminMenu',
    'adminCategories',
    'adminFoods',
    'blogCategories',
    'blogPosts',
    'specialPosterFoods',
    'karakWhatsAppOrderSettings',
    'karakWhatsAppBookingSettings',
    'whatsappPendingUpdates'
  ]);
  const originalSet = Storage.prototype.setItem;
  const originalRemove = Storage.prototype.removeItem;
  let adminAccess = false;
  let checkedAccess = false;

  async function hasAdminAccess() {
    if (checkedAccess) return adminAccess;
    if (!window.karakSupabase) return false;
    checkedAccess = true;
    try {
      const { data: sessionData, error: sessionError } = await window.karakSupabase.auth.getSession();
      if (sessionError) throw sessionError;
      const userId = sessionData.session && sessionData.session.user && sessionData.session.user.id;
      if (!userId) return false;
      const { data, error } = await window.karakSupabase
        .from('admin_profiles')
        .select('id,active')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      adminAccess = Boolean(data && data.active);
    } catch (error) {
      console.error('Could not verify Supabase admin access for legacy cache sync:', error);
    }
    return adminAccess;
  }

  async function syncLegacyKey(key, value) {
    if (!LEGACY_KEYS.has(key) || !await hasAdminAccess()) return;
    try {
      const { error } = await window.karakSupabase.from('app_store').upsert({
        key,
        value: JSON.parse(value),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (error) {
      console.error('Could not sync legacy admin cache to Supabase:', key, error);
    }
  }

  Storage.prototype.setItem = function (key, value) {
    const result = originalSet.call(this, key, value);
    if (this === window.localStorage && LEGACY_KEYS.has(String(key))) {
      syncLegacyKey(String(key), String(value));
    }
    return result;
  };

  Storage.prototype.removeItem = function (key) {
    const result = originalRemove.call(this, key);
    if (this === window.localStorage && LEGACY_KEYS.has(String(key))) {
      hasAdminAccess().then(allowed => {
        if (!allowed) return;
        window.karakSupabase.from('app_store').delete().eq('key', String(key)).then(({ error }) => {
          if (error) console.error('Could not delete legacy admin cache from Supabase:', key, error);
        });
      });
    }
    return result;
  };

  async function hydrateLegacyCache() {
    let changed = false;
    try {
      if (await hasAdminAccess()) {
        const { data, error } = await window.karakSupabase
          .from('app_store')
          .select('key,value')
          .in('key', Array.from(LEGACY_KEYS));
        if (error) throw error;
        (data || []).forEach(row => {
          if (!LEGACY_KEYS.has(row.key)) return;
          const incoming = JSON.stringify(row.value);
          if (localStorage.getItem(row.key) !== incoming) {
            originalSet.call(localStorage, row.key, incoming);
            changed = true;
          }
        });
      }
    } catch (error) {
      console.error('Could not hydrate legacy admin cache from Supabase:', error);
      window.dispatchEvent(new CustomEvent('karak-data-ready', { detail: { changed: false, error } }));
      return;
    }
    window.dispatchEvent(new CustomEvent('karak-data-ready', { detail: { changed } }));
  }

  function start() {
    window.karakSupabase.auth.onAuthStateChange((_event, session) => {
      checkedAccess = false;
      adminAccess = false;
      if (session) setTimeout(hydrateLegacyCache, 0);
    });
    hydrateLegacyCache();
  }

  if (window.karakSupabase) start();
  else window.addEventListener('karak-supabase-ready', start, { once: true });
})();
