// ESTADO GLOBAL DA APLICAÇÃO
let currentUser = null;
let currentMode = 'rumo_ao_estrelato';
let currentCareerId = null;
let editingIndex = -1;
let syncTimer = null;
let isSyncing = false;
const PROJECT_VERSION = '1.4';

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
function switchMode(mode) {
    currentMode = mode;

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

    updateCareerDropdown();
    // Força a atualização visual das novidades ao trocar de modo.
    setTimeout(() => { renderNewFeatures(); if (mode === 'rumo_ao_estrelato' && typeof switchBALTab === 'function') switchBALTab('overview'); }, 0);
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
        ? `<button onclick="openRelationshipEditModal()" class="feature-action w-full">❤️ Iniciar relacionamento</button>`
        : `
            <button onclick="relationshipInteraction('conversa')" class="feature-action w-full">💬 Conversar</button>
            <button onclick="relationshipInteraction('encontro')" class="feature-action w-full">🍽️ Marcar encontro <span class="text-slate-400">${currencySymbol()} 250</span></button>
            <button onclick="relationshipGiftMenu()" class="feature-action w-full">🎁 Dar presente</button>
            ${rel.status === 'namorando' ? `<button onclick="proposeMarriage()" class="feature-action gold w-full">💍 Pedir em casamento</button>` : ''}
            ${rel.status === 'noivo' ? `<button onclick="marryRelationship()" class="feature-action gold w-full">💒 Casar</button>` : ''}
            <button onclick="openRelationshipBreakupModal()" class="feature-action danger w-full">💔 Encerrar relacionamento</button>
            <button onclick="openRelationshipEditModal()" class="feature-action w-full">⚙️ Editar relacionamento</button>
        `;

    const body = `
        <div class="space-y-4">
            <div class="bg-gradient-to-r from-rose-500/10 to-purple-500/10 border border-rose-500/20 rounded-2xl p-4">
                <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-2xl">❤️</div>
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
            <button onclick="giveRelationshipGift('flores',80)" class="feature-action">🌹 Flores <span>${currencySymbol()} 80</span></button>
            <button onclick="giveRelationshipGift('jantar',300)" class="feature-action">🍷 Jantar <span>${currencySymbol()} 300</span></button>
            <button onclick="giveRelationshipGift('perfume',500)" class="feature-action">🌸 Perfume <span>${currencySymbol()} 500</span></button>
            <button onclick="giveRelationshipGift('joia',1200)" class="feature-action gold">💎 Joia <span>${currencySymbol()} 1.200</span></button>
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
