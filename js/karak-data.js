/* Karak Station database adapter. Supabase is the source of truth. */
(function () {
  const ready = () => new Promise((resolve, reject) => {
    if (window.karakSupabase) return resolve(window.karakSupabase);
    const timer = setTimeout(() => reject(new Error('Supabase client is not configured.')), 10000);
    window.addEventListener('karak-supabase-ready', () => { clearTimeout(timer); resolve(window.karakSupabase); }, { once: true });
  });
  const fail = (error) => { console.error('Karak Station database error:', error); throw error; };

  async function client() { return ready(); }

  async function persistImage(image, folder) {
    if (typeof image !== 'string' || !image.startsWith('data:')) return image || '';
    const response = await fetch(image);
    if (!response.ok) throw new Error('Could not read the selected image.');
    const blob = await response.blob();
    const extension = blob.type.split('/')[1] || 'image';
    const file = new File([blob], `image.${extension}`, { type: blob.type });
    return window.KarakDB.uploadImage(file, folder);
  }

  async function getLegacyMenu(s) {
    const { data, error } = await s.from('app_store')
      .select('key,value')
      .in('key', ['adminMenu', 'adminCategories', 'adminFoods']);
    if (error) fail(error);
    const values = new Map((data || []).map(row => [row.key, row.value]));
    const storedMenu = values.get('adminMenu');
    const menu = typeof storedMenu === 'string' ? JSON.parse(storedMenu) : storedMenu;
    const storedCategories = values.get('adminCategories');
    const storedFoods = values.get('adminFoods');
    const legacyCategories = typeof storedCategories === 'string' ? JSON.parse(storedCategories) : storedCategories;
    const legacyFoods = typeof storedFoods === 'string' ? JSON.parse(storedFoods) : storedFoods;
    const categories = Array.isArray(menu?.categories) ? menu.categories : Array.isArray(legacyCategories) ? legacyCategories : [];
    const foods = Array.isArray(menu?.foods) ? menu.foods : Array.isArray(legacyFoods) ? legacyFoods : [];
    return categories.length || foods.length ? { categories, foods } : null;
  }

  window.KarakDB = {
    async getMenu() {
      const s = await client();
      const [c, f] = await Promise.all([
        s.from('categories').select('*').order('sort_order').order('name'),
        s.from('foods').select('*').order('sort_order').order('name')
      ]);
      if (c.error) fail(c.error); if (f.error) fail(f.error);
      let categories = (c.data || []).map(x => x.name).filter(name => typeof name === 'string' && name.trim());
      const foods = (f.data || []).map(x => ({ id:x.legacy_id || x.id, name:x.name, arabicName:x.arabic_name, arabicConfirmed:x.arabic_confirmed, amount:x.amount, image:x.image_url || x.image, imageData:x.image_url || '', category:x.category, description:x.description, desc:x.description, status:x.status }));
      if (!categories.length && !foods.length) {
        const { data: sessionData, error: sessionError } = await s.auth.getSession();
        if (sessionError) fail(sessionError);
        if (sessionData.session) {
          const { data: admin, error: adminError } = await s.rpc('is_admin');
          if (adminError) fail(adminError);
          if (admin) {
            const legacyMenu = await getLegacyMenu(s);
            if (legacyMenu) return { ...legacyMenu, legacy: true };
          }
        }
        return { categories, foods };
      }
      if (!categories.length) {
        const foodCategories = foods
          .map(food => String(food.category || '').trim())
          .filter(Boolean);
        const { data: sessionData, error: sessionError } = await s.auth.getSession();
        if (sessionError) fail(sessionError);
        if (sessionData.session) {
          const { data: admin, error: adminError } = await s.rpc('is_admin');
          if (adminError) fail(adminError);
          if (admin) {
            const legacyMenu = await getLegacyMenu(s);
            const legacyCategories = legacyMenu ? legacyMenu.categories : [];
            categories = [...new Set([...legacyCategories, ...foodCategories])];
            if (categories.length) {
              const { error } = await s.from('categories').insert(
                categories.map((name, sort_order) => ({ name, sort_order }))
              );
              if (error) fail(error);
            }
          } else {
            categories = [...new Set(foodCategories)];
          }
        } else {
          categories = [...new Set(foodCategories)];
        }
      }
      return {
        categories,
        foods
      };
    },
    async saveMenu(categories, foods) {
      const s = await client();
      const storedFoods = await Promise.all(foods.map(async f => {
        const image = await persistImage(f.imageData || f.image, 'menu');
        return { ...f, image };
      }));
      const { error: de } = await s.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (de) fail(de);
      const { error: df } = await s.from('foods').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (df) fail(df);
      if (categories.length) {
        const { error } = await s.from('categories').insert(categories.map((name,i)=>({name,sort_order:i})));
        if (error) fail(error);
      }
      if (storedFoods.length) {
        const { error } = await s.from('foods').insert(storedFoods.map((f,i)=>({legacy_id:String(f.id || ''),name:f.name||'',arabic_name:f.arabicName||'',arabic_confirmed:!!f.arabicConfirmed,amount:f.amount||'',image:f.image||'',image_url:f.image||'',category:f.category||'',description:f.description||f.desc||'',status:f.status||'available',sort_order:i})));
        if (error) fail(error);
      }
    },
    async getSpecialFoods() {
      const s = await client(); const {data,error}=await s.from('special_foods').select('*').order('sort_order').order('name'); if(error) fail(error);
      return (data||[]).map(x=>({id:x.legacy_id||x.id,name:x.name,arabicName:x.arabic_name,desc:x.description,description:x.description,amount:x.price,price:x.price,image:x.image,imageData:x.image_url||'',status:x.status}));
    },
    async saveSpecialFoods(items) {
      const s=await client();
      const storedItems=await Promise.all(items.map(async f=>({
        ...f,
        image:await persistImage(f.imageData||f.image,'special')
      })));
      const {error:de}=await s.from('special_foods').delete().neq('id','00000000-0000-0000-0000-000000000000');
      if(de)fail(de);
      if(storedItems.length){
        const {error}=await s.from('special_foods').insert(storedItems.map((f,i)=>({
          legacy_id:String(f.id||''),
          name:f.name||'',
          arabic_name:f.arabicName||'',
          description:f.description||f.desc||'',
          price:f.amount||f.price||'',
          image:f.image||'',
          image_url:f.image||'',
          status:f.status||'available',
          sort_order:i
        })));
        if(error)fail(error);
      }
    },
    async getBlog() {
      const s=await client(); const [c,p]=await Promise.all([s.from('blog_categories').select('*').order('sort_order').order('name'),s.from('blog_posts').select('*').order('post_date',{ascending:false}).order('created_at',{ascending:false})]); if(c.error)fail(c.error);if(p.error)fail(p.error);
      const engagement = await s.rpc('get_public_blog_engagement');
      if (engagement.error) fail(engagement.error);
      const engagementByPost = new Map((engagement.data || []).map(item => [item.post_legacy_id, item]));
      return {categories:(c.data||[]).map(x=>x.name),posts:(p.data||[]).map(x=>{
        const item = engagementByPost.get(x.legacy_id);
        const commentList = [...(Array.isArray(x.comment_list) ? x.comment_list : []), ...(item?.comment_list || [])];
        return {id:x.legacy_id||x.id,title:x.title,date:x.post_date,category:x.category,image:x.image,imageUrl:x.image_url,likes:Number(x.likes||0)+Number(item?.likes||0),comments:Number(x.comments||0)+(item?.comment_list||[]).length,commentList,link:x.link,excerpt:x.excerpt,content:x.content};
      })};
    },
    async likeBlogPost(postId, visitorId) {
      const s=await client();
      const {data,error}=await s.rpc('like_blog_post',{p_post_legacy_id:String(postId),p_visitor_id:visitorId});
      if(error)fail(error);
      return Number(data)||0;
    },
    async addBlogComment(postId, name, text) {
      const s=await client();
      const {data,error}=await s.from('blog_comments').insert({
        post_legacy_id:String(postId),
        commenter_name:String(name).trim(),
        comment_text:String(text).trim(),
        status:'published'
      }).select('id,commenter_name,comment_text,created_at').single();
      if(error)fail(error);
      return {id:data.id,name:data.commenter_name,text:data.comment_text,date:data.created_at};
    },
    async saveBlog(categories,posts){
      const s=await client();
      const storedPosts=await Promise.all(posts.map(async p=>({
        ...p,
        image:await persistImage(p.image,'blog')
      })));
      let r=await s.from('blog_categories').delete().neq('id','00000000-0000-0000-0000-000000000000');
      if(r.error)fail(r.error);
      r=await s.from('blog_posts').delete().neq('id','00000000-0000-0000-0000-000000000000');
      if(r.error)fail(r.error);
      if(categories.length){
        r=await s.from('blog_categories').insert(categories.map((name,i)=>({name,sort_order:i})));
        if(r.error)fail(r.error);
      }
      if(storedPosts.length){
        r=await s.from('blog_posts').insert(storedPosts.map((p,i)=>({
          legacy_id:String(p.id||''),
          title:p.title||'',
          post_date:p.date||null,
          category:p.category||'',
          image:p.image||'',
          image_url:p.image||'',
          likes:Number(p.likes||0),
          comments:Number(p.comments||0),
          comment_list:Array.isArray(p.commentList)?p.commentList:[],
          link:p.link||'',
          excerpt:p.excerpt||'',
          content:p.content||'',
          created_at:new Date(Date.now()+i).toISOString()
        })));
        if(r.error)fail(r.error);
      }
    },
    async getSetting(key, fallback={}){const s=await client();const {data,error}=await s.from('site_settings').select('value').eq('key',key).maybeSingle();if(error)fail(error);return data ? data.value : fallback;},
    async saveSetting(key,value){
      const s=await client();
      const updatedAt=new Date().toISOString();
      const rows=[{key,value,updated_at:updatedAt}];
      if(key==='payment_details') rows.push({key:'payment_currency',value:{currencyCountry:value.currencyCountry||'QA'},updated_at:updatedAt});
      const {error}=await s.from('site_settings').upsert(rows);
      if(error)fail(error);
    },
    async getLegacySetting(key,fallback=null){const s=await client();const {data,error}=await s.from('app_store').select('value').eq('key',key).maybeSingle();if(error)fail(error);return data ? data.value : fallback;},
    async createOrder(order){const s=await client();const {error}=await s.from('orders').insert({legacy_id:order.id?String(order.id):null,customer_name:order.customerName||order.customer||'',customer_country_code:order.customerCountryCode||'+974',customer_phone_number:order.customerPhoneNumber||order.customerPhone||'',order_type:order.orderType||'whatsapp',items:order.items||order.foods||[],total:order.total||'',message:order.message||order.orderDetails||'',status:order.status||'pending',source:order.source||'website',special_poster:!!order.specialPoster,device:order.device||'',delivered_at:order.deliveredAt||null});if(error)fail(error);},
    async getOrders(){const s=await client();const {data,error}=await s.from('orders').select('*').order('created_at',{ascending:false});if(error)fail(error);return data||[];},
    async getOrderCounts(){
      const s=await client();
      const [whatsapp,specialPoster]=await Promise.all([
        s.from('orders').select('id',{count:'exact',head:true}).eq('order_type','whatsapp'),
        s.from('orders').select('id',{count:'exact',head:true}).or('special_poster.eq.true,source.eq.special-poster')
      ]);
      if(whatsapp.error)fail(whatsapp.error);
      if(specialPoster.error)fail(specialPoster.error);
      return {whatsapp:whatsapp.count||0,specialPoster:specialPoster.count||0};
    },
    async updateOrder(id, patch){const s=await client();const {error}=await s.from('orders').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);if(error)fail(error);},
    async deleteOrder(id){const s=await client();const {error}=await s.from('orders').delete().eq('id',id);if(error)fail(error);},
    async uploadImage(file, folder='uploads'){const s=await client();const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safe}`;const {error}=await s.storage.from('karak-images').upload(path,file,{upsert:false});if(error)fail(error);return s.storage.from('karak-images').getPublicUrl(path).data.publicUrl;},
    async session(){const s=await client();return (await s.auth.getSession()).data.session;},
    async signIn(email,password){const s=await client();const {data,error}=await s.auth.signInWithPassword({email,password});if(error)fail(error);return data;},
    async signOut(){const s=await client();const {error}=await s.auth.signOut();if(error)fail(error);},
    async adminProfile(){const s=await client();const session=await this.session();if(!session)return null;const {data,error}=await s.from('admin_profiles').select('*').eq('id',session.user.id).maybeSingle();if(error)fail(error);return data;}
  };
})();
