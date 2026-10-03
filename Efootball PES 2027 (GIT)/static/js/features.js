// ============================================================
// NOVOS MÓDULOS - CALENDÁRIO, ELENCO, EVOLUÇÃO, TROFÉUS,
// FINANÇAS, TREINADOR, NOTÍCIAS, POPULARIDADE, SELEÇÃO,
// RECORDES E BACKUP
// ============================================================

function ensureFeatureData(career) {
    ensureCareerCurrency(career);
    if (!career.calendar) career.calendar = [];
    if (!career.squad) career.squad = [];
    if (!career.attributes) career.attributes = {
        overall: 0, velocidade: 0, aceleracao: 0, finalizacao: 0,
        passe: 0, drible: 0, forca: 0, resistencia: 0, defesa: 0, cabecio: 0
    };
    if (!career.trophies) career.trophies = [];
    if (!career.finance) career.finance = { budget: 0, salaryBudget: 0, revenue: 0, expenses: 0 };
    // Finanças pessoais são exclusivas do Become a Legend.
    if (!career.playerFinance) career.playerFinance = {
        salary: 0, balance: 0, monthlyExpenses: 0, lifestyle: 'Confortável',
        home: { name: 'Apartamento simples', value: 0 },
        car: { name: 'Sem carro', value: 0 },
        investments: 0, transactions: [], wardrobe: {casual: 0, evento: 0, treino: 0}, cellphone: {model: 'Celular básico', value: 0}, sponsorships: [], bank: {score: 0}, assets: [], personalState: {energy: 100, fame: 0}, personalHall: [], futureFamily: {children: 0, plans: ''}, personalGoals: [], lifeEvents: [], familyFriends: {familySupport: 50, friends: 50}
    };
    if (!career.manager) career.manager = { reputation: 1, confidence: 50, fanSupport: 50 };
    if (!career.news) career.news = [];
    if (typeof career.popularity !== 'number') career.popularity = 0;
    if (!career.nationalTeam) career.nationalTeam = { country: '', games: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, titles: 0 };
    if (!career.records) career.records = { bestSeasonGoals: 0, bestSeasonAssists: 0, mostGamesClub: 0, mostTitles: 0, hatTricks: 0 };
    if (!career.seasons) career.seasons = [];
    if (!career.objectives) career.objectives = [];
    if (!career.youth) career.youth = [];
    if (!career.market) career.market = [];
    if (!career.clubDatabase) career.clubDatabase = [];
    if (!career.rankings) career.rankings = { worldPosition: 0, playerPoints: 0, clubPosition: 0, clubPoints: 0 };
    if (!career.competitions) career.competitions = [];
    if (!career.transfers) career.transfers = career.transfers || [];
    if (!career.awards) career.awards = [];
    if (!career.injuries) career.injuries = [];
    if (!career.discipline) career.discipline = { yellowCards: 0, redCards: 0 };
    if (!career.relations) career.relations = [];
    if (!career.events) career.events = [];
    if (!career.balEventSystem) career.balEventSystem = { lastAutoDate: '', history: [] };
    // Novos sistemas do Become a Legend 1.3
    if (!Array.isArray(career.rivalries)) career.rivalries = [];
    if (!Array.isArray(career.clubReputationsPlayer)) career.clubReputationsPlayer = [];
    if (!career.fanbase) career.fanbase = { support: 50, trust: 50, affection: 50, mood: 'Neutra', notes: '' };
    if (!career.pressConferences) career.pressConferences = { count: 0, history: [], lastDate: '', lastImpact: '' };
    if (!career.agentCareer) career.agentCareer = { name: '', agency: '', trust: 60, activity: 50, status: 'Ativo', lastAction: '', rumors: [] };
    if (!career.careerPhase) career.careerPhase = { phase: '', yearsPro: 0, notes: '' };
    // Dados exclusivos da Master Liga: Comissão Técnica e Reputação do Clube.
    if (!career.staff) career.staff = [];
    if (!career.clubReputation) career.clubReputation = {
        national: 50, international: 20, prestige: 50, fan: 50, media: 50,
        playerAttraction: 50, staffAttraction: 50
    };
    // Master Liga 1.3: gestão dinâmica do clube, torcida, rivalidades e objetivos.
    if (!career.boardManagement) career.boardManagement = { confidence: Number(career.manager?.confidence ?? 50), pressure: 30, mood: 'Estável', lastMeeting: '', demands: [], history: [] };
    if (!career.clubFans) career.clubFans = { satisfaction: Number(career.manager?.fanSupport ?? 50), trust: 50, attendance: 50, pressure: 25, mood: 'Neutra', lastReaction: '', history: [] };
    if (!Array.isArray(career.clubRivalries)) career.clubRivalries = [];
    if (!career.seasonScenario) career.seasonScenario = { position: 0, matchesPlayed: 0, points: 0, expectation: '', lastUpdate: '' };
}


function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function money(value) {
    const n = Number(value || 0);
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function ensurePersonalLifeData(career) {
    if (!career.playerFinance) career.playerFinance = {};
    const pf = career.playerFinance;
    pf.wardrobe ||= {casual: 0, evento: 0, treino: 0};
    if (!pf.wardrobe.owned) pf.wardrobe.owned = [];
    if (!pf.wardrobe.equipped) pf.wardrobe.equipped = {};
    pf.cellphone ||= {model: 'Celular básico', value: 0};
    pf.sponsorships ||= [];
    pf.bank ||= {score: 0};
    pf.assets ||= [];
    if (!Array.isArray(pf.assets)) pf.assets = [];
    pf.personalState ||= {energy: 100, fame: 0};
    pf.personalHall ||= [];
    pf.futureFamily ||= {children: 0, plans: '', marriage: '', home: '', familyGoals: '', careerGoals: '', targetYear: '', notes: ''};
    pf.futureFamily.children ??= 0; pf.futureFamily.plans ??= ''; pf.futureFamily.marriage ??= ''; pf.futureFamily.home ??= ''; pf.futureFamily.familyGoals ??= ''; pf.futureFamily.careerGoals ??= ''; pf.futureFamily.targetYear ??= ''; pf.futureFamily.notes ??= '';
    pf.lifeEvents ||= [];
    if (!Array.isArray(pf.lifeEvents)) pf.lifeEvents = [];
    pf.lifeEvents = pf.lifeEvents.map((e, i) => ({id:e.id||`life_event_${Date.now()}_${i}`, title:e.title||e.text||'Evento da vida', category:e.category||'Pessoal', date:e.date||new Date().toLocaleDateString('pt-BR'), description:e.description||'', impact:Math.max(-100,Math.min(100,Number(e.impact)||0)), important:Boolean(e.important)}));
    pf.personalGoals ||= [];
    if (!Array.isArray(pf.personalGoals)) pf.personalGoals = [];
    pf.lifeEvents ||= [];
    pf.familyFriends ||= {familySupport: 50, friends: 50, parents: 50, siblings: 50, bestFriend: '', friendsList: [], events: []};
    pf.familyFriends.parents ??= 50;
    pf.familyFriends.siblings ??= 50;
    pf.familyFriends.bestFriend ??= '';
    pf.familyFriends.friendsList ||= [];
    pf.familyFriends.events ||= [];
    pf.mediaPopularity ||= {popularity: 0, image: 50, press: 50, fanRecognition: 50, followers: {instagram: 0, youtube: 0, tiktok: 0}, headlines: []};
    return pf;
}


const WARDROBE_CATALOG = [
    {id:'camiseta_preta', name:'Camiseta Preta Premium', category:'Camisetas', price:180, icon:'👕'},
    {id:'camiseta_branca', name:'Camiseta Branca Premium', category:'Camisetas', price:180, icon:'👕'},
    {id:'camisa_social', name:'Camisa Social', category:'Camisas', price:420, icon:'👔'},
    {id:'polo_luxo', name:'Polo Casual', category:'Camisas', price:320, icon:'👕'},
    {id:'jeans_azul', name:'Calça Jeans Azul', category:'Calças', price:350, icon:'👖'},
    {id:'calca_social', name:'Calça Social', category:'Calças', price:480, icon:'👖'},
    {id:'bermuda', name:'Bermuda Casual', category:'Bermudas', price:220, icon:'🩳'},
    {id:'tenis_branco', name:'Tênis Branco', category:'Tênis', price:650, icon:'👟'},
    {id:'tenis_esportivo', name:'Tênis Esportivo', category:'Tênis', price:520, icon:'👟'},
    {id:'tenis_luxo', name:'Tênis Premium', category:'Tênis', price:1100, icon:'👟'},
    {id:'jaqueta', name:'Jaqueta Casual', category:'Casacos', price:780, icon:'🧥'},
    {id:'blazer', name:'Blazer Elegante', category:'Casacos', price:1200, icon:'🧥'},
    {id:'moletom', name:'Moletom', category:'Casacos', price:390, icon:'🧥'},
    {id:'bone', name:'Boné', category:'Acessórios', price:140, icon:'🧢'},
    {id:'oculos', name:'Óculos de Sol', category:'Acessórios', price:600, icon:'🕶️'},
    {id:'relogio', name:'Relógio Premium', category:'Acessórios', price:1500, icon:'⌚'},
    {id:'corrente', name:'Corrente', category:'Acessórios', price:900, icon:'📿'},
    {id:'terno', name:'Terno de Gala', category:'Eventos', price:2200, icon:'🤵'}
];

function ensureWardrobeData(career) {
    const pf = ensurePersonalLifeData(career);
    if (!pf.wardrobe || typeof pf.wardrobe !== 'object') {
        pf.wardrobe = {casual:0, evento:0, treino:0, owned:[], equipped:{}};
    }
    pf.wardrobe.owned ||= [];
    pf.wardrobe.equipped ||= {};
    return pf.wardrobe;
}

function wardrobeMoney(value) {
    return formatCareerMoney(value, {decimals: 2});
}

function openWardrobeModal() {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    ensureWardrobeData(c);
    renderWardrobeModal();
}

function renderWardrobeModal() {
    const c = featureCareer();
    if (!c) return;
    const pf = ensurePersonalLifeData(c);
    const wardrobe = ensureWardrobeData(c);
    const balance = Number(pf.balance || 0);
    const owned = new Set(wardrobe.owned || []);
    const categories = [...new Set(WARDROBE_CATALOG.map(item => item.category))];

    const equippedRows = categories.map(category => {
        const id = wardrobe.equipped?.[category];
        const item = WARDROBE_CATALOG.find(x => x.id === id);
        return `<div class="bg-black/30 border border-white/5 rounded-xl p-3">
            <div class="text-[10px] uppercase tracking-wider text-slate-500">${escapeHtml(category)}</div>
            <div class="mt-1 text-sm font-bold text-white">${item ? `${item.icon} ${escapeHtml(item.name)}` : '<span class="text-slate-500">Nenhuma peça equipada</span>'}</div>
        </div>`;
    }).join('');

    const catalogRows = categories.map(category => {
        const items = WARDROBE_CATALOG.filter(item => item.category === category);
        return `<div>
            <h4 class="text-xs font-black uppercase tracking-wider text-cyan-300 mb-2">${escapeHtml(category)}</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                ${items.map(item => {
                    const isOwned = owned.has(item.id);
                    const isEquipped = wardrobe.equipped?.[category] === item.id;
                    return `<div class="bg-black/30 border ${isEquipped ? 'border-cyan-400/50' : 'border-white/5'} rounded-xl p-3">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <div class="font-bold text-white">${item.icon} ${escapeHtml(item.name)}</div>
                                <div class="text-xs text-slate-400 mt-1">${wardrobeMoney(item.price)}</div>
                            </div>
                            ${isEquipped ? '<span class="text-[10px] font-bold text-cyan-300">EQUIPADO</span>' : ''}
                        </div>
                        <div class="mt-2">
                            ${isOwned
                                ? `<button onclick="equipWardrobeItem('${item.id}')" class="feature-action w-full">${isEquipped ? 'Equipado' : 'Vestir peça'}</button>`
                                : `<button onclick="buyWardrobeItem('${item.id}')" class="feature-action green w-full">Comprar • ${wardrobeMoney(item.price)}</button>`
                            }
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');

    const body = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-black/30 border border-white/5 rounded-xl p-3">
                    <span class="text-[10px] uppercase tracking-wider text-slate-500">Saldo disponível</span>
                    <strong class="block text-lg text-emerald-400 mt-1">${wardrobeMoney(balance)}</strong>
                </div>
                <div class="bg-black/30 border border-white/5 rounded-xl p-3">
                    <span class="text-[10px] uppercase tracking-wider text-slate-500">Peças no armário</span>
                    <strong class="block text-lg text-cyan-400 mt-1">${owned.size}</strong>
                </div>
            </div>

            <div>
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-xs font-black uppercase tracking-wider text-white">Look equipado</h4>
                    <span class="text-[10px] text-slate-500">Troque cada categoria individualmente</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">${equippedRows}</div>
            </div>

            <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-white mb-2">Loja de roupas</h4>
                <div class="space-y-4">${catalogRows}</div>
            </div>
        </div>`;

    showFeatureModal('Guarda-roupa • Roupas e Estilo', body, 'Fechar', 'closeFeatureModal()');
}

function buyWardrobeItem(itemId) {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    const wardrobe = ensureWardrobeData(c);
    const item = WARDROBE_CATALOG.find(x => x.id === itemId);
    if (!item) return;

    if (wardrobe.owned.includes(itemId)) {
        equipWardrobeItem(itemId);
        return;
    }

    const pf = ensurePersonalLifeData(c);
    const balance = Number(pf.balance || 0);
    if (balance < item.price) {
        return alert(`Saldo insuficiente. Você precisa de ${wardrobeMoney(item.price)} e possui ${wardrobeMoney(balance)}.`);
    }

    pf.balance = balance - item.price;
    logPlayerTransaction(c, 'saída', `Compra de roupa: ${item.name}`, item.price);
    wardrobe.owned.push(itemId);
    wardrobe.equipped[item.category] = itemId;

    saveLocalData();
    renderData();
    renderWardrobeModal();
}

function equipWardrobeItem(itemId) {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    const wardrobe = ensureWardrobeData(c);
    const item = WARDROBE_CATALOG.find(x => x.id === itemId);
    if (!item || !wardrobe.owned.includes(itemId)) return;

    wardrobe.equipped[item.category] = itemId;
    saveLocalData();
    renderData();
    renderWardrobeModal();
}


const PERSONAL_ASSET_CATALOG = [
    {id:'apto_moderno', name:'Apartamento Moderno', category:'Moradia', price:650000, icon:'🏢', resale:.82},
    {id:'casa_luxo', name:'Casa de Luxo', category:'Moradia', price:1800000, icon:'🏠', resale:.88},
    {id:'mansao', name:'Mansão', category:'Moradia', price:4500000, icon:'🏡', resale:.90},
    {id:'carro_esportivo', name:'Carro Esportivo', category:'Veículos', price:850000, icon:'🏎️', resale:.72},
    {id:'suv_luxo', name:'SUV de Luxo', category:'Veículos', price:520000, icon:'🚙', resale:.76},
    {id:'supercarro', name:'Supercarro', category:'Veículos', price:2200000, icon:'🏎️', resale:.78},
    {id:'moto_premium', name:'Moto Premium', category:'Veículos', price:180000, icon:'🏍️', resale:.72},
    {id:'relogio_luxo', name:'Relógio de Luxo', category:'Luxo', price:120000, icon:'⌚', resale:.80},
    {id:'joia_diamante', name:'Joia com Diamantes', category:'Luxo', price:250000, icon:'💎', resale:.65},
    {id:'colecao_tenis', name:'Coleção de Tênis Raros', category:'Luxo', price:45000, icon:'👟', resale:.70},
    {id:'notebook_premium', name:'Notebook Premium', category:'Tecnologia', price:18000, icon:'💻', resale:.55},
    {id:'celular_flagship', name:'Celular Flagship', category:'Tecnologia', price:9000, icon:'📱', resale:.55},
    {id:'setup_gamer', name:'Setup Gamer Completo', category:'Tecnologia', price:30000, icon:'🎮', resale:.60},
    {id:'academia', name:'Academia Particular', category:'Negócios', price:750000, icon:'🏋️', resale:.80},
    {id:'restaurante', name:'Restaurante', category:'Negócios', price:1200000, icon:'🍽️', resale:.82},
    {id:'loja_esportiva', name:'Loja Esportiva', category:'Negócios', price:550000, icon:'🏪', resale:.78}
];

function ensureAssetData(career) {
    const pf = ensurePersonalLifeData(career);
    if (!Array.isArray(pf.assets)) pf.assets = [];
    pf.assets = pf.assets.map((a, i) => {
        if (typeof a === 'string') return {id:`custom_${i}`, name:a, category:'Outros', value:0, custom:true};
        return {...a, id:a.id || `legacy_${i}`, category:a.category || 'Outros', value:Number(a.value || a.price || 0)};
    });
    return pf.assets;
}

function assetMoney(value) {
    return formatCareerMoney(value, {decimals: 2});
}

function getPatrimonyTotal(career) {
    const pf = ensurePersonalLifeData(career);
    const assets = ensureAssetData(career);
    const catalogTotal = assets.reduce((sum,a)=>sum+Number(a.value||a.price||0),0);
    const homeValue = Number(pf.home?.value || 0);
    const carValue = Number(pf.car?.value || 0);
    const investments = Number(pf.investments || 0);
    return catalogTotal + homeValue + carValue + investments;
}

function openPatrimonyModal() {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    renderPatrimonyModal();
}

function renderPatrimonyModal() {
    const c = featureCareer();
    if (!c) return;
    const pf = ensurePersonalLifeData(c);
    const assets = ensureAssetData(c);
    const balance = Number(pf.balance || 0);
    const categories = [...new Set(PERSONAL_ASSET_CATALOG.map(x=>x.category))];
    const catalogIds = new Set(assets.map(x=>x.id));

    const total = getPatrimonyTotal(c);
    const listed = assets.reduce((s,a)=>s+Number(a.value||0),0);
    const fixed = Number(pf.home?.value||0) + Number(pf.car?.value||0);
    const inv = Number(pf.investments||0);

    const ownedRows = assets.length ? assets.map((asset,index)=>`
        <div class="bg-black/30 border border-white/5 rounded-xl p-3">
            <div class="flex justify-between gap-3">
                <div>
                    <div class="font-bold text-white">${asset.icon||'📦'} ${escapeHtml(asset.name)}</div>
                    <div class="text-xs text-slate-500 mt-1">${escapeHtml(asset.category||'Outros')}</div>
                </div>
                <strong class="text-emerald-400 text-sm">${assetMoney(asset.value)}</strong>
            </div>
            <div class="flex gap-2 mt-3">
                ${asset.custom ? '' : `<button onclick="sellPatrimonyAsset(${index})" class="feature-action red flex-1">Vender</button>`}
                <button onclick="removePatrimonyAsset(${index})" class="feature-action flex-1">Remover registro</button>
            </div>
        </div>`).join('') : `<div class="text-center text-sm text-slate-500 py-6">Nenhum bem adicional registrado.</div>`;

    const catalogRows = categories.map(cat=>{
        const items=PERSONAL_ASSET_CATALOG.filter(x=>x.category===cat);
        return `<div><h4 class="text-xs font-black uppercase tracking-wider text-cyan-300 mb-2">${escapeHtml(cat)}</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-2">${items.map(item=>{
            const owned=catalogIds.has(item.id);
            return `<div class="bg-black/30 border ${owned?'border-emerald-400/30':'border-white/5'} rounded-xl p-3"><div class="flex justify-between gap-2"><div><div class="font-bold text-white">${item.icon} ${escapeHtml(item.name)}</div><div class="text-xs text-slate-400 mt-1">${assetMoney(item.price)}</div></div>${owned?'<span class="text-[10px] text-emerald-300 font-bold">ADQUIRIDO</span>':''}</div><button ${owned?'disabled':''} onclick="buyPatrimonyAsset('${item.id}')" class="feature-action green w-full mt-3 ${owned?'opacity-50 cursor-not-allowed':''}">${owned?'Já possui':'Comprar • '+assetMoney(item.price)}</button></div>`;
        }).join('')}</div></div>`;
    }).join('');

    const body=`<div class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div class="bg-black/30 border border-white/5 rounded-xl p-3"><span class="text-[10px] text-slate-500 uppercase">Patrimônio total</span><strong class="block text-lg text-amber-300 mt-1">${assetMoney(total)}</strong></div>
            <div class="bg-black/30 border border-white/5 rounded-xl p-3"><span class="text-[10px] text-slate-500 uppercase">Saldo</span><strong class="block text-lg text-cyan-400 mt-1">${assetMoney(balance)}</strong></div>
            <div class="bg-black/30 border border-white/5 rounded-xl p-3"><span class="text-[10px] text-slate-500 uppercase">Bens</span><strong class="block text-lg text-white mt-1">${assets.length}</strong></div>
            <div class="bg-black/30 border border-white/5 rounded-xl p-3"><span class="text-[10px] text-slate-500 uppercase">Investimentos</span><strong class="block text-lg text-emerald-400 mt-1">${assetMoney(inv)}</strong></div>
        </div>
        <div class="bg-black/20 border border-white/5 rounded-xl p-3 text-xs text-slate-400">Moradia + carro registrados no financeiro: <strong class="text-white">${assetMoney(fixed)}</strong> • Bens adicionais: <strong class="text-white">${assetMoney(listed)}</strong></div>
        <div><div class="flex items-center justify-between mb-2"><h4 class="text-xs font-black uppercase tracking-wider text-white">Meus bens</h4><button onclick="openCustomPatrimonyModal()" class="feature-action">+ Bem personalizado</button></div><div class="grid grid-cols-1 md:grid-cols-2 gap-2">${ownedRows}</div></div>
        <div><h4 class="text-xs font-black uppercase tracking-wider text-white mb-2">Mercado de patrimônio</h4><div class="space-y-4">${catalogRows}</div></div>
    </div>`;
    showFeatureModal('Patrimônio • Bens e Conquistas', body, 'Fechar', 'closeFeatureModal()');
}

function buyPatrimonyAsset(id) {
    const c=featureCareer(); if(!c || currentMode!=='rumo_ao_estrelato') return;
    const item=PERSONAL_ASSET_CATALOG.find(x=>x.id===id); if(!item) return;
    const assets=ensureAssetData(c); if(assets.some(x=>x.id===id)) return;
    const pf=ensurePersonalLifeData(c); const balance=Number(pf.balance||0);
    if(balance<item.price) return alert(`Saldo insuficiente. Você precisa de ${assetMoney(item.price)} e possui ${assetMoney(balance)}.`);
    pf.balance=balance-item.price;
    assets.unshift({id:item.id,name:item.name,category:item.category,price:item.price,value:item.price,icon:item.icon,resale:item.resale,custom:false,boughtAt:new Date().toLocaleDateString('pt-BR')});
    logPlayerTransaction(c,'saída',`Compra de patrimônio: ${item.name}`,item.price);
    saveLocalData(); renderData(); renderPatrimonyModal();
}

function sellPatrimonyAsset(index) {
    const c=featureCareer(); if(!c || currentMode!=='rumo_ao_estrelato') return;
    const assets=ensureAssetData(c); const asset=assets[index]; if(!asset || asset.custom) return;
    const pf=ensurePersonalLifeData(c); const resale=Number(asset.resale||.75); const value=Math.round(Number(asset.value||0)*resale);
    pf.balance=Number(pf.balance||0)+value;
    logPlayerTransaction(c,'entrada',`Venda de patrimônio: ${asset.name}`,value);
    assets.splice(index,1); saveLocalData(); renderData(); renderPatrimonyModal();
}

function removePatrimonyAsset(index) {
    const c=featureCareer(); if(!c || currentMode!=='rumo_ao_estrelato') return;
    const assets=ensureAssetData(c); if(!assets[index]) return;
    assets.splice(index,1); saveLocalData(); renderData(); renderPatrimonyModal();
}

function openCustomPatrimonyModal() {
    showFeatureModal('Adicionar bem ao patrimônio', `<div class="space-y-3"><input id="custom-asset-name" placeholder="Ex.: Relógio recebido de presente" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><select id="custom-asset-category" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Outros</option><option>Moradia</option><option>Veículos</option><option>Luxo</option><option>Tecnologia</option><option>Negócios</option></select><input id="custom-asset-value" type="number" min="0" placeholder="Valor estimado (${currencySymbol()})" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`, 'Adicionar', 'saveCustomPatrimonyAsset()');
}

function saveCustomPatrimonyAsset() {
    const c=featureCareer(); if(!c || currentMode!=='rumo_ao_estrelato') return;
    const assets=ensureAssetData(c); const name=document.getElementById('custom-asset-name')?.value.trim();
    if(!name) return;
    assets.unshift({id:'custom_'+Date.now(),name,category:document.getElementById('custom-asset-category')?.value||'Outros',value:Number(document.getElementById('custom-asset-value')?.value)||0,custom:true,icon:'📦'});
    saveLocalData(); closeFeatureModal(); renderData(); openPatrimonyModal();
}


function ensurePersonalGoalsData(career) {
    const pf = ensurePersonalLifeData(career);
    pf.personalGoals ||= [];
    if (!Array.isArray(pf.personalGoals)) pf.personalGoals = [];
    pf.personalGoals = pf.personalGoals.map((g, i) => ({
        id: g.id || `goal_${Date.now()}_${i}`,
        text: g.text || g.title || 'Objetivo pessoal',
        category: g.category || 'Pessoal',
        progress: Math.max(0, Math.min(100, Number(g.progress ?? (g.done ? 100 : 0)) || 0)),
        deadline: g.deadline || '',
        reward: Number(g.reward) || 0,
        notes: g.notes || '',
        done: Boolean(g.done || Number(g.progress) >= 100),
        createdAt: g.createdAt || new Date().toLocaleDateString('pt-BR')
    }));
    return pf.personalGoals;
}

function openPersonalStateModal() {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    const pf = ensurePersonalLifeData(c);
    const energy = Math.max(0, Math.min(100, Number(pf.personalState.energy) || 0));
    const fame = Math.max(0, Math.min(100, Number(pf.personalState.fame) || 0));
    const goals = ensurePersonalGoalsData(c);
    const completed = goals.filter(g => g.done).length;
    const avg = goals.length ? Math.round(goals.reduce((a,g)=>a+g.progress,0)/goals.length) : 0;

    const body = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                    <div class="text-[10px] uppercase tracking-wider text-slate-500">Energia</div>
                    <div class="text-3xl font-black text-emerald-400 mt-1">${energy}%</div>
                    <div class="h-2 bg-slate-800 rounded-full mt-2"><div class="h-2 bg-emerald-400 rounded-full" style="width:${energy}%"></div></div>
                </div>
                <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                    <div class="text-[10px] uppercase tracking-wider text-slate-500">Fama pessoal</div>
                    <div class="text-3xl font-black text-amber-400 mt-1">${fame}%</div>
                    <div class="h-2 bg-slate-800 rounded-full mt-2"><div class="h-2 bg-amber-400 rounded-full" style="width:${fame}%"></div></div>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-black/30 rounded-xl p-3"><strong class="block text-white text-xl">${goals.length}</strong><span class="text-[10px] text-slate-500">Objetivos</span></div>
                <div class="bg-black/30 rounded-xl p-3"><strong class="block text-emerald-400 text-xl">${completed}</strong><span class="text-[10px] text-slate-500">Concluídos</span></div>
                <div class="bg-black/30 rounded-xl p-3"><strong class="block text-cyan-400 text-xl">${avg}%</strong><span class="text-[10px] text-slate-500">Progresso médio</span></div>
            </div>
            <div class="border-t border-white/10 pt-4">
                <h4 class="font-bold text-white mb-3">Estado pessoal</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="text-xs text-slate-400">Energia</label><input id="pl-energy" type="number" min="0" max="100" value="${energy}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
                    <div><label class="text-xs text-slate-400">Fama pessoal</label><input id="pl-fame" type="number" min="0" max="100" value="${fame}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
                </div>
            </div>
        </div>`;
    showFeatureModal('Vida Pessoal • Estado', body, 'Salvar estado', 'savePersonalState()');
}

function savePersonalState() {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    const pf = ensurePersonalLifeData(c);
    pf.personalState = {
        energy: Math.max(0, Math.min(100, Number(document.getElementById('pl-energy')?.value) || 0)),
        fame: Math.max(0, Math.min(100, Number(document.getElementById('pl-fame')?.value) || 0))
    };
    saveLocalData(); closeFeatureModal(); renderData();
}

function openPersonalGoalsModal() {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    const goals = ensurePersonalGoalsData(c);
    const completed = goals.filter(g => g.done).length;
    const categories = ['Carreira','Finanças','Relacionamento','Saúde','Estilo de vida','Pessoal'];
    const rows = goals.length ? goals.map((g, i) => {
        const progress = Math.max(0, Math.min(100, Number(g.progress) || 0));
        const deadline = g.deadline ? escapeHtml(g.deadline) : 'Sem prazo';
        const status = g.done || progress >= 100 ? 'Concluído' : progress > 0 ? 'Em andamento' : 'Não iniciado';
        return `<div class="bg-black/30 border border-white/5 rounded-xl p-4">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                        <strong class="text-white">${escapeHtml(g.text)}</strong>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">${escapeHtml(g.category)}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">Prazo: ${deadline} ${g.reward ? `• Recompensa: ${moneyBR(g.reward)}` : ''}</div>
                </div>
                <span class="text-xs font-bold ${g.done ? 'text-emerald-400' : 'text-cyan-400'}">${status}</span>
            </div>
            <div class="flex justify-between text-xs mt-3"><span class="text-slate-400">Progresso</span><strong class="text-white">${progress}%</strong></div>
            <div class="h-2 bg-slate-800 rounded-full mt-1"><div class="h-2 bg-cyan-400 rounded-full" style="width:${progress}%"></div></div>
            ${g.notes ? `<p class="text-xs text-slate-500 mt-2">${escapeHtml(g.notes)}</p>` : ''}
            <div class="flex flex-wrap gap-2 mt-3">
                <button onclick="editPersonalGoal(${i})" class="feature-action">Editar</button>
                ${!g.done ? `<button onclick="completePersonalGoal(${i})" class="feature-action green">Concluir</button>` : ''}
                <button onclick="deletePersonalGoal(${i})" class="feature-action danger">Excluir</button>
            </div>
        </div>`;
    }).join('') : `<div class="text-center text-sm text-slate-500 border border-dashed border-white/10 rounded-xl p-6">Nenhum objetivo pessoal cadastrado.</div>`;

    showFeatureModal('Vida & Objetivos', `
        <div class="space-y-4">
            <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-black/30 rounded-xl p-3"><strong class="block text-white text-xl">${goals.length}</strong><span class="text-[10px] text-slate-500">Total</span></div>
                <div class="bg-black/30 rounded-xl p-3"><strong class="block text-emerald-400 text-xl">${completed}</strong><span class="text-[10px] text-slate-500">Concluídos</span></div>
                <div class="bg-black/30 rounded-xl p-3"><strong class="block text-cyan-400 text-xl">${goals.length ? Math.round(goals.reduce((a,g)=>a+g.progress,0)/goals.length) : 0}%</strong><span class="text-[10px] text-slate-500">Média</span></div>
            </div>
            <div class="flex justify-end">
                <button onclick="openAddPersonalGoalModal()" class="feature-action green"><i class="fa-solid fa-plus mr-1"></i>Novo objetivo</button>
            </div>
            <div class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">${rows}</div>
        </div>
    `, 'Fechar', 'closeFeatureModal()');
}

function openAddPersonalGoalModal(index = -1) {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    const goals = ensurePersonalGoalsData(c);
    const g = index >= 0 ? goals[index] : {text:'', category:'Pessoal', progress:0, deadline:'', reward:0, notes:''};
    const categories = ['Carreira','Finanças','Relacionamento','Saúde','Estilo de vida','Pessoal'];
    const categoryOptions = categories.map(x => `<option ${x===g.category?'selected':''}>${x}</option>`).join('');
    showFeatureModal(index >= 0 ? 'Editar objetivo pessoal' : 'Novo objetivo pessoal', `
        <div class="space-y-3">
            <div><label class="text-xs text-slate-400">Objetivo</label><input id="pg-text" value="${escapeHtml(g.text)}" placeholder="Ex: Comprar minha primeira casa" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
            <div class="grid grid-cols-2 gap-3">
                <div><label class="text-xs text-slate-400">Categoria</label><select id="pg-category" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${categoryOptions}</select></div>
                <div><label class="text-xs text-slate-400">Progresso (%)</label><input id="pg-progress" type="number" min="0" max="100" value="${Number(g.progress)||0}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div><label class="text-xs text-slate-400">Prazo</label><input id="pg-deadline" type="date" value="${escapeHtml(g.deadline)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
                <div><label class="text-xs text-slate-400">Recompensa (${currencySymbol()})</label><input id="pg-reward" type="number" min="0" value="${Number(g.reward)||0}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
            </div>
            <div><label class="text-xs text-slate-400">Observações</label><textarea id="pg-notes" rows="2" placeholder="Como pretende alcançar esse objetivo?" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(g.notes)}</textarea></div>
        </div>`, index >= 0 ? 'Salvar alterações' : 'Criar objetivo', `savePersonalGoal(${index})`);
}

function savePersonalGoal(index = -1) {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    const goals = ensurePersonalGoalsData(c);
    const text = document.getElementById('pg-text')?.value.trim();
    if (!text) return alert('Digite um objetivo.');
    const progress = Math.max(0, Math.min(100, Number(document.getElementById('pg-progress')?.value) || 0));
    const item = {
        id: index >= 0 ? goals[index].id : `goal_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        text,
        category: document.getElementById('pg-category')?.value || 'Pessoal',
        progress,
        deadline: document.getElementById('pg-deadline')?.value || '',
        reward: Math.max(0, Number(document.getElementById('pg-reward')?.value) || 0),
        notes: document.getElementById('pg-notes')?.value.trim() || '',
        done: progress >= 100,
        createdAt: index >= 0 ? (goals[index].createdAt || new Date().toLocaleDateString('pt-BR')) : new Date().toLocaleDateString('pt-BR')
    };
    if (index >= 0) goals[index] = item; else goals.unshift(item);
    saveLocalData();
    openPersonalGoalsModal();
}

function editPersonalGoal(index) { openAddPersonalGoalModal(index); }
function completePersonalGoal(index) {
    const c = featureCareer(); if (!c) return;
    const goals = ensurePersonalGoalsData(c); const g = goals[index]; if (!g) return;
    g.progress = 100; g.done = true;
    saveLocalData(); openPersonalGoalsModal();
}
function deletePersonalGoal(index) {
    const c = featureCareer(); if (!c) return;
    const goals = ensurePersonalGoalsData(c); const g = goals[index]; if (!g) return;
    showFeatureModal('Excluir objetivo', `<div class="text-sm text-slate-300">Deseja excluir o objetivo <strong class="text-white">${escapeHtml(g.text)}</strong>?</div>`, 'Excluir', `confirmDeletePersonalGoal(${index})`);
}
function confirmDeletePersonalGoal(index) {
    const c = featureCareer(); if (!c) return;
    const goals = ensurePersonalGoalsData(c); goals.splice(index, 1);
    saveLocalData(); openPersonalGoalsModal();
}


function ensureFamilyFriendsData(career) {
    const pf = ensurePersonalLifeData(career);
    pf.familyFriends ||= {};
    const f = pf.familyFriends;
    f.familySupport ??= 50; f.friends ??= 50; f.parents ??= 50; f.siblings ??= 50;
    f.bestFriend ??= ''; f.friendsList ||= []; f.events ||= [];
    return f;
}

function openFamilyFriendsModal() {
    const c = featureCareer(); if (!c || currentMode !== 'rumo_ao_estrelato') return;
    const f = ensureFamilyFriendsData(c);
    const avg = Math.round((Number(f.familySupport)+Number(f.friends)+Number(f.parents)+Number(f.siblings))/4);
    const friendRows = f.friendsList.length ? f.friendsList.map((x,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-center gap-3"><div><strong class="text-white">${escapeHtml(x.name)}</strong><div class="text-xs text-slate-500">${escapeHtml(x.type||'Amigo')} • ${Number(x.level||0)}%</div></div><button onclick="deleteFamilyFriend(${i})" class="feature-action danger">Remover</button></div>`).join('') : '<div class="text-xs text-slate-500">Nenhum amigo cadastrado.</div>';
    const eventRows = f.events.length ? f.events.slice(0,8).map(x=>`<div class="bg-black/20 rounded-lg p-2 text-xs"><span class="text-slate-500">${escapeHtml(x.date||'')}</span> — <span class="text-white">${escapeHtml(x.text||'')}</span></div>`).join('') : '<div class="text-xs text-slate-500">Nenhum evento familiar registrado.</div>';
    showFeatureModal('Família & Amigos', `
        <div class="space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                ${[['familySupport','Apoio da família'],['parents','Pais'],['siblings','Irmãos'],['friends','Amizades']].map(([k,l])=>`<div class="bg-black/30 rounded-xl p-3"><strong class="block text-cyan-300 text-xl">${Number(f[k]||0)}%</strong><span class="text-[10px] text-slate-500">${l}</span></div>`).join('')}
            </div>
            <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                <div class="flex justify-between text-xs"><span class="text-slate-400">Equilíbrio social</span><strong class="text-white">${avg}%</strong></div>
                <div class="h-2 bg-slate-800 rounded-full mt-2"><div class="h-2 bg-cyan-400 rounded-full" style="width:${avg}%"></div></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                ${[['familySupport','Apoio da família'],['parents','Relação com os pais'],['siblings','Relação com irmãos'],['friends','Círculo de amizades']].map(([k,l])=>`<div><label class="text-xs text-slate-400">${l} (%)</label><input id="ff-${k}" type="number" min="0" max="100" value="${Number(f[k]||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}
            </div>
            <div><label class="text-xs text-slate-400">Melhor amigo</label><input id="ff-best" value="${escapeHtml(f.bestFriend)}" placeholder="Nome do melhor amigo" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
            <div class="border-t border-white/5 pt-3"><div class="flex justify-between items-center mb-2"><h4 class="text-xs font-black uppercase tracking-wider text-white">Amigos</h4><button onclick="openAddFamilyFriendModal()" class="feature-action green">+ Amigo</button></div><div class="space-y-2">${friendRows}</div></div>
            <div class="border-t border-white/5 pt-3"><div class="flex justify-between items-center mb-2"><h4 class="text-xs font-black uppercase tracking-wider text-white">Eventos familiares</h4><button onclick="openFamilyEventModal()" class="feature-action">+ Evento</button></div><div class="space-y-2">${eventRows}</div></div>
        </div>`, 'Salvar', 'saveFamilyFriends()');
}
function saveFamilyFriends() {
    const c=featureCareer(); if(!c)return; const f=ensureFamilyFriendsData(c);
    ['familySupport','parents','siblings','friends'].forEach(k=>f[k]=Math.max(0,Math.min(100,Number(document.getElementById('ff-'+k)?.value)||0)));
    f.bestFriend=document.getElementById('ff-best')?.value.trim()||'';
    saveLocalData(); closeFeatureModal(); renderData();
}
function openAddFamilyFriendModal(){showFeatureModal('Adicionar Amigo',`<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Nome</label><input id="ff-name" placeholder="Nome do amigo" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Tipo</label><select id="ff-type" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Amigo</option><option>Melhor amigo</option><option>Companheiro de equipe</option><option>Amigo de infância</option></select></div><div><label class="text-xs text-slate-400">Proximidade (%)</label><input id="ff-level" type="number" min="0" max="100" value="50" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`,'Adicionar','saveFamilyFriend()');}
function saveFamilyFriend(){const c=featureCareer();if(!c)return;const f=ensureFamilyFriendsData(c),name=document.getElementById('ff-name')?.value.trim();if(!name)return alert('Digite o nome do amigo.');f.friendsList.unshift({name,type:document.getElementById('ff-type').value,level:Math.max(0,Math.min(100,Number(document.getElementById('ff-level').value)||0))});saveLocalData();openFamilyFriendsModal();}
function deleteFamilyFriend(i){const c=featureCareer();if(!c)return;const f=ensureFamilyFriendsData(c);f.friendsList.splice(i,1);saveLocalData();openFamilyFriendsModal();}
function openFamilyEventModal(){showFeatureModal('Evento Familiar',`<input id="ff-event" placeholder="Ex: Aniversário da mãe" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">`,'Registrar','saveFamilyEvent()');}
function saveFamilyEvent(){const c=featureCareer();if(!c)return;const f=ensureFamilyFriendsData(c),text=document.getElementById('ff-event')?.value.trim();if(!text)return;f.events.unshift({text,date:new Date().toLocaleDateString('pt-BR')});saveLocalData();openFamilyFriendsModal();}

function ensureMediaPopularityData(career){const pf=ensurePersonalLifeData(career);pf.mediaPopularity ||= {};const m=pf.mediaPopularity;m.popularity ??= Number(career.popularity||0);m.image ??= 50;m.press ??= 50;m.fanRecognition ??= 50;m.followers ||= {instagram:0,youtube:0,tiktok:0};m.headlines ||= [];return m;}
function openMediaPopularityModal(){const c=featureCareer();if(!c||currentMode!=='rumo_ao_estrelato')return;const m=ensureMediaPopularityData(c);const total=Number(m.followers.instagram||0)+Number(m.followers.youtube||0)+Number(m.followers.tiktok||0);const rows=m.headlines.length?m.headlines.slice(0,8).map(x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="text-[10px] text-slate-500">${escapeHtml(x.date||'')}</div><strong class="text-white text-sm">${escapeHtml(x.title||'Notícia')}</strong><p class="text-xs text-slate-400 mt-1">${escapeHtml(x.text||'')}</p></div>`).join(''):'<div class="text-xs text-slate-500">Nenhuma manchete registrada.</div>';showFeatureModal('Mídia & Popularidade',`<div class="space-y-4"><div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-center"><div class="bg-black/30 rounded-xl p-3"><strong class="block text-orange-400 text-2xl">${Number(m.popularity)}%</strong><span class="text-[10px] text-slate-500">Popularidade</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-cyan-300 text-xl">${Number(m.image)}%</strong><span class="text-[10px] text-slate-500">Imagem pública</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-purple-300 text-xl">${Number(m.press)}%</strong><span class="text-[10px] text-slate-500">Imprensa</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-emerald-400 text-xl">${total.toLocaleString('pt-BR')}</strong><span class="text-[10px] text-slate-500">Seguidores</span></div></div><div class="grid grid-cols-2 gap-3">${[['popularity','Popularidade'],['image','Imagem pública'],['press','Reputação na imprensa'],['fanRecognition','Reconhecimento da torcida']].map(([k,l])=>`<div><label class="text-xs text-slate-400">${l} (%)</label><input id="mp-${k}" type="number" min="0" max="100" value="${Number(m[k]||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}</div><div class="border-t border-white/5 pt-3"><h4 class="text-xs font-black uppercase tracking-wider text-white mb-2">Redes sociais</h4><div class="grid grid-cols-3 gap-2">${[['instagram','Instagram'],['youtube','YouTube'],['tiktok','TikTok']].map(([k,l])=>`<div><label class="text-xs text-slate-400">${l}</label><input id="mp-${k}" type="number" min="0" value="${Number(m.followers[k]||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}</div></div><div class="border-t border-white/5 pt-3"><div class="flex justify-between items-center mb-2"><h4 class="text-xs font-black uppercase tracking-wider text-white">Manchetes</h4><button onclick="openMediaHeadlineModal()" class="feature-action green">+ Notícia</button></div><div class="space-y-2">${rows}</div></div></div>`,'Salvar','saveMediaPopularity()');}
function saveMediaPopularity(){const c=featureCareer();if(!c)return;const m=ensureMediaPopularityData(c);['popularity','image','press','fanRecognition'].forEach(k=>m[k]=Math.max(0,Math.min(100,Number(document.getElementById('mp-'+k)?.value)||0)));['instagram','youtube','tiktok'].forEach(k=>m.followers[k]=Math.max(0,Number(document.getElementById('mp-'+k)?.value)||0));c.popularity=m.popularity;saveLocalData();closeFeatureModal();renderData();}
function openMediaHeadlineModal(){showFeatureModal('Nova notícia',`<div class="space-y-3"><input id="mp-title" placeholder="Manchete" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><textarea id="mp-text" rows="3" placeholder="Repercussão da notícia..." class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></textarea></div>`,'Publicar','saveMediaHeadline()');}
function saveMediaHeadline(){const c=featureCareer();if(!c)return;const m=ensureMediaPopularityData(c),title=document.getElementById('mp-title')?.value.trim();if(!title)return; m.headlines.unshift({date:new Date().toLocaleDateString('pt-BR'),title,text:document.getElementById('mp-text')?.value.trim()||''});saveLocalData();openMediaPopularityModal();}

function openLifeEventModal(){
    const c=featureCareer(); if(!c||currentMode!=='rumo_ao_estrelato')return;
    showFeatureModal('Registrar Evento da Vida',`<div class="space-y-3"><input id="life-event-title" placeholder="Título do evento" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><div class="grid grid-cols-2 gap-3"><select id="life-event-category" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Carreira</option><option>Relacionamento</option><option>Família</option><option>Finanças</option><option>Conquista</option><option>Problema</option><option>Transferência</option><option>Pessoal</option></select><input id="life-event-date" value="${new Date().toLocaleDateString('pt-BR')}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><textarea id="life-event-description" rows="3" placeholder="O que aconteceu?" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></textarea><div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Impacto (-100 a +100)</label><input id="life-event-impact" type="number" min="-100" max="100" value="0" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><label class="flex items-center gap-2 text-sm text-slate-300 mt-5"><input id="life-event-important" type="checkbox"> Importante</label></div></div>`,'Registrar','saveLifeEvent()');
}
function saveLifeEvent(){
    const c=featureCareer(); if(!c)return; const pf=ensurePersonalLifeData(c),title=document.getElementById('life-event-title')?.value.trim(); if(!title)return alert('Digite o título do evento.');
    pf.lifeEvents.unshift({id:`life_event_${Date.now()}`,title,category:document.getElementById('life-event-category')?.value||'Pessoal',date:document.getElementById('life-event-date')?.value.trim()||new Date().toLocaleDateString('pt-BR'),description:document.getElementById('life-event-description')?.value.trim()||'',impact:Math.max(-100,Math.min(100,Number(document.getElementById('life-event-impact')?.value)||0)),important:Boolean(document.getElementById('life-event-important')?.checked)});
    saveLocalData(); openPersonalLifeModal('events');
}
function deleteLifeEvent(id){const c=featureCareer();if(!c)return;const pf=ensurePersonalLifeData(c),i=pf.lifeEvents.findIndex(e=>e.id===id);if(i<0)return;pf.lifeEvents.splice(i,1);saveLocalData();openPersonalLifeModal('events');}

function openPersonalLifeModal(section) {
    if (currentMode !== 'rumo_ao_estrelato' || !currentCareerId) return;
    const c = featureCareer(); const pf = ensurePersonalLifeData(c);
    const titles = {
      family:'Família e Amigos', wardrobe:'Guarda-roupa', cellphone:'Celular', news:'Mídia & Popularidade',
      sponsorship:'Patrocínios', bank:'Banco', assets:'Patrimônio', state:'Estado do Jogador', hall:'Hall Pessoal',
      future:'Família Futura', goals:'Objetivos Pessoais', events:'Eventos da Vida'
    };
    let body='';
    if(section==='family') { openFamilyFriendsModal(); return; }
    if(section==='wardrobe') {
        openWardrobeModal();
        return;
    }
    if(section==='cellphone') body=`<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Modelo</label><input id="pl-phone" value="${escapeHtml(pf.cellphone.model)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Valor (${currencySymbol()})</label><input id="pl-phone-value" type="number" min="0" value="${pf.cellphone.value||0}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`;
    if(section==='sponsorship') body=`<div class="space-y-3"><input id="pl-sponsor" placeholder="Marca / contrato" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><input id="pl-sponsor-value" type="number" min="0" placeholder="Valor do contrato (${currencySymbol()})" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`;
    if(section==='bank') body=`<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Score bancário</label><input id="pl-bank-score" type="number" min="0" max="1000" value="${pf.bank.score||0}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Saldo atual</label><input value="${moneyBR(pf.balance)}" disabled class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-slate-400"></div></div>`;
    if(section==='assets') { openPatrimonyModal(); return; }
    if(section==='state') { openPersonalStateModal(); return; }
    if(section==='future') {
        const f=pf.futureFamily;
        body=`<div class="space-y-4"><div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Filhos planejados</label><input id="pl-children" type="number" min="0" value="${Number(f.children)||0}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Ano/meta</label><input id="pl-targetYear" value="${escapeHtml(f.targetYear||'')}" placeholder="Ex.: 2030" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Planos de casamento</label><input id="pl-marriage" value="${escapeHtml(f.marriage||'')}" placeholder="Ex.: casar após a carreira estabilizar" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Planos de moradia</label><input id="pl-home" value="${escapeHtml(f.home||'')}" placeholder="Ex.: comprar uma casa" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div><div><label class="text-xs text-slate-400">Planos familiares</label><textarea id="pl-family-goals" rows="2" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(f.familyGoals||'')}</textarea></div><div><label class="text-xs text-slate-400">Planos de carreira</label><textarea id="pl-career-goals" rows="2" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(f.careerGoals||'')}</textarea></div><div><label class="text-xs text-slate-400">Outros planos para o futuro</label><textarea id="pl-future-plans" rows="2" placeholder="Seus planos pessoais..." class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(f.plans||'')}</textarea></div><div><label class="text-xs text-slate-400">Observações</label><textarea id="pl-notes" rows="2" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(f.notes||'')}</textarea></div></div>`;
    }
    if(section==='events') {
        const events=pf.lifeEvents||[];
        const rows=events.length?events.slice(0,12).map(e=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between gap-3"><div><div class="text-[10px] text-slate-500">${escapeHtml(e.date||'')} • ${escapeHtml(e.category||'Pessoal')}</div><strong class="text-white text-sm">${escapeHtml(e.title||'Evento')}</strong>${e.important?'<span class="ml-2 text-[9px] uppercase text-amber-300">Importante</span>':''}<p class="text-xs text-slate-400 mt-1">${escapeHtml(e.description||'Sem descrição.')}</p><div class="text-[10px] text-cyan-300 mt-1">Impacto: ${Number(e.impact)>0?'+':''}${Number(e.impact||0)}</div></div><button onclick="deleteLifeEvent('${escapeHtml(e.id)}')" class="feature-action danger shrink-0">Excluir</button></div>`).join(''):'<div class="text-xs text-slate-500">Nenhum evento registrado.</div>';
        body=`<div class="space-y-4"><div class="grid grid-cols-3 gap-2 text-center"><div class="bg-black/30 rounded-xl p-3"><strong class="block text-cyan-300 text-xl">${events.length}</strong><span class="text-[10px] text-slate-500">Eventos</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-amber-300 text-xl">${events.filter(e=>e.important).length}</strong><span class="text-[10px] text-slate-500">Importantes</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-emerald-300 text-xl">${events.filter(e=>Number(e.impact)>0).length}</strong><span class="text-[10px] text-slate-500">Positivos</span></div></div><div class="flex justify-end"><button onclick="openLifeEventModal()" class="feature-action green">+ Registrar evento</button></div><div class="space-y-2">${rows}</div></div>`;
    }
    if(section==='hall') body=`<input id="pl-hall" placeholder="Conquista pessoal" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><div class="mt-3 text-xs text-slate-400">${pf.personalHall.length} conquista(s) registrada(s).</div>`;
    if(section==='news') { openMediaPopularityModal(); return; }
    showFeatureModal(titles[section], body, 'Salvar', `savePersonalLife('${section}')`);
}

function savePersonalLife(section) {
    const c=featureCareer(); if(!c || currentMode!=='rumo_ao_estrelato') return; const pf=ensurePersonalLifeData(c);
    const val=id=>document.getElementById(id)?.value;
    if(section==='family'){ return; }
    else if(section==='wardrobe'){ return; }
    else if(section==='cellphone'){pf.cellphone={model:val('pl-phone')||'Celular básico',value:Number(val('pl-phone-value'))||0};}
    else if(section==='sponsorship'){const n=val('pl-sponsor');if(n)pf.sponsorships.unshift({name:n,value:Number(val('pl-sponsor-value'))||0,date:new Date().toLocaleDateString('pt-BR')});}
    else if(section==='bank'){pf.bank.score=Math.max(0,Number(val('pl-bank-score'))||0);}
    else if(section==='assets'){ return; }
    else if(section==='state'){ return; }
    else if(section==='future'){pf.futureFamily={children:Math.max(0,Number(val('pl-children'))||0),targetYear:val('pl-targetYear')||'',marriage:val('pl-marriage')||'',home:val('pl-home')||'',familyGoals:val('pl-family-goals')||'',careerGoals:val('pl-career-goals')||'',plans:val('pl-future-plans')||'',notes:val('pl-notes')||''};}
    else if(section==='goals'){ return; }
    else if(section==='events'){ return; }
    else if(section==='hall'){const n=val('pl-hall');if(n)pf.personalHall.unshift({text:n,date:new Date().toLocaleDateString('pt-BR')});}
    else if(section==='news'){const n=val('pl-news');if(n){c.news ||= []; c.news.unshift({date:new Date().toLocaleDateString('pt-BR'),title:'Vida pessoal',text:n});}}
    saveLocalData();closeFeatureModal();renderData();
}

function featureCareer() {
    if (!currentCareerId || !currentUser) return null;
    const modeData = appData.users[currentUser]?.[currentMode];
    const career = modeData?.[currentCareerId];
    if (!career) return null;
    ensureFeatureData(career);
    return career;
}

function showFeatureModal(title, body, saveLabel = 'Salvar', saveFunction = '') {
    let modal = document.getElementById('featureModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'featureModal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm hidden justify-center items-center z-[70] p-4';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="bg-slate-900 border border-white/10 w-full max-w-xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <h3 class="text-lg font-bold text-white">${escapeHtml(title)}</h3>
                <button type="button" onclick="closeFeatureModal()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            </div>
            ${body}
            <div class="flex justify-end gap-2 pt-4">
                <button type="button" onclick="closeFeatureModal()" class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold">Cancelar</button>
                ${saveFunction ? `<button type="button" onclick="${saveFunction}" class="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold">${escapeHtml(saveLabel)}</button>` : ''}
            </div>
        </div>`;
    modal.style.display = 'flex';
}

function closeFeatureModal() {
    const modal = document.getElementById('featureModal');
    if (modal) modal.style.display = 'none';
}

function accountData() {
    if (!currentUser || !appData.users[currentUser]) return null;
    const user = appData.users[currentUser];
    if (!user.clubDatabase) user.clubDatabase = [];
    return user;
}

function openSeasonModal() {
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Registrar Temporada', `<div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-400">Temporada</label><input id="sea-name" placeholder="2027/28" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        <div><label class="text-xs text-slate-400">Clube</label><input id="sea-club" placeholder="Barcelona" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        ${[['games','Jogos'],['wins','Vitórias'],['draws','Empates'],['losses','Derrotas'],['goals','Gols'],['assists','Assistências'],['titles','Títulos']].map(x=>`<div><label class="text-xs text-slate-400">${x[1]}</label><input id="sea-${x[0]}" type="number" min="0" value="0" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}
        <div class="col-span-2"><label class="text-xs text-slate-400">Resumo</label><textarea id="sea-notes" rows="2" placeholder="Como foi a temporada?" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></textarea></div>
    </div>`, 'Adicionar', 'saveSeason()');
}
function saveSeason(){const c=featureCareer();if(!c)return;const x={season:document.getElementById('sea-name').value.trim(),club:document.getElementById('sea-club').value.trim()};['games','wins','draws','losses','goals','assists','titles'].forEach(k=>x[k]=Number(document.getElementById('sea-'+k).value)||0);x.notes=document.getElementById('sea-notes').value.trim();c.seasons.push(x);saveLocalData();closeFeatureModal();renderData();}

function openObjectiveModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Objetivo da Temporada', `<div class="space-y-3"><input id="obj-title" placeholder="Classificar para a Libertadores" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><div class="grid grid-cols-2 gap-3"><input id="obj-target" placeholder="Meta (ex: G4)" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><input id="obj-progress" type="number" min="0" max="100" value="0" placeholder="Progresso %" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><select id="obj-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Em andamento</option><option>Concluído</option><option>Falhou</option></select></div>`, 'Adicionar', 'saveObjective()');
}
function saveObjective(){const c=featureCareer();if(!c)return;c.objectives.push({title:document.getElementById('obj-title').value.trim(),target:document.getElementById('obj-target').value.trim(),progress:Math.max(0,Math.min(100,Number(document.getElementById('obj-progress').value)||0)),status:document.getElementById('obj-status').value});saveLocalData();closeFeatureModal();renderData();}
function deleteObjective(i){const c=featureCareer();if(c&&confirm('Remover objetivo?')){c.objectives.splice(i,1);saveLocalData();renderData();}}

function openYouthModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Novo Jogador da Base', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Nome</label><input id="y-name" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Posição</label><input id="y-pos" placeholder="ATA" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Idade</label><input id="y-age" type="number" min="12" max="30" value="17" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Overall</label><input id="y-ovr" type="number" min="1" max="100" value="60" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Potencial</label><input id="y-pot" type="number" min="1" max="100" value="80" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div class="col-span-2"><label class="text-xs text-slate-400">Status</label><select id="y-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Base</option><option>Promovido</option><option>Emprestado</option><option>Dispensado</option></select></div></div>`, 'Adicionar', 'saveYouth()');
}
function saveYouth(){const c=featureCareer();if(!c)return;c.youth.push({name:document.getElementById('y-name').value.trim(),position:document.getElementById('y-pos').value.trim(),age:Number(document.getElementById('y-age').value)||17,overall:Number(document.getElementById('y-ovr').value)||0,potential:Number(document.getElementById('y-pot').value)||0,status:document.getElementById('y-status').value});saveLocalData();closeFeatureModal();renderData();}
function deleteYouth(i){const c=featureCareer();if(c&&confirm('Remover jogador da base?')){c.youth.splice(i,1);saveLocalData();renderData();}}

function openMarketModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Mercado de Transferências', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Jogador</label><input id="mk-name" placeholder="Nome do jogador" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Posição</label><input id="mk-pos" placeholder="MEI" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Idade</label><input id="mk-age" type="number" value="20" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Overall</label><input id="mk-ovr" type="number" min="1" max="100" value="75" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Valor (${currencySymbol()}M)</label><input id="mk-value" type="number" step="0.1" value="10" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Preço pedido (${currencySymbol()}M)</label><input id="mk-price" type="number" step="0.1" value="15" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Status</label><select id="mk-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Disponível</option><option>Negociação</option><option>Contratado</option><option>Descartado</option></select></div></div>`, 'Adicionar', 'saveMarket()');
}
function saveMarket(){const c=featureCareer();if(!c)return;c.market.push({name:document.getElementById('mk-name').value.trim(),position:document.getElementById('mk-pos').value.trim(),age:Number(document.getElementById('mk-age').value)||0,overall:Number(document.getElementById('mk-ovr').value)||0,value:Number(document.getElementById('mk-value').value)||0,price:Number(document.getElementById('mk-price').value)||0,status:document.getElementById('mk-status').value});saveLocalData();closeFeatureModal();renderData();}
function deleteMarket(i){const c=featureCareer();if(c&&confirm('Remover jogador do mercado?')){c.market.splice(i,1);saveLocalData();renderData();}}

function openRankingModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    const r=featureCareer().rankings||{};
    showFeatureModal('Ranking Mundial', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Posição mundial</label><input id="rank-world" type="number" min="0" value="${Number(r.worldPosition||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Pontos do jogador</label><input id="rank-points" type="number" min="0" value="${Number(r.playerPoints||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Posição do clube</label><input id="rank-club" type="number" min="0" value="${Number(r.clubPosition||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Pontos do clube</label><input id="rank-club-points" type="number" min="0" value="${Number(r.clubPoints||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Salvar', 'saveRanking()');
}
function saveRanking(){const c=featureCareer();if(!c)return;c.rankings={worldPosition:Number(document.getElementById('rank-world').value)||0,playerPoints:Number(document.getElementById('rank-points').value)||0,clubPosition:Number(document.getElementById('rank-club').value)||0,clubPoints:Number(document.getElementById('rank-club-points').value)||0};saveLocalData();closeFeatureModal();renderData();}

function openCompetitionModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Estatísticas por Competição', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Temporada</label><input id="cp-season" placeholder="2027/28" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Competição</label><input id="cp-name" placeholder="Champions League" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>${[['games','Jogos'],['wins','Vitórias'],['draws','Empates'],['losses','Derrotas'],['goals','Gols'],['assists','Assistências']].map(x=>`<div><label class="text-xs text-slate-400">${x[1]}</label><input id="cp-${x[0]}" type="number" min="0" value="0" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}<div class="col-span-2"><label class="text-xs text-slate-400">Resultado final</label><input id="cp-result" placeholder="Campeão / Vice / Semifinal" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Adicionar', 'saveCompetition()');
}
function saveCompetition(){const c=featureCareer();if(!c)return;const x={season:document.getElementById('cp-season').value.trim(),competition:document.getElementById('cp-name').value.trim(),result:document.getElementById('cp-result').value.trim()};['games','wins','draws','losses','goals','assists'].forEach(k=>x[k]=Number(document.getElementById('cp-'+k).value)||0);c.competitions.push(x);saveLocalData();closeFeatureModal();renderData();}
function deleteCompetition(i){const c=featureCareer();if(c&&confirm('Remover estatística da competição?')){c.competitions.splice(i,1);saveLocalData();renderData();}}

function openClubDatabaseModal(){
    const u=accountData();if(!u)return;
    showFeatureModal('Banco de Clubes', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Nome do clube</label><input id="clubdb-name" placeholder="Santos FC" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">País</label><input id="clubdb-country" placeholder="Brasil" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Liga</label><input id="clubdb-league" placeholder="Brasileirão" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Overall do elenco</label><input id="clubdb-ovr" type="number" min="1" max="100" value="75" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Orçamento (${currencySymbol()}M)</label><input id="clubdb-budget" type="number" step="0.1" value="0" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Cadastrar', 'saveClubDatabase()');
}
function saveClubDatabase(){const u=accountData();if(!u)return;u.clubDatabase.push({name:document.getElementById('clubdb-name').value.trim(),country:document.getElementById('clubdb-country').value.trim(),league:document.getElementById('clubdb-league').value.trim(),overall:Number(document.getElementById('clubdb-ovr').value)||0,budget:Number(document.getElementById('clubdb-budget').value)||0});saveLocalData();closeFeatureModal();renderData();}
function deleteClubDatabase(i){const u=accountData();if(u&&confirm('Remover clube do banco?')){u.clubDatabase.splice(i,1);saveLocalData();renderData();}}

function openAwardModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Novo Prêmio Individual', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Prêmio</label><input id="aw-name" placeholder="Bola de Ouro" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Temporada</label><input id="aw-season" placeholder="2027/28" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Clube</label><input id="aw-club" placeholder="Barcelona" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Competição</label><input id="aw-comp" placeholder="Champions League" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Descrição</label><input id="aw-note" placeholder="Melhor jogador da competição" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Adicionar', 'saveAward()');
}
function saveAward(){const c=featureCareer();if(!c)return;c.awards.push({name:document.getElementById('aw-name').value.trim(),season:document.getElementById('aw-season').value.trim(),club:document.getElementById('aw-club').value.trim(),competition:document.getElementById('aw-comp').value.trim(),note:document.getElementById('aw-note').value.trim()});saveLocalData();closeFeatureModal();renderData();}
function deleteAward(i){const c=featureCareer();if(c&&confirm('Remover este prêmio?')){c.awards.splice(i,1);saveLocalData();renderData();}}

function openInjuryModal(index = -1){
    const c = featureCareer();
    if (!c) return alert('Selecione uma carreira primeiro.');
    const editing = index >= 0 && c.injuries[index];
    showFeatureModal(editing ? 'Editar Lesão' : 'Registrar Lesão', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Lesão</label><input id="inj-name" placeholder="Entorse no tornozelo" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Data</label><input id="inj-date" type="date" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Dias afastado</label><input id="inj-days" type="number" min="0" value="7" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Gravidade</label><select id="inj-severity" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Leve</option><option>Moderada</option><option>Grave</option></select></div><div><label class="text-xs text-slate-400">Jogos perdidos</label><input id="inj-games" type="number" min="0" value="0" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div class="col-span-2"><label class="text-xs text-slate-400">Status</label><select id="inj-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Em recuperação</option><option>Recuperado</option></select></div></div>`, editing ? 'Salvar alterações' : 'Adicionar', `saveInjury(${index})`);
    if (editing) {
        document.getElementById('inj-name').value = editing.name || '';
        document.getElementById('inj-date').value = editing.date || '';
        document.getElementById('inj-days').value = Number(editing.days || 0);
        document.getElementById('inj-severity').value = editing.severity || 'Leve';
        document.getElementById('inj-games').value = Number(editing.gamesLost || 0);
        document.getElementById('inj-status').value = editing.status || 'Em recuperação';
    }
}
function saveInjury(index = -1){
    const c=featureCareer(); if(!c)return;
    const data={name:document.getElementById('inj-name').value.trim(),date:document.getElementById('inj-date').value,days:Number(document.getElementById('inj-days').value)||0,severity:document.getElementById('inj-severity').value,gamesLost:Number(document.getElementById('inj-games').value)||0,status:document.getElementById('inj-status').value};
    if(index >= 0 && c.injuries[index]) c.injuries[index] = data; else c.injuries.push(data);
    saveLocalData(); closeFeatureModal(); renderData();
}
function deleteInjury(i){const c=featureCareer();if(c&&confirm('Remover este registro de lesão?')){c.injuries.splice(i,1);saveLocalData();renderData();}}

function openDisciplineModal(){
    const c=featureCareer(); if(!c || currentMode !== 'rumo_ao_estrelato') return;
    if(!c.discipline) c.discipline={yellowCards:0,redCards:0};
    showFeatureModal('Cartões Disciplinares — Geral', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-amber-300">Cartões Amarelos</label><input id="disc-yellow" type="number" min="0" value="${Number(c.discipline.yellowCards||0)}" class="w-full bg-black/40 border border-amber-500/20 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-rose-300">Cartões Vermelhos</label><input id="disc-red" type="number" min="0" value="${Number(c.discipline.redCards||0)}" class="w-full bg-black/40 border border-rose-500/20 rounded-lg p-2 text-sm text-white"></div></div>`, 'Salvar','saveDiscipline()');
}
function saveDiscipline(){const c=featureCareer();if(!c || currentMode !== 'rumo_ao_estrelato')return;c.discipline={yellowCards:Number(document.getElementById('disc-yellow').value)||0,redCards:Number(document.getElementById('disc-red').value)||0};saveLocalData();closeFeatureModal();renderData();}

function openRelationModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Nova Relação', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Nome</label><input id="rel-name" placeholder="Nome da pessoa" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Tipo</label><select id="rel-type" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Companheiro</option><option>Técnico</option><option>Agente</option><option>Diretor</option><option>Amigo</option><option>Rival</option><option>Família</option><option>Outro</option></select></div><div><label class="text-xs text-slate-400">Nível (%)</label><input id="rel-level" type="number" min="0" max="100" value="50" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Status</label><select id="rel-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Boa</option><option>Neutra</option><option>Tensa</option><option>Rivalidade</option></select></div></div>`, 'Adicionar', 'saveRelation()');
}
function saveRelation(){const c=featureCareer();if(!c)return;c.relations.push({name:document.getElementById('rel-name').value.trim(),type:document.getElementById('rel-type').value,level:Math.max(0,Math.min(100,Number(document.getElementById('rel-level').value)||0)),status:document.getElementById('rel-status').value});saveLocalData();closeFeatureModal();renderData();}
function deleteRelation(i){const c=featureCareer();if(c&&confirm('Remover esta relação?')){c.relations.splice(i,1);saveLocalData();renderData();}}

function openCareerEventModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Novo Evento da Carreira', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Data</label><input id="ev-date" type="date" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Categoria</label><select id="ev-type" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Estreia</option><option>Primeiro Gol</option><option>Primeiro Título</option><option>Seleção</option><option>Recorde</option><option>Transferência</option><option>Prêmio</option><option>Outro</option></select></div><div class="col-span-2"><label class="text-xs text-slate-400">Evento</label><input id="ev-title" placeholder="Estreia pelo Barcelona" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div class="col-span-2"><label class="text-xs text-slate-400">Detalhes</label><textarea id="ev-note" rows="3" placeholder="Conte o que aconteceu..." class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></textarea></div></div>`, 'Adicionar', 'saveCareerEvent()');
}
function saveCareerEvent(){const c=featureCareer();if(!c)return;c.events.push({date:document.getElementById('ev-date').value,type:document.getElementById('ev-type').value,title:document.getElementById('ev-title').value.trim(),note:document.getElementById('ev-note').value.trim()});saveLocalData();closeFeatureModal();renderData();}
function deleteCareerEvent(i){const c=featureCareer();if(c&&confirm('Remover este evento?')){c.events.splice(i,1);saveLocalData();renderData();}}

function getSeasonSummary(seasonName) {
    const c = featureCareer();
    if (!c) return null;
    const list = (c.seasons || []).filter(s => String(s.season || '') === String(seasonName || ''));
    if (!list.length) return null;
    return list.reduce((acc, s) => {
        acc.season = s.season || seasonName;
        acc.clubs.push(s.club || '-');
        acc.games += Number(s.games || 0); acc.wins += Number(s.wins || 0);
        acc.draws += Number(s.draws || 0); acc.losses += Number(s.losses || 0);
        acc.goals += Number(s.goals || 0); acc.assists += Number(s.assists || 0);
        acc.titles += Number(s.titles || 0);
        if (s.notes) acc.notes.push(s.notes);
        return acc;
    }, {season: seasonName, clubs: [], games:0, wins:0, draws:0, losses:0, goals:0, assists:0, titles:0, notes:[]});
}
function openSeasonSummaryModal() {
    const c = featureCareer();
    if (!c) return alert('Selecione uma carreira primeiro.');
    const seasons = [...new Set((c.seasons || []).map(s => s.season).filter(Boolean))];
    if (!seasons.length) return alert('Registre uma temporada primeiro.');
    const defaultSeason = seasons[seasons.length - 1];
    const renderSummary = (name) => {
        const x = getSeasonSummary(name);
        if (!x) return '<p class="text-xs text-slate-500 italic">Nenhum dado para esta temporada.</p>';
        const aproveitamento = x.games ? (((x.wins * 3 + x.draws) / (x.games * 3)) * 100).toFixed(1) : '0.0';
        return `<div class="feature-summary-grid"><div><strong>${x.games}</strong><span>Jogos</span></div><div><strong>${x.wins}</strong><span>Vitórias</span></div><div><strong>${x.draws}</strong><span>Empates</span></div><div><strong>${x.losses}</strong><span>Derrotas</span></div><div><strong>${x.goals}</strong><span>Gols</span></div><div><strong>${x.assists}</strong><span>Assistências</span></div><div><strong>${x.titles}</strong><span>Títulos</span></div><div><strong>${aproveitamento}%</strong><span>Aproveitamento</span></div></div><p class="text-xs text-slate-400 mt-4">Clubes: ${x.clubs.map(escapeHtml).join(' • ') || '-'}</p>${x.notes.length ? `<p class="text-xs text-slate-500 mt-2">${x.notes.map(escapeHtml).join(' • ')}</p>` : ''}`;
    };
    showFeatureModal('Resumo da Temporada', `<div><label class="text-xs text-slate-400">Temporada</label><select id="summary-season" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1">${seasons.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}</select><div id="season-summary-content" class="mt-4">${renderSummary(defaultSeason)}</div></div>`, 'Fechar', 'closeFeatureModal()');
    const select = document.getElementById('summary-season');
    const content = document.getElementById('season-summary-content');
    if (select && content) select.addEventListener('change', () => { content.innerHTML = renderSummary(select.value); });
}
function openSaveManagerModal() {
    if (!currentUser) return;
    const user = appData.users[currentUser];
    const careers = user?.[currentMode] || {};
    const ids = Object.keys(careers);
    const modeLabel = currentMode === 'rumo_ao_estrelato' ? 'Become a Legend' : 'Master Liga';
    const list = ids.length ? ids.map(id => {
        const c = careers[id];
        return `<div class="save-item"><div><strong>${escapeHtml(c.name || 'Carreira')}</strong><span>${modeLabel} • ${((c.seasons || []).length)} temporada(s)</span></div><div class="save-item-actions"><button onclick="renameCareer('${id}')" class="feature-action">Renomear</button><button onclick="duplicateCareer('${id}')" class="feature-action green">Duplicar</button><button onclick="deleteCareerFromManager('${id}')" class="feature-action danger">Excluir</button></div></div>`;
    }).join('') : '<p class="text-xs text-slate-500 italic">Nenhum save neste modo.</p>';
    showFeatureModal('Gerenciar Saves', `<p class="text-xs text-slate-400 mb-3">Vários saves, renomeação, duplicação e exclusão. O backup JSON continua disponível no final da página.</p><div class="save-manager-list">${list}</div>`, 'Fechar', 'closeFeatureModal()');
}
function renameCareer(id) {
    const careers = appData.users[currentUser]?.[currentMode]; const c = careers?.[id]; if (!c) return;
    const name = prompt('Novo nome da carreira:', c.name || 'Carreira');
    if (!name || !name.trim()) return;
    c.name = name.trim(); saveLocalData(); closeFeatureModal(); updateCareerDropdown(); openSaveManagerModal();
}
function duplicateCareer(id) {
    const careers = appData.users[currentUser]?.[currentMode]; const c = careers?.[id]; if (!c) return;
    const copy = JSON.parse(JSON.stringify(c));
    const name = prompt('Nome do novo save:', `${c.name || 'Carreira'} - Cópia`);
    if (!name || !name.trim()) return;
    copy.name = name.trim();
    const newId = 'career_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    careers[newId] = copy; currentCareerId = newId; saveLocalData(); closeFeatureModal(); updateCareerDropdown(); openSaveManagerModal();
}
function deleteCareerFromManager(id) {
    const careers = appData.users[currentUser]?.[currentMode]; const c = careers?.[id]; if (!c) return;
    if (!confirm(`Excluir o save "${c.name || 'Carreira'}"? Esta ação não pode ser desfeita.`)) return;
    delete careers[id]; if (currentCareerId === id) currentCareerId = Object.keys(careers)[0] || null;
    saveLocalData(); closeFeatureModal(); updateCareerDropdown(); openSaveManagerModal();
}

function openStaffModal() {
    if (currentMode !== 'master_liga') return;

    const c = featureCareer();
    if (!c) {
        alert('Selecione uma carreira da Master Liga primeiro.');
        return;
    }

    ensureFeatureData(c);

    const roles = [
        'Treinador Principal',
        'Auxiliar Técnico',
        'Preparador Físico',
        'Preparador de Goleiros',
        'Analista de Desempenho',
        'Fisioterapeuta',
        'Psicólogo Esportivo'
    ];

    const roleOptions = roles.map(role =>
        `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`
    ).join('');

    const staffList = c.staff.length
        ? c.staff.map((member, index) => {
            const quality = Math.max(1, Math.min(100, Number(member.quality) || 0));
            const salary = Number(member.salary) || 0;

            return `
                <div class="bg-black/30 border border-white/10 rounded-xl p-3">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div class="min-w-0">
                            <div class="font-bold text-white">${escapeHtml(member.name)}</div>
                            <div class="text-xs text-cyan-300 mt-1">${escapeHtml(member.role || 'Sem função')}</div>
                            <div class="text-xs text-slate-400 mt-1">
                                Qualidade: <b class="text-white">${quality}/100</b>
                                • Salário: <b class="text-white">${currencySymbol()} ${money(salary)} mil/mês</b>
                            </div>
                        </div>

                        <button type="button"
                            onclick="deleteStaffMember(${index})"
                            class="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs font-bold">
                            <i class="fa-solid fa-user-minus mr-1"></i>Demitir
                        </button>
                    </div>
                </div>
            `;
        }).join('')
        : `<div class="text-sm text-slate-500 italic border border-dashed border-white/10 rounded-xl p-4 text-center">
                Nenhum profissional contratado.
           </div>`;

    showFeatureModal(
        'Comissão Técnica',
        `
        <div class="space-y-5">

            <div>
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold text-white">
                        <i class="fa-solid fa-users-gear text-cyan-400 mr-2"></i>
                        Profissionais contratados
                    </h4>
                    <span class="text-xs text-slate-400">${c.staff.length} contratado(s)</span>
                </div>

                <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                    ${staffList}
                </div>
            </div>

            <div class="border-t border-white/10 pt-4">
                <h4 class="font-bold text-white mb-3">
                    <i class="fa-solid fa-user-plus text-emerald-400 mr-2"></i>
                    Contratar profissional
                </h4>

                <div class="space-y-3">
                    <div>
                        <label class="text-xs text-slate-400">Nome</label>
                        <input id="staff-name" required
                            placeholder="Ex: Rafael Mendes"
                            class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs text-slate-400">Função</label>
                            <select id="staff-role"
                                class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">
                                ${roleOptions}
                            </select>
                        </div>

                        <div>
                            <label class="text-xs text-slate-400">Qualidade (1–100)</label>
                            <input id="staff-quality" type="number" min="1" max="100" value="70"
                                class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">
                        </div>
                    </div>

                    <div>
                        <label class="text-xs text-slate-400">Salário mensal (${currencySymbol()} mil)</label>
                        <input id="staff-salary" type="number" min="0" step="0.1" value="10"
                            class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">
                    </div>
                </div>
            </div>
        </div>
        `,
        'Contratar',
        'saveStaffMember()'
    );
}

function saveStaffMember() {
    const c = featureCareer();

    if (!c || currentMode !== 'master_liga') return;

    ensureFeatureData(c);

    const nameEl = document.getElementById('staff-name');
    const roleEl = document.getElementById('staff-role');
    const qualityEl = document.getElementById('staff-quality');
    const salaryEl = document.getElementById('staff-salary');

    const name = nameEl ? nameEl.value.trim() : '';
    const role = roleEl ? roleEl.value : '';
    const quality = Math.max(1, Math.min(100, Number(qualityEl?.value) || 70));
    const salary = Math.max(0, Number(salaryEl?.value) || 0);

    if (!name) {
        alert('Digite o nome do profissional.');
        return;
    }

    if (!role) {
        alert('Selecione uma função.');
        return;
    }

    c.staff.push({
        id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        role,
        quality,
        salary
    });

    saveLocalData();
    closeFeatureModal();
    renderData();
}

function deleteStaffMember(index) {
    const c = featureCareer();

    if (!c || currentMode !== 'master_liga') return;

    ensureFeatureData(c);

    const member = c.staff[index];

    if (!member) {
        showFeatureModal(
            'Profissional não encontrado',
            `<div class="text-center py-6">
                <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-triangle-exclamation text-red-400 text-xl"></i>
                </div>
                <p class="text-slate-300 text-sm">O profissional selecionado não existe mais na comissão técnica.</p>
            </div>`,
            '',
            ''
        );
        return;
    }

    const quality = Math.max(1, Math.min(100, Number(member.quality) || 0));
    const salary = Number(member.salary) || 0;

    showFeatureModal(
        'Demitir profissional',
        `
        <div class="space-y-4">
            <div class="text-center py-2">
                <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-user-minus text-red-400 text-2xl"></i>
                </div>
                <h4 class="text-lg font-bold text-white">${escapeHtml(member.name)}</h4>
                <p class="text-sm text-cyan-300 mt-1">${escapeHtml(member.role || 'Sem função')}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
                    <div class="text-xs text-slate-400">Qualidade</div>
                    <div class="text-lg font-bold text-white mt-1">${quality}/100</div>
                </div>
                <div class="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
                    <div class="text-xs text-slate-400">Salário</div>
                    <div class="text-lg font-bold text-white mt-1">${currencySymbol()} ${money(salary)} mil</div>
                </div>
            </div>

            <div class="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <div class="flex gap-3 items-start">
                    <i class="fa-solid fa-circle-exclamation text-red-400 mt-0.5"></i>
                    <div>
                        <p class="text-sm font-bold text-red-300">Confirmar demissão</p>
                        <p class="text-xs text-slate-400 mt-1">Este profissional será removido da comissão técnica e deixará de receber salário pelo clube.</p>
                    </div>
                </div>
            </div>
        </div>
        `,
        'Confirmar demissão',
        `confirmDeleteStaffMember(${index})`
    );
}

function confirmDeleteStaffMember(index) {
    const c = featureCareer();

    if (!c || currentMode !== 'master_liga') return;

    ensureFeatureData(c);

    const member = c.staff[index];

    if (!member) {
        closeFeatureModal();
        renderData();
        return;
    }

    c.staff.splice(index, 1);

    saveLocalData();
    closeFeatureModal();
    renderData();
}

function openClubReputationModal() {
    if (currentMode !== 'master_liga') return;
    const r=featureCareer()?.clubReputation || {};
    const fields=[['national','Reputação nacional'],['international','Reputação internacional'],['prestige','Prestígio'],['fan','Reconhecimento da torcida'],['media','Reconhecimento da imprensa'],['playerAttraction','Atratividade para jogadores'],['staffAttraction','Atratividade para profissionais']];
    showFeatureModal('Editar Reputação do Clube', `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${fields.map(([k,l])=>`<div><label class="text-xs text-slate-400">${l} (0–100)</label><input id="rep-${k}" type="number" min="0" max="100" value="${Number(r[k]??50)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}</div>`, 'Salvar', 'saveClubReputation()');
}
function saveClubReputation() {
    const c=featureCareer(); if(!c || currentMode!=='master_liga') return;
    ensureFeatureData(c); const keys=['national','international','prestige','fan','media','playerAttraction','staffAttraction'];
    keys.forEach(k=>{ c.clubReputation[k]=Math.max(0,Math.min(100,Number(document.getElementById('rep-'+k).value)||0)); });
    saveLocalData(); closeFeatureModal(); renderData();
}

function renderMasterFeatureOverview(career) {
    const c = career || {};
    const hasCareer = !!career;
    const staff = Array.isArray(c.staff) ? c.staff : [];
    const trophies = Array.isArray(c.trophies) ? c.trophies : [];
    const seasons = Array.isArray(c.seasons) ? c.seasons : [];
    const clubs = Array.isArray(c.clubes) ? c.clubes : [];
    const objectives = Array.isArray(c.objectives) ? c.objectives : [];
    const calendar = Array.isArray(c.calendar) ? c.calendar : [];
    const currentClub = clubs.length ? clubs[clubs.length - 1] : null;
    const board = c.boardManagement || {};
    const scenario = c.seasonScenario || {};
    const rep = c.clubReputation || { national:50, international:20, prestige:50, fan:50, media:50, playerAttraction:50, staffAttraction:50 };
    const totalSalary = staff.reduce((sum, x) => sum + (Number(x.salary) || 0), 0);
    const avgQuality = staff.length ? Math.round(staff.reduce((sum,x)=>sum+(Number(x.quality)||0),0)/staff.length) : 0;
    const objectiveAvg = objectives.length ? Math.round(objectives.reduce((sum,x)=>sum+Math.max(0,Math.min(100,Number(x.progress)||0)),0)/objectives.length) : 0;
    const titleRows = trophies.length ? trophies.slice().reverse().map(t=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-center"><div><strong class="text-amber-300 text-sm">🏆 ${escapeHtml(t.name||'Título')}</strong><span class="text-xs text-slate-400 block">${escapeHtml(t.season||'-')} • ${escapeHtml(t.club||currentClub?.clube||'-')}</span></div></div>`).join('') : '<p class="text-xs text-slate-500 italic">Nenhum título detalhado registrado.</p>';
    const objectiveRows = objectives.length ? objectives.map((o,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="flex justify-between gap-3"><strong class="text-white text-sm">${escapeHtml(o.title||'Objetivo')}</strong><span class="text-xs text-cyan-300">${Math.round(Number(o.progress)||0)}%</span></div><p class="text-xs text-slate-400 mt-1">Meta: ${escapeHtml(o.target||'-')} • ${escapeHtml(o.status||'Em andamento')}</p><div class="h-2 bg-slate-800 rounded-full mt-2 overflow-hidden"><div class="h-2 bg-cyan-400" style="width:${Math.max(0,Math.min(100,Number(o.progress)||0))}%"></div></div></div>`).join('') : '<p class="text-xs text-slate-500 italic">Nenhum objetivo cadastrado.</p>';
    const seasonRows = seasons.length ? seasons.slice().reverse().map(x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="flex justify-between"><strong class="text-white text-sm">${escapeHtml(x.season||'-')}</strong><span class="text-xs text-slate-400">${x.games||0} jogos</span></div><div class="text-xs text-slate-400 mt-1">${x.wins||0}V • ${x.draws||0}E • ${x.losses||0}D • ${x.goals||0} GP • ${x.assists||0} GC</div></div>`).join('') : '<p class="text-xs text-slate-500 italic">Nenhuma temporada registrada.</p>';
    const clubRows = clubs.length ? clubs.slice().reverse().map(x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><strong class="text-white text-sm">${escapeHtml(x.clube||x.nome||x.name||'Clube')}</strong><span class="block text-xs text-slate-400 mt-1">${escapeHtml(x.temporada||x.tempoClube||'Passagem registrada')}</span></div>`).join('') : '<p class="text-xs text-slate-500 italic">Nenhum clube registrado.</p>';
    const repItems=[['Nacional','national'],['Internacional','international'],['Prestígio','prestige'],['Torcida','fan'],['Imprensa','media']];
    const repRows=repItems.map(([label,key])=>{const v=Math.max(0,Math.min(100,Number(rep[key]??0)));return `<div><div class="flex justify-between text-xs"><span class="text-slate-400">${label}</span><strong class="text-white">${v}/100</strong></div><div class="h-2 bg-slate-800 rounded-full mt-1 overflow-hidden"><div class="h-2 bg-purple-400" style="width:${v}%"></div></div></div>`}).join('');
    const overview=`<div data-master-panel="overview" class="master-panel master-active space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="feature-panel"><span class="text-[10px] text-slate-400 uppercase font-bold">Clube atual</span><strong class="block text-white text-lg mt-1">${escapeHtml(currentClub?.clube||currentClub?.nome||currentClub?.name||'Nenhum')}</strong></div>
            <div class="feature-panel"><span class="text-[10px] text-slate-400 uppercase font-bold">Temporada</span><strong class="block text-cyan-300 text-lg mt-1">${escapeHtml(scenario.season||'Não definida')}</strong></div>
            <div class="feature-panel"><span class="text-[10px] text-slate-400 uppercase font-bold">Posição</span><strong class="block text-amber-300 text-lg mt-1">${scenario.position ? scenario.position+'º' : '-'}</strong></div>
            <div class="feature-panel"><span class="text-[10px] text-slate-400 uppercase font-bold">Confiança da diretoria</span><strong class="block text-emerald-300 text-lg mt-1">${Number(board.confidence??50)}/100</strong></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-chart-line text-cyan-400 mr-2"></i>Momento da temporada</h3><p>${scenario.matchesPlayed||0} jogos • ${scenario.points||0} pontos</p></div></div><div class="grid grid-cols-3 gap-3 text-center"><div><strong class="text-white text-xl">${scenario.matchesPlayed||0}</strong><span class="block text-[10px] text-slate-500">JOGOS</span></div><div><strong class="text-cyan-300 text-xl">${scenario.points||0}</strong><span class="block text-[10px] text-slate-500">PONTOS</span></div><div><strong class="text-amber-300 text-xl">${objectiveAvg}%</strong><span class="block text-[10px] text-slate-500">METAS</span></div></div></div>
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-users text-emerald-400 mr-2"></i>Resumo do clube</h3><p>${staff.length} profissional(is) na comissão</p></div></div><div class="space-y-3"><div class="flex justify-between text-xs"><span class="text-slate-400">Qualidade média</span><strong class="text-white">${avgQuality}/100</strong></div><div class="flex justify-between text-xs"><span class="text-slate-400">Folha da comissão</span><strong class="text-emerald-300">${currencySymbol()} ${money(totalSalary)} mil/mês</strong></div><div class="flex justify-between text-xs"><span class="text-slate-400">Prestígio</span><strong class="text-purple-300">${Number(rep.prestige??0)}/100</strong></div></div></div>
        </div>
        ${!hasCareer?'<p class="text-xs text-amber-300"><i class="fa-solid fa-circle-info mr-1"></i>Crie ou selecione uma carreira da Master Liga.</p>':''}
    </div>`;
    const club=`<div data-master-panel="club" class="master-panel space-y-4">
        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-people-group text-cyan-400 mr-2"></i>Comissão Técnica</h3><p>Gestão da equipe técnica e custo salarial.</p></div><button onclick="openStaffModal()" class="feature-action">Gerenciar</button></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${staff.length?staff.map(x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><strong class="text-white text-sm">${escapeHtml(x.name||'Profissional')}</strong><span class="block text-xs text-slate-400">${escapeHtml(x.role||'Sem função')} • ${Number(x.quality)||0}/100</span><span class="block text-xs text-emerald-300 mt-1">${currencySymbol()} ${money(Number(x.salary)||0)} mil/mês</span></div>`).join(''):'<p class="text-xs text-slate-500 italic">Nenhum profissional contratado.</p>'}</div></div>
        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-earth-americas text-purple-400 mr-2"></i>Reputação do Clube</h3><p>Indicadores institucionais do clube.</p></div><button onclick="openClubReputationModal()" class="feature-action purple">Editar</button></div><div class="space-y-3">${repRows}</div></div>
    </div>`;
    const season=`<div data-master-panel="season" class="master-panel space-y-4">
        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-calendar-days text-cyan-400 mr-2"></i>Temporada Atual</h3><p>Contexto esportivo e histórico recente.</p></div><button onclick="openSeasonScenarioModal()" class="feature-action">Atualizar</button></div><div class="grid grid-cols-2 md:grid-cols-4 gap-3"><div class="bg-black/30 rounded-xl p-3 text-center"><strong class="text-white text-xl">${scenario.matchesPlayed||0}</strong><span class="block text-[10px] text-slate-500">JOGOS</span></div><div class="bg-black/30 rounded-xl p-3 text-center"><strong class="text-cyan-300 text-xl">${scenario.points||0}</strong><span class="block text-[10px] text-slate-500">PONTOS</span></div><div class="bg-black/30 rounded-xl p-3 text-center"><strong class="text-amber-300 text-xl">${scenario.position?scenario.position+'º':'-'}</strong><span class="block text-[10px] text-slate-500">POSIÇÃO</span></div><div class="bg-black/30 rounded-xl p-3 text-center"><strong class="text-emerald-300 text-xl">${escapeHtml(scenario.form||'-')}</strong><span class="block text-[10px] text-slate-500">FASE</span></div></div></div>
        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-clock-rotate-left text-slate-400 mr-2"></i>Histórico de Temporadas</h3><p>Campanhas registradas na carreira.</p></div></div><div class="space-y-2">${seasonRows}</div></div>
        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-list-check text-cyan-400 mr-2"></i>Calendário</h3><p>${calendar.length} jogo(s) registrado(s).</p></div><button onclick="openCalendarModal()" class="feature-action">+ Jogo</button></div><div class="space-y-2 max-h-64 overflow-y-auto">${calendar.length?calendar.slice().reverse().map(x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between"><div><strong class="text-white text-sm">${escapeHtml(x.date||'-')}</strong><span class="text-cyan-400 text-xs ml-2">${escapeHtml(x.competition||'')}</span><div class="text-xs text-slate-400">${escapeHtml(x.opponent||'')} • ${escapeHtml(x.homeAway||'')}</div></div><span class="text-xs font-bold">${escapeHtml(x.result||'')} ${x.score?'• '+escapeHtml(x.score):''}</span></div>`).join(''):'<p class="text-xs text-slate-500 italic">Nenhum jogo registrado.</p>'}</div></div>
    </div>`;
    const goals=`<div data-master-panel="objectives" class="master-panel space-y-4">
        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-bullseye text-amber-400 mr-2"></i>Objetivos da Diretoria</h3><p>Acompanhe as metas e a pressão sobre o trabalho.</p></div><button onclick="openObjectiveModal()" class="feature-action gold">+ Objetivo</button></div><div class="space-y-3">${objectiveRows}</div></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="feature-panel"><h3><i class="fa-solid fa-building-columns text-amber-300 mr-2"></i>Diretoria & Conselho</h3><p class="text-xs text-slate-400 mt-1">${escapeHtml(board.mood||'Estável')}</p><div class="mt-3 space-y-2 text-xs"><div class="flex justify-between"><span class="text-slate-400">Confiança</span><strong>${Number(board.confidence??50)}/100</strong></div><div class="flex justify-between"><span class="text-slate-400">Pressão</span><strong>${Number(board.pressure??0)}/100</strong></div></div><button onclick="openBoardManagementModal()" class="feature-action gold w-full mt-3">Gerenciar</button></div><div class="feature-panel"><h3><i class="fa-solid fa-chart-line text-cyan-300 mr-2"></i>Desempenho das metas</h3><div class="text-3xl font-black text-cyan-300 mt-2">${objectiveAvg}%</div><p class="text-xs text-slate-400 mt-1">média dos objetivos atuais</p></div></div>
    </div>`;
    const history=`<div data-master-panel="history" class="master-panel space-y-4">
        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-trophy text-amber-400 mr-2"></i>Títulos & História</h3><p>Legado e conquistas registradas na Master Liga.</p></div><button onclick="openDetailedTrophyModal()" class="feature-action gold">+ Título</button></div><div class="space-y-2">${titleRows}</div></div>
        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-timeline text-cyan-400 mr-2"></i>Histórico de Clubes</h3><p>Passagens registradas na carreira.</p></div><button onclick="openModal()" class="feature-action">+ Clube</button></div><div class="space-y-2">${clubRows}</div></div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3"><div class="feature-panel text-center"><strong class="text-2xl text-amber-300">${trophies.length}</strong><span class="block text-[10px] text-slate-500 uppercase">Títulos</span></div><div class="feature-panel text-center"><strong class="text-2xl text-cyan-300">${seasons.length}</strong><span class="block text-[10px] text-slate-500 uppercase">Temporadas</span></div><div class="feature-panel text-center"><strong class="text-2xl text-emerald-300">${clubs.length}</strong><span class="block text-[10px] text-slate-500 uppercase">Clubes</span></div></div>
    </div>`;
    return `<div class="feature-panel master-new-features">${overview}${club}${season}${goals}${history}</div>`;
}
function renderNewFeatures() {
    const container = document.getElementById('new-features-container');
    if (!container) return;
    const career = featureCareer();
    if (!career) {
        if (currentMode === 'master_liga') {
            container.innerHTML = renderMasterFeatureOverview(null);
        } else {
            container.innerHTML = '';
        }
        return;
    }
    ensureFeatureData(career);
    const isRumo = currentMode === 'rumo_ao_estrelato';
    // Master Liga recebe somente os módulos do treinador/clube.
    if (!isRumo) {
        container.innerHTML = renderMasterFeatureOverview(career);
        return;
    }
    ensurePersonalLifeData(career);
    const calendar = career.calendar || [], seasons = career.seasons || [], trophies = career.trophies || [], news = career.news || [], competitions = career.competitions || [];
    const objectives = career.objectives || [], market = career.market || [];
    const awards = career.awards || [], injuries = career.injuries || [], events = career.events || [];
    const f = career.finance || {}, m = career.manager || {}, r = career.records || {};
    const staff = career.staff || [];
    const clubRep = career.clubReputation || {national:50,international:20,prestige:50,fan:50,media:50,playerAttraction:50,staffAttraction:50};
    const popularity = Number(career.popularity || 0);
    const pf = career.playerFinance || { salary: 0, balance: 0, monthlyExpenses: 0, lifestyle: 'Confortável', home: {name:'Apartamento simples',value:0}, car:{name:'Sem carro',value:0}, investments:0, transactions:[] };
    const playerBalance = Number(pf.balance || 0);
    ensurePlayerCareerSystems(career);
    const rows = (items, empty, fn) => items.length ? items.map(fn).join('') : `<p class="text-xs text-slate-500 italic">${empty}</p>`;
    const seasonRows = rows(seasons,'Nenhuma temporada registrada.',(x,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="flex justify-between gap-3"><div><strong class="text-white text-sm">${escapeHtml(x.season||'-')}</strong><span class="text-cyan-400 text-xs ml-2">${escapeHtml(x.club||'-')}</span></div><span class="text-xs text-slate-400">${x.games||0} jogos</span></div><div class="text-xs text-slate-400 mt-1">${x.wins||0}V • ${x.draws||0}E • ${x.losses||0}D • ${x.goals||0} G • ${x.assists||0} A • ${x.titles||0} títulos</div>${x.notes?`<p class="text-xs text-slate-500 mt-1">${escapeHtml(x.notes)}</p>`:''}</div>`);
    const trophyRows = rows(trophies,'Nenhum troféu detalhado.',(t,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-center"><div><strong class="text-amber-300 text-sm">🏆 ${escapeHtml(t.name)}</strong><span class="text-xs text-slate-400 block">${escapeHtml(t.season)} • ${escapeHtml(t.club)}</span></div><button onclick="deleteDetailedTrophy(${i})" class="text-rose-400"><i class="fa-solid fa-trash"></i></button></div>`);
    const compRows = rows(competitions,'Nenhuma competição registrada.',x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><strong class="text-white text-sm">${escapeHtml(x.competition)}</strong><span class="text-xs text-cyan-400 ml-2">${escapeHtml(x.season)}</span><div class="text-xs text-slate-400 mt-1">${x.games||0}J • ${x.wins||0}V • ${x.draws||0}E • ${x.losses||0}D • ${x.goals||0}G • ${x.assists||0}A</div><span class="text-xs text-amber-300">${escapeHtml(x.result||'')}</span></div>`);
    const objectiveRows = rows(objectives,'Nenhum objetivo cadastrado.',(x,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="flex justify-between"><strong class="text-white text-sm">${escapeHtml(x.title)}</strong><button onclick="deleteObjective(${i})" class="text-rose-400"><i class="fa-solid fa-trash"></i></button></div><div class="text-xs text-slate-400 mt-1">Meta: ${escapeHtml(x.target)} • ${escapeHtml(x.status)}</div><div class="h-2 bg-slate-800 rounded-full mt-2 overflow-hidden"><div class="h-2 bg-cyan-400" style="width:${Number(x.progress||0)}%"></div></div></div>`);
    const marketRows = rows(market,'Nenhum jogador no mercado.',x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between"><div><strong class="text-white text-sm">${escapeHtml(x.name)}</strong><span class="block text-xs text-slate-400">${escapeHtml(x.position)} • ${x.age} anos • OVR ${x.overall}</span></div><div class="text-right"><span class="text-xs text-emerald-400">${currencySymbol()} ${money(x.price)}M</span><span class="block text-[10px] text-cyan-400">${escapeHtml(x.status)}</span></div></div>`);
    const newsRows = rows(news.slice().reverse(),'Nenhuma notícia criada.',n=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="text-[10px] text-cyan-400 font-mono">${escapeHtml(n.date||'')}</div><strong class="text-white text-sm block mt-1">${escapeHtml(n.title)}</strong><p class="text-xs text-slate-400 mt-1">${escapeHtml(n.text||'')}</p></div>`);
    const history = (career.clubes||[]).map((c,i)=>`<div class="relative pl-5 pb-4 border-l border-cyan-500/20"><span class="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-cyan-400"></span><strong class="text-white text-sm">${escapeHtml(c.clube||c.nome||c.name||'Clube')}</strong><span class="text-xs text-slate-400 ml-2">${escapeHtml((c.tempoClube ? '• '+c.tempoClube : '') + (c.temporada ? ' • '+c.temporada : ''))}</span></div>`).join('') || '<p class="text-xs text-slate-500 italic">Nenhuma passagem registrada.</p>';
    const recordCards = `<div class="grid grid-cols-2 md:grid-cols-5 gap-2">${[['bestSeasonGoals','Gols em uma temporada'],['bestSeasonAssists','Assistências em uma temporada'],['mostGamesClub','Jogos por um clube'],['mostTitles','Mais títulos'],['hatTricks','Hat-tricks']].map(x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 text-center"><strong class="text-2xl text-white block">${Number(r[x[0]]||0)}</strong><span class="text-[10px] text-slate-400">${x[1]}</span></div>`).join('')}</div>`;
    const awardRows = rows(awards.slice().reverse(),'Nenhum prêmio individual registrado.',(x,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-start"><div><strong class="text-amber-300 text-sm">🏅 ${escapeHtml(x.name||'Prêmio')}</strong><span class="block text-xs text-slate-400">${escapeHtml(x.season||'-')} • ${escapeHtml(x.club||'-')} • ${escapeHtml(x.competition||'-')}</span>${x.note?`<p class="text-xs text-slate-500 mt-1">${escapeHtml(x.note)}</p>`:''}</div><button onclick="deleteAward(${awards.length-1-i})" class="text-rose-400"><i class="fa-solid fa-trash"></i></button></div>`);
    const injuryRows = rows(injuries.slice().reverse(),'Nenhuma lesão registrada.',(x,i)=>{ const realIndex = injuries.length - 1 - i; return `<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-start gap-3"><div><strong class="text-white text-sm">🚑 ${escapeHtml(x.name||'Lesão')}</strong><span class="block text-xs text-slate-400">${escapeHtml(x.date||'-')} • ${escapeHtml(x.severity||'')} • ${x.days||0} dias • ${x.gamesLost||0} jogos perdidos</span></div><div class="flex items-center gap-3"><div class="text-xs ${x.status==='Recuperado'?'text-emerald-400':'text-amber-300'}">${escapeHtml(x.status||'')}</div><button onclick="openInjuryModal(${realIndex})" class="text-cyan-400" title="Editar lesão"><i class="fa-solid fa-pen-to-square"></i></button><button onclick="deleteInjury(${realIndex})" class="text-rose-400" title="Excluir lesão"><i class="fa-solid fa-trash"></i></button></div></div>`; });
    const discipline = career.discipline || { yellowCards: 0, redCards: 0 };
    const eventRows = rows(events.slice().reverse(),'Nenhum evento de carreira registrado.',(x,i)=>`<div class="relative pl-5 pb-4 border-l border-cyan-500/20"><span class="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-cyan-400"></span><div class="text-[10px] text-cyan-400">${escapeHtml(x.date||'-')} • ${escapeHtml(x.type||'')}</div><strong class="text-white text-sm block">${escapeHtml(x.title||'Evento')}</strong>${x.note?`<p class="text-xs text-slate-500 mt-1">${escapeHtml(x.note)}</p>`:''}</div>`);

    container.innerHTML = `<section class="space-y-6">
        <div class="feature-panel border-cyan-500/20">
            <div class="feature-head">
                <div>
                    <h3><i class="fa-solid fa-star text-amber-400 mr-2"></i>Experiência do Jogador</h3>
                    <p>Novos sistemas do Become a Legend: rivalidades, reputação, torcida, coletivas, agente e fases da carreira.</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                    <div class="flex justify-between items-start gap-3"><div><span class="text-[10px] uppercase tracking-wider text-slate-500">Rivalidades</span><strong class="block text-white text-lg mt-1">${career.rivalries.length}</strong></div><i class="fa-solid fa-fire text-rose-400 text-lg"></i></div>
                    <p class="text-xs text-slate-500 mt-2">Confrontos e histórico contra rivais individuais.</p>
                    <button onclick="openRivalriesModal()" class="feature-action w-full mt-3">Abrir rivalidades</button>
                </div>
                <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                    <div class="flex justify-between items-start gap-3"><div><span class="text-[10px] uppercase tracking-wider text-slate-500">Reputação por clube</span><strong class="block text-cyan-300 text-lg mt-1">${career.clubReputationsPlayer.length}</strong></div><i class="fa-solid fa-shield-halved text-cyan-400 text-lg"></i></div>
                    <p class="text-xs text-slate-500 mt-2">Sua marca e legado individual em cada clube.</p>
                    <button onclick="openPlayerClubReputationModal()" class="feature-action w-full mt-3">Ver reputação</button>
                </div>
                <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                    <div class="flex justify-between items-start gap-3"><div><span class="text-[10px] uppercase tracking-wider text-slate-500">Torcida</span><strong class="block text-emerald-300 text-lg mt-1">${Number(career.fanbase.support)}%</strong></div><i class="fa-solid fa-people-group text-emerald-400 text-lg"></i></div>
                    <p class="text-xs text-slate-500 mt-2">Apoio, confiança e clima da torcida.</p>
                    <button onclick="openFanbaseModal()" class="feature-action w-full mt-3">Gerenciar torcida</button>
                </div>
                <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                    <div class="flex justify-between items-start gap-3"><div><span class="text-[10px] uppercase tracking-wider text-slate-500">Coletivas</span><strong class="block text-purple-300 text-lg mt-1">${Number(career.pressConferences.count || 0)}</strong></div><i class="fa-solid fa-microphone text-purple-400 text-lg"></i></div>
                    <p class="text-xs text-slate-500 mt-2">Responda jornalistas e afete sua imagem profissional.</p>
                    <button onclick="openPressConferenceModal()" class="feature-action w-full mt-3">Dar coletiva</button>
                </div>
                <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                    <div class="flex justify-between items-start gap-3"><div><span class="text-[10px] uppercase tracking-wider text-slate-500">Agente</span><strong class="block text-amber-300 text-lg mt-1">${escapeHtml(career.agentCareer.name || career.profile?.empresario || 'Não definido')}</strong></div><i class="fa-solid fa-briefcase text-amber-400 text-lg"></i></div>
                    <p class="text-xs text-slate-500 mt-2">Acompanhe confiança, movimentações e rumores.</p>
                    <button onclick="openAgentCareerModal()" class="feature-action w-full mt-3">Abrir agente</button>
                </div>
                <div class="bg-black/30 border border-white/5 rounded-xl p-4">
                    <div class="flex justify-between items-start gap-3"><div><span class="text-[10px] uppercase tracking-wider text-slate-500">Fase da carreira</span><strong class="block text-white text-lg mt-1">${escapeHtml(getCareerPhaseLabel(career))}</strong></div><i class="fa-solid fa-stairs text-cyan-400 text-lg"></i></div>
                    <p class="text-xs text-slate-500 mt-2">Momento atual e evolução da trajetória profissional.</p>
                    <button onclick="openCareerPhaseModal()" class="feature-action w-full mt-3">Ver fase da carreira</button>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-calendar-days text-cyan-400 mr-2"></i>Calendário</h3><p>Agenda e resultados</p></div><button onclick="openCalendarModal()" class="feature-action">+ Jogo</button></div><div class="space-y-2 max-h-64 overflow-y-auto">${rows(calendar,'Nenhum jogo registrado.',x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between"><div><strong class="text-white text-sm">${escapeHtml(x.date||'-')}</strong><span class="text-cyan-400 text-xs ml-2">${escapeHtml(x.competition||'')}</span><div class="text-xs text-slate-400">${escapeHtml(x.opponent||'')} • ${escapeHtml(x.homeAway||'')}</div></div><span class="text-xs font-bold">${escapeHtml(x.result||'')} ${x.score?'• '+escapeHtml(x.score):''}</span></div>`)}</div></div>
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-clock-rotate-left text-cyan-400 mr-2"></i>Temporadas</h3><p>Histórico de cada temporada</p></div><div class="flex gap-2"><button onclick="openSeasonSummaryModal()" class="feature-action gold">Resumo</button><button onclick="openSeasonModal()" class="feature-action">+ Temporada</button></div></div><div class="space-y-2 max-h-64 overflow-y-auto">${seasonRows}</div></div>
        </div>

        ${isRumo ? `<div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-ranking-star text-purple-400 mr-2"></i>Evolução do Jogador</h3><p>Overall e atributos</p></div><button onclick="openAttributesModal()" class="feature-action purple">Editar</button></div><div class="text-center mb-4"><div class="text-xs text-slate-400">OVERALL</div><div class="text-5xl font-black text-cyan-400">${Number(career.attributes?.overall||0)}</div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-2">${[['Velocidade','velocidade'],['Aceleração','aceleracao'],['Finalização','finalizacao'],['Passe','passe'],['Drible','drible'],['Força','forca'],['Resistência','resistencia'],['Defesa','defesa']].map(x=>`<div class="bg-black/30 rounded-xl p-3"><div class="flex justify-between text-xs"><span class="text-slate-400">${x[0]}</span><strong class="text-white">${Number(career.attributes?.[x[1]]||0)}</strong></div><div class="h-2 bg-slate-800 rounded-full mt-2"><div class="h-2 bg-cyan-400" style="width:${Math.min(100,Number(career.attributes?.[x[1]]||0))}%"></div></div></div>`).join('')}</div></div>` : ''}

        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-route text-cyan-400 mr-2"></i>Linha do Tempo da Carreira</h3><p>Veja sua trajetória por clubes</p></div></div><div class="pt-2">${history}</div></div>

        <div class="feature-panel">
            <div class="feature-head"><div><h3><i class="fa-solid fa-trophy text-amber-400 mr-2"></i>Sala de Troféus</h3><p>Conquistas detalhadas do clube/jogador</p></div><button onclick="openDetailedTrophyModal()" class="feature-action gold">+ Título</button></div>
            <div class="space-y-2 max-h-60 overflow-y-auto">${trophyRows}</div>
        </div>

        ${isRumo ? `
        <div class="feature-panel personal-life-hub">
            <div class="feature-head">
                <div>
                    <h3><i class="fa-solid fa-user-circle text-pink-400 mr-2"></i>Vida Pessoal</h3>
                    <p>Organize sua vida fora dos gramados por categorias</p>
                </div>
            </div>

            <div class="personal-life-grid">
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">❤️</span><div><h4>Relacionamentos</h4><p>Vida amorosa e decisões</p></div></div><button onclick="openRelationshipModal()" class="feature-action">Abrir</button></div>
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">👨‍👩‍👦</span><div><h4>Família & Amigos</h4><p>Apoio e amizades</p></div></div><button onclick="openPersonalLifeModal('family')" class="feature-action">Abrir</button></div>
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">👕</span><div><h4>Estilo & Aparência</h4><p>Roupas e celular</p></div></div><div class="flex gap-2"><button onclick="openPersonalLifeModal('wardrobe')" class="feature-action">Guarda-roupa</button><button onclick="openPersonalLifeModal('cellphone')" class="feature-action">Celular</button></div></div>
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">📱</span><div><h4>Mídia & Popularidade</h4><p>Imagem pública, seguidores e imprensa</p></div></div><div class="flex gap-2"><button onclick="openPersonalLifeModal('news')" class="feature-action">Abrir mídia</button><button onclick="openPersonalLifeModal('sponsorship')" class="feature-action">Patrocínios</button></div></div>
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">🏠</span><div><h4>Patrimônio</h4><p>Bens, veículos, imóveis e conquistas</p></div></div><button onclick="openPatrimonyModal()" class="feature-action gold">Gerenciar</button></div>
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">🏦</span><div><h4>Finanças</h4><p>Banco e saldo pessoal</p></div></div><div class="flex gap-2"><button onclick="openPersonalLifeModal('bank')" class="feature-action">Banco</button><button onclick="openPlayerFinanceModal()" class="feature-action green">Financeiro</button></div></div>
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">📊</span><div><h4>Vida & Objetivos</h4><p>Estado e metas pessoais</p></div></div><div class="flex gap-2"><button onclick="openPersonalLifeModal('state')" class="feature-action">Estado</button><button onclick="openPersonalLifeModal('goals')" class="feature-action">Objetivos</button></div></div>
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">👶</span><div><h4>Futuro</h4><p>Planos familiares</p></div></div><button onclick="openPersonalLifeModal('future')" class="feature-action">Abrir</button></div>
                <div class="personal-category"><div class="personal-category-head"><span class="personal-icon">🏆</span><div><h4>Hall Pessoal</h4><p>Conquistas fora do futebol</p></div></div><button onclick="openPersonalLifeModal('hall')" class="feature-action">Abrir</button></div>
                <div class="personal-category personal-category-wide"><div class="personal-category-head"><span class="personal-icon">⚡</span><div><h4>Eventos da Vida</h4><p>Registre acontecimentos importantes da sua vida pessoal</p></div></div><button onclick="openPersonalLifeModal('events')" class="feature-action">Abrir eventos</button></div>
            </div>
        </div>` : ''}

        ${isRumo ? `<div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-wallet text-emerald-400 mr-2"></i>Vida Financeira do Jogador</h3><p>Use seu salário para construir sua vida fora dos gramados</p></div><div class="flex gap-2"><button onclick="openPlayerFinanceModal()" class="feature-action green">Gerenciar</button><button onclick="receivePlayerSalary()" class="feature-action">+ Salário</button></div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><div class="bg-black/30 p-3 rounded-xl">Salário<strong class="block text-emerald-400">${moneyBR(pf.salary)}</strong></div><div class="bg-black/30 p-3 rounded-xl">Saldo<strong class="block ${playerBalance>=0?'text-cyan-400':'text-rose-400'}">${moneyBR(playerBalance)}</strong></div><div class="bg-black/30 p-3 rounded-xl">Moradia<strong class="block text-white">${escapeHtml(pf.home?.name||'Apartamento simples')}</strong></div><div class="bg-black/30 p-3 rounded-xl">Carro<strong class="block text-white">${escapeHtml(pf.car?.name||'Sem carro')}</strong></div></div><div class="mt-3 text-xs text-slate-400 flex flex-wrap gap-4"><span>Estilo: <strong class="text-white">${escapeHtml(pf.lifestyle||'Confortável')}</strong></span><span>Investimentos: <strong class="text-amber-300">${moneyBR(pf.investments||0)}</strong></span></div><div class="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5"><button onclick="playerExpense('restaurante')" class="feature-action">🍽️ Restaurante</button><button onclick="playerExpense('lazer')" class="feature-action">🎮 Lazer</button><button onclick="playerExpense('viagem')" class="feature-action">✈️ Viagem</button><button onclick="playerExpense('presente')" class="feature-action">🎁 Presente</button><button onclick="playerExpense('treinamento')" class="feature-action">🏋️ Treinamento</button><button onclick="investPlayerMoney()" class="feature-action gold">📈 Investir</button></div></div>` : ''}

        ${isRumo ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-arrow-right-arrow-left text-emerald-400 mr-2"></i>Mercado</h3><p>Jogadores e negociações</p></div><button onclick="openMarketModal()" class="feature-action green">+ Jogador</button></div><div class="space-y-2 max-h-52 overflow-y-auto">${marketRows}</div></div><div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-star text-orange-400 mr-2"></i>Popularidade</h3><p>Impacto do jogador</p></div><button onclick="openPopularityModal()" class="feature-action">Editar</button></div><div class="text-center py-5"><div class="text-5xl font-black text-orange-400">${popularity}%</div><div class="h-2 bg-slate-800 rounded-full mt-3"><div class="h-2 bg-orange-400" style="width:${popularity}%"></div></div></div></div></div>` : ''}


        ${!isRumo ? `<div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-bullseye text-cyan-400 mr-2"></i>Objetivos da Temporada</h3><p>Metas da diretoria e do clube</p></div><button onclick="openObjectiveModal()" class="feature-action">+ Objetivo</button></div><div class="space-y-2 max-h-60 overflow-y-auto">${objectiveRows}</div></div>` : ''}

        ${!isRumo ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-coins text-emerald-400 mr-2"></i>Finanças</h3><p>Somente na Master Liga</p></div><button onclick="openFinanceModal()" class="feature-action green">Editar</button></div><div class="grid grid-cols-2 gap-2 text-xs"><div class="bg-black/30 p-3 rounded-xl">Orçamento<strong class="block text-emerald-400">${currencySymbol()} ${money(f.budget)}M</strong></div><div class="bg-black/30 p-3 rounded-xl">Folha<strong class="block text-white">${currencySymbol()} ${money(f.salaryBudget)}M</strong></div><div class="bg-black/30 p-3 rounded-xl">Receitas<strong class="block text-cyan-400">${currencySymbol()} ${money(f.revenue)}M</strong></div><div class="bg-black/30 p-3 rounded-xl">Despesas<strong class="block text-rose-400">${currencySymbol()} ${money(f.expenses)}M</strong></div></div><div class="text-center text-sm font-bold mt-3 ${balance>=0?'text-emerald-400':'text-rose-400'}">Saldo: ${currencySymbol()} ${money(balance)}M</div></div><div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-user-tie text-amber-400 mr-2"></i>Sistema de Treinador</h3><p>Diretoria, reputação e torcida</p></div><button onclick="openManagerModal()" class="feature-action gold">Editar</button></div><div class="grid grid-cols-3 gap-2 text-center"><div><strong class="text-amber-300 text-2xl">${m.reputation||1}/5</strong><span class="block text-[10px] text-slate-400">Reputação</span></div><div><strong class="text-cyan-400 text-2xl">${m.confidence||0}%</strong><span class="block text-[10px] text-slate-400">Diretoria</span></div><div><strong class="text-emerald-400 text-2xl">${m.fanSupport||0}%</strong><span class="block text-[10px] text-slate-400">Torcida</span></div></div></div></div>` : ''}



        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-newspaper text-cyan-400 mr-2"></i>Central de Notícias</h3><p>Momentos importantes da carreira</p></div><button onclick="openNewsModal()" class="feature-action">+ Notícia</button></div><div class="space-y-2 max-h-64 overflow-y-auto">${newsRows}</div></div>

        ${isRumo ? `<div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-crown text-amber-400 mr-2"></i>Recordes Pessoais</h3><p>Marcas históricas do jogador</p></div><button onclick="openRecordsModal()" class="feature-action gold">Editar</button></div>${recordCards}</div>` : ''}

        ${isRumo ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-award text-amber-400 mr-2"></i>Prêmios Individuais</h3><p>Bola de Ouro, Chuteira de Ouro e outros</p></div><button onclick="openAwardModal()" class="feature-action gold">+ Prêmio</button></div><div class="space-y-2 max-h-60 overflow-y-auto">${awardRows}</div></div>
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-heart-pulse text-rose-400 mr-2"></i>Histórico de Lesões</h3><p>Períodos afastado e jogos perdidos — editável</p></div><button onclick="openInjuryModal()" class="feature-action">+ Lesão</button></div><div class="space-y-2 max-h-60 overflow-y-auto">${injuryRows}</div></div>
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-triangle-exclamation text-amber-400 mr-2"></i>Cartões Disciplinares</h3><p>Totais gerais do jogador — exclusivo do Become a Legend</p></div><button onclick="openDisciplineModal()" class="feature-action gold">Editar</button></div><div class="grid grid-cols-2 gap-3 text-center"><div class="bg-black/30 border border-amber-500/20 rounded-xl p-4"><strong class="text-3xl text-amber-300">${Number(discipline.yellowCards||0)}</strong><span class="block text-xs text-slate-400 mt-1">🟨 Amarelos</span></div><div class="bg-black/30 border border-rose-500/20 rounded-xl p-4"><strong class="text-3xl text-rose-400">${Number(discipline.redCards||0)}</strong><span class="block text-xs text-slate-400 mt-1">🟥 Vermelhos</span></div></div></div>
        </div>` : ''}

        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-timeline text-cyan-400 mr-2"></i>Linha do Tempo da Carreira</h3><p>Momentos marcantes da trajetória</p></div><button onclick="openCareerEventModal()" class="feature-action">+ Evento</button></div><div class="max-h-60 overflow-y-auto pt-2">${eventRows}</div></div>

        <div class="feature-panel"><div class="flex flex-wrap justify-between items-center gap-3"><div><h3 class="font-bold text-white"><i class="fa-solid fa-cloud-arrow-up text-cyan-400 mr-2"></i>Sincronização e Backup</h3><p class="text-xs text-slate-400">Google: sincronização online entre dispositivos. Backup: arquivo manual.</p></div><div class="flex gap-2"><button onclick="syncToServer().then(()=>alert('Sincronização concluída.'))" class="feature-action">Sincronizar</button><button onclick="exportCareerBackup()" class="feature-action">Exportar</button><label class="feature-action cursor-pointer">Importar<input type="file" accept="application/json" onchange="importCareerBackup(event)" class="hidden"></label></div></div></div>
    </section>`;
    organizeBALFeaturePanels(container);
}

// Organiza o conteúdo grande do Become a Legend dentro das abas.
// Os módulos continuam sendo renderizados normalmente, mas passam a
// aparecer somente na categoria correspondente.
function organizeBALFeaturePanels(container) {
    if (currentMode !== 'rumo_ao_estrelato' || !container) return;
    const root = container.querySelector(':scope > section');
    if (!root) return;
    const nodes = Array.from(root.children);
    nodes.forEach(node => {
        node.removeAttribute('data-bal-feature-panel');
        node.classList.remove('bal-feature-active');
        node.classList.add('bal-feature-panel');
    });
    nodes.forEach(node => {
        const html = (node.innerHTML || '').toLowerCase();
        let tab = 'overview';
        if (html.includes('evolução do jogador') || html.includes('recordes pessoais') || html.includes('histórico de lesões') || html.includes('cartões disciplinares') || html.includes('linha do tempo da carreira')) tab = 'stats';
        if (html.includes('sala de troféus') || html.includes('prêmios individuais')) tab = 'titles';
        if (html.includes('vida pessoal') || html.includes('vida financeira do jogador') || html.includes('mercado') || html.includes('popularidade')) tab = 'profile';
        if (html.includes('linha do tempo da carreira') && html.includes('momentos marcantes')) tab = 'events';
        if (html.includes('central de notícias')) tab = 'overview';
        if (html.includes('sincronização e backup')) tab = 'overview';
        node.setAttribute('data-bal-feature-panel', tab);
    });
    const active = document.querySelector('[data-bal-tab].active')?.getAttribute('data-bal-tab') || 'overview';
    updateBALFeaturePanelVisibility(active);
}

function updateBALFeaturePanelVisibility(tab) {
    document.querySelectorAll('[data-bal-feature-panel]').forEach(el => {
        const active = el.getAttribute('data-bal-feature-panel') === tab;
        el.classList.toggle('bal-feature-active', active);
    });
}

function openCalendarModal() {
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Registrar Jogo', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Data</label><input id="fm-date" type="date" class="feature-input w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Competição</label><input id="fm-comp" placeholder="Brasileirão" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Adversário</label><input id="fm-opp" placeholder="Flamengo" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Casa/Fora</label><select id="fm-ha" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Casa</option><option>Fora</option><option>Neutro</option></select></div><div><label class="text-xs text-slate-400">Resultado</label><select id="fm-result" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Pendente</option><option>Vitória</option><option>Empate</option><option>Derrota</option></select></div><div><label class="text-xs text-slate-400">Placar</label><input id="fm-score" placeholder="2 x 1" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Adicionar', 'saveCalendarMatch()');
}
function saveCalendarMatch() { const c=featureCareer(); if(!c)return; c.calendar.push({date:document.getElementById('fm-date').value,competition:document.getElementById('fm-comp').value.trim(),opponent:document.getElementById('fm-opp').value.trim(),homeAway:document.getElementById('fm-ha').value,result:document.getElementById('fm-result').value,score:document.getElementById('fm-score').value.trim()}); saveLocalData(); closeFeatureModal(); renderData(); }
function deleteCalendarMatch(i) { const c=featureCareer(); if(c&&confirm('Remover este jogo?')){c.calendar.splice(i,1);saveLocalData();renderData();} }

function openSquadModal() { showFeatureModal('Adicionar Jogador ao Elenco', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Nome</label><input id="fm-player" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Posição</label><input id="fm-pos" placeholder="ATA" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Overall</label><input id="fm-overall" type="number" min="1" max="100" value="70" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Status</label><select id="fm-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Titular</option><option>Reserva</option><option>Rotação</option><option>Lesionado</option></select></div><div><label class="text-xs text-slate-400">Valor (${currencySymbol()}M)</label><input id="fm-value" type="number" step="0.1" value="1" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Adicionar', 'saveSquadPlayer()'); }
function saveSquadPlayer(){const c=featureCareer();if(!c)return;c.squad.push({name:document.getElementById('fm-player').value.trim(),position:document.getElementById('fm-pos').value.trim(),overall:Number(document.getElementById('fm-overall').value)||0,status:document.getElementById('fm-status').value,value:Number(document.getElementById('fm-value').value)||0});saveLocalData();closeFeatureModal();renderData();}
function deleteSquadPlayer(i){const c=featureCareer();if(c&&confirm('Remover jogador?')){c.squad.splice(i,1);saveLocalData();renderData();}}

function openAttributesModal(){const c=featureCareer();if(!c)return;const a=c.attributes;const fields=[['overall','Overall'],['velocidade','Velocidade'],['aceleracao','Aceleração'],['finalizacao','Finalização'],['passe','Passe'],['drible','Drible'],['forca','Força'],['resistencia','Resistência'],['defesa','Defesa'],['cabecio','Cabeceio']];showFeatureModal('Editar Atributos',`<div class="grid grid-cols-2 gap-3">${fields.map(x=>`<div><label class="text-xs text-slate-400">${x[1]}</label><input id="attr-${x[0]}" type="number" min="0" max="100" value="${Number(a[x[0]]||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}</div>`,'Salvar','saveAttributes()');}
function saveAttributes(){const c=featureCareer();if(!c)return;Object.keys(c.attributes).forEach(k=>{const el=document.getElementById('attr-'+k);if(el)c.attributes[k]=Math.max(0,Math.min(100,Number(el.value)||0));});saveLocalData();closeFeatureModal();renderData();}

function openDetailedTrophyModal(){showFeatureModal('Adicionar Troféu',`<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Título</label><input id="fm-trophy" placeholder="Champions League" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Temporada</label><input id="fm-trophy-season" placeholder="2027/28" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Clube</label><input id="fm-trophy-club" placeholder="Barcelona" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`,'Adicionar','saveDetailedTrophy()');}
function saveDetailedTrophy(){const c=featureCareer();if(!c)return;c.trophies.push({name:document.getElementById('fm-trophy').value.trim(),season:document.getElementById('fm-trophy-season').value.trim(),club:document.getElementById('fm-trophy-club').value.trim()});saveLocalData();closeFeatureModal();renderData();}
function deleteDetailedTrophy(i){const c=featureCareer();if(c&&confirm('Remover troféu?')){c.trophies.splice(i,1);saveLocalData();renderData();}}

function moneyBR(value) {
    return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function logPlayerTransaction(career, type, description, amount) {
    if (!career.playerFinance.transactions) career.playerFinance.transactions = [];
    career.playerFinance.transactions.unshift({ date: new Date().toLocaleDateString('pt-BR'), type, description, amount: Number(amount) || 0 });
    career.playerFinance.transactions = career.playerFinance.transactions.slice(0, 50);
}

function receivePlayerSalary() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const c = featureCareer();
    const salary = Number(c.playerFinance?.salary || 0);
    if (salary <= 0) return alert('Cadastre seu salário primeiro em Gerenciar.');
    c.playerFinance.balance = Number(c.playerFinance.balance || 0) + salary;
    logPlayerTransaction(c, 'entrada', 'Salário recebido', salary);
    saveLocalData();
    renderData();
}

function spendPlayerMoney(amount, description) {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return false;
    amount = Number(amount) || 0;
    if (amount <= 0) return false;
    if (Number(c.playerFinance.balance || 0) < amount) return alert('Saldo insuficiente.');
    c.playerFinance.balance -= amount;
    c.playerFinance.monthlyExpenses = Number(c.playerFinance.monthlyExpenses || 0) + amount;
    logPlayerTransaction(c, 'saída', description, -amount);
    saveLocalData();
    renderData();
    return true;
}

function openPlayerFinanceModal() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const c = featureCareer();
    const pf = c.playerFinance;
    const homeOptions = [
        ['Apartamento simples',0], ['Apartamento confortável',250000], ['Apartamento de luxo',1000000], ['Casa',2500000], ['Mansão',10000000]
    ];
    const carOptions = [
        ['Sem carro',0], ['Carro popular',70000], ['SUV',220000], ['Esportivo',650000], ['Supercarro',2500000]
    ];
    const lifeOptions = [['Econômico',5000],['Confortável',15000],['Luxuoso',50000]];
    showFeatureModal('Vida Financeira do Jogador', `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div><label class="text-xs text-slate-400">Salário mensal (${currencySymbol()})</label><input id="pf-salary" type="number" min="0" step="1000" value="${Number(pf.salary||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
                <div><label class="text-xs text-slate-400">Saldo atual (${currencySymbol()})</label><input id="pf-balance" type="number" min="0" step="1000" value="${Number(pf.balance||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
            </div>
            <div><label class="text-xs text-slate-400">Estilo de vida</label><select id="pf-lifestyle" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${lifeOptions.map(([n,v])=>`<option value="${n}" data-cost="${v}" ${pf.lifestyle===n?'selected':''}>${n} — ${moneyBR(v)}/mês</option>`).join('')}</select></div>
            <div><label class="text-xs text-slate-400">Moradia</label><select id="pf-home" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${homeOptions.map(([n,v])=>`<option value="${n}" data-value="${v}" ${pf.home?.name===n?'selected':''}>${n}${v?' — '+moneyBR(v):''}</option>`).join('')}</select></div>
            <div><label class="text-xs text-slate-400">Carro</label><select id="pf-car" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${carOptions.map(([n,v])=>`<option value="${n}" data-value="${v}" ${pf.car?.name===n?'selected':''}>${n}${v?' — '+moneyBR(v):''}</option>`).join('')}</select></div>
            <div><label class="text-xs text-slate-400">Investimentos (${currencySymbol()})</label><input id="pf-investments" type="number" min="0" step="1000" value="${Number(pf.investments||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
            <div class="bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-slate-400">Use <strong class="text-white">+ Salário</strong> para receber o salário no saldo e os botões de gastos para registrar despesas. As compras são descontadas do saldo.</div>
        </div>`, 'Salvar', 'savePlayerFinance()');
}

function savePlayerFinance() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const c = featureCareer();
    const pf = c.playerFinance;
    const home = document.getElementById('pf-home');
    const car = document.getElementById('pf-car');
    pf.salary = Math.max(0, Number(document.getElementById('pf-salary').value) || 0);
    pf.balance = Math.max(0, Number(document.getElementById('pf-balance').value) || 0);
    pf.lifestyle = document.getElementById('pf-lifestyle').value;
    pf.home = { name: home.value, value: Number(home.selectedOptions[0].dataset.value || 0) };
    pf.car = { name: car.value, value: Number(car.selectedOptions[0].dataset.value || 0) };
    pf.investments = Math.max(0, Number(document.getElementById('pf-investments').value) || 0);
    saveLocalData();
    closeFeatureModal();
    renderData();
}

function playerExpense(type) {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const presets = {
        restaurante: [500, 'Restaurante'],
        lazer: [1000, 'Lazer'],
        viagem: [5000, 'Viagem'],
        presente: [1500, 'Presente'],
        treinamento: [2000, 'Treinamento particular']
    };
    const [amount, label] = presets[type] || [0, 'Despesa'];
    const custom = prompt(`${label}\nValor da despesa em ${currencySymbol()} (padrão: ${moneyBR(amount)}):`, amount);
    if (custom === null) return;
    const value = Number(String(custom).replace(/[^0-9.,]/g,'').replace(/\./g,'').replace(',','.'));
    if (value > 0) spendPlayerMoney(value, label);
}

function investPlayerMoney() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const c = featureCareer();
    const value = Number(prompt('Quanto deseja investir? (${currencySymbol()})', '10000'));
    if (!value || value <= 0) return;
    if (Number(c.playerFinance.balance || 0) < value) return alert('Saldo insuficiente.');
    c.playerFinance.balance -= value;
    c.playerFinance.investments = Number(c.playerFinance.investments || 0) + value;
    logPlayerTransaction(c, 'investimento', 'Aplicação financeira', -value);
    saveLocalData();
    renderData();
}

function openFinanceModal(){const c=featureCareer();if(!c)return;const f=c.finance;showFeatureModal('Editar Finanças',`<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Orçamento (${currencySymbol()}M)</label><input id="fin-budget" type="number" step="0.1" value="${Number(f.budget||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Folha Salarial (${currencySymbol()}M)</label><input id="fin-salary" type="number" step="0.1" value="${Number(f.salaryBudget||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Receitas (${currencySymbol()}M)</label><input id="fin-revenue" type="number" step="0.1" value="${Number(f.revenue||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Despesas (${currencySymbol()}M)</label><input id="fin-expenses" type="number" step="0.1" value="${Number(f.expenses||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`,'Salvar','saveFinance()');}
function saveFinance(){const c=featureCareer();if(!c)return;c.finance={budget:Number(document.getElementById('fin-budget').value)||0,salaryBudget:Number(document.getElementById('fin-salary').value)||0,revenue:Number(document.getElementById('fin-revenue').value)||0,expenses:Number(document.getElementById('fin-expenses').value)||0};saveLocalData();closeFeatureModal();renderData();}

function openManagerModal(){const c=featureCareer();if(!c)return;const m=c.manager;showFeatureModal('Sistema de Treinador',`<div class="grid grid-cols-3 gap-3"><div><label class="text-xs text-slate-400">Reputação (1-5)</label><input id="mgr-rep" type="number" min="1" max="5" value="${Number(m.reputation||1)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Diretoria (%)</label><input id="mgr-conf" type="number" min="0" max="100" value="${Number(m.confidence||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Torcida (%)</label><input id="mgr-fans" type="number" min="0" max="100" value="${Number(m.fanSupport||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`,'Salvar','saveManager()');}
function saveManager(){const c=featureCareer();if(!c)return;c.manager={reputation:Math.max(1,Math.min(5,Number(document.getElementById('mgr-rep').value)||1)),confidence:Math.max(0,Math.min(100,Number(document.getElementById('mgr-conf').value)||0)),fanSupport:Math.max(0,Math.min(100,Number(document.getElementById('mgr-fans').value)||0))};saveLocalData();closeFeatureModal();renderData();}

function openNewsModal(){showFeatureModal('Nova Notícia',`<div class="space-y-3"><div><label class="text-xs text-slate-400">Manchete</label><input id="news-title" placeholder="Craque decide a final!" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Texto</label><textarea id="news-text" rows="4" placeholder="Descreva o acontecimento..." class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></textarea></div></div>`,'Publicar','saveNews()');}
function saveNews(){const c=featureCareer();if(!c)return;c.news.push({date:new Date().toLocaleDateString('pt-BR'),title:document.getElementById('news-title').value.trim(),text:document.getElementById('news-text').value.trim()});saveLocalData();closeFeatureModal();renderData();}

function openPopularityModal(){const c=featureCareer();if(!c)return;showFeatureModal('Atualizar Popularidade',`<label class="text-xs text-slate-400">Popularidade: <span id="pop-value">${Number(c.popularity||0)}%</span></label><input id="pop-input" type="range" min="0" max="100" value="${Number(c.popularity||0)}" oninput="document.getElementById('pop-value').innerText=this.value+'%'" class="w-full accent-orange-500 mt-3">`,'Salvar','savePopularity()');}
function savePopularity(){const c=featureCareer();if(!c)return;c.popularity=Number(document.getElementById('pop-input').value)||0;saveLocalData();closeFeatureModal();renderData();}

function openNationalTeamModal(){const c=featureCareer();if(!c)return;const n=c.nationalTeam;showFeatureModal('Seleção Nacional',`<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">País</label><input id="nt-country" value="${escapeHtml(n.country||'')}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>${[['games','Jogos'],['wins','Vitórias'],['draws','Empates'],['losses','Derrotas'],['goals','Gols'],['assists','Assistências'],['titles','Títulos']].map(x=>`<div><label class="text-xs text-slate-400">${x[1]}</label><input id="nt-${x[0]}" type="number" min="0" value="${Number(n[x[0]]||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}</div>`,'Salvar','saveNationalTeam()');}
function saveNationalTeam(){const c=featureCareer();if(!c)return;const n={country:document.getElementById('nt-country').value.trim()};['games','wins','draws','losses','goals','assists','titles'].forEach(k=>n[k]=Number(document.getElementById('nt-'+k).value)||0);c.nationalTeam=n;saveLocalData();closeFeatureModal();renderData();}

function openRecordsModal(){const c=featureCareer();if(!c)return;const r=c.records;showFeatureModal('Recordes Pessoais',`<div class="grid grid-cols-2 gap-3">${[['bestSeasonGoals','Mais gols em uma temporada'],['bestSeasonAssists','Mais assistências em uma temporada'],['mostGamesClub','Mais jogos por um clube'],['mostTitles','Maior número de títulos'],['hatTricks','Hat-tricks']].map(x=>`<div><label class="text-xs text-slate-400">${x[1]}</label><input id="rec-${x[0]}" type="number" min="0" value="${Number(r[x[0]]||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}</div>`,'Salvar','saveRecords()');}
function saveRecords(){const c=featureCareer();if(!c)return;Object.keys(c.records).forEach(k=>{const el=document.getElementById('rec-'+k);if(el)c.records[k]=Number(el.value)||0;});saveLocalData();closeFeatureModal();renderData();}

function exportCareerBackup(){const c=featureCareer();if(!c)return alert('Selecione uma carreira primeiro.');const payload={version:2,mode:currentMode,careerId:currentCareerId,career:c};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`pes2027_${currentMode}_${(c.name||'carreira').replace(/[^a-z0-9_-]+/gi,'_')}.json`;a.click();URL.revokeObjectURL(url);}
function importCareerBackup(event){const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(reader.result);if(!payload.career)throw new Error('Backup inválido');const id='career_'+Date.now();const imported=payload.career;ensureFeatureData(imported);if(!appData.users[currentUser][currentMode])appData.users[currentUser][currentMode]={};appData.users[currentUser][currentMode][id]=imported;currentCareerId=id;saveLocalData();updateCareerDropdown();alert('Backup importado com sucesso.');}catch(e){alert('Não foi possível importar o backup.');console.error(e);}event.target.value='';};reader.readAsText(file);}

// Intercepta o render original para manter todos os módulos sincronizados.
const _originalRenderData = renderData;
renderData = function() {
    _originalRenderData();
    const c = featureCareer();
    if (c) ensureFeatureData(c);
    renderNewFeatures();
};

// Garante a migração de carreiras antigas sem apagar nenhum dado existente.
const _originalSaveLocalData = saveLocalData;
saveLocalData = function() {
    if (appData && appData.users) {
        Object.values(appData.users).forEach(user => {
            ['rumo_ao_estrelato','master_liga'].forEach(mode => {
                const careers = user?.[mode] || {};
                Object.values(careers).forEach(ensureFeatureData);
            });
        });
    }
    _originalSaveLocalData();
};


// ============================================================
// BECOME A LEGEND 1.3 — RIVALIDADES, REPUTAÇÃO, TORCIDA,
// COLETIVAS, AGENTE E FASES DA CARREIRA
// ============================================================
function ensurePlayerCareerSystems(career) {
    career.rivalries ||= [];
    career.clubReputationsPlayer ||= [];
    career.fanbase ||= { support: 50, trust: 50, affection: 50, mood: 'Neutra', notes: '' };
    career.pressConferences ||= { count: 0, history: [], lastDate: '', lastImpact: '' };
    career.pressConferences.history ||= [];
    career.agentCareer ||= { name: career.profile?.empresario || '', agency: '', trust: 60, activity: 50, status: 'Ativo', lastAction: '', rumors: [] };
    career.agentCareer.rumors ||= [];
    career.careerPhase ||= { phase: '', yearsPro: 0, notes: '' };

    // Sincroniza automaticamente os clubes já registrados com a reputação individual.
    const clubs = Array.isArray(career.clubes) ? career.clubes : [];
    clubs.forEach(club => {
        const name = String(club?.clube || club?.nome || club?.name || '').trim();
        if (!name) return;
        if (!career.clubReputationsPlayer.some(x => String(x.club).toLowerCase() === name.toLowerCase())) {
            career.clubReputationsPlayer.push({ club: name, reputation: 50, seasons: club.temporada || '', titles: club.titulos || '', notes: '' });
        }
    });
}

function playerRepStatus(value) {
    const n = Number(value || 0);
    if (n >= 90) return 'Ídolo';
    if (n >= 75) return 'Muito querido';
    if (n >= 60) return 'Reconhecido';
    if (n >= 45) return 'Neutro';
    if (n >= 30) return 'Questionado';
    return 'Contestado';
}

function openRivalriesModal() {
    const c = featureCareer();
    if (!c || currentMode !== 'rumo_ao_estrelato') return;
    ensurePlayerCareerSystems(c);
    const rows = c.rivalries.length ? c.rivalries.map((r, i) => `
        <div class="bg-black/30 border border-white/5 rounded-xl p-4">
            <div class="flex justify-between gap-3">
                <div><strong class="text-white">${escapeHtml(r.name || 'Rival')}</strong><span class="text-xs text-slate-400 ml-2">${escapeHtml(r.club || '')}</span>
                <div class="text-xs text-slate-400 mt-1">Intensidade: <strong class="text-rose-300">${Number(r.intensity || 50)}%</strong></div></div>
                <span class="text-[10px] px-2 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">${escapeHtml(r.status || 'Rival')}</span>
            </div>
            <div class="grid grid-cols-4 gap-2 mt-3 text-center">
                <div><strong class="text-white">${Number(r.wins || 0)}</strong><span class="block text-[10px] text-slate-500">Vitórias</span></div>
                <div><strong class="text-white">${Number(r.draws || 0)}</strong><span class="block text-[10px] text-slate-500">Empates</span></div>
                <div><strong class="text-white">${Number(r.losses || 0)}</strong><span class="block text-[10px] text-slate-500">Derrotas</span></div>
                <div><strong class="text-white">${Number(r.goals || 0)}</strong><span class="block text-[10px] text-slate-500">Gols</span></div>
            </div>
            ${r.lastResult ? `<p class="text-xs text-slate-500 mt-3">Último confronto: ${escapeHtml(r.lastResult)}</p>` : ''}
            <div class="flex gap-2 mt-3"><button onclick="editRivalry(${i})" class="feature-action">Editar</button><button onclick="deleteRivalry(${i})" class="feature-action danger">Excluir</button></div>
        </div>`).join('') : '<div class="text-center text-sm text-slate-500 border border-dashed border-white/10 rounded-xl p-6">Nenhuma rivalidade cadastrada.</div>';
    showFeatureModal('Rivalidades Individuais', `<div class="space-y-4"><div class="flex justify-end"><button onclick="editRivalry(-1)" class="feature-action green"><i class="fa-solid fa-plus mr-1"></i>Nova rivalidade</button></div><div class="space-y-2 max-h-[55vh] overflow-y-auto">${rows}</div></div>`, 'Fechar', 'closeFeatureModal()');
}

function editRivalry(index = -1) {
    const c = featureCareer(); if (!c) return;
    const r = index >= 0 ? c.rivalries[index] : { name:'', club:'', intensity:50, wins:0, draws:0, losses:0, goals:0, lastResult:'', status:'Rival' };
    showFeatureModal(index >= 0 ? 'Editar Rivalidade' : 'Nova Rivalidade', `<div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-400">Rival</label><input id="rv-name" value="${escapeHtml(r.name)}" placeholder="Ex.: João Silva" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        <div><label class="text-xs text-slate-400">Clube</label><input id="rv-club" value="${escapeHtml(r.club)}" placeholder="Ex.: Palmeiras" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        <div><label class="text-xs text-slate-400">Intensidade (0–100)</label><input id="rv-intensity" type="number" min="0" max="100" value="${Number(r.intensity || 0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        <div><label class="text-xs text-slate-400">Status</label><select id="rv-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option ${r.status==='Rival'?'selected':''}>Rival</option><option ${r.status==='Grande rival'?'selected':''}>Grande rival</option><option ${r.status==='Clássico pessoal'?'selected':''}>Clássico pessoal</option></select></div>
        <div><label class="text-xs text-slate-400">Vitórias</label><input id="rv-wins" type="number" min="0" value="${Number(r.wins || 0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        <div><label class="text-xs text-slate-400">Empates</label><input id="rv-draws" type="number" min="0" value="${Number(r.draws || 0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        <div><label class="text-xs text-slate-400">Derrotas</label><input id="rv-losses" type="number" min="0" value="${Number(r.losses || 0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        <div><label class="text-xs text-slate-400">Gols contra o rival</label><input id="rv-goals" type="number" min="0" value="${Number(r.goals || 0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        <div class="col-span-2"><label class="text-xs text-slate-400">Último confronto</label><input id="rv-last" value="${escapeHtml(r.lastResult || '')}" placeholder="Ex.: Santos 2 x 1 Palmeiras — gol aos 88'" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
    </div>`, 'Salvar', `saveRivalry(${index})`);
}
function saveRivalry(index) {
    const c = featureCareer(); if (!c) return;
    const item = { name: document.getElementById('rv-name')?.value.trim(), club: document.getElementById('rv-club')?.value.trim(), intensity: Math.max(0,Math.min(100,Number(document.getElementById('rv-intensity')?.value)||0)), status: document.getElementById('rv-status')?.value || 'Rival', wins:Number(document.getElementById('rv-wins')?.value)||0, draws:Number(document.getElementById('rv-draws')?.value)||0, losses:Number(document.getElementById('rv-losses')?.value)||0, goals:Number(document.getElementById('rv-goals')?.value)||0, lastResult:document.getElementById('rv-last')?.value.trim() || '' };
    if (!item.name) return alert('Informe o nome do rival.');
    if (index >= 0) c.rivalries[index] = item; else c.rivalries.push(item);
    saveLocalData(); closeFeatureModal(); renderData(); openRivalriesModal();
}
function deleteRivalry(index) { const c=featureCareer(); if(!c || !confirm('Excluir esta rivalidade?')) return; c.rivalries.splice(index,1); saveLocalData(); renderData(); openRivalriesModal(); }

function openPlayerClubReputationModal() {
    const c=featureCareer(); if(!c || currentMode!=='rumo_ao_estrelato') return;
    ensurePlayerCareerSystems(c);
    const rows=c.clubReputationsPlayer.map((r,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-4"><div class="flex justify-between gap-3"><div><strong class="text-white">${escapeHtml(r.club)}</strong><span class="block text-xs text-slate-500 mt-1">${escapeHtml(playerRepStatus(r.reputation))}</span></div><strong class="text-cyan-300 text-xl">${Number(r.reputation)}%</strong></div><div class="h-2 bg-slate-800 rounded-full mt-3"><div class="h-2 bg-cyan-400 rounded-full" style="width:${Number(r.reputation)}%"></div></div><div class="text-xs text-slate-500 mt-2">Temporadas: ${escapeHtml(r.seasons || '-')} ${r.titles ? `• Títulos: ${escapeHtml(r.titles)}` : ''}</div><button onclick="editPlayerClubReputation(${i})" class="feature-action mt-3">Editar</button></div>`).join('') || '<p class="text-sm text-slate-500">Cadastre um clube no histórico para começar.</p>';
    showFeatureModal('Reputação por Clube', `<div class="space-y-3">${rows}</div>`, 'Fechar', 'closeFeatureModal()');
}
function editPlayerClubReputation(index) {
    const c=featureCareer(); if(!c) return; const r=c.clubReputationsPlayer[index]; if(!r) return;
    showFeatureModal('Editar reputação • '+escapeHtml(r.club), `<div class="space-y-3"><div><label class="text-xs text-slate-400">Reputação (0–100)</label><input id="pcr-value" type="number" min="0" max="100" value="${Number(r.reputation||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Temporadas / período</label><input id="pcr-seasons" value="${escapeHtml(r.seasons||'')}" placeholder="2027–2030" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Títulos marcantes</label><input id="pcr-titles" value="${escapeHtml(r.titles||'')}" placeholder="2 Campeonatos, 1 Copa" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Observações</label><textarea id="pcr-notes" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(r.notes||'')}</textarea></div></div>`, 'Salvar', `savePlayerClubReputation(${index})`);
}
function savePlayerClubReputation(index) { const c=featureCareer(); if(!c||!c.clubReputationsPlayer[index])return; const r=c.clubReputationsPlayer[index]; r.reputation=Math.max(0,Math.min(100,Number(document.getElementById('pcr-value')?.value)||0)); r.seasons=document.getElementById('pcr-seasons')?.value.trim()||''; r.titles=document.getElementById('pcr-titles')?.value.trim()||''; r.notes=document.getElementById('pcr-notes')?.value.trim()||''; saveLocalData(); closeFeatureModal(); renderData(); openPlayerClubReputationModal(); }

function openFanbaseModal() {
    const c=featureCareer(); if(!c||currentMode!=='rumo_ao_estrelato')return; ensurePlayerCareerSystems(c); const f=c.fanbase;
    showFeatureModal('Torcida', `<div class="space-y-4"><div class="grid grid-cols-3 gap-2 text-center"><div class="bg-black/30 rounded-xl p-3"><strong class="block text-emerald-400 text-2xl">${Number(f.support)}%</strong><span class="text-[10px] text-slate-500">Apoio</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-cyan-300 text-2xl">${Number(f.trust)}%</strong><span class="text-[10px] text-slate-500">Confiança</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-amber-300 text-2xl">${Number(f.affection)}%</strong><span class="text-[10px] text-slate-500">Carinho</span></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Apoio (0–100)</label><input id="fan-support" type="number" min="0" max="100" value="${Number(f.support)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Confiança (0–100)</label><input id="fan-trust" type="number" min="0" max="100" value="${Number(f.trust)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Carinho (0–100)</label><input id="fan-affection" type="number" min="0" max="100" value="${Number(f.affection)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Clima</label><select id="fan-mood" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option ${f.mood==='Eufórica'?'selected':''}>Eufórica</option><option ${f.mood==='Positiva'?'selected':''}>Positiva</option><option ${f.mood==='Neutra'?'selected':''}>Neutra</option><option ${f.mood==='Impaciente'?'selected':''}>Impaciente</option><option ${f.mood==='Hostil'?'selected':''}>Hostil</option></select></div></div><div><label class="text-xs text-slate-400">Observações</label><textarea id="fan-notes" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(f.notes||'')}</textarea></div></div>`, 'Salvar', 'saveFanbase()');
}
function saveFanbase(){const c=featureCareer();if(!c)return;const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));c.fanbase={support:clamp(document.getElementById('fan-support')?.value),trust:clamp(document.getElementById('fan-trust')?.value),affection:clamp(document.getElementById('fan-affection')?.value),mood:document.getElementById('fan-mood')?.value||'Neutra',notes:document.getElementById('fan-notes')?.value.trim()||''};saveLocalData();closeFeatureModal();renderData();}

const PRESS_CONFERENCE_QUESTIONS = [
    {id:'titular',q:'Você acredita que merece ser titular no próximo jogo?',options:[['Humilde','Estou trabalhando para conquistar meu espaço.','positive'],['Confiante','Meu desempenho mostra que posso ajudar desde o início.','strong'],['Desafiante','A decisão é do treinador, mas quero jogar.','bold']]},
    {id:'fase',q:'Como você avalia sua fase atual?',options:[['Tranquilo','Estou focado em melhorar a cada partida.','positive'],['Ambicioso','Sei que posso entregar ainda mais.','strong'],['Direto','Meu desempenho fala por mim.','bold']]},
    {id:'transferencia',q:'Há rumores de interesse de outros clubes. O que você diz?',options:[['Leal','Meu foco está totalmente no clube atual.','loyal'],['Aberto','É sempre bom ser reconhecido, mas não há decisão.','neutral'],['Ambicioso','Quero estar em um projeto que me permita crescer.','bold']]},
    {id:'torcida',q:'A torcida tem cobrado resultados. Como responde?',options:[['Respeitoso','A torcida tem razão em cobrar e vamos trabalhar.','positive'],['Confiante','Vamos responder dentro de campo.','strong'],['Provocador','Prefiro responder jogando do que falando.','bold']]},
    {id:'companheiros',q:'Como é sua relação com os companheiros?',options:[['União','O grupo é fundamental para tudo que conquistamos.','positive'],['Profissional','Tenho uma boa relação e foco no trabalho.','neutral'],['Liderança','Procuro assumir responsabilidade quando necessário.','leader']]}
];
function openPressConferenceModal(){const c=featureCareer();if(!c||currentMode!=='rumo_ao_estrelato')return;ensurePlayerCareerSystems(c);const q=PRESS_CONFERENCE_QUESTIONS[Math.floor(Math.random()*PRESS_CONFERENCE_QUESTIONS.length)];showFeatureModal('Coletiva de Imprensa', `<div class="space-y-4"><div class="bg-black/30 border border-white/5 rounded-xl p-4"><span class="text-[10px] uppercase tracking-wider text-purple-300">Pergunta do jornalista</span><p class="text-white font-bold mt-2">${escapeHtml(q.q)}</p></div><div class="space-y-2">${q.options.map((o,i)=>`<button onclick="answerPressConference('${q.id}','${o[2]}','${escapeHtml(o[0]).replace(/'/g,"\\'")}')" class="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all"><strong class="text-white text-sm">${escapeHtml(o[0])}</strong><span class="block text-xs text-slate-400 mt-1">${escapeHtml(o[1])}</span></button>`).join('')}</div><div class="text-xs text-slate-500">Coletivas respondidas: ${Number(c.pressConferences.count||0)}</div></div>`, 'Fechar', 'closeFeatureModal()');}
function answerPressConference(questionId, style, label){const c=featureCareer();if(!c)return;const impacts={positive:{media:3,fan:2,trust:2,text:'Resposta profissional e equilibrada.'},strong:{media:2,fan:3,trust:3,text:'Resposta confiante.'},bold:{media:5,fan:-1,trust:-1,text:'Resposta mais ousada.'},loyal:{media:2,fan:4,trust:2,text:'A lealdade foi bem recebida.'},neutral:{media:1,fan:1,trust:1,text:'Resposta cautelosa.'},leader:{media:4,fan:3,trust:3,text:'A postura de liderança chamou atenção.'}}[style]||{media:0,fan:0,trust:0,text:'Resposta registrada.'};
    ensurePlayerCareerSystems(c); c.pressConferences.count++; const date=new Date().toLocaleDateString('pt-BR'); c.pressConferences.lastDate=date; c.pressConferences.lastImpact=impacts.text; c.pressConferences.history.unshift({date,questionId,style,label,impact:impacts.text}); c.pressConferences.history=c.pressConferences.history.slice(0,30);
    ensurePersonalLifeData(c); c.mediaPopularity.press=Math.max(0,Math.min(100,Number(c.mediaPopularity.press||50)+impacts.media)); c.mediaPopularity.fanRecognition=Math.max(0,Math.min(100,Number(c.mediaPopularity.fanRecognition||50)+impacts.fan)); c.fanbase.support=Math.max(0,Math.min(100,Number(c.fanbase.support||50)+impacts.fan)); c.fanbase.trust=Math.max(0,Math.min(100,Number(c.fanbase.trust||50)+impacts.trust));
    saveLocalData(); closeFeatureModal(); renderData(); alert(`${impacts.text} Torcida: ${impacts.fan >= 0 ? '+' : ''}${impacts.fan}% • Imprensa: ${impacts.media >= 0 ? '+' : ''}${impacts.media}%`);
}

function openAgentCareerModal(){const c=featureCareer();if(!c||currentMode!=='rumo_ao_estrelato')return;ensurePlayerCareerSystems(c);const a=c.agentCareer;const rumors=a.rumors||[];const rows=rumors.length?rumors.slice(0,6).map(r=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="text-[10px] text-slate-500">${escapeHtml(r.date||'')}</div><strong class="text-white text-sm">${escapeHtml(r.title||'Movimentação')}</strong><p class="text-xs text-slate-400 mt-1">${escapeHtml(r.text||'')}</p></div>`).join(''):'<p class="text-xs text-slate-500">Nenhuma movimentação registrada.</p>';
    showFeatureModal('Agente & Mercado', `<div class="space-y-4"><div class="grid grid-cols-3 gap-2 text-center"><div class="bg-black/30 rounded-xl p-3"><strong class="block text-amber-300 text-2xl">${Number(a.trust)}%</strong><span class="text-[10px] text-slate-500">Confiança</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-cyan-300 text-2xl">${Number(a.activity)}%</strong><span class="text-[10px] text-slate-500">Atividade</span></div><div class="bg-black/30 rounded-xl p-3"><strong class="block text-white text-sm mt-2">${escapeHtml(a.status||'Ativo')}</strong><span class="block text-[10px] text-slate-500">Status</span></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Nome do agente</label><input id="ag-name" value="${escapeHtml(a.name||c.profile?.empresario||'')}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Agência</label><input id="ag-agency" value="${escapeHtml(a.agency||'')}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Confiança (0–100)</label><input id="ag-trust" type="number" min="0" max="100" value="${Number(a.trust)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Atividade (0–100)</label><input id="ag-activity" type="number" min="0" max="100" value="${Number(a.activity)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div class="md:col-span-2"><label class="text-xs text-slate-400">Última ação</label><input id="ag-action" value="${escapeHtml(a.lastAction||'')}" placeholder="Ex.: Negociou renovação com o clube" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div><div class="border-t border-white/5 pt-3"><div class="flex justify-between items-center mb-2"><h4 class="text-xs font-black uppercase tracking-wider text-white">Rumores / movimentações</h4><button onclick="addAgentRumor()" class="feature-action green">+ Registrar</button></div><div class="space-y-2">${rows}</div></div></div>`, 'Salvar', 'saveAgentCareer()');}
function saveAgentCareer(){const c=featureCareer();if(!c)return;ensurePlayerCareerSystems(c);const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));c.agentCareer={...c.agentCareer,name:document.getElementById('ag-name')?.value.trim()||'',agency:document.getElementById('ag-agency')?.value.trim()||'',trust:clamp(document.getElementById('ag-trust')?.value),activity:clamp(document.getElementById('ag-activity')?.value),lastAction:document.getElementById('ag-action')?.value.trim()||''};if(c.profile)c.profile.empresario=c.agentCareer.name;saveLocalData();closeFeatureModal();renderData();}
function addAgentRumor(){const c=featureCareer();if(!c)return;showFeatureModal('Registrar movimentação do agente', `<div class="space-y-3"><input id="agr-title" placeholder="Título — Ex.: Sondagem do Milan" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><textarea id="agr-text" placeholder="Detalhes da movimentação" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></textarea></div>`, 'Adicionar', 'saveAgentRumor()');}
function saveAgentRumor(){const c=featureCareer();if(!c)return;ensurePlayerCareerSystems(c);const title=document.getElementById('agr-title')?.value.trim();if(!title)return alert('Informe um título.');c.agentCareer.rumors.unshift({date:new Date().toLocaleDateString('pt-BR'),title,text:document.getElementById('agr-text')?.value.trim()||''});c.agentCareer.rumors=c.agentCareer.rumors.slice(0,30);c.agentCareer.lastAction=title;saveLocalData();closeFeatureModal();renderData();openAgentCareerModal();}

function deriveCareerPhase(c){const manual=c.careerPhase?.phase||'';if(manual)return manual;const age=parseInt(String(c.profile?.idade||'').match(/\d+/)?.[0]||'0',10);if(age&&age<=20)return 'Promessa';if(age&&age<=24)return 'Jovem profissional';if(age&&age<=28)return 'Jogador estabelecido';if(age&&age<=32)return 'Estrela';if(age&&age<=36)return 'Veterano';if(age>36)return 'Final de carreira';return 'Não definida';}
function getCareerPhaseLabel(c){return deriveCareerPhase(c);}
function openCareerPhaseModal(){const c=featureCareer();if(!c||currentMode!=='rumo_ao_estrelato')return;ensurePlayerCareerSystems(c);const p=c.careerPhase;const phases=['Promessa','Jovem profissional','Jogador estabelecido','Estrela','Veterano','Final de carreira'];const opts=phases.map(x=>`<option ${deriveCareerPhase(c)===x?'selected':''}>${x}</option>`).join('');showFeatureModal('Fases da Carreira', `<div class="space-y-4"><div class="bg-black/30 border border-white/5 rounded-xl p-4"><span class="text-[10px] uppercase tracking-wider text-cyan-300">Momento atual</span><strong class="block text-2xl text-white mt-1">${escapeHtml(deriveCareerPhase(c))}</strong><p class="text-xs text-slate-500 mt-1">A fase pode ser definida manualmente para acompanhar a narrativa da carreira.</p></div><div><label class="text-xs text-slate-400">Fase atual</label><select id="phase-value" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${opts}</select></div><div><label class="text-xs text-slate-400">Anos como profissional</label><input id="phase-years" type="number" min="0" value="${Number(p.yearsPro||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Observações</label><textarea id="phase-notes" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(p.notes||'')}</textarea></div></div>`, 'Salvar', 'saveCareerPhase()');}
function saveCareerPhase(){const c=featureCareer();if(!c)return;ensurePlayerCareerSystems(c);c.careerPhase={phase:document.getElementById('phase-value')?.value||'',yearsPro:Math.max(0,Number(document.getElementById('phase-years')?.value)||0),notes:document.getElementById('phase-notes')?.value.trim()||''};saveLocalData();closeFeatureModal();renderData();}


/* ================= MASTER LIGA 1.3 ================= */
function openBoardManagementModal(){
    const c=featureCareer(); if(!c)return;
    const b=c.boardManagement||{confidence:50,pressure:30,mood:'Estável',lastMeeting:'',demands:[],history:[]};
    showFeatureModal('Diretoria & Conselho',`<div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs text-slate-400">Confiança da diretoria (%)</label><input id="board-conf" type="number" min="0" max="100" value="${Number(b.confidence||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
            <div><label class="text-xs text-slate-400">Pressão (%)</label><input id="board-pressure" type="number" min="0" max="100" value="${Number(b.pressure||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
        </div>
        <select id="board-mood" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option ${b.mood==='Muito satisfeita'?'selected':''}>Muito satisfeita</option><option ${b.mood==='Estável'?'selected':''}>Estável</option><option ${b.mood==='Preocupada'?'selected':''}>Preocupada</option><option ${b.mood==='Insatisfeita'?'selected':''}>Insatisfeita</option></select>
        <input id="board-meeting" placeholder="Resumo da última reunião" value="${escapeHtml(b.lastMeeting||'')}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">
        <input id="board-demand" placeholder="Nova cobrança da diretoria (opcional)" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">
    </div>`,'Salvar','saveBoardManagement()');
}
function saveBoardManagement(){const c=featureCareer();if(!c)return;const old=c.boardManagement||{};const b={confidence:Math.max(0,Math.min(100,Number(document.getElementById('board-conf')?.value)||0)),pressure:Math.max(0,Math.min(100,Number(document.getElementById('board-pressure')?.value)||0)),mood:document.getElementById('board-mood')?.value||'Estável',lastMeeting:document.getElementById('board-meeting')?.value.trim()||'',demands:Array.isArray(old.demands)?old.demands.slice():[],history:Array.isArray(old.history)?old.history.slice():[]};const demand=document.getElementById('board-demand')?.value.trim();if(demand)b.demands.unshift({text:demand,date:new Date().toLocaleDateString('pt-BR'),done:false});b.history.unshift({date:new Date().toLocaleDateString('pt-BR'),confidence:b.confidence,pressure:b.pressure,mood:b.mood,meeting:b.lastMeeting});b.history=b.history.slice(0,20);c.boardManagement=b;c.manager=c.manager||{};c.manager.confidence=b.confidence;saveLocalData();closeFeatureModal();renderData();}

function openClubFansModal(){const c=featureCareer();if(!c)return;const f=c.clubFans||{satisfaction:50,trust:50,attendance:50,pressure:25,mood:'Neutra',lastReaction:'',history:[]};showFeatureModal('Torcida do Clube',`<div class="space-y-4"><div class="grid grid-cols-2 gap-3">${[['satisfaction','Satisfação'],['trust','Confiança'],['attendance','Presença nos estádios'],['pressure','Pressão']].map(([k,l])=>`<div><label class="text-xs text-slate-400">${l} (%)</label><input id="fan-${k}" type="number" min="0" max="100" value="${Number(f[k]||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`).join('')}</div><select id="fan-mood" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Entusiasmada</option><option ${f.mood==='Neutra'?'selected':''}>Neutra</option><option>Preocupada</option><option>Revoltada</option></select><textarea id="fan-reaction" rows="3" placeholder="Última reação da torcida" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(f.lastReaction||'')}</textarea></div>`,'Salvar','saveClubFans()');}
function saveClubFans(){const c=featureCareer();if(!c)return;const old=c.clubFans||{};const f={};['satisfaction','trust','attendance','pressure'].forEach(k=>f[k]=Math.max(0,Math.min(100,Number(document.getElementById('fan-'+k)?.value)||0)));f.mood=document.getElementById('fan-mood')?.value||'Neutra';f.lastReaction=document.getElementById('fan-reaction')?.value.trim()||'';f.history=Array.isArray(old.history)?old.history.slice():[];f.history.unshift({date:new Date().toLocaleDateString('pt-BR'),satisfaction:f.satisfaction,mood:f.mood,reaction:f.lastReaction});f.history=f.history.slice(0,20);c.clubFans=f;c.manager=c.manager||{};c.manager.fanSupport=f.satisfaction;saveLocalData();closeFeatureModal();renderData();}

function openClubRivalriesModal(){const c=featureCareer();if(!c)return;const list=Array.isArray(c.clubRivalries)?c.clubRivalries:[];const rows=list.length?list.map((r,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between gap-3"><div><strong class="text-rose-300">🔥 ${escapeHtml(r.club||'Rival')}</strong><div class="text-xs text-slate-400 mt-1">Intensidade: ${Number(r.intensity||0)}/100 • Jogos: ${Number(r.games||0)} • Vitórias: ${Number(r.wins||0)}</div>${r.notes?`<div class="text-xs text-slate-500 mt-1">${escapeHtml(r.notes)}</div>`:''}</div><button onclick="deleteClubRivalry(${i})" class="text-rose-400"><i class="fa-solid fa-trash"></i></button></div>`).join(''):'<p class="text-xs text-slate-500 italic">Nenhuma rivalidade cadastrada.</p>';showFeatureModal('Rivalidades do Clube',`<div class="space-y-3"><div class="space-y-2 max-h-48 overflow-y-auto">${rows}</div><div class="border-t border-white/5 pt-3 grid grid-cols-2 gap-3"><input id="cr-club" placeholder="Clube rival" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><input id="cr-intensity" type="number" min="0" max="100" value="80" placeholder="Intensidade" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><input id="cr-games" type="number" min="0" value="0" placeholder="Jogos" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><input id="cr-wins" type="number" min="0" value="0" placeholder="Vitórias" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><textarea id="cr-notes" rows="2" placeholder="Contexto da rivalidade" class="col-span-2 w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></textarea></div></div>`,'Adicionar','saveClubRivalry()');}
function saveClubRivalry(){const c=featureCareer();if(!c)return;const name=document.getElementById('cr-club')?.value.trim();if(!name)return alert('Informe o clube rival.');c.clubRivalries=Array.isArray(c.clubRivalries)?c.clubRivalries:[];c.clubRivalries.push({club:name,intensity:Math.max(0,Math.min(100,Number(document.getElementById('cr-intensity')?.value)||0)),games:Math.max(0,Number(document.getElementById('cr-games')?.value)||0),wins:Math.max(0,Number(document.getElementById('cr-wins')?.value)||0),notes:document.getElementById('cr-notes')?.value.trim()||''});saveLocalData();closeFeatureModal();renderData();}
function deleteClubRivalry(i){const c=featureCareer();if(c&&Array.isArray(c.clubRivalries)){c.clubRivalries.splice(i,1);saveLocalData();closeFeatureModal();renderData();openClubRivalriesModal();}}

function openSeasonScenarioModal(){const c=featureCareer();if(!c)return;const s=c.seasonScenario||{};showFeatureModal('Cenário da Temporada',`<div class="space-y-4"><div class="grid grid-cols-3 gap-3"><input id="ss-pos" type="number" min="1" placeholder="Posição" value="${Number(s.position||0)||''}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><input id="ss-games" type="number" min="0" placeholder="Jogos" value="${Number(s.matchesPlayed||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><input id="ss-points" type="number" min="0" placeholder="Pontos" value="${Number(s.points||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><input id="ss-expect" placeholder="Expectativa atual da diretoria" value="${escapeHtml(s.expectation||'')}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><div class="bg-black/30 rounded-xl p-3 text-xs text-slate-400">Ao atualizar, as metas existentes com progresso informado recebem um status contextual. O sistema não apaga nem substitui seus objetivos atuais.</div></div>`,'Atualizar','saveSeasonScenario()');}
function saveSeasonScenario(){const c=featureCareer();if(!c)return;const s={position:Math.max(0,Number(document.getElementById('ss-pos')?.value)||0),matchesPlayed:Math.max(0,Number(document.getElementById('ss-games')?.value)||0),points:Math.max(0,Number(document.getElementById('ss-points')?.value)||0),expectation:document.getElementById('ss-expect')?.value.trim()||'',lastUpdate:new Date().toLocaleDateString('pt-BR')};c.seasonScenario=s;applyDynamicMasterScenario(c);saveLocalData();closeFeatureModal();renderData();}
function applyDynamicMasterScenario(c){const objs=Array.isArray(c.objectives)?c.objectives:[];const s=c.seasonScenario||{};if(!objs.length)return;const avg=objs.reduce((a,o)=>a+Math.max(0,Math.min(100,Number(o.progress)||0)),0)/objs.length;const b=c.boardManagement||{};if(avg>=80){b.confidence=Math.min(100,Math.max(0,Number(b.confidence||50)+5));b.pressure=Math.max(0,Number(b.pressure||0)-5);b.mood='Muito satisfeita';}else if(avg<35){b.confidence=Math.max(0,Number(b.confidence||50)-7);b.pressure=Math.min(100,Number(b.pressure||0)+10);b.mood='Preocupada';}else{b.mood='Estável';}c.boardManagement=b;c.manager=c.manager||{};c.manager.confidence=b.confidence;}


/* ============================================================
   BECOME A LEGEND 1.4 — EVENTOS NARRATIVOS E DECISÕES
   ============================================================ */
function ensureBALNarrativeData(c){
    if(!c.balEventSystem) c.balEventSystem={history:[],current:null,used:[]};
    c.balEventSystem.history=Array.isArray(c.balEventSystem.history)?c.balEventSystem.history:[];
    c.balEventSystem.used=Array.isArray(c.balEventSystem.used)?c.balEventSystem.used:[];
    c.personalState=c.personalState||{energy:100,fame:0,morale:50};
    if(typeof c.personalState.energy!=='number') c.personalState.energy=100;
    if(typeof c.personalState.fame!=='number') c.personalState.fame=0;
    if(typeof c.personalState.morale!=='number') c.personalState.morale=50;
    c.manager=c.manager||{reputation:1,confidence:50,fanSupport:50};
    c.manager.confidence=balClamp(c.manager.confidence??50);
    c.fanbase=c.fanbase||{support:50,trust:50,affection:50,mood:'Neutra'};
    c.fanbase.support=balClamp(c.fanbase.support??50); c.fanbase.trust=balClamp(c.fanbase.trust??50);
    c.relationshipStatus=c.relationshipStatus||{level:50,affection:50,trust:50,compatibility:50,status:'namorando',name:''};
    c.relationshipStatus.affection=balClamp(c.relationshipStatus.affection??c.relationshipStatus.level??50);
    c.relationshipStatus.trust=balClamp(c.relationshipStatus.trust??50);
    c.playerFinance=c.playerFinance||{balance:0};
    c.playerFinance.balance=Number(c.playerFinance.balance||0);
    const pf=ensurePersonalLifeData(c);
    pf.familyFriends=pf.familyFriends||{familySupport:50,friends:50,parents:50,siblings:50,bestFriend:'',friendsList:[],events:[]};
    pf.familyFriends.friends=balClamp(pf.familyFriends.friends??50);
}
function balClamp(v){return Math.max(0,Math.min(100,Number(v)||0));}
function balEscape(v){return typeof escapeHtml==='function'?escapeHtml(v):String(v??'');}

const BAL_EVENT_CATEGORIES={
    classico:{label:'Jogos antes dos clássicos',icon:'🔥',desc:'Clima, provocações e pressão antes do grande rival.',color:'rose'},
    pessoal:{label:'Vida pessoal',icon:'❤️',desc:'Família, rotina, festas, namoro e escolhas fora do campo.',color:'pink'},
    elenco:{label:'Brigas no elenco',icon:'👊',desc:'Conflitos, companheiros, vestiário e união do grupo.',color:'amber'},
    aniversario:{label:'Aniversário de companheiros',icon:'🎂',desc:'Momentos sociais que podem aproximar ou afastar você do elenco.',color:'cyan'},
    tecnico:{label:'Técnico',icon:'🧑‍🏫',desc:'Conversas, cobranças e oportunidades com o treinador.',color:'blue'},
    amigos:{label:'Amigos',icon:'🤝',desc:'Amizades, lealdade e situações do dia a dia.',color:'emerald'},
    namorada:{label:'Namorada',icon:'💕',desc:'Decisões que afetam diretamente seu relacionamento.',color:'rose'},
    imprensa:{label:'Notícias & imprensa',icon:'📰',desc:'Entrevistas, rumores e repercussão pública.',color:'violet'}
};

/* Cada evento possui 3 escolhas. Os efeitos são deliberadamente diferentes:
   time, técnico, amigos e namorada evoluem separadamente. */
const BAL_NARRATIVE_EVENTS=[
 {id:'classico_provocacao',cat:'classico',title:'Provocação na véspera do clássico',news:'Um jogador do rival dá uma entrevista dizendo que seu time não tem coragem para encarar o clássico. O vestiário está em silêncio esperando uma reação.',choices:[
  {label:'Entrar na provocação e motivar o elenco.',effect:{team:5,coach:-2,fame:2,morale:5},result:'Você compra a briga e transforma a provocação em combustível para o grupo.'},
  {label:'Pedir cabeça fria e responder apenas dentro de campo.',effect:{team:3,coach:5,morale:2},result:'Sua postura madura agrada o treinador e mantém o elenco focado.'},
  {label:'Ignorar completamente a provocação.',effect:{coach:2,team:-2,morale:-1},result:'O técnico aprova sua tranquilidade, mas alguns companheiros acham que faltou atitude.'}]},
 {id:'classico_jantar',cat:'classico',title:'Jantar do elenco antes do clássico',news:'O capitão organiza um jantar na noite anterior ao clássico. O treinador liberou, mas pediu que todos respeitem o horário de descanso.',choices:[
  {label:'Ir e ficar com o elenco até o fim.',effect:{team:7,friends:5,coach:-2,energy:-3},result:'Você fortalece os laços do grupo, embora chegue um pouco mais cansado.'},
  {label:'Ir, conversar com todos e sair cedo.',effect:{team:5,coach:3,friends:3},result:'Você participa do momento e mostra responsabilidade.'},
  {label:'Não ir e descansar para o jogo.',effect:{coach:6,team:-2,energy:6},result:'O treinador gosta da disciplina, mas alguns companheiros sentem sua ausência.'}]},
 {id:'classico_pressao',cat:'classico',title:'Torcida exige a vitória',news:'Na chegada ao CT, a torcida faz uma recepção intensa. Faixas pedem uma vitória contra o maior rival.',choices:[
  {label:'Parar para falar com os torcedores.',effect:{team:2,fame:6,morale:4},result:'Sua atitude aproxima você da torcida e aumenta a confiança do grupo.'},
  {label:'Prometer que o time dará tudo em campo.',effect:{team:4,fame:4,morale:5},result:'A promessa aumenta a responsabilidade, mas também empolga os torcedores.'},
  {label:'Passar direto e manter o foco.',effect:{coach:4,team:-2,morale:1},result:'Você evita distrações, mas a torcida esperava mais proximidade.'}]},

 {id:'pessoal_familia',cat:'pessoal',title:'Dia de folga com a família',news:'Você finalmente tem uma tarde livre. Sua família marcou um almoço, mas um patrocinador oferece uma aparição no mesmo horário.',choices:[
  {label:'Escolher a família.',effect:{friends:3,team:1,morale:6,energy:4},result:'Você aproveita o momento e volta ao CT mais leve.'},
  {label:'Cumprir o compromisso comercial.',effect:{fame:6,money:1500,coach:1,morale:-2},result:'A ação gera boa repercussão e rende dinheiro, mas você perde o almoço.'},
  {label:'Tentar encaixar os dois compromissos.',effect:{fame:3,money:700,friends:2,energy:-3},result:'Você consegue conciliar tudo, mas termina o dia exausto.'}]},
 {id:'pessoal_festa',cat:'pessoal',title:'Convite para uma festa',news:'Um grupo de amigos convida você para uma festa importante. No dia seguinte há treino cedo.',choices:[
  {label:'Ir por pouco tempo e voltar cedo.',effect:{friends:5,energy:-2,coach:1},result:'Seus amigos ficam felizes e você mantém a disciplina.'},
  {label:'Ficar até tarde.',effect:{friends:8,morale:4,energy:-8,coach:-4},result:'A noite é ótima, mas o treino do dia seguinte cobra seu preço.'},
  {label:'Recusar e descansar.',effect:{coach:5,energy:6,friends:-2},result:'Você prioriza a carreira, embora alguns amigos fiquem chateados.'}]},

 {id:'elenco_discussao',cat:'elenco',title:'Discussão no vestiário',news:'Dois jogadores discutem feio depois de um treino. Um deles pede que você tome partido porque considera o outro desrespeitoso.',choices:[
  {label:'Defender seu amigo.',effect:{friends:7,team:-4,coach:-1},result:'Seu amigo fica grato, mas parte do elenco acha que você tomou partido.'},
  {label:'Tentar reconciliar os dois.',effect:{team:7,coach:5,friends:2,morale:4},result:'Você evita que a discussão cresça e ganha respeito no vestiário.'},
  {label:'Não se envolver.',effect:{coach:2,team:-3,friends:-3},result:'Você evita a confusão, mas os dois esperavam uma postura sua.'}]},
 {id:'elenco_banco',cat:'elenco',title:'Companheiro revoltado com o banco',news:'Um companheiro reserva está irritado com a falta de oportunidades e critica o treinador na sua frente.',choices:[
  {label:'Ouvir e aconselhar o companheiro.',effect:{friends:6,team:3,coach:-1},result:'Ele confia mais em você e desabafa sem criar uma crise maior.'},
  {label:'Dizer para ele conversar diretamente com o técnico.',effect:{team:4,coach:5,friends:2},result:'Você orienta o jogador para uma solução profissional.'},
  {label:'Concordar que o treinador está errado.',effect:{friends:6,team:-2,coach:-7},result:'Seu companheiro se sente apoiado, mas a comissão fica sabendo da sua opinião.'}]},

 {id:'aniversario_capitao',cat:'aniversario',title:'Aniversário do capitão',news:'O capitão do time completa mais um ano. O elenco preparou uma pequena festa depois do treino e cada jogador pode contribuir com um presente.',choices:[
  {label:'Comprar um presente especial.',effect:{friends:7,team:5,money:-500},result:'O capitão fica genuinamente feliz com a lembrança.'},
  {label:'Participar da festa e fazer uma homenagem.',effect:{friends:6,team:7,morale:3},result:'Sua homenagem vira um dos momentos mais comentados da festa.'},
  {label:'Dar apenas os parabéns e ir embora.',effect:{friends:-2,team:-1,coach:1},result:'Você cumpre o básico, mas perde uma chance de se aproximar do grupo.'}]},
 {id:'aniversario_jovem',cat:'aniversario',title:'Aniversário de um jovem do elenco',news:'Um jogador recém-promovido da base comemora o aniversário. Ele admira seu futebol e espera que você apareça.',choices:[
  {label:'Aparecer e conversar com ele.',effect:{friends:6,team:4,morale:3},result:'O jovem passa a enxergar você como uma referência.'},
  {label:'Mandar um presente pelo celular.',effect:{friends:3,money:-200},result:'Ele agradece a lembrança, embora esperasse sua presença.'},
  {label:'Esquecer a data.',effect:{friends:-5,team:-2},result:'O jogador fica decepcionado e a situação circula entre os companheiros.'}]},

 {id:'tecnico_conversa',cat:'tecnico',title:'Conversa particular com o treinador',news:'Depois do treino, o treinador pede para falar com você. Ele quer saber se pode contar com sua liderança no próximo jogo.',choices:[
  {label:'Aceitar a responsabilidade.',effect:{coach:8,team:5,morale:4},result:'O treinador passa a confiar mais em você em momentos decisivos.'},
  {label:'Dizer que prefere focar apenas no futebol.',effect:{coach:1,team:1},result:'Você mantém sua rotina, mas perde uma oportunidade de liderança.'},
  {label:'Pedir para o treinador confiar também nos mais jovens.',effect:{coach:6,team:6,friends:3},result:'A comissão vê maturidade na sua preocupação com o grupo.'}]},
 {id:'tecnico_treino',cat:'tecnico',title:'Treino extra',news:'O treinador oferece um treino individual depois da atividade normal. Você está cansado, mas sabe que pode ganhar espaço.',choices:[
  {label:'Aceitar o treino extra.',effect:{coach:7,energy:-6,morale:3},result:'O treinador elogia sua dedicação.'},
  {label:'Pedir um treino mais leve.',effect:{coach:3,energy:-2},result:'Você mostra vontade sem comprometer sua recuperação.'},
  {label:'Recusar para descansar.',effect:{coach:-4,energy:7},result:'Seu corpo agradece, mas o treinador esperava mais disposição.'}]},

 {id:'amigos_lealdade',cat:'amigos',title:'Um amigo precisa de você',news:'Um amigo de infância que acompanha sua carreira passa por um momento difícil e pede para conversar.',choices:[
  {label:'Parar tudo e ouvir o amigo.',effect:{friends:8,morale:4,energy:-2},result:'Ele percebe que a fama não mudou sua lealdade.'},
  {label:'Conversar depois do treino.',effect:{friends:5,coach:2},result:'Você encontra um equilíbrio entre amizade e carreira.'},
  {label:'Dizer que está ocupado demais.',effect:{friends:-7,morale:-3},result:'O amigo entende sua rotina, mas sente que ficou em segundo plano.'}]},

 {id:'namorada_tempo',cat:'namorada',title:'Ela quer mais tempo com você',news:'Sua namorada diz que sente sua falta. Você tem um treino extra marcado e uma noite livre pela primeira vez em semanas.',choices:[
  {label:'Cancelar o treino extra e sair com ela.',effect:{girlfriend:9,morale:5,coach:-3},result:'Ela se sente valorizada e vocês têm uma noite especial.'},
  {label:'Manter o treino e marcar outro dia.',effect:{girlfriend:4,coach:4},result:'Ela entende sua ambição, desde que você cumpra a promessa.'},
  {label:'Dizer que a carreira vem primeiro.',effect:{girlfriend:-8,coach:2,morale:-4},result:'A conversa termina mal e cria distância entre vocês.'}]},
 {id:'namorada_jogo',cat:'namorada',title:'Ela quer ir ao jogo',news:'Sua namorada quer assistir ao próximo jogo fora de casa. A viagem é longa e você precisa chegar cedo ao estádio.',choices:[
  {label:'Convidá-la e organizar tudo.',effect:{girlfriend:7,morale:5,money:-300},result:'Ela fica feliz por poder acompanhar você de perto.'},
  {label:'Explicar que prefere manter a concentração.',effect:{girlfriend:2,coach:2},result:'Ela entende, embora fique um pouco decepcionada.'},
  {label:'Dizer que ela está atrapalhando sua preparação.',effect:{girlfriend:-9,morale:-5,coach:1},result:'A frase machuca e a relação sente o impacto.'}]},

 {id:'imprensa_rumor',cat:'imprensa',title:'Rumor de transferência',news:'Um portal publica que um rival está preparando uma proposta por você. O agente liga pedindo uma declaração.',choices:[
  {label:'Dizer que está feliz no clube atual.',effect:{team:7,coach:6,fame:3},result:'Torcida e comissão gostam da demonstração de compromisso.'},
  {label:'Dizer que qualquer proposta será analisada.',effect:{fame:6,team:-2,coach:-2},result:'Você mantém as portas abertas, mas cria especulação.'},
  {label:'Confirmar que gostaria de sair.',effect:{fame:4,team:-8,coach:-7},result:'A notícia explode e o ambiente no clube fica pesado.'}]},
 {id:'imprensa_polemica',cat:'imprensa',title:'Pergunta polêmica após o jogo',news:'Depois de uma partida difícil, um repórter pergunta se o treinador perdeu o controle do elenco.',choices:[
  {label:'Defender o treinador.',effect:{coach:7,team:4,fame:2},result:'Sua resposta protege o ambiente interno.'},
  {label:'Dizer que o grupo precisa melhorar.',effect:{team:2,fame:5,coach:-2},result:'Você é visto como sincero, mas gera debate.'},
  {label:'Criticar publicamente algumas decisões.',effect:{fame:7,coach:-8,team:-4},result:'A repercussão é enorme e a comissão não gosta da exposição.'}]}
];

function switchMasterTab(tab){
    if (currentMode !== 'master_liga') return;
    document.querySelectorAll('[data-master-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.masterTab === tab));
    document.querySelectorAll('[data-master-panel]').forEach(panel => panel.classList.toggle('master-active', panel.dataset.masterPanel === tab));
    const clubBox = document.getElementById('master-club-management');
    if (clubBox) clubBox.style.display = tab === 'club' ? 'block' : 'none';
    const stats = document.getElementById('bal-stats-section');
    if (stats) stats.style.display = 'none';
}

function switchBALTab(tab){
    if(currentMode!=='rumo_ao_estrelato')return;
    const tabs=['overview','profile','stats','titles','events']; if(!tabs.includes(tab))tab='overview';
    document.querySelectorAll('[data-bal-tab]').forEach(b=>b.classList.toggle('active',b.getAttribute('data-bal-tab')===tab));
    document.querySelectorAll('[data-bal-panel]').forEach(p=>p.classList.toggle('bal-active',p.getAttribute('data-bal-panel')===tab));
    const nav=document.getElementById('bal-tabs'); if(nav)nav.classList.remove('hidden');
    if(typeof updateBALFeaturePanelVisibility === 'function') updateBALFeaturePanelVisibility(tab);
    if(tab==='events')renderBALEvents();
}
function getBALCategoryEvents(cat){return BAL_NARRATIVE_EVENTS.filter(e=>e.cat===cat);}
function getBALRelations(c){ensureBALNarrativeData(c);const pf=ensurePersonalLifeData(c);return {team:Math.round(c.fanbase.trust),coach:Math.round(c.manager.confidence),friends:Math.round(pf.familyFriends.friends),girlfriend:Math.round(c.relationshipStatus.affection),fans:Math.round(c.fanbase.support)};}
function renderBALRelations(c){const el=document.getElementById('bal-event-relations');if(!el)return;const r=getBALRelations(c);const data=[['team','👥 Time','cyan'],['coach','🧑‍🏫 Técnico','blue'],['friends','🤝 Amigos','emerald'],['girlfriend','💕 Namorada','rose'],['fans','📣 Torcida','amber']];el.innerHTML=data.map(([k,l,col])=>`<div class="bg-black/25 border border-white/5 rounded-xl p-3"><div class="flex justify-between text-[10px] mb-1"><span class="text-slate-400">${l}</span><strong class="text-${col}-300">${r[k]}</strong></div><div class="h-1.5 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-${col}-400" style="width:${r[k]}%"></div></div></div>`).join('');}
function renderBALCategories(){const el=document.getElementById('bal-event-categories');if(!el)return;el.innerHTML=Object.entries(BAL_EVENT_CATEGORIES).map(([k,v])=>`<button onclick="startBALEventCategory('${k}')" class="text-left bg-black/20 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 rounded-xl p-3 transition-all"><div class="text-2xl mb-1">${v.icon}</div><strong class="block text-white text-xs">${balEscape(v.label)}</strong><span class="block text-[10px] text-slate-500 mt-1">${balEscape(v.desc)}</span></button>`).join('');}
function pickBALNarrativeEvent(cat){const c=featureCareer();if(!c)return null;ensureBALNarrativeData(c);const all=getBALCategoryEvents(cat);if(!all.length)return null;const used=c.balEventSystem.used||[];let pool=all.filter(e=>!used.includes(e.id));if(!pool.length){c.balEventSystem.used=c.balEventSystem.used.filter(id=>!all.some(e=>e.id===id));pool=all;}return pool[Math.floor(Math.random()*pool.length)];}
function startBALEventCategory(cat){const c=featureCareer();if(!c||currentMode!=='rumo_ao_estrelato')return;const e=pickBALNarrativeEvent(cat);if(!e)return;ensureBALNarrativeData(c);c.balEventSystem.current={eventId:e.id,cat:e.cat,title:e.title,news:e.news,choices:e.choices};saveLocalData();renderBALEvents();document.getElementById('bal-event-current')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
function openBALRandomCategory(){const keys=Object.keys(BAL_EVENT_CATEGORIES);startBALEventCategory(keys[Math.floor(Math.random()*keys.length)]);}
function balEffect(c,e){const x=e||{};ensureBALNarrativeData(c);const r={};
    if(x.team){c.fanbase.trust=balClamp(c.fanbase.trust+x.team);c.fanbase.affection=balClamp((c.fanbase.affection??50)+Math.round(x.team*.5));r.team=x.team;}
    if(x.coach){c.manager.confidence=balClamp(c.manager.confidence+x.coach);r.coach=x.coach;}
    if(x.friends){c.playerFinance= c.playerFinance||{balance:0};const f=ensurePersonalLifeData(c).familyFriends;f.friends=balClamp(f.friends+x.friends);r.friends=x.friends;}
    if(x.girlfriend){c.relationshipStatus.affection=balClamp(c.relationshipStatus.affection+x.girlfriend);c.relationshipStatus.level=balClamp((c.relationshipStatus.level??50)+Math.round(x.girlfriend*.5));r.girlfriend=x.girlfriend;}
    if(x.fans){c.fanbase.support=balClamp(c.fanbase.support+x.fans);r.fans=x.fans;}
    if(x.morale)c.personalState.morale=balClamp(c.personalState.morale+x.morale); if(x.energy)c.personalState.energy=balClamp(c.personalState.energy+x.energy); if(x.fame)c.personalState.fame=Math.max(0,c.personalState.fame+x.fame); if(x.money)c.playerFinance.balance+=Number(x.money);
    return r;
}
function formatBALEffects(e){const names={team:'Time',coach:'Técnico',friends:'Amigos',girlfriend:'Namorada',fans:'Torcida',morale:'Moral',energy:'Energia',fame:'Fama',money:'Dinheiro'};return Object.entries(e||{}).filter(([,v])=>Number(v)).map(([k,v])=>`${balEscape(names[k]||k)}: <strong class="${Number(v)>0?'text-emerald-300':'text-rose-300'}">${Number(v)>0?'+':''}${v}${k==='money'?' '+currencySymbol():''}</strong>`).join(' • ');}
function chooseBALEvent(index){const c=featureCareer();if(!c||currentMode!=='rumo_ao_estrelato')return;ensureBALNarrativeData(c);const cur=c.balEventSystem.current;if(!cur||!cur.choices?.[index])return;const choice=cur.choices[index];const delta=balEffect(c,choice.effect||{});const item={id:Date.now()+Math.random(),date:new Date().toLocaleDateString('pt-BR'),time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),category:cur.cat,title:cur.title,news:cur.news,choice:choice.label,result:choice.result,effect:choice.effect||{}};c.balEventSystem.history.unshift(item);c.balEventSystem.history=c.balEventSystem.history.slice(0,100);c.balEventSystem.used.unshift(cur.eventId);c.balEventSystem.used=c.balEventSystem.used.slice(0,60);c.balEventSystem.current=null;c.events=c.events||[];c.events.unshift({date:item.date,type:'Decisão',title:item.title,note:`${choice.label} — ${choice.result}`});c.events=c.events.slice(0,100);saveLocalData();renderBALEvents();renderData();}
function renderBALEvents(){const c=featureCareer();if(!c||currentMode!=='rumo_ao_estrelato')return;ensureBALNarrativeData(c);renderBALRelations(c);renderBALCategories();const cur=document.getElementById('bal-event-current'),h=document.getElementById('bal-event-history'),count=document.getElementById('bal-event-count');if(!cur||!h)return;const e=c.balEventSystem.current;
    cur.innerHTML=e?`<div class="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-5"><div class="flex items-center gap-2 text-[10px] uppercase tracking-wider text-violet-300 mb-2"><span>${BAL_EVENT_CATEGORIES[e.cat]?.icon||'⚡'}</span>${balEscape(BAL_EVENT_CATEGORIES[e.cat]?.label||'Evento')}</div><h4 class="text-xl font-black text-white">${balEscape(e.title)}</h4><div class="mt-3 bg-black/20 rounded-xl p-4"><span class="text-[10px] uppercase text-slate-500">Notícia</span><p class="text-sm text-slate-200 mt-1 leading-relaxed">${balEscape(e.news)}</p></div><div class="mt-4 space-y-2">${e.choices.map((ch,i)=>`<button onclick="chooseBALEvent(${i})" class="w-full text-left bg-black/20 hover:bg-violet-500/15 border border-white/5 hover:border-violet-500/30 rounded-xl p-3 transition-all"><span class="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 font-black mr-2">${String.fromCharCode(65+i)}</span><span class="text-sm text-white">${balEscape(ch.label)}</span></button>`).join('')}</div></div>`:'<div class="bg-black/20 border border-white/5 rounded-2xl p-5 text-center"><div class="text-3xl mb-2">📰</div><strong class="text-white text-sm">Escolha uma categoria acima</strong><p class="text-xs text-slate-500 mt-1">Você receberá uma notícia e terá que decidir como agir. As consequências ficam na sua carreira.</p></div>';
    if(count)count.textContent=`${(c.balEventSystem.history||[]).length} decisões registradas`;
    h.innerHTML=(c.balEventSystem.history||[]).length?(c.balEventSystem.history||[]).map(x=>`<div class="bg-black/20 border border-white/5 rounded-xl p-3"><div class="flex justify-between gap-3"><div><span class="text-[10px] text-violet-300 uppercase">${balEscape(BAL_EVENT_CATEGORIES[x.category]?.label||x.category||'Evento')}</span><strong class="block text-white text-sm mt-0.5">${balEscape(x.title)}</strong></div><span class="text-[10px] text-slate-500">${balEscape(x.date||'')}</span></div><p class="text-[11px] text-slate-500 mt-2">Sua escolha: <span class="text-slate-300">${balEscape(x.choice||'')}</span></p><p class="text-xs text-slate-400 mt-1">${balEscape(x.result||'')}</p><div class="text-[10px] mt-2">${formatBALEffects(x.effect)}</div></div>`).join(''):'<p class="text-xs text-slate-500 italic">Nenhuma decisão registrada ainda.</p>';
}
function clearBALEvents(){const c=featureCareer();if(!c||currentMode!=='rumo_ao_estrelato')return;if(!confirm('Limpar o histórico de decisões narrativas?'))return;ensureBALNarrativeData(c);c.balEventSystem.history=[];saveLocalData();renderBALEvents();}
