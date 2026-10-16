// ESTADO GLOBAL DA APLICAÇÃO
let currentUser = null;
let currentMode = 'rumo_ao_estrelato';
let currentCareerId = null;
let editingIndex = -1;
let syncTimer = null;
let isSyncing = false;
const PROJECT_VERSION = '1.6';

let appData = {
    users: {}
};

document.addEventListener('DOMContentLoaded', () => {
    loadLocalData();
    checkSession();
    initGoogleLogin();
});

function loadLocalData() {
    const saved = localStorage.getItem('pes2027_manager_data');
    if (saved) {
        try {
            appData = JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao ler localStorage', e);
        }
    }
}


// SISTEMA DE MOEDA — compartilhado pelos dois modos.
const CAREER_CURRENCIES = {
    BRL: { code: 'BRL', symbol: 'R$', name: 'Real brasileiro', locale: 'pt-BR' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    USD: { code: 'USD', symbol: 'US$', name: 'Dólar americano', locale: 'en-US' }
};

function ensureCareerCurrency(career) {
    if (!career) return 'BRL';
    if (!CAREER_CURRENCIES[career.currency]) career.currency = 'BRL';
    return career.currency;
}

function getCareerCurrency(career = null) {
    const c = career || (currentCareerId && appData?.users?.[currentUser]?.[currentMode]?.[currentCareerId]);
    const code = ensureCareerCurrency(c);
    return CAREER_CURRENCIES[code] || CAREER_CURRENCIES.BRL;
}

function formatCareerMoney(value, options = {}) {
    const currency = getCareerCurrency();
    const n = Number(value || 0);
    const decimals = options.decimals ?? 2;
    const formatted = n.toLocaleString(currency.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${currency.symbol} ${formatted}`;
}

function currencySymbol() { return getCareerCurrency().symbol; }

function updateCurrencyDisplay() {
    const el = document.getElementById('currency-display');
    if (el) el.textContent = currencySymbol();
}

function openCurrencyModal() {
    if (!currentCareerId) return alert('Selecione uma carreira primeiro.');
    const career = appData.users[currentUser][currentMode][currentCareerId];
    ensureCareerCurrency(career);
    const radio = document.querySelector(`input[name="career-currency"][value="${career.currency}"]`);
    if (radio) radio.checked = true;
    const modal = document.getElementById('currencyModal');
    if (modal) modal.classList.remove('hidden');
}

function closeCurrencyModal() {
    const modal = document.getElementById('currencyModal');
    if (modal) modal.classList.add('hidden');
}

function saveCareerCurrency() {
    if (!currentCareerId) return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    const selected = document.querySelector('input[name="career-currency"]:checked');
    if (!selected || !CAREER_CURRENCIES[selected.value]) return;
    career.currency = selected.value;
    saveLocalData();
    closeCurrencyModal();
    updateCurrencyDisplay();
    renderData();
}

function saveLocalData() {
    localStorage.setItem('pes2027_manager_data', JSON.stringify(appData));
    scheduleCloudSync();
}

function scheduleCloudSync() {
    const account = currentUser ? appData.users[currentUser] : null;
    if (!account || account.authProvider !== 'google') return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncToServer, 450);
}

async function syncToServer() {
    const account = currentUser ? appData.users[currentUser] : null;
    if (!account || account.authProvider !== 'google' || isSyncing) return;
    try {
        isSyncing = true;
        const response = await fetch('/api/sync', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appData })
        });
        if (!response.ok) throw new Error('Falha na sincronização');
        localStorage.setItem('pes2027_last_sync', new Date().toISOString());
    } catch (error) {
        console.warn('Sincronização online indisponível:', error);
    } finally {
        isSyncing = false;
    }
}

async function loadCloudData() {
    try {
        const response = await fetch('/api/sync');
        if (!response.ok) return false;
        const data = await response.json();
        if (!data.ok || !data.appData || !Object.keys(data.appData).length) return false;
        appData = data.appData;
        localStorage.setItem('pes2027_manager_data', JSON.stringify(appData));
        return true;
    } catch (error) {
        console.warn('Não foi possível carregar os dados online:', error);
        return false;
    }
}

// ============================================================
// LOGIN COM GOOGLE (Google Identity Services)
// ============================================================
function initGoogleLogin() {
    const button = document.getElementById('google-button');
    const status = document.getElementById('google-status');
    if (!button) return;

    const clientId = window.GOOGLE_CLIENT_ID || '';
    if (!clientId) {
        button.innerHTML = '<div class="google-config-warning"><i class="fa-solid fa-circle-info mr-1"></i> Login Google ainda não configurado.</div>';
        if (status) status.innerText = 'Configure GOOGLE_CLIENT_ID no servidor para ativar o login Google.';
        return;
    }

    if (!window.google || !google.accounts || !google.accounts.id) {
        setTimeout(initGoogleLogin, 400);
        return;
    }

    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true
    });

    button.innerHTML = '';
    google.accounts.id.renderButton(button, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: 360,
        locale: 'pt-BR'
    });
}

async function handleGoogleCredential(response) {
    const status = document.getElementById('google-status');
    if (!response || !response.credential) return;

    if (status) status.innerText = 'Validando sua Conta do Google...';

    try {
        const result = await fetch('/api/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });

        const data = await result.json();
        if (!result.ok || !data.ok || !data.user) {
            throw new Error(data.error || 'Falha ao entrar com Google.');
        }

        const googleUser = data.user;
        currentUser = googleUser.email.toLowerCase();

        const localUser = appData.users[currentUser];
        if (!localUser) {
            appData.users[currentUser] = {
                rumo_ao_estrelato: {},
                master_liga: {},
                password: null,
                authProvider: 'google',
                googleSub: googleUser.id,
                displayName: googleUser.name,
                picture: googleUser.picture || ''
            };
        } else {
            localUser.authProvider = 'google';
            localUser.googleSub = googleUser.id;
            localUser.displayName = googleUser.name;
            localUser.picture = googleUser.picture || '';
        }

        // Primeiro tenta carregar a carreira da nuvem. Se ainda não existir, envia o
        // cadastro local atual para a conta Google, evitando perder uma carreira antiga.
        const serverHasData = data.appData && Object.keys(data.appData.users || {}).length > 0;
        if (serverHasData) {
            appData = data.appData;
            if (!appData.users) appData.users = {};
            if (!appData.users[currentUser]) {
                const oldKey = Object.keys(appData.users).find(key => appData.users[key]?.googleSub === googleUser.id);
                if (oldKey) {
                    appData.users[currentUser] = appData.users[oldKey];
                    if (oldKey !== currentUser) delete appData.users[oldKey];
                } else {
                    appData.users[currentUser] = { rumo_ao_estrelato: {}, master_liga: {}, password: null, authProvider: 'google', googleSub: googleUser.id, displayName: googleUser.name, picture: googleUser.picture || '' };
                }
            }
            appData.users[currentUser].authProvider = 'google';
            appData.users[currentUser].googleSub = googleUser.id;
            appData.users[currentUser].displayName = googleUser.name;
            appData.users[currentUser].picture = googleUser.picture || '';
        } else {
            saveLocalData();
            await syncToServer();
        }

        localStorage.setItem('pes2027_manager_data', JSON.stringify(appData));
        localStorage.setItem('pes2027_active_user', currentUser);
        showMainMenu();
    } catch (error) {
        console.error(error);
        if (status) status.innerText = 'Não foi possível entrar com Google. Verifique a configuração do servidor.';
        alert(error.message || 'Falha no login com Google.');
    }
}

function handleAuth(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return;

    currentUser = email;
    if (!appData.users[currentUser]) {
        appData.users[currentUser] = { rumo_ao_estrelato: {}, master_liga: {}, password: password };
        saveLocalData();
    } else {
        const account = appData.users[currentUser];
        // Contas antigas não tinham senha: define a senha no primeiro acesso após a atualização.
        if (!account.password) {
            account.password = password;
            saveLocalData();
        } else if (account.password !== password) {
            alert('Senha incorreta.');
            return;
        }
    }

    localStorage.setItem('pes2027_active_user', currentUser);
    showMainMenu();
}

function checkSession() {
    const active = localStorage.getItem('pes2027_active_user');
    if (active) {
        currentUser = active;
        if (!appData.users[currentUser]) {
            appData.users[currentUser] = { rumo_ao_estrelato: {}, master_liga: {} };
        }
        showMainMenu();
    }
}

async function logout() {
    try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {}
    currentUser = null;
    currentCareerId = null;
    localStorage.removeItem('pes2027_active_user');
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
}

function showMainMenu() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('menu-user-display').innerText = appData.users[currentUser]?.displayName || currentUser;
    const versionEl = document.getElementById('project-version');
    if (versionEl) versionEl.innerText = PROJECT_VERSION;
}

function showAppScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('user-display').innerText = currentUser;
    switchMode(currentMode);
}

function openMode(mode) {
    currentMode = mode;
    currentCareerId = null;
    showAppScreen();
}

function backToMainMenu() {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

// CONTROLE DE VISIBILIDADE DOS MODOS

// SELETOR DE LIGAS E TEMAS VISUAIS — carregado pelo index.html.
// Mantido no core.js para que o botão "Ligas" não dependa do script.js legado.
const PES_LEAGUES = [
 {group:'Brasil',flag:'🇧🇷',name:'Brasileirão Série A',color:'#159447',accent:'#f5d547',sponsor:'Patrocínio comercial: Coca-Cola (2026–2027)'},
 {group:'Brasil',flag:'🇧🇷',name:'Brasileirão Série B',color:'#167b45',accent:'#e6c84f',sponsor:'Patrocínio comercial: Coca-Cola (2026–2027)'},
 {group:'Brasil',flag:'🇧🇷',name:'Campeonato Brasileiro Série C',color:'#176b40',accent:'#d8b74b'},
 {group:'Brasil',flag:'🇧🇷',name:'Campeonato Brasileiro Série D',color:'#145b39',accent:'#d3a63d'},
 {group:'Inglaterra',flag:'🇬🇧',name:'Premier League',color:'#4b176e',accent:'#f2a7ff'},
 {group:'Inglaterra',flag:'🇬🇧',name:'EFL Championship',color:'#163c8c',accent:'#f4a340'},
 {group:'Inglaterra',flag:'🇬🇧',name:'EFL League One',color:'#174b9a',accent:'#f3c14b'},
 {group:'Inglaterra',flag:'🇬🇧',name:'EFL League Two',color:'#173c70',accent:'#d8e7ff'},
 {group:'Espanha',flag:'🇪🇸',name:'LaLiga EA SPORTS',color:'#9b1b25',accent:'#f4c64e'},
 {group:'Espanha',flag:'🇪🇸',name:'LaLiga HYPERMOTION',color:'#771c2d',accent:'#f0a1a7'},
 {group:'Itália',flag:'🇮🇹',name:'Serie A Enilive',color:'#123d87',accent:'#55b7ff'},
 {group:'Itália',flag:'🇮🇹',name:'Serie BKT',color:'#194c92',accent:'#f2b34b'},
 {group:'França',flag:'🇫🇷',name:'Ligue 1 McDonald’s',color:'#153b76',accent:'#e5c65c'},
 {group:'França',flag:'🇫🇷',name:'Ligue 2 BKT',color:'#1a4d87',accent:'#e9b84c'},
 {group:'Alemanha',flag:'🇩🇪',name:'Bundesliga',color:'#8e1722',accent:'#f2f2f2'},
 {group:'Alemanha',flag:'🇩🇪',name:'2. Bundesliga',color:'#77202b',accent:'#e8b34b'},
 {group:'Alemanha',flag:'🇩🇪',name:'3. Liga',color:'#5f1a24',accent:'#d9d9d9'},
 {group:'Portugal',flag:'🇵🇹',name:'Liga Portugal Betclic',color:'#0e6b46',accent:'#e7d65a'},
 {group:'Portugal',flag:'🇵🇹',name:'Liga Portugal 2 Meu Super',color:'#145a43',accent:'#d8b54a'},
 {group:'Japão',flag:'🇯🇵',name:'Meiji Yasuda J1 League',color:'#9b1b25',accent:'#ffffff'},
 {group:'UEFA',flag:'🌍',name:'UEFA Champions League',color:'#101c64',accent:'#6da9ff'},
 {group:'UEFA',flag:'🌍',name:'UEFA Europa League',color:'#8a3b0a',accent:'#ffb25b'},
 {group:'UEFA',flag:'🌍',name:'UEFA Conference League',color:'#075c45',accent:'#77d6a8'},
 {group:'CONMEBOL',flag:'🌎',name:'CONMEBOL Libertadores',color:'#9b6410',accent:'#ffe08a'},
 {group:'CONMEBOL',flag:'🌎',name:'CONMEBOL Sudamericana',color:'#155f80',accent:'#8ed9f2'}
];
const LEGACY_LEAGUE_NAMES = {
 'Campeonato Brasileiro Série A':'Brasileirão Série A',
 'Campeonato Brasileiro Série B':'Brasileirão Série B'
};
function normalizeSelectedLeague(career){
 if(career?.selectedLeague && LEGACY_LEAGUE_NAMES[career.selectedLeague]) career.selectedLeague=LEGACY_LEAGUE_NAMES[career.selectedLeague];
 return career?.selectedLeague || null;
}
function currentLeagueCareer(){
    if(!currentUser || !currentCareerId) return null;
    return appData?.users?.[currentUser]?.[currentMode]?.[currentCareerId] || null;
}
function openLeagueSelector(){
    const modal=document.getElementById('leagueModal');
    const select=document.getElementById('league-select');
    if(!modal || !select){ console.error('Seletor de ligas: modal ou lista não encontrado no HTML.'); return; }
    const grouped=PES_LEAGUES.reduce((map,item)=>{(map[item.group] ||= []).push(item);return map;},{});
    select.innerHTML=Object.entries(grouped).map(([group,items])=>`<optgroup label="${group}">${items.map(item=>`<option value="${item.name}">${item.flag} ${item.name}</option>`).join('')}</optgroup>`).join('');
    const career=currentLeagueCareer();
    select.value=normalizeSelectedLeague(career) || PES_LEAGUES[0].name;
    previewLeagueTheme(select.value);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
function closeLeagueSelector(){
    const modal=document.getElementById('leagueModal');
    if(modal){modal.classList.add('hidden');modal.classList.remove('flex');}
}
function leagueBackgroundLayers(league, preview=false){
    const stadium = "url('/static/img/league-stadium.svg')";
    return `linear-gradient(115deg, ${league.color}${preview?'e8':'b8'} 0%, rgba(2,6,23,${preview?'.70':'.88'}) 72%), radial-gradient(ellipse at 14% 8%, ${league.accent}${preview?'35':'22'} 0%, transparent 48%), ${stadium}`;
}
function previewLeagueTheme(name){
    const league=PES_LEAGUES.find(item=>item.name===name) || PES_LEAGUES[0];
    const preview=document.getElementById('league-preview');
    const title=document.getElementById('league-preview-name');
    const meta=document.getElementById('league-preview-meta');
    if(preview){
        preview.style.backgroundColor='#080d19';
        preview.style.backgroundImage=leagueBackgroundLayers(league,true);
        preview.style.backgroundSize='cover';
        preview.style.backgroundPosition='center';
        preview.style.borderColor=league.accent+'66';
        preview.style.boxShadow=`inset 3px 0 0 ${league.accent}aa`;
    }
    if(title){title.textContent=`${league.flag} ${league.name}`;title.style.color=league.accent;title.title=league.sponsor||league.group;}
    if(meta){meta.textContent=league.sponsor||`Competição nacional • ${league.group}`;}
}
function saveLeagueSelection(){
    const career=currentLeagueCareer();
    const select=document.getElementById('league-select');
    if(!select) return;
    if(!career){alert('Crie ou selecione uma carreira antes de aplicar uma liga.');return;}
    career.selectedLeague=select.value;
    applyLeagueTheme(career);
    saveLocalData();
    closeLeagueSelector();
}
function applyLeagueTheme(career=null){
    const activeCareer=career || currentLeagueCareer();
    const selectedName=normalizeSelectedLeague(activeCareer);
    const league=PES_LEAGUES.find(item=>item.name===selectedName);
    const body=document.body;
    if(!body) return;
    if(!league){
        body.style.setProperty('--league-color','#020617');
        body.style.setProperty('--league-accent','#38bdf8');
        body.style.backgroundColor='';
        body.style.backgroundImage='';
        return;
    }
    body.style.setProperty('--league-color',league.color);
    body.style.setProperty('--league-accent',league.accent);
    body.style.backgroundColor='#020617';
    body.style.backgroundImage=leagueBackgroundLayers(league,false);
    body.style.backgroundSize='cover';
    body.style.backgroundPosition='center center';
    body.style.backgroundRepeat='no-repeat';
    body.style.backgroundAttachment='fixed';
}

function switchMode(mode) {
    currentMode = mode;

    // Marca o modo diretamente no app para que módulos exclusivos nunca
    // vazem visualmente de um modo para o outro, mesmo com conteúdo antigo.
    const appScreen = document.getElementById('app-screen');
    if (appScreen) appScreen.dataset.mode = mode;

    const btnRumo = document.getElementById('btn-rumo');
    const btnMaster = document.getElementById('btn-master');
    const lifestyleSection = document.querySelector('.lifestyle-section');
    const playerProfileCard = document.getElementById('player-profile-card');
    const balExclusiveSection = document.getElementById('be-a-legend-exclusive-section');
    const individualTrophyCard = document.getElementById('trophy-individual-card');
    const careerClubHistory = document.getElementById('career-club-history');
    const masterClubManagement = document.getElementById('master-club-management');
    const masterTabs = document.getElementById('master-tabs');
    const balTabs = document.getElementById('bal-tabs');

    if (mode === 'rumo_ao_estrelato') {
        if (individualTrophyCard) individualTrophyCard.style.display = '';
        const balYellowStat = document.getElementById('bal-yellow-stat');
        const balRedStat = document.getElementById('bal-red-stat');
        if (balYellowStat) balYellowStat.style.display = '';
        if (balRedStat) balRedStat.style.display = '';
        const pTaken = document.getElementById('bal-penalties-taken-stat');
        const pScored = document.getElementById('bal-penalties-scored-stat');
        const pMissed = document.getElementById('bal-penalties-missed-stat');
        if (pTaken) pTaken.style.display = '';
        if (pScored) pScored.style.display = '';
        if (pMissed) pMissed.style.display = '';
        btnRumo.className = "btn-mode flex-1 md:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all bg-cyan-500/20 text-cyan-400 border border-cyan-500/40";
        btnMaster.className = "btn-mode flex-1 md:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all text-slate-400 hover:text-white";
        
        document.getElementById('mode-title').innerText = 'Become a Legend (Jogador)';
        document.getElementById('label-dynamic-1').innerText = 'Gols Totais';
        document.getElementById('label-dynamic-2').innerText = 'Assistências Totais';
        const masterStats = document.getElementById('bal-stats-section');
        if (masterStats) masterStats.style.display = '';

        // EXIBE APENAS NO BECOME A LEGEND
        if (lifestyleSection) lifestyleSection.style.display = 'block';
        if (playerProfileCard) playerProfileCard.style.display = 'block';
        if (balExclusiveSection) balExclusiveSection.style.display = 'block';
        if (careerClubHistory) careerClubHistory.style.display = 'block';
        if (masterClubManagement) masterClubManagement.style.display = 'none';
        if (balTabs && typeof switchBALTab === 'function') { balTabs.classList.remove('hidden'); switchBALTab('overview'); }
        if (masterTabs) masterTabs.classList.add('hidden');

    } else {
        if (individualTrophyCard) individualTrophyCard.style.display = 'none';
        const balYellowStat = document.getElementById('bal-yellow-stat');
        const balRedStat = document.getElementById('bal-red-stat');
        if (balYellowStat) balYellowStat.style.display = 'none';
        if (balRedStat) balRedStat.style.display = 'none';
        const pTaken = document.getElementById('bal-penalties-taken-stat');
        const pScored = document.getElementById('bal-penalties-scored-stat');
        const pMissed = document.getElementById('bal-penalties-missed-stat');
        if (pTaken) pTaken.style.display = 'none';
        if (pScored) pScored.style.display = 'none';
        if (pMissed) pMissed.style.display = 'none';
        btnMaster.className = "btn-mode flex-1 md:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all bg-cyan-500/20 text-cyan-400 border border-cyan-500/40";
        btnRumo.className = "btn-mode flex-1 md:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all text-slate-400 hover:text-white";
        
        document.getElementById('mode-title').innerText = 'Master Liga (Treinador/Clube)';
        document.getElementById('label-dynamic-1').innerText = 'Gols Pro';
        document.getElementById('label-dynamic-2').innerText = 'Gols Sofridos';
        const masterStats = document.getElementById('bal-stats-section');
        if (masterStats) masterStats.style.display = 'none';

        // OCULTA NA MASTER LIGA
        if (lifestyleSection) lifestyleSection.style.display = 'none';
        if (playerProfileCard) playerProfileCard.style.display = 'none';
        if (balExclusiveSection) balExclusiveSection.style.display = 'none';
        if (careerClubHistory) careerClubHistory.style.display = 'none';
        if (masterClubManagement) masterClubManagement.style.display = 'block';
        if (balTabs) balTabs.classList.add('hidden');
        if (masterTabs) { masterTabs.classList.remove('hidden'); if (typeof switchMasterTab === 'function') switchMasterTab('overview'); }
        document.querySelectorAll('[data-bal-panel]').forEach(p => { p.classList.remove('bal-active'); });
    }

    // Limpa imediatamente o painel compartilhado antes de reconstruí-lo.
    const newFeatures = document.getElementById('new-features-container');
    if (newFeatures) {
        newFeatures.innerHTML = '';
        newFeatures.style.display = mode === 'rumo_ao_estrelato' ? 'block' : 'block';
    }

    updateCareerDropdown();
    // Reconstrói no modo atual, sem atraso, evitando que a Master apareça no Rumo.
    renderNewFeatures();
    if (mode === 'rumo_ao_estrelato' && typeof switchBALTab === 'function') switchBALTab('overview');
}

function updateCareerDropdown() {
    const select = document.getElementById('select-career');
    select.innerHTML = '<option value="">-- Selecione uma Carreira --</option>';

    if (!appData.users[currentUser]) {
        appData.users[currentUser] = { rumo_ao_estrelato: {}, master_liga: {} };
    }

    const careers = appData.users[currentUser][currentMode] || {};
    const keys = Object.keys(careers);

    keys.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.innerText = careers[id].name;
        select.appendChild(opt);
    });

    if (keys.length > 0) {
        if (!currentCareerId || !careers[currentCareerId]) {
            currentCareerId = keys[0];
        }
        select.value = currentCareerId;
    } else {
        currentCareerId = null;
    }

    renderData();
}

function changeCareer() {
    const select = document.getElementById('select-career');
    currentCareerId = select.value || null;
    renderData();
}

function openCareerModal() {
    document.getElementById('input-career-name').value = '';
    document.getElementById('careerModal').style.display = 'flex';
}

function closeCareerModal() {
    document.getElementById('careerModal').style.display = 'none';
}

function handleCreateCareer(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    const nameInput = document.getElementById('input-career-name');
    if (!nameInput) return;

    const name = nameInput.value.trim();
    if (!name) return;

    if (!appData.users[currentUser]) {
        appData.users[currentUser] = { rumo_ao_estrelato: {}, master_liga: {} };
    }
    if (!appData.users[currentUser][currentMode]) {
        appData.users[currentUser][currentMode] = {};
    }

    const id = 'career_' + Date.now();
    const newCareer = {
        name: name,
        currency: 'BRL',
        profile: { idade: '-', camisa: '-', posicao: '-', nacionalidade: '-', empresario: '-', pai: '-', mae: '-', irmao: '-', namorada: '-' },
        sponsor: 'none',
        coachStatus: { trust: 50, dissatisfaction: 0, role: 'Rotação de Elenco', requestedTransfer: false },
        relationshipStatus: { level: 50 },
        marketData: { marketValue: 0, releaseClause: 0 },
        transfers: [],
        clubes: []
    };

    // Perfil de atleta, incluindo camisa e posição, é exclusivo do Become a Legend.
    if (currentMode === 'rumo_ao_estrelato') {
        newCareer.profile.camisa = '-';
        newCareer.profile.posicao = '-';
    }

    appData.users[currentUser][currentMode][id] = newCareer;

    saveLocalData();
    currentCareerId = id;
    closeCareerModal();
    updateCareerDropdown();
}

function openDeleteCareerModal() {
    if (!currentCareerId) return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    document.getElementById('delete-career-name').innerText = career.name;
    document.getElementById('deleteCareerModal').style.display = 'flex';
}

function closeDeleteCareerModal() {
    document.getElementById('deleteCareerModal').style.display = 'none';
}

function confirmDeleteCareer() {
    if (!currentCareerId) return;
    delete appData.users[currentUser][currentMode][currentCareerId];
    saveLocalData();
    currentCareerId = null;
    closeDeleteCareerModal();
    updateCareerDropdown();
}

// PERFIL DO JOGADOR
function openProfileModal() {
    if (!currentCareerId) return;
    const prof = appData.users[currentUser][currentMode][currentCareerId].profile || {};
    document.getElementById('input-prof-idade').value = prof.idade ? prof.idade.replace(' anos', '') : '';
    document.getElementById('input-prof-camisa').value = prof.camisa && prof.camisa !== '-' ? prof.camisa : '';
    document.getElementById('input-prof-posicao').value = prof.posicao && prof.posicao !== '-' ? prof.posicao : '';
    document.getElementById('input-prof-nacionalidade').value = prof.nacionalidade || '';
    document.getElementById('input-prof-empresario').value = prof.empresario || '';
    document.getElementById('input-prof-pai').value = prof.pai || '';
    document.getElementById('input-prof-mae').value = prof.mae || '';
    document.getElementById('input-prof-irmao').value = prof.irmao || '';
    document.getElementById('input-prof-namorada').value = prof.namorada || '';
    document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function handleSaveProfile(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    if (!currentCareerId) return;

    appData.users[currentUser][currentMode][currentCareerId].profile = {
        idade: document.getElementById('input-prof-idade').value ? `${document.getElementById('input-prof-idade').value} anos` : '-',
        camisa: document.getElementById('input-prof-camisa').value ? String(document.getElementById('input-prof-camisa').value) : '-',
        posicao: document.getElementById('input-prof-posicao').value || '-',
        nacionalidade: document.getElementById('input-prof-nacionalidade').value.trim() || '-',
        empresario: document.getElementById('input-prof-empresario').value.trim() || '-',
        pai: document.getElementById('input-prof-pai').value.trim() || '-',
        mae: document.getElementById('input-prof-mae').value.trim() || '-',
        irmao: document.getElementById('input-prof-irmao').value.trim() || '-',
        namorada: document.getElementById('input-prof-namorada').value.trim() || '-'
    };

    saveLocalData();
    closeProfileModal();
    renderData();
}

// RELACIONAMENTO COM O TÉCNICO
function openCoachModal() {
    if (!currentCareerId) return;
    const coach = appData.users[currentUser][currentMode][currentCareerId].coachStatus || { trust: 50, dissatisfaction: 0, role: 'Rotação de Elenco', requestedTransfer: false };
    const interactionButton = document.querySelector('#coachModal button[onclick="openCareerInteractionMenu(\'coach\')"]');
    if (interactionButton) interactionButton.style.display = currentMode === 'rumo_ao_estrelato' ? '' : 'none';
    
    document.getElementById('input-coach-trust').value = coach.trust;
    document.getElementById('input-dissatisfaction').value = coach.dissatisfaction;
    document.getElementById('input-squad-role').value = coach.role;
    document.getElementById('input-request-transfer').checked = coach.requestedTransfer;

    document.getElementById('coachModal').style.display = 'flex';
}

function closeCoachModal() {
    document.getElementById('coachModal').style.display = 'none';
}

function handleSaveCoach(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    if (!currentCareerId) return;

    appData.users[currentUser][currentMode][currentCareerId].coachStatus = {
        trust: Number(document.getElementById('input-coach-trust').value) || 0,
        dissatisfaction: Number(document.getElementById('input-dissatisfaction').value) || 0,
        role: document.getElementById('input-squad-role').value,
        requestedTransfer: document.getElementById('input-request-transfer').checked
    };

    saveLocalData();
    closeCoachModal();
    renderData();
}

// RELACIONAMENTOS / VIDA AMOROSA
function normalizeRelationship(career) {
    if (!career.relationshipStatus) career.relationshipStatus = { level: 50, status: 'namorando' };

    const rel = career.relationshipStatus;
    if (!rel.status) {
        rel.status = (career.profile?.namorada && career.profile.namorada !== '-') ? 'namorando' : 'solteiro';
    }

    if (!Array.isArray(rel.history)) rel.history = [];
    if (!Array.isArray(rel.dates)) rel.dates = [];
    if (!Array.isArray(rel.gifts)) rel.gifts = [];

    const legacyLevel = Math.max(0, Math.min(100, Number(rel.level) || 0));
    if (rel.affection === undefined) rel.affection = legacyLevel;
    if (rel.trust === undefined) rel.trust = legacyLevel;
    if (rel.compatibility === undefined) rel.compatibility = legacyLevel;

    rel.affection = Math.max(0, Math.min(100, Number(rel.affection) || 0));
    rel.trust = Math.max(0, Math.min(100, Number(rel.trust) || 0));
    rel.compatibility = Math.max(0, Math.min(100, Number(rel.compatibility) || 0));

    if (rel.status === 'solteiro') {
        rel.level = 0;
    } else {
        rel.level = Math.round((rel.affection + rel.trust + rel.compatibility) / 3);
    }

    if (!rel.partner) {
        const oldName = career.profile?.namorada && career.profile.namorada !== '-' ? career.profile.namorada : '';
        rel.partner = oldName ? { name: oldName } : null;
    }

    if (!rel.partner && rel.status !== 'solteiro') rel.status = 'solteiro';
    if (rel.partner && !rel.partner.name) rel.partner.name = career.profile?.namorada || 'Parceiro(a)';

    return rel;
}

function relationshipStatusLabel(status) {
    return {
        solteiro: 'Solteiro',
        namorando: 'Namorando',
        noivo: 'Noivo(a)',
        casado: 'Casado(a)'
    }[status] || 'Solteiro';
}

function relationshipBar(value, label, cls='rose') {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    return `<div>
        <div class="flex justify-between text-[11px] mb-1"><span class="text-slate-400">${label}</span><strong class="text-white">${v}%</strong></div>
        <div class="h-2 bg-slate-800 rounded-full overflow-hidden"><div class="h-2 bg-${cls}-400 rounded-full transition-all" style="width:${v}%"></div></div>
    </div>`;
}

function openRelationshipModal() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    const rel = normalizeRelationship(career);
    const partnerName = rel.partner?.name || '';

    const historyRows = rel.history.length
        ? rel.history.slice(0, 8).map((h) => `
            <div class="bg-black/25 border border-white/5 rounded-lg p-2.5">
                <div class="flex justify-between gap-2">
                    <strong class="text-xs text-white">${escapeHtml(h.name || 'Relacionamento')}</strong>
                    <span class="text-[10px] text-slate-500">${escapeHtml(h.date || '')}</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1">${escapeHtml(h.status || 'Encerrado')} • ${Number(h.level || 0)}%</div>
            </div>`).join('')
        : '<p class="text-xs text-slate-500 italic">Nenhum relacionamento anterior registrado.</p>';

    const actions = rel.status === 'solteiro'
        ? `<button onclick="openRelationshipEditModal()" class="feature-action w-full"> Iniciar relacionamento</button>`
        : `
            <button onclick="relationshipInteraction('conversa')" class="feature-action w-full"> Conversar e fortalecer a confiança</button>
            <button onclick="relationshipInteraction('encontro')" class="feature-action w-full"> Marcar encontro <span class="text-slate-400">${currencySymbol()} 250</span></button>
            <button onclick="relationshipActivityMenu()" class="feature-action w-full"> Viagens, passeios e momentos a dois</button>
            <button onclick="relationshipCommunicationMenu()" class="feature-action w-full"> Mensagens, ligações e rotina</button>
            <button onclick="relationshipTrustMenu()" class="feature-action w-full"> Ciúmes, rumores e confiança</button>
            <button onclick="relationshipGiftMenu()" class="feature-action w-full"> Presentes e datas especiais</button>
            <button onclick="relationshipRomanceMenu()" class="feature-action w-full"> Intimidade romântica</button>
            <button onclick="relationshipFutureMenu()" class="feature-action w-full"> Planos de futuro e morar juntos</button>
            ${rel.status === 'namorando' ? `<button onclick="proposeMarriage()" class="feature-action gold w-full"> Pedir em casamento</button>` : ''}
            ${rel.status === 'noivo' ? `<button onclick="marryRelationship()" class="feature-action gold w-full"> Casar</button>` : ''}
            <button onclick="openRelationshipBreakupModal()" class="feature-action danger w-full"> Encerrar relacionamento</button>
            <button onclick="openRelationshipEditModal()" class="feature-action w-full"> Editar relacionamento</button>
        `;

    const body = `
        <div class="space-y-4">
            <div class="bg-gradient-to-r from-rose-500/10 to-purple-500/10 border border-rose-500/20 rounded-2xl p-4">
                <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-2xl"></div>
                    <div class="flex-1">
                        <div class="text-[10px] uppercase tracking-wider text-slate-500">Status</div>
                        <strong class="text-xl text-white">${relationshipStatusLabel(rel.status)}</strong>
                        ${partnerName ? `<div class="text-sm text-rose-300 mt-1">${escapeHtml(partnerName)}</div>` : '<div class="text-xs text-slate-500 mt-1">Nenhum parceiro(a) atual</div>'}
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] text-slate-500 uppercase">Relação</div>
                        <strong class="text-3xl text-rose-400">${rel.level}%</strong>
                    </div>
                </div>
            </div>

            ${rel.status !== 'solteiro' ? `
            <div class="bg-black/25 border border-white/5 rounded-xl p-4 space-y-3">
                ${relationshipBar(rel.affection, 'Afeto', 'rose')}
                ${relationshipBar(rel.trust, 'Confiança', 'cyan')}
                ${relationshipBar(rel.compatibility, 'Compatibilidade', 'purple')}
            </div>` : ''}

            <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-white mb-2">Ações</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${actions}</div>
            </div>

            <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-white mb-2">Histórico amoroso</h4>
                <div class="space-y-2 max-h-44 overflow-y-auto">${historyRows}</div>
            </div>
        </div>`;

    showFeatureModal('Relacionamentos • Vida Amorosa', body, 'Fechar', 'closeFeatureModal()');
}

function openRelationshipEditModal() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    const rel = normalizeRelationship(career);
    const name = rel.partner?.name || career.profile?.namorada || '';
    const level = rel.status === 'solteiro' ? 0 : rel.level;

    const body = `
        <div class="space-y-4">
            <div>
                <label class="text-xs text-slate-400 block mb-1">Status</label>
                <select id="input-relationship-status" onchange="updateRelationshipForm()" class="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white">
                    <option value="solteiro">Solteiro</option>
                    <option value="namorando">Namorando</option>
                    <option value="noivo">Noivo(a)</option>
                    <option value="casado">Casado(a)</option>
                </select>
            </div>
            <div id="relationship-name-wrap">
                <label class="text-xs text-slate-400 block mb-1">Nome do parceiro(a)</label>
                <input id="input-relationship-name" value="${escapeHtml(name)}" placeholder="Ex.: Ana" class="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white">
            </div>
            <div id="relationship-level-wrap">
                <div class="flex justify-between mb-2"><label class="text-xs text-slate-400">Nível inicial</label><span id="relationship-level-value" class="text-sm font-black text-rose-400">${level}%</span></div>
                <input type="range" id="input-relationship-level" min="0" max="100" value="${level}" oninput="updateRelationshipValue(this.value)" class="w-full accent-rose-500">
                <p class="text-[10px] text-slate-500 mt-2">O nível inicial define afeto, confiança e compatibilidade. Depois, essas características evoluem separadamente pelas ações.</p>
            </div>
        </div>`;

    showFeatureModal('Editar relacionamento', body, 'Salvar', 'handleSaveRelationship()');
    document.getElementById('input-relationship-status').value = rel.status;
    updateRelationshipForm();
}

function updateRelationshipValue(value) {
    const el = document.getElementById('relationship-level-value');
    if (el) el.innerText = `${value}%`;
}

function updateRelationshipForm() {
    const status = document.getElementById('input-relationship-status')?.value || 'solteiro';
    const hasPartner = status !== 'solteiro';
    const nameWrap = document.getElementById('relationship-name-wrap');
    const levelWrap = document.getElementById('relationship-level-wrap');
    if (nameWrap) nameWrap.style.display = hasPartner ? 'block' : 'none';
    if (levelWrap) levelWrap.style.display = hasPartner ? 'block' : 'none';
}

function handleSaveRelationship() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    const status = document.getElementById('input-relationship-status')?.value || 'solteiro';
    const name = document.getElementById('input-relationship-name')?.value.trim() || '';

    const rel = normalizeRelationship(career);
    if (status === 'solteiro') {
        if (rel.partner?.name) {
            rel.history.unshift({
                name: rel.partner.name,
                status: 'Encerrado',
                level: rel.level,
                date: new Date().toLocaleDateString('pt-BR')
            });
        }
        rel.status = 'solteiro';
        rel.level = rel.affection = rel.trust = rel.compatibility = 0;
        rel.partner = null;
        career.profile.namorada = '-';
    } else {
        const initial = Math.max(0, Math.min(100, Number(document.getElementById('input-relationship-level')?.value) || 0));
        rel.status = status;
        rel.level = rel.affection = rel.trust = rel.compatibility = initial;
        rel.partner = { name: name || rel.partner?.name || 'Parceiro(a)' };
        career.profile.namorada = rel.partner.name;
    }

    saveLocalData();
    closeFeatureModal();
    renderData();
}

function relationshipInteraction(type) {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    const rel = normalizeRelationship(career);
    if (rel.status === 'solteiro' || !rel.partner) return;

    if (type === 'encontro') {
        const pf = ensurePersonalLifeData(career);
        const cost = 250;
        const balance = Number(pf.balance || 0);
        if (balance < cost) {
            return showFeatureModal('Encontro', `<p class="text-sm text-slate-300">Saldo insuficiente para o encontro.</p><p class="text-xs text-slate-500 mt-2">Necessário: ${currencySymbol()} 250 • Disponível: ${moneyBR(balance)}</p>`, 'Fechar', 'closeFeatureModal()');
        }
        pf.balance = balance - cost;
        if (typeof logPlayerTransaction === 'function') logPlayerTransaction(career, 'saída', 'Encontro romântico', cost);
        rel.affection += 7;
        rel.trust += 4;
        rel.compatibility += 6;
        rel.dates.unshift({date:new Date().toLocaleDateString('pt-BR'), cost});
        addRelationshipEvent(rel, `Encontro com ${rel.partner.name}`);
    } else {
        rel.affection += 3;
        rel.trust += 4;
        rel.compatibility += 1;
        addRelationshipEvent(rel, `Conversa com ${rel.partner.name}`);
    }

    normalizeRelationship(career);
    saveLocalData();
    renderData();
    openRelationshipModal();
}

function relationshipGiftMenu() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const body = `
        <div class="grid grid-cols-2 gap-2">
            <button onclick="giveRelationshipGift('flores',80)" class="feature-action"> Flores <span>${currencySymbol()} 80</span></button>
            <button onclick="giveRelationshipGift('jantar',300)" class="feature-action"> Jantar <span>${currencySymbol()} 300</span></button>
            <button onclick="giveRelationshipGift('perfume',500)" class="feature-action"> Perfume <span>${currencySymbol()} 500</span></button>
            <button onclick="giveRelationshipGift('joia',1200)" class="feature-action gold"> Joia <span>${currencySymbol()} 1.200</span></button>
        </div>`;
    showFeatureModal('Dar presente', body, 'Voltar', 'openRelationshipModal()');
}

function giveRelationshipGift(name, cost) {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    const rel = normalizeRelationship(career);
    const pf = ensurePersonalLifeData(career);
    const balance = Number(pf.balance || 0);

    if (rel.status === 'solteiro' || !rel.partner) return;
    if (balance < cost) {
        return showFeatureModal('Presente', `<p class="text-sm text-slate-300">Saldo insuficiente.</p><p class="text-xs text-slate-500 mt-2">Necessário: ${moneyBR(cost)} • Disponível: ${moneyBR(balance)}</p>`, 'Voltar', 'relationshipGiftMenu()');
    }

    pf.balance = balance - cost;
    if (typeof logPlayerTransaction === 'function') logPlayerTransaction(career, 'saída', `Presente para ${rel.partner.name}: ${name}`, cost);
    rel.affection += cost >= 1000 ? 10 : 6;
    rel.trust += 3;
    rel.compatibility += 2;
    rel.gifts.unshift({name, cost, date:new Date().toLocaleDateString('pt-BR')});
    addRelationshipEvent(rel, `Presente: ${name}`);

    normalizeRelationship(career);
    saveLocalData();
    renderData();
    openRelationshipModal();
}

/* Relacionamento expandido — recursos adicionais da versão 1.5. Cada ação grava histórico e altera atributos. */
function relationshipActivityMenu(){
 const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);if(rel.status==='solteiro'||!rel.partner)return;
 const body=`<div class="space-y-2"><p class="text-xs text-slate-400">Escolha uma atividade. Passeios mais caros consomem o saldo do jogador.</p>
 <button onclick="relationshipDoActivity('parque',80,4,5,5)" class="feature-action w-full">Passeio no parque · ${currencySymbol()} 80</button>
 <button onclick="relationshipDoActivity('cinema',180,6,4,5)" class="feature-action w-full">Cinema e jantar · ${currencySymbol()} 180</button>
 <button onclick="relationshipDoActivity('viagem',900,10,7,8)" class="feature-action w-full">Viagem de fim de semana · ${currencySymbol()} 900</button>
 <button onclick="relationshipDoActivity('data especial',350,8,8,7)" class="feature-action w-full">Comemorar uma data especial · ${currencySymbol()} 350</button></div>`;
 showFeatureModal('Passeios e viagens',body,'Voltar','openRelationshipModal()');
}
function relationshipDoActivity(label,cost,affection,trust,compatibility){const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);const pf=ensurePersonalLifeData(c);const balance=Number(pf.balance||0);if(balance<cost)return showFeatureModal('Saldo insuficiente',`<p class="text-sm text-slate-300">Você precisa de ${moneyBR(cost)} para esta atividade. Saldo disponível: ${moneyBR(balance)}.</p>`,'Voltar','relationshipActivityMenu()');pf.balance=balance-cost;if(typeof logPlayerTransaction==='function')logPlayerTransaction(c,'saída',`Relacionamento: ${label}`,cost);rel.affection+=affection;rel.trust+=trust;rel.compatibility+=compatibility;rel.dates.unshift({date:new Date().toLocaleDateString('pt-BR'),cost,type:label});relationshipRemember(c,label,`Você escolheu ${label} com ${rel.partner.name}.`);normalizeRelationship(c);saveLocalData();renderData();openRelationshipModal();}
function relationshipCommunicationMenu(){const body=`<div class="space-y-2"><button onclick="relationshipDoCommunication('mensagem carinhosa',3,3,2)" class="feature-action w-full">Enviar mensagem carinhosa</button><button onclick="relationshipDoCommunication('ligação antes do jogo',3,4,3)" class="feature-action w-full">Ligar antes de uma partida importante</button><button onclick="relationshipDoCommunication('conversa sincera',2,6,5)" class="feature-action w-full">Conversar sobre a rotina e a falta de tempo</button><button onclick="relationshipDoCommunication('esquecer de responder',-4,-5,-2)" class="feature-action danger w-full">Deixar a mensagem sem resposta</button></div>`;showFeatureModal('Comunicação do casal',body,'Voltar','openRelationshipModal()');}
function relationshipDoCommunication(label,a,t,co){const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);if(!rel.partner)return;rel.affection+=a;rel.trust+=t;rel.compatibility+=co;relationshipRemember(c,label,({ 'mensagem carinhosa':'Você reservou um momento para demonstrar carinho.','ligação antes do jogo':'Você ligou antes da partida e mostrou que se importa.','conversa sincera':'Vocês conversaram sobre expectativas e rotina.','esquecer de responder':'A mensagem ficou sem resposta e isso causou insegurança.'})[label]||label);normalizeRelationship(c);saveLocalData();renderData();openRelationshipModal();}
function relationshipTrustMenu(){const body=`<div class="space-y-2"><p class="text-xs text-slate-400">As decisões ficam registradas e influenciam a confiança futura.</p><button onclick="relationshipDoTrust('explicar rumor',5,7,2)" class="feature-action w-full">Explicar um rumor com calma</button><button onclick="relationshipDoTrust('conversar sobre ciúmes',4,5,6)" class="feature-action w-full">Conversar sobre ciúmes e limites</button><button onclick="relationshipDoTrust('esconder situação',-8,-12,-5)" class="feature-action danger w-full">Esconder uma situação importante</button><button onclick="relationshipDoTrust('promessa cumprida',5,6,4)" class="feature-action w-full">Cumprir uma promessa feita a ela</button></div>`;showFeatureModal('Confiança e rumores',body,'Voltar','openRelationshipModal()');}
function relationshipDoTrust(label,a,t,co){const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);if(!rel.partner)return;rel.affection+=a;rel.trust+=t;rel.compatibility+=co;relationshipRemember(c,label,`Decisão sobre confiança: ${label}.`);normalizeRelationship(c);saveLocalData();renderData();if(a<0&&rel.level<35)showFeatureModal('Tensão no relacionamento',`<p class="text-sm text-slate-300">${escapeHtml(rel.partner.name)} está magoada. Você pode tentar reconstruir a confiança com atitudes consistentes.</p>`,'Tentar conversar','relationshipInteraction(\'conversa\')');else openRelationshipModal();}
function relationshipRomanceMenu(){const body=`<div class="space-y-2"><p class="text-xs text-slate-400">Momentos afetivos não explícitos; o resultado depende da confiança e da compatibilidade.</p><button onclick="relationshipDoRomance('noite romântica',250,7,5,6)" class="feature-action w-full">Preparar uma noite romântica · ${currencySymbol()} 250</button><button onclick="relationshipDoRomance('tempo de qualidade em casa',0,5,5,7)" class="feature-action w-full">Passar um tempo de qualidade em casa · Grátis</button><button onclick="relationshipDoRomance('demonstrar carinho',0,4,3,3)" class="feature-action w-full">Demonstrar carinho e conversar · Grátis</button></div>`;showFeatureModal('Romance e intimidade',body,'Voltar','openRelationshipModal()');}
function relationshipDoRomance(label,cost,a,t,co){const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);if(!rel.partner)return;if(rel.trust<25||rel.compatibility<25)return showFeatureModal('É preciso conversar primeiro','<p class="text-sm text-slate-300">A confiança ou a compatibilidade está baixa. Respeite o momento dela e priorize uma conversa honesta.</p>','Voltar','relationshipRomanceMenu()');const pf=ensurePersonalLifeData(c);if(Number(pf.balance||0)<cost)return showFeatureModal('Saldo insuficiente','<p class="text-sm text-slate-300">Você não tem saldo suficiente para planejar essa noite.</p>','Voltar','relationshipRomanceMenu()');pf.balance=Number(pf.balance||0)-cost;if(cost&&typeof logPlayerTransaction==='function')logPlayerTransaction(c,'saída',`Relacionamento: ${label}`,cost);rel.affection+=a;rel.trust+=t;rel.compatibility+=co;relationshipRemember(c,label,'Vocês compartilharam um momento romântico e respeitaram os limites um do outro.');normalizeRelationship(c);saveLocalData();renderData();openRelationshipModal();}
function relationshipFutureMenu(){const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);if(!rel.partner)return;const living=!!rel.livingTogether;const body=`<div class="space-y-3"><div class="bg-black/25 rounded-xl p-3"><div class="text-xs text-slate-400">Plano atual</div><strong class="text-white">${living?'Morando juntos':'Morando separadamente'}</strong><div class="text-xs text-slate-500 mt-1">Relação: ${rel.level}% • Confiança: ${rel.trust}% • Compatibilidade: ${rel.compatibility}%</div></div>${!living?`<button onclick="relationshipSetLivingTogether()" class="feature-action w-full">Conversar sobre morar juntos</button>`:`<button onclick="relationshipMoveOut()" class="feature-action danger w-full">Decidir morar separadamente</button>`}<button onclick="relationshipAnniversary()" class="feature-action w-full">Registrar aniversário do casal</button><p class="text-xs text-slate-500">Noivado e casamento continuam sendo etapas separadas, com requisitos próprios.</p></div>`;showFeatureModal('Planos de futuro',body,'Voltar','openRelationshipModal()');}
function relationshipSetLivingTogether(){const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);if(!rel.partner)return;if(rel.status!=='namorando'&&rel.status!=='noivo'&&rel.status!=='casado')return;if(rel.level<65||rel.trust<55||rel.compatibility<50)return showFeatureModal('Ainda não é o momento',`<p class="text-sm text-slate-300">Para considerar morar juntos, a relação precisa ter pelo menos 65% de nível, 55% de confiança e 50% de compatibilidade.</p>`,'Voltar','relationshipFutureMenu()');rel.livingTogether=true;rel.affection+=2;rel.trust+=4;rel.compatibility+=4;relationshipRemember(c,'decidir morar juntos','Vocês decidiram dividir a casa e combinar responsabilidades.');normalizeRelationship(c);saveLocalData();renderData();openRelationshipModal();}
function relationshipMoveOut(){const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);if(!rel.partner)return;rel.livingTogether=false;rel.trust-=3;relationshipRemember(c,'morar separadamente','Vocês decidiram ter espaços separados por enquanto.');normalizeRelationship(c);saveLocalData();renderData();openRelationshipModal();}
function relationshipAnniversary(){const c=featureCareer();if(!c)return;const rel=normalizeRelationship(c);if(!rel.partner)return;rel.affection+=5;rel.trust+=4;rel.compatibility+=3;rel.anniversaries=Number(rel.anniversaries||0)+1;relationshipRemember(c,'aniversário do casal','Você se lembrou de comemorar uma data importante do casal.');normalizeRelationship(c);saveLocalData();renderData();openRelationshipModal();}
function relationshipRemember(c,title,description){const rel=normalizeRelationship(c);if(!Array.isArray(rel.memories))rel.memories=[];rel.memories.unshift({title,description,date:new Date().toLocaleDateString('pt-BR'),level:rel.level,trust:rel.trust});rel.memories=rel.memories.slice(0,50);addRelationshipEvent(rel,description);c.events=Array.isArray(c.events)?c.events:[];c.events.unshift({date:new Date().toLocaleDateString('pt-BR'),type:'Relacionamento',title,note:description});c.events=c.events.slice(0,100);}

function addRelationshipEvent(rel, text) {
    if (!Array.isArray(rel.events)) rel.events = [];
    rel.events.unshift({text, date:new Date().toLocaleDateString('pt-BR')});
    rel.events = rel.events.slice(0, 30);
}

function openRelationshipBreakupModal() {
    const career = featureCareer();
    if (!career) return;
    const rel = normalizeRelationship(career);
    if (rel.status === 'solteiro' || !rel.partner) return;

    const body = `
        <div class="space-y-3">
            <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <div class="text-xs text-slate-400">Você está prestes a encerrar seu relacionamento com</div>
                <strong class="block text-lg text-white mt-1">${escapeHtml(rel.partner.name)}</strong>
                <div class="text-xs text-slate-500 mt-1">Nível atual: ${rel.level}%</div>
            </div>
            <p class="text-sm text-slate-300">O relacionamento será colocado no histórico e você ficará solteiro.</p>
        </div>`;
    showFeatureModal('Encerrar relacionamento', body, 'Encerrar relacionamento', 'confirmRelationshipBreakup()');
}

function confirmRelationshipBreakup() {
    const career = featureCareer();
    if (!career) return;
    const rel = normalizeRelationship(career);
    if (rel.status === 'solteiro' || !rel.partner) return;

    rel.history.unshift({
        name: rel.partner.name,
        status: relationshipStatusLabel(rel.status),
        level: rel.level,
        date: new Date().toLocaleDateString('pt-BR')
    });
    rel.status = 'solteiro';
    rel.level = rel.affection = rel.trust = rel.compatibility = 0;
    rel.partner = null;
    if (!career.profile) career.profile = {};
    career.profile.namorada = '-';

    saveLocalData();
    closeFeatureModal();
    renderData();
}

function proposeMarriage() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    const rel = normalizeRelationship(career);
    if (rel.status !== 'namorando' || !rel.partner) {
        return showFeatureModal('Pedido de casamento', '<p class="text-sm text-slate-300">Você precisa estar namorando para fazer um pedido de casamento.</p>', 'Fechar', 'closeFeatureModal()');
    }
    if (rel.level < 70 || rel.compatibility < 60) {
        return showFeatureModal('Pedido de casamento', `<p class="text-sm text-slate-300">O relacionamento ainda não está pronto para esse passo.</p><div class="text-xs text-slate-500 mt-3">Necessário: relação 70% e compatibilidade 60%.</div>`, 'Fechar', 'closeFeatureModal()');
    }

    rel.status = 'noivo';
    rel.affection += 3;
    rel.trust += 6;
    addRelationshipEvent(rel, `Pedido de casamento aceito por ${rel.partner.name}`);
    normalizeRelationship(career);
    saveLocalData();
    renderData();
    openRelationshipModal();
}

function marryRelationship() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const career = appData.users[currentUser][currentMode][currentCareerId];
    const rel = normalizeRelationship(career);
    if (rel.status !== 'noivo') return;
    if (rel.level < 80) {
        return showFeatureModal('Casamento', '<p class="text-sm text-slate-300">O relacionamento precisa chegar a 80% antes do casamento.</p>', 'Fechar', 'closeFeatureModal()');
    }

    rel.status = 'casado';
    rel.affection += 4;
    rel.trust += 8;
    rel.compatibility += 3;
    addRelationshipEvent(rel, `Casamento com ${rel.partner.name}`);
    normalizeRelationship(career);
    saveLocalData();
    renderData();
    openRelationshipModal();
}

function setSingleRelationship() {
    openRelationshipBreakupModal();
}

function finishRelationship() {
    openRelationshipBreakupModal();
}

// TRANSFERÊNCIAS E MERCADO
function openTransferModal() {
    if (!currentCareerId) return;
    document.getElementById('transferModal').style.display = 'flex';
}

function closeTransferModal() {
    document.getElementById('transferModal').style.display = 'none';
}

function handleSaveTransfer(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    if (!currentCareerId) return;

    const career = appData.users[currentUser][currentMode][currentCareerId];
    if (!career.transfers) career.transfers = [];
    if (!career.marketData) career.marketData = { marketValue: 0, releaseClause: 0 };

    const type = document.getElementById('input-transfer-type').value;
    const fee = Number(document.getElementById('input-transfer-fee').value) || 0;
    const marketVal = Number(document.getElementById('input-transfer-market-val').value) || 0;
    const clause = Number(document.getElementById('input-transfer-clause').value) || 0;

    career.transfers.push({
        from: document.getElementById('input-transfer-from').value.trim(),
        to: document.getElementById('input-transfer-to').value.trim(),
        season: document.getElementById('input-transfer-season').value.trim(),
        type: type,
        fee: fee,
        marketVal: marketVal,
        clause: clause
    });

    if (marketVal > 0) career.marketData.marketValue = marketVal;
    if (clause > 0) career.marketData.releaseClause = clause;

    saveLocalData();
    closeTransferModal();
    renderData();
}

function deleteTransfer(index) {
    if (!currentCareerId) return;
    if (confirm('Deseja remover este registro de transferência?')) {
        appData.users[currentUser][currentMode][currentCareerId].transfers.splice(index, 1);
        saveLocalData();
        renderData();
    }
}

// RENDERIZAÇÃO COMPLETA
