// ESTADO GLOBAL DA APLICAÇÃO
let currentUser = null;
let currentMode = 'rumo_ao_estrelato';
let currentCareerId = null;
let editingIndex = -1;
let syncTimer = null;
let isSyncing = false;
const PROJECT_VERSION = '1.2';

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

    if (mode === 'rumo_ao_estrelato') {
        if (individualTrophyCard) individualTrophyCard.style.display = '';
        btnRumo.className = "btn-mode flex-1 md:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all bg-cyan-500/20 text-cyan-400 border border-cyan-500/40";
        btnMaster.className = "btn-mode flex-1 md:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all text-slate-400 hover:text-white";
        
        document.getElementById('mode-title').innerText = 'Rumo ao Estrelato (Jogador)';
        document.getElementById('label-dynamic-1').innerText = 'Gols Totais';
        document.getElementById('label-dynamic-2').innerText = 'Assistências Totais';

        // EXIBE APENAS NO RUMO AO ESTRELATO
        if (lifestyleSection) lifestyleSection.style.display = 'block';
        if (playerProfileCard) playerProfileCard.style.display = 'block';
        if (balExclusiveSection) balExclusiveSection.style.display = 'block';
        if (careerClubHistory) careerClubHistory.style.display = 'block';
        if (masterClubManagement) masterClubManagement.style.display = 'none';

    } else {
        if (individualTrophyCard) individualTrophyCard.style.display = 'none';
        btnMaster.className = "btn-mode flex-1 md:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all bg-cyan-500/20 text-cyan-400 border border-cyan-500/40";
        btnRumo.className = "btn-mode flex-1 md:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all text-slate-400 hover:text-white";
        
        document.getElementById('mode-title').innerText = 'Master Liga (Treinador/Clube)';
        document.getElementById('label-dynamic-1').innerText = 'Gols Pro';
        document.getElementById('label-dynamic-2').innerText = 'Gols Sofridos';

        // OCULTA NA MASTER LIGA
        if (lifestyleSection) lifestyleSection.style.display = 'none';
        if (playerProfileCard) playerProfileCard.style.display = 'none';
        if (balExclusiveSection) balExclusiveSection.style.display = 'none';
        if (careerClubHistory) careerClubHistory.style.display = 'none';
        if (masterClubManagement) masterClubManagement.style.display = 'block';
    }

    updateCareerDropdown();
    // Força a atualização visual das novidades ao trocar de modo.
    setTimeout(() => renderNewFeatures(), 0);
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
        profile: { idade: '-', camisa: '-', posicao: '-', nacionalidade: '-', empresario: '-', pai: '-', mae: '-', irmao: '-', namorada: '-' },
        sponsor: 'none',
        coachStatus: { trust: 50, dissatisfaction: 0, role: 'Rotação de Elenco', requestedTransfer: false },
        relationshipStatus: { level: 50 },
        marketData: { marketValue: 0, releaseClause: 0 },
        transfers: [],
        clubes: []
    };

    // Perfil de atleta, incluindo camisa e posição, é exclusivo do Rumo ao Estrelato.
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
            <button onclick="relationshipInteraction('encontro')" class="feature-action w-full">🍽️ Marcar encontro <span class="text-slate-400">R$ 250</span></button>
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
            return showFeatureModal('Encontro', `<p class="text-sm text-slate-300">Saldo insuficiente para o encontro.</p><p class="text-xs text-slate-500 mt-2">Necessário: R$ 250 • Disponível: R$ ${moneyBR(balance)}</p>`, 'Fechar', 'closeFeatureModal()');
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
            <button onclick="giveRelationshipGift('flores',80)" class="feature-action">🌹 Flores <span>R$ 80</span></button>
            <button onclick="giveRelationshipGift('jantar',300)" class="feature-action">🍷 Jantar <span>R$ 300</span></button>
            <button onclick="giveRelationshipGift('perfume',500)" class="feature-action">🌸 Perfume <span>R$ 500</span></button>
            <button onclick="giveRelationshipGift('joia',1200)" class="feature-action gold">💎 Joia <span>R$ 1.200</span></button>
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
        return showFeatureModal('Presente', `<p class="text-sm text-slate-300">Saldo insuficiente.</p><p class="text-xs text-slate-500 mt-2">Necessário: R$ ${moneyBR(cost)} • Disponível: R$ ${moneyBR(balance)}</p>`, 'Voltar', 'relationshipGiftMenu()');
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
function renderData() {
    const listEl = document.getElementById('lista-clubes');
    if (listEl) listEl.innerHTML = '';

    if (!currentCareerId || !appData.users[currentUser] || !appData.users[currentUser][currentMode] || !appData.users[currentUser][currentMode][currentCareerId]) {
        resetStats();
        // Mesmo sem carreira selecionada, a Master Liga deve mostrar as novidades.
        renderNewFeatures();
        return;
    }

    const career = appData.users[currentUser][currentMode][currentCareerId];
    
    // Perfil
    const prof = career.profile || {};
    if (document.getElementById('prof-idade')) document.getElementById('prof-idade').innerText = prof.idade || '-';
    if (document.getElementById('prof-camisa')) document.getElementById('prof-camisa').innerText = prof.camisa || '-';
    if (document.getElementById('prof-posicao')) document.getElementById('prof-posicao').innerText = prof.posicao || '-';
    if (document.getElementById('prof-nacionalidade')) document.getElementById('prof-nacionalidade').innerText = prof.nacionalidade || '-';
    if (document.getElementById('prof-empresario')) document.getElementById('prof-empresario').innerText = prof.empresario || '-';
    if (document.getElementById('prof-pai')) document.getElementById('prof-pai').innerText = prof.pai || '-';
    if (document.getElementById('prof-mae')) document.getElementById('prof-mae').innerText = prof.mae || '-';
    if (document.getElementById('prof-irmao')) document.getElementById('prof-irmao').innerText = prof.irmao || '-';
    if (document.getElementById('prof-namorada')) document.getElementById('prof-namorada').innerText = prof.namorada || '-';

    // Patrocínio de chuteira
    const sponsorSelect = document.getElementById('sponsor-boots');
    if (sponsorSelect) {
        sponsorSelect.value = career.sponsor || 'none';
        sponsorSelect.onchange = (e) => {
            career.sponsor = e.target.value;
            saveLocalData();
        };
    }

    // Render exclusivo BAL: Técnico & Insatisfação
    if (currentMode === 'rumo_ao_estrelato') {
        const coach = career.coachStatus || { trust: 50, dissatisfaction: 0, role: 'Rotação de Elenco', requestedTransfer: false };
        if (!career.relationshipStatus) career.relationshipStatus = { level: 50 };
        const relationship = normalizeRelationship(career);
        const relationshipValue = relationship.level;
        const statusLabels = { solteiro: 'Solteiro', namorando: 'Namorando', noivo: 'Noivo(a)', casado: 'Casado(a)' };
        if (document.getElementById('display-relationship-val')) document.getElementById('display-relationship-val').innerText = `${relationshipValue}%`;
        if (document.getElementById('display-relationship-bar')) document.getElementById('display-relationship-bar').style.width = `${relationshipValue}%`;
        if (document.getElementById('display-relationship-status')) document.getElementById('display-relationship-status').innerText = statusLabels[relationship.status] || 'Solteiro';
        const relActions = document.getElementById('relationship-actions');
        if (relActions) {
            if (relationship.status === 'solteiro') {
                relActions.innerHTML = `<button onclick="openRelationshipModal()" class="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">Iniciar relacionamento</button>`;
            } else if (relationship.status === 'namorando') {
                relActions.innerHTML = `<button onclick="proposeMarriage()" class="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold"><i class="fa-solid fa-ring mr-1"></i>Pedir em casamento</button><button onclick="finishRelationship()" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border border-white/10 text-xs font-bold">Terminar relação</button>`;
            } else if (relationship.status === 'noivo') {
                relActions.innerHTML = `<button onclick="openRelationshipModal()" class="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">Atualizar noivado</button><button onclick="finishRelationship()" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border border-white/10 text-xs font-bold">Terminar noivado</button>`;
            } else {
                relActions.innerHTML = `<button onclick="openRelationshipModal()" class="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">Atualizar casamento</button><button onclick="finishRelationship()" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border border-white/10 text-xs font-bold">Encerrar casamento</button>`;
            }
        }
        
        if (document.getElementById('display-coach-trust-val')) document.getElementById('display-coach-trust-val').innerText = `${coach.trust}%`;
        if (document.getElementById('display-coach-trust-bar')) document.getElementById('display-coach-trust-bar').style.width = `${coach.trust}%`;
        
        if (document.getElementById('display-dissatisfaction-val')) document.getElementById('display-dissatisfaction-val').innerText = `${coach.dissatisfaction}%`;
        if (document.getElementById('display-dissatisfaction-bar')) document.getElementById('display-dissatisfaction-bar').style.width = `${coach.dissatisfaction}%`;
        
        if (document.getElementById('display-squad-role')) document.getElementById('display-squad-role').innerText = coach.role;
        if (document.getElementById('display-transfer-request-status')) document.getElementById('display-transfer-request-status').innerText = `Pedir transferência: ${coach.requestedTransfer ? 'Sim (Ativo)' : 'Não'}`;
        
        if (document.getElementById('display-coach-status')) {
            if (coach.trust >= 80) document.getElementById('display-coach-status').innerText = 'Homem de Confiança';
            else if (coach.trust >= 50) document.getElementById('display-coach-status').innerText = 'Reserva Utilizado';
            else document.getElementById('display-coach-status').innerText = 'Fora dos Planos';
        }

        if (document.getElementById('display-dissatisfaction-status')) {
            if (coach.dissatisfaction >= 75) document.getElementById('display-dissatisfaction-status').innerText = 'Em Atrito com o Clube';
            else if (coach.dissatisfaction >= 40) document.getElementById('display-dissatisfaction-status').innerText = 'Incomodado com Minutos';
            else document.getElementById('display-dissatisfaction-status').innerText = 'Satisfeito com o Clube';
        }

        // Render exclusivo BAL: Transferências & Mercado
        const transfers = career.transfers || [];
        const market = career.marketData || { marketValue: 0, releaseClause: 0 };
        
        if (document.getElementById('market-value-display')) document.getElementById('market-value-display').innerText = `€ ${market.marketValue || 0}M`;
        if (document.getElementById('release-clause-display')) document.getElementById('release-clause-display').innerText = `€ ${market.releaseClause || 0}M`;

        let highestFee = 0;
        let rejectedCount = 0;

        const transferListEl = document.getElementById('transfer-history-list');
        if (transferListEl) {
            transferListEl.innerHTML = '';

            if (transfers.length === 0) {
                transferListEl.innerHTML = '<p class="text-xs text-slate-500 italic">Nenhuma transferência registrada.</p>';
            } else {
                transfers.forEach((t, idx) => {
                    if (t.type === 'Proposta Recusada') rejectedCount++;
                    if (t.fee > highestFee) highestFee = t.fee;

                    const trItem = document.createElement('div');
                    trItem.className = "bg-black/20 border border-white/5 p-3 rounded-lg flex justify-between items-center text-xs";
                    trItem.innerHTML = `
                        <div>
                            <span class="font-bold text-white">${t.from} <i class="fa-solid fa-arrow-right text-slate-500 mx-1"></i> ${t.to}</span>
                            <span class="text-[10px] text-slate-400 block">${t.season} | ${t.type}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="font-mono text-emerald-400 font-bold">${t.fee > 0 ? `€ ${t.fee}M` : 'Grátis'}</span>
                            <button onclick="deleteTransfer(${idx})" class="text-rose-400 hover:text-rose-300"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `;
                    transferListEl.appendChild(trItem);
                });
            }
        }

        if (document.getElementById('highest-fee-display')) document.getElementById('highest-fee-display').innerText = `€ ${highestFee}M`;
        if (document.getElementById('rejected-offers-display')) document.getElementById('rejected-offers-display').innerText = rejectedCount;
    }

    // Estatísticas dos Clubes
    let totalJogos = 0, totalVitorias = 0, totalEmpates = 0, totalDerrotas = 0;
    let totalDyn1 = 0, totalDyn2 = 0;
    let tLiga = 0, tContinental = 0, tCopa = 0, tMundial = 0, tSupercopa = 0, tIndividual = 0;

    const clubes = career.clubes || [];

    clubes.forEach((c, index) => {
        totalJogos += Number(c.jogos || 0);
        totalVitorias += Number(c.vitorias || 0);
        totalEmpates += Number(c.empates || 0);
        totalDerrotas += Number(c.derrotas || 0);
        totalDyn1 += Number(c.dyn1 || 0);
        totalDyn2 += Number(c.dyn2 || 0);

        const titulosStr = (c.titulos || '').toLowerCase();
        if (titulosStr.includes('liga')) tLiga++;
        if (titulosStr.includes('copa')) tCopa++;
        if (titulosStr.includes('champions') || titulosStr.includes('libertadores') || titulosStr.includes('continental')) tContinental++;
        if (titulosStr.includes('mundial')) tMundial++;
        if (titulosStr.includes('supercopa')) tSupercopa++;
        if (titulosStr.includes('bola de ouro') || titulosStr.includes('the best') || titulosStr.includes('artilheiro')) tIndividual++;

        if (listEl) {
            const item = document.createElement('div');
            item.className = "bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all";
            
            const contratoLabel = currentMode === 'rumo_ao_estrelato' ? 'Fim de Contrato' : 'Contrato';
            const tempoClubeHtml = c.tempoClube
                ? ` | Tempo no Clube: <strong class="text-cyan-400">${c.tempoClube}</strong>`
                : ' | Tempo no Clube: <strong class="text-cyan-400">-</strong>';

            const jogosClube = Number(c.jogos || 0);
            const vitoriasClube = Number(c.vitorias || 0);
            const empatesClube = Number(c.empates || 0);
            const aproveitamentoClube = jogosClube > 0
                ? (((vitoriasClube * 3 + empatesClube) / (jogosClube * 3)) * 100).toFixed(1)
                : '0.0';

            item.innerHTML = `
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <h3 class="font-bold text-white text-base">${c.clube}</h3>
                        <span class="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">${c.temporada || 'N/A'}</span>
                    </div>
                    <p class="text-xs text-slate-400">${contratoLabel}: <strong class="text-slate-200">${c.contrato || '-'}</strong>${tempoClubeHtml} | Salário: <strong class="text-slate-200">R$ ${c.salario || '0'}</strong></p>
                    <p class="text-xs text-amber-400 font-medium"><i class="fa-solid fa-trophy mr-1"></i> ${c.titulos || 'Nenhum título registrado'}</p>
                </div>
                <div class="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <div class="text-right text-xs">
                        <div class="text-slate-300 font-mono"><strong>${c.jogos}J</strong> (${c.vitorias}V / ${c.empates}E / ${c.derrotas}D)</div>
                        <div class="text-slate-400 font-mono mt-0.5">${currentMode === 'rumo_ao_estrelato' ? 'Gols' : 'GP'}: <strong class="text-cyan-400">${c.dyn1}</strong> | ${currentMode === 'rumo_ao_estrelato' ? 'Assist' : 'GC'}: <strong class="text-purple-400">${c.dyn2}</strong></div>
                        <div class="text-cyan-400 font-mono mt-0.5 font-bold"><i class="fa-solid fa-chart-line mr-1"></i>Aproveitamento: ${aproveitamentoClube}%</div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="openModal(${index})" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-all"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deleteClube(${index})" class="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
            listEl.appendChild(item);
        }
    });

    if (document.getElementById('qtd-clubes')) document.getElementById('qtd-clubes').innerText = clubes.length;
    if (document.getElementById('stat-jogos')) document.getElementById('stat-jogos').innerText = totalJogos;
    if (document.getElementById('stat-vitorias')) document.getElementById('stat-vitorias').innerText = totalVitorias;
    if (document.getElementById('stat-empates')) document.getElementById('stat-empates').innerText = totalEmpates;
    if (document.getElementById('stat-derrotas')) document.getElementById('stat-derrotas').innerText = totalDerrotas;
    if (document.getElementById('stat-dynamic-1')) document.getElementById('stat-dynamic-1').innerText = totalDyn1;
    if (document.getElementById('stat-dynamic-2')) document.getElementById('stat-dynamic-2').innerText = totalDyn2;

    const aproveitamento = totalJogos > 0 ? (((totalVitorias * 3 + totalEmpates) / (totalJogos * 3)) * 100).toFixed(1) : 0;
    if (document.getElementById('stat-aproveitamento')) document.getElementById('stat-aproveitamento').innerText = `${aproveitamento}%`;

    if (document.getElementById('trophy-liga-count')) document.getElementById('trophy-liga-count').innerText = tLiga;
    if (document.getElementById('trophy-continental-count')) document.getElementById('trophy-continental-count').innerText = tContinental;
    if (document.getElementById('trophy-copa-count')) document.getElementById('trophy-copa-count').innerText = tCopa;
    if (document.getElementById('trophy-mundial-count')) document.getElementById('trophy-mundial-count').innerText = tMundial;
    if (document.getElementById('trophy-supercopa-count')) document.getElementById('trophy-supercopa-count').innerText = tSupercopa;
    if (document.getElementById('trophy-individual-count')) document.getElementById('trophy-individual-count').innerText = tIndividual;
    if (document.getElementById('total-trophies-count')) document.getElementById('total-trophies-count').innerText = tLiga + tContinental + tCopa + tMundial + tSupercopa + tIndividual;

    // Na Master Liga, mantém a edição do clube atual sem trazer o histórico do jogador.
    const masterClubDisplay = document.getElementById('master-club-display');
    if (masterClubDisplay && currentMode === 'master_liga') {
        if (!clubes.length) {
            masterClubDisplay.innerHTML = `
                <div class="bg-black/30 border border-white/5 rounded-xl p-5 text-center">
                    <p class="text-sm text-slate-400">Nenhum clube cadastrado nesta carreira.</p>
                    <button onclick="openModal()" class="feature-action mt-3">+ Cadastrar clube atual</button>
                </div>`;
        } else {
            const currentIndex = clubes.length - 1;
            const c = clubes[currentIndex];
            const aproveitamentoAtual = Number(c.jogos || 0) > 0
                ? (((Number(c.vitorias || 0) * 3 + Number(c.empates || 0)) / (Number(c.jogos || 0) * 3)) * 100).toFixed(1)
                : '0.0';
            masterClubDisplay.innerHTML = `
                <div class="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-white text-lg">${escapeHtml(c.clube || 'Clube não informado')}</h4>
                            <span class="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">${escapeHtml(c.temporada || 'Temporada não informada')}</span>
                        </div>
                        <div class="text-xs text-slate-400 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Contrato: <strong class="text-slate-200">${escapeHtml(c.contrato || '-')}</strong></span>
                            <span>Tempo: <strong class="text-cyan-400">${escapeHtml(c.tempoClube || '-')}</strong></span>
                            <span>Salário: <strong class="text-slate-200">R$ ${escapeHtml(c.salario || '0')}</strong></span>
                        </div>
                        <div class="text-xs text-amber-400 mt-2">🏆 ${escapeHtml(c.titulos || 'Nenhum título registrado')}</div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right text-xs">
                            <div class="text-slate-300 font-mono"><strong>${Number(c.jogos || 0)}J</strong> (${Number(c.vitorias || 0)}V / ${Number(c.empates || 0)}E / ${Number(c.derrotas || 0)}D)</div>
                            <div class="text-slate-400 font-mono mt-1">GP: <strong class="text-cyan-400">${Number(c.dyn1 || 0)}</strong> | GC: <strong class="text-purple-400">${Number(c.dyn2 || 0)}</strong></div>
                            <div class="text-cyan-400 font-mono font-bold mt-1">Aproveitamento: ${aproveitamentoAtual}%</div>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="openModal(${currentIndex})" class="p-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all" title="Editar clube atual"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button onclick="deleteClube(${currentIndex})" class="p-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all" title="Excluir clube"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
        }
    }
}

function resetStats() {
    const ids = ['qtd-clubes', 'stat-jogos', 'stat-vitorias', 'stat-empates', 'stat-derrotas', 'stat-dynamic-1', 'stat-dynamic-2', 'total-trophies-count'];
    ids.forEach(id => {
        if (document.getElementById(id)) document.getElementById(id).innerText = '0';
    });
    if (document.getElementById('stat-aproveitamento')) document.getElementById('stat-aproveitamento').innerText = '0%';
}

function openModal(index = -1) {
    if (!currentCareerId) return alert('Selecione ou crie uma carreira primeiro!');

    editingIndex = index;
    const isEdit = index >= 0;
    document.getElementById('modal-title-text').innerText = isEdit ? 'Editar Clube' : 'Adicionar Clube';

    const modalLabel1 = document.getElementById('modal-label-1');
    const modalLabel2 = document.getElementById('modal-label-2');
    const modalLabelContrato = document.getElementById('modal-label-contrato');
    const containerTempoClube = document.getElementById('container-tempo-permanencia');

    if (currentMode === 'rumo_ao_estrelato') {
        if (modalLabel1) modalLabel1.innerText = 'Gols';
        if (modalLabel2) modalLabel2.innerText = 'Assistências';
        if (modalLabelContrato) modalLabelContrato.innerText = 'Término do Contrato';
        if (containerTempoClube) containerTempoClube.style.display = 'block';
    } else {
        if (modalLabel1) modalLabel1.innerText = 'Gols Pro';
        if (modalLabel2) modalLabel2.innerText = 'Gols Sofridos';
        if (modalLabelContrato) modalLabelContrato.innerText = 'Duração Contrato';
        if (containerTempoClube) containerTempoClube.style.display = 'block';
    }

    if (isEdit) {
        const c = appData.users[currentUser][currentMode][currentCareerId].clubes[index];
        document.getElementById('input-clube').value = c.clube || '';
        document.getElementById('input-temporada').value = c.temporada || '';
        document.getElementById('input-contrato').value = c.contrato || '';
        document.getElementById('input-tempo-clube').value = c.tempoClube || '';
        document.getElementById('input-salario').value = c.salario || '';
        document.getElementById('input-jogos').value = c.jogos || 0;
        document.getElementById('input-vitorias').value = c.vitorias || 0;
        document.getElementById('input-empates').value = c.empates || 0;
        document.getElementById('input-derrotas').value = c.derrotas || 0;
        document.getElementById('input-dynamic-1').value = c.dyn1 || 0;
        document.getElementById('input-dynamic-2').value = c.dyn2 || 0;
        document.getElementById('input-titulos').value = c.titulos || '';
    } else {
        document.getElementById('editForm').reset();
    }

    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    editingIndex = -1;
}

const editForm = document.getElementById('editForm');
if (editForm) {
    editForm.addEventListener('submit', (e) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        if (!currentCareerId) return;

        const clubeData = {
            clube: document.getElementById('input-clube').value.trim(),
            temporada: document.getElementById('input-temporada').value.trim(),
            contrato: document.getElementById('input-contrato').value.trim(),
            tempoClube: document.getElementById('input-tempo-clube').value.trim(),
            salario: document.getElementById('input-salario').value.trim(),
            jogos: Number(document.getElementById('input-jogos').value) || 0,
            vitorias: Number(document.getElementById('input-vitorias').value) || 0,
            empates: Number(document.getElementById('input-empates').value) || 0,
            derrotas: Number(document.getElementById('input-derrotas').value) || 0,
            dyn1: Number(document.getElementById('input-dynamic-1').value) || 0,
            dyn2: Number(document.getElementById('input-dynamic-2').value) || 0,
            titulos: document.getElementById('input-titulos').value.trim()
        };

        const clubes = appData.users[currentUser][currentMode][currentCareerId].clubes;

        if (editingIndex >= 0) {
            clubes[editingIndex] = clubeData;
        } else {
            clubes.push(clubeData);
        }

        saveLocalData();
        closeModal();
        renderData();
    });
}

function deleteClube(index) {
    if (!currentCareerId) return;
    if (confirm('Deseja realmente remover este registro de clube?')) {
        appData.users[currentUser][currentMode][currentCareerId].clubes.splice(index, 1);
        saveLocalData();
        renderData();
    }
}

async function saveToCloud() {
    saveLocalData();
    if (appData.users[currentUser]?.authProvider !== 'google') {
        alert('A conta local salva apenas neste navegador. Entre com Google para sincronizar entre PC e celular.');
        return;
    }
    await syncToServer();
    alert('Dados sincronizados com a conta Google.');
}

async function loadFromCloud() {
    if (appData.users[currentUser]?.authProvider !== 'google') {
        loadLocalData();
        renderData();
        return alert('A conta local não possui sincronização entre dispositivos.');
    }
    const ok = await loadCloudData();
    if (ok) renderData();
    alert(ok ? 'Dados da nuvem sincronizados!' : 'Não foi possível carregar os dados da nuvem.');
}
// ============================================================
// NOVOS MÓDULOS - CALENDÁRIO, ELENCO, EVOLUÇÃO, TROFÉUS,
// FINANÇAS, TREINADOR, NOTÍCIAS, POPULARIDADE, SELEÇÃO,
// RECORDES E BACKUP
// ============================================================

function ensureFeatureData(career) {
    if (!career.calendar) career.calendar = [];
    if (!career.squad) career.squad = [];
    if (!career.attributes) career.attributes = {
        overall: 0, velocidade: 0, aceleracao: 0, finalizacao: 0,
        passe: 0, drible: 0, forca: 0, resistencia: 0, defesa: 0, cabecio: 0
    };
    if (!career.trophies) career.trophies = [];
    if (!career.finance) career.finance = { budget: 0, salaryBudget: 0, revenue: 0, expenses: 0 };
    // Finanças pessoais são exclusivas do Rumo ao Estrelato.
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
    if (!career.relations) career.relations = [];
    if (!career.events) career.events = [];
    // Dados exclusivos da Master Liga: Comissão Técnica e Reputação do Clube.
    if (!career.staff) career.staff = [];
    if (!career.clubReputation) career.clubReputation = {
        national: 50, international: 20, prestige: 50, fan: 50, media: 50,
        playerAttraction: 50, staffAttraction: 50
    };
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
    return `R$ ${Number(value || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
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
    return `R$ ${Number(value || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
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
    showFeatureModal('Adicionar bem ao patrimônio', `<div class="space-y-3"><input id="custom-asset-name" placeholder="Ex.: Relógio recebido de presente" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><select id="custom-asset-category" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Outros</option><option>Moradia</option><option>Veículos</option><option>Luxo</option><option>Tecnologia</option><option>Negócios</option></select><input id="custom-asset-value" type="number" min="0" placeholder="Valor estimado (R$)" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`, 'Adicionar', 'saveCustomPatrimonyAsset()');
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
                    <div class="text-[11px] text-slate-500 mt-1">Prazo: ${deadline} ${g.reward ? `• Recompensa: R$ ${moneyBR(g.reward)}` : ''}</div>
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
                <div><label class="text-xs text-slate-400">Recompensa (R$)</label><input id="pg-reward" type="number" min="0" value="${Number(g.reward)||0}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
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
    if(section==='cellphone') body=`<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Modelo</label><input id="pl-phone" value="${escapeHtml(pf.cellphone.model)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Valor (R$)</label><input id="pl-phone-value" type="number" min="0" value="${pf.cellphone.value||0}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`;
    if(section==='sponsorship') body=`<div class="space-y-3"><input id="pl-sponsor" placeholder="Marca / contrato" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><input id="pl-sponsor-value" type="number" min="0" placeholder="Valor do contrato (R$)" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>`;
    if(section==='bank') body=`<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Score bancário</label><input id="pl-bank-score" type="number" min="0" max="1000" value="${pf.bank.score||0}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Saldo atual</label><input value="R$ ${moneyBR(pf.balance)}" disabled class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-slate-400"></div></div>`;
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
    showFeatureModal('Mercado de Transferências', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Jogador</label><input id="mk-name" placeholder="Nome do jogador" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Posição</label><input id="mk-pos" placeholder="MEI" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Idade</label><input id="mk-age" type="number" value="20" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Overall</label><input id="mk-ovr" type="number" min="1" max="100" value="75" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Valor (€M)</label><input id="mk-value" type="number" step="0.1" value="10" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Preço pedido (€M)</label><input id="mk-price" type="number" step="0.1" value="15" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Status</label><select id="mk-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Disponível</option><option>Negociação</option><option>Contratado</option><option>Descartado</option></select></div></div>`, 'Adicionar', 'saveMarket()');
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
    showFeatureModal('Banco de Clubes', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Nome do clube</label><input id="clubdb-name" placeholder="Santos FC" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">País</label><input id="clubdb-country" placeholder="Brasil" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Liga</label><input id="clubdb-league" placeholder="Brasileirão" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Overall do elenco</label><input id="clubdb-ovr" type="number" min="1" max="100" value="75" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Orçamento (€M)</label><input id="clubdb-budget" type="number" step="0.1" value="0" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Cadastrar', 'saveClubDatabase()');
}
function saveClubDatabase(){const u=accountData();if(!u)return;u.clubDatabase.push({name:document.getElementById('clubdb-name').value.trim(),country:document.getElementById('clubdb-country').value.trim(),league:document.getElementById('clubdb-league').value.trim(),overall:Number(document.getElementById('clubdb-ovr').value)||0,budget:Number(document.getElementById('clubdb-budget').value)||0});saveLocalData();closeFeatureModal();renderData();}
function deleteClubDatabase(i){const u=accountData();if(u&&confirm('Remover clube do banco?')){u.clubDatabase.splice(i,1);saveLocalData();renderData();}}

function openAwardModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Novo Prêmio Individual', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Prêmio</label><input id="aw-name" placeholder="Bola de Ouro" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Temporada</label><input id="aw-season" placeholder="2027/28" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Clube</label><input id="aw-club" placeholder="Barcelona" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Competição</label><input id="aw-comp" placeholder="Champions League" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Descrição</label><input id="aw-note" placeholder="Melhor jogador da competição" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Adicionar', 'saveAward()');
}
function saveAward(){const c=featureCareer();if(!c)return;c.awards.push({name:document.getElementById('aw-name').value.trim(),season:document.getElementById('aw-season').value.trim(),club:document.getElementById('aw-club').value.trim(),competition:document.getElementById('aw-comp').value.trim(),note:document.getElementById('aw-note').value.trim()});saveLocalData();closeFeatureModal();renderData();}
function deleteAward(i){const c=featureCareer();if(c&&confirm('Remover este prêmio?')){c.awards.splice(i,1);saveLocalData();renderData();}}

function openInjuryModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Registrar Lesão', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Lesão</label><input id="inj-name" placeholder="Entorse no tornozelo" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Data</label><input id="inj-date" type="date" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Dias afastado</label><input id="inj-days" type="number" min="0" value="7" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Gravidade</label><select id="inj-severity" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Leve</option><option>Moderada</option><option>Grave</option></select></div><div><label class="text-xs text-slate-400">Jogos perdidos</label><input id="inj-games" type="number" min="0" value="0" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div class="col-span-2"><label class="text-xs text-slate-400">Status</label><select id="inj-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Em recuperação</option><option>Recuperado</option></select></div></div>`, 'Adicionar', 'saveInjury()');
}
function saveInjury(){const c=featureCareer();if(!c)return;c.injuries.push({name:document.getElementById('inj-name').value.trim(),date:document.getElementById('inj-date').value,days:Number(document.getElementById('inj-days').value)||0,severity:document.getElementById('inj-severity').value,gamesLost:Number(document.getElementById('inj-games').value)||0,status:document.getElementById('inj-status').value});saveLocalData();closeFeatureModal();renderData();}
function deleteInjury(i){const c=featureCareer();if(c&&confirm('Remover este registro de lesão?')){c.injuries.splice(i,1);saveLocalData();renderData();}}

function openRelationModal(){
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Nova Relação', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Nome</label><input id="rel-name" placeholder="Nome da pessoa" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Tipo</label><select id="rel-type" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Companheiro</option><option>Técnico</option><option>Agente</option><option>Diretor</option><option>Amigo</option><option>Rival</option><option>Família</option><option>Outro</option></select></div><div><label class="text-xs text-slate-400">Nível (%)</label><input id="rel-level" type="number" min="0" max="100" value="50" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Status</label><select id="rel-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Boa</option><option>Neutra</option><option>Tensa</option><option>Rivalidade</option></select></div></div>`, 'Adicionar', 'saveRelation()');
}
function saveRelation(){const c=featureCareer();if(!c)return;c.relations.push({name:document.getElementById('rel-name').value.trim(),type:document.getElementById('rel-type').value,level:Math.max(0,Math.min(100,Number(document.getElementById('rel-level').value)||0)),status:document.getElementById('rel-status').value});saveLocalData();closeFeatureModal();renderData();}
function deleteRelation(i){const c=featureCareer();if(c&&confirm('Remover esta relação?')){c.relations.splice(i,1);saveLocalData();renderData();}}

function openCareerClubHistoryModal(index=null){
    const c=featureCareer(); if(!c)return;
    const editing=index!==null && c.clubes && c.clubes[index];
    const x=editing?c.clubes[index]:{};
    showFeatureModal(editing?'Editar Passagem na Carreira':'Adicionar Passagem na Carreira', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Clube</label><input id="ch-club" value="${escapeHtml(x.clube||x.nome||x.name||'')}" placeholder="Barcelona" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Temporada</label><input id="ch-season" value="${escapeHtml(x.temporada||'')}" placeholder="2027/28" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Tempo no clube</label><input id="ch-time" value="${escapeHtml(x.tempoClube||'')}" placeholder="2 anos" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, editing?'Salvar':'Adicionar', `saveCareerClubHistory(${editing?index:'null'})`);
}
function saveCareerClubHistory(index=null){const c=featureCareer();if(!c)return;if(!Array.isArray(c.clubes))c.clubes=[];const data={clube:document.getElementById('ch-club').value.trim(),temporada:document.getElementById('ch-season').value.trim(),tempoClube:document.getElementById('ch-time').value.trim()};if(!data.clube)return alert('Informe o nome do clube.');if(index===null)c.clubes.push(data);else c.clubes[index]=data;saveLocalData();closeFeatureModal();renderData();}
function deleteCareerClubHistory(i){const c=featureCareer();if(c&&Array.isArray(c.clubes)&&confirm('Excluir esta passagem da linha do tempo?')){c.clubes.splice(i,1);saveLocalData();renderData();}}

function openCareerEventModal(index=null){
    const c=featureCareer(); if(!c)return alert('Selecione uma carreira primeiro.');
    const editing=index!==null && c.events && c.events[index]; const x=editing?c.events[index]:{};
    showFeatureModal(editing?'Editar Evento da Carreira':'Novo Evento da Carreira', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Data</label><input id="ev-date" type="date" value="${escapeHtml(x.date||'')}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Categoria</label><select id="ev-type" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Estreia</option><option>Primeiro Gol</option><option>Primeiro Título</option><option>Seleção</option><option>Recorde</option><option>Transferência</option><option>Prêmio</option><option>Outro</option></select></div><div class="col-span-2"><label class="text-xs text-slate-400">Evento</label><input id="ev-title" value="${escapeHtml(x.title||'')}" placeholder="Estreia pelo Barcelona" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div class="col-span-2"><label class="text-xs text-slate-400">Detalhes</label><textarea id="ev-note" rows="3" placeholder="Conte o que aconteceu..." class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${escapeHtml(x.note||'')}</textarea></div></div>`, editing?'Salvar':'Adicionar', `saveCareerEvent(${editing?index:'null'})`);
    if(editing){const el=document.getElementById('ev-type'); if(el)el.value=x.type||'Outro';}
}
function saveCareerEvent(index=null){const c=featureCareer();if(!c)return;if(!Array.isArray(c.events))c.events=[];const data={date:document.getElementById('ev-date').value,type:document.getElementById('ev-type').value,title:document.getElementById('ev-title').value.trim(),note:document.getElementById('ev-note').value.trim()};if(index===null)c.events.push(data);else c.events[index]=data;saveLocalData();closeFeatureModal();renderData();}
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
    const modeLabel = currentMode === 'rumo_ao_estrelato' ? 'Rumo ao Estrelato' : 'Master Liga';
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
                                • Salário: <b class="text-white">€ ${money(salary)} mil/mês</b>
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
                        <label class="text-xs text-slate-400">Salário mensal (€ mil)</label>
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
                    <div class="text-lg font-bold text-white mt-1">€ ${money(salary)} mil</div>
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
    const hasCareer = !!career;
    const c = career || {};
    const staff = (Array.isArray(c.staff) ? c.staff : []).map(member => ({
        ...member,
        name: member?.name || 'Profissional sem nome',
        role: [
            'Treinador Principal',
            'Auxiliar Técnico',
            'Preparador Físico',
            'Preparador de Goleiros',
            'Analista de Desempenho',
            'Fisioterapeuta',
            'Psicólogo Esportivo'
        ].includes(member?.role) ? member.role : (member?.role || 'Sem função'),
        quality: Math.max(1, Math.min(100, Number(member?.quality) || 0)),
        salary: Math.max(0, Number(member?.salary) || 0)
    }));
    const rep = c.clubReputation || {
        national: 50, international: 20, prestige: 50, fan: 50, media: 50,
        playerAttraction: 50, staffAttraction: 50
    };

    const roles = [
        ['Treinador Principal','Treinador Principal'],
        ['Auxiliar Técnico','Auxiliar Técnico'],
        ['Preparador Físico','Preparador Físico'],
        ['Preparador de Goleiros','Preparador de Goleiros'],
        ['Analista de Desempenho','Analista de Desempenho'],
        ['Fisioterapeuta','Fisioterapeuta'],
        ['Psicólogo Esportivo','Psicólogo Esportivo']
    ];
    const totalSalary = staff.reduce((sum, x) => sum + (Number(x.salary) || 0), 0);
    const avgQuality = staff.length ? Math.round(staff.reduce((sum, x) => sum + (Number(x.quality) || 0), 0) / staff.length) : 0;

    const roleRows = roles.map(([label, role]) => {
        const members = staff.filter(x => x.role === role);
        const quality = members.length
            ? Math.round(members.reduce((sum, x) => sum + (Number(x.quality) || 0), 0) / members.length)
            : 0;

        const memberNames = members.length
            ? members.map(x => escapeHtml(x.name)).join(' • ')
            : 'Nenhum contratado';

        return `<div class="master-chart-row">
            <div class="master-chart-label">
                <span>${escapeHtml(label)}</span>
                <strong>${members.length ? quality : 0}/100</strong>
            </div>
            <div class="master-chart-track">
                <div class="master-chart-fill cyan" style="width:${quality}%"></div>
            </div>
            <div class="master-chart-sub">
                ${members.length} profissional(is) • ${memberNames}
            </div>
        </div>`;
    }).join('');

    const repItems = [
        ['Reputação nacional','national'],
        ['Reputação internacional','international'],
        ['Prestígio','prestige'],
        ['Reconhecimento da torcida','fan'],
        ['Reconhecimento da imprensa','media'],
        ['Atratividade para jogadores','playerAttraction'],
        ['Atratividade para comissão técnica','staffAttraction']
    ];
    const repRows = repItems.map(([label,key]) => {
        const value = Math.max(0, Math.min(100, Number(rep[key] ?? 0)));
        return `<div class="master-chart-row">
            <div class="master-chart-label"><span>${label}</span><strong>${value}/100</strong></div>
            <div class="master-chart-track"><div class="master-chart-fill purple" style="width:${value}%"></div></div>
        </div>`;
    }).join('');

    return `<div class="feature-panel master-new-features">
        <div class="feature-head">
            <div>
                <h3><i class="fa-solid fa-sparkles text-cyan-400 mr-2"></i>Novidades da Master Liga</h3>
                <p>Novos sistemas exclusivos do modo treinador</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="button" onclick="openStaffModal()" class="master-news-card cyan-card">
                <div class="master-news-title"><strong><i class="fa-solid fa-people-group text-cyan-400 mr-2"></i>Comissão Técnica</strong><span class="feature-action">Gerenciar</span></div>
                <p>Contrate ou demita profissionais, defina a qualidade e acompanhe o custo salarial.</p>
                <div class="master-news-stat">${staff.length} profissional(is) • Qualidade média <b>${avgQuality}/100</b> • € ${money(totalSalary)} mil/mês</div>
            </button>

            <button type="button" onclick="openClubReputationModal()" class="master-news-card purple-card">
                <div class="master-news-title"><strong><i class="fa-solid fa-earth-americas text-purple-400 mr-2"></i>Reputação do Clube</strong><span class="feature-action purple">Gerenciar</span></div>
                <p>Gerencie reputação nacional e internacional, prestígio, torcida, imprensa e atratividade.</p>
                <div class="master-news-stat">Prestígio <b>${Number(rep.prestige ?? 0)}/100</b> • Nacional <b>${Number(rep.national ?? 0)}/100</b></div>
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div class="master-chart-panel cyan-panel">
                <div class="master-chart-head"><div><h4><i class="fa-solid fa-chart-column text-cyan-400 mr-2"></i>Gráfico da Comissão Técnica</h4><p>Qualidade média por função</p></div><span>${staff.length} contratado(s)</span></div>
                <div class="master-chart-list">${roleRows}</div>
            </div>

            <div class="master-chart-panel purple-panel">
                <div class="master-chart-head"><div><h4><i class="fa-solid fa-chart-bar text-purple-400 mr-2"></i>Gráfico da Reputação do Clube</h4><p>Indicadores atuais — escala de 0 a 100</p></div><span>0–100</span></div>
                <div class="master-chart-list">${repRows}</div>
            </div>
        </div>

        ${!hasCareer ? '<p class="text-xs text-amber-300 mt-4"><i class="fa-solid fa-circle-info mr-1"></i>Crie ou selecione uma carreira da Master Liga para gerenciar estes sistemas.</p>' : ''}
    </div>`;
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
    const rows = (items, empty, fn) => items.length ? items.map(fn).join('') : `<p class="text-xs text-slate-500 italic">${empty}</p>`;
    const seasonRows = rows(seasons,'Nenhuma temporada registrada.',(x,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="flex justify-between gap-3"><div><strong class="text-white text-sm">${escapeHtml(x.season||'-')}</strong><span class="text-cyan-400 text-xs ml-2">${escapeHtml(x.club||'-')}</span></div><span class="text-xs text-slate-400">${x.games||0} jogos</span></div><div class="text-xs text-slate-400 mt-1">${x.wins||0}V • ${x.draws||0}E • ${x.losses||0}D • ${x.goals||0} G • ${x.assists||0} A • ${x.titles||0} títulos</div>${x.notes?`<p class="text-xs text-slate-500 mt-1">${escapeHtml(x.notes)}</p>`:''}</div>`);
    const trophyRows = rows(trophies,'Nenhum troféu detalhado.',(t,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-center"><div><strong class="text-amber-300 text-sm">🏆 ${escapeHtml(t.name)}</strong><span class="text-xs text-slate-400 block">${escapeHtml(t.season)} • ${escapeHtml(t.club)}</span></div><button onclick="deleteDetailedTrophy(${i})" class="text-rose-400"><i class="fa-solid fa-trash"></i></button></div>`);
    const compRows = rows(competitions,'Nenhuma competição registrada.',x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><strong class="text-white text-sm">${escapeHtml(x.competition)}</strong><span class="text-xs text-cyan-400 ml-2">${escapeHtml(x.season)}</span><div class="text-xs text-slate-400 mt-1">${x.games||0}J • ${x.wins||0}V • ${x.draws||0}E • ${x.losses||0}D • ${x.goals||0}G • ${x.assists||0}A</div><span class="text-xs text-amber-300">${escapeHtml(x.result||'')}</span></div>`);
    const objectiveRows = rows(objectives,'Nenhum objetivo cadastrado.',(x,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="flex justify-between"><strong class="text-white text-sm">${escapeHtml(x.title)}</strong><button onclick="deleteObjective(${i})" class="text-rose-400"><i class="fa-solid fa-trash"></i></button></div><div class="text-xs text-slate-400 mt-1">Meta: ${escapeHtml(x.target)} • ${escapeHtml(x.status)}</div><div class="h-2 bg-slate-800 rounded-full mt-2 overflow-hidden"><div class="h-2 bg-cyan-400" style="width:${Number(x.progress||0)}%"></div></div></div>`);
    const marketRows = rows(market,'Nenhum jogador no mercado.',x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between"><div><strong class="text-white text-sm">${escapeHtml(x.name)}</strong><span class="block text-xs text-slate-400">${escapeHtml(x.position)} • ${x.age} anos • OVR ${x.overall}</span></div><div class="text-right"><span class="text-xs text-emerald-400">€ ${money(x.price)}M</span><span class="block text-[10px] text-cyan-400">${escapeHtml(x.status)}</span></div></div>`);
    const newsRows = rows(news.slice().reverse(),'Nenhuma notícia criada.',n=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="text-[10px] text-cyan-400 font-mono">${escapeHtml(n.date||'')}</div><strong class="text-white text-sm block mt-1">${escapeHtml(n.title)}</strong><p class="text-xs text-slate-400 mt-1">${escapeHtml(n.text||'')}</p></div>`);
    const history = (career.clubes||[]).map((c,i)=>`<div class="relative pl-5 pb-4 border-l border-cyan-500/20"><span class="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-cyan-400"></span><div class="flex justify-between items-start gap-3"><div><strong class="text-white text-sm">${escapeHtml(c.clube||c.nome||c.name||'Clube')}</strong><span class="text-xs text-slate-400 ml-2">${escapeHtml((c.tempoClube ? '• '+c.tempoClube : '') + (c.temporada ? ' • '+c.temporada : ''))}</span></div><div class="flex gap-2 shrink-0"><button onclick="openCareerClubHistoryModal(${i})" class="text-cyan-400" title="Editar"><i class="fa-solid fa-pen"></i></button><button onclick="deleteCareerClubHistory(${i})" class="text-rose-400" title="Excluir"><i class="fa-solid fa-trash"></i></button></div></div></div>`).join('') || '<p class="text-xs text-slate-500 italic">Nenhuma passagem registrada.</p>';
    const recordCards = `<div class="grid grid-cols-2 md:grid-cols-5 gap-2">${[['bestSeasonGoals','Gols em uma temporada'],['bestSeasonAssists','Assistências em uma temporada'],['mostGamesClub','Jogos por um clube'],['mostTitles','Mais títulos'],['hatTricks','Hat-tricks']].map(x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 text-center"><strong class="text-2xl text-white block">${Number(r[x[0]]||0)}</strong><span class="text-[10px] text-slate-400">${x[1]}</span></div>`).join('')}</div>`;
    const awardRows = rows(awards.slice().reverse(),'Nenhum prêmio individual registrado.',(x,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-start"><div><strong class="text-amber-300 text-sm">🏅 ${escapeHtml(x.name||'Prêmio')}</strong><span class="block text-xs text-slate-400">${escapeHtml(x.season||'-')} • ${escapeHtml(x.club||'-')} • ${escapeHtml(x.competition||'-')}</span>${x.note?`<p class="text-xs text-slate-500 mt-1">${escapeHtml(x.note)}</p>`:''}</div><button onclick="deleteAward(${awards.length-1-i})" class="text-rose-400"><i class="fa-solid fa-trash"></i></button></div>`);
    const injuryRows = rows(injuries.slice().reverse(),'Nenhuma lesão registrada.',(x,i)=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-start"><div><strong class="text-white text-sm">🚑 ${escapeHtml(x.name||'Lesão')}</strong><span class="block text-xs text-slate-400">${escapeHtml(x.date||'-')} • ${escapeHtml(x.severity||'')} • ${x.days||0} dias • ${x.gamesLost||0} jogos perdidos</span></div><div class="text-xs ${x.status==='Recuperado'?'text-emerald-400':'text-amber-300'}">${escapeHtml(x.status||'')}</div></div>`);
    const eventRows = rows(events.slice().reverse(),'Nenhum evento de carreira registrado.',(x,ri)=>{const i=events.length-1-ri;return `<div class="relative pl-5 pb-4 border-l border-cyan-500/20"><span class="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-cyan-400"></span><div class="flex justify-between items-start gap-3"><div><div class="text-[10px] text-cyan-400">${escapeHtml(x.date||'-')} • ${escapeHtml(x.type||'')}</div><strong class="text-white text-sm block">${escapeHtml(x.title||'Evento')}</strong>${x.note?`<p class="text-xs text-slate-500 mt-1">${escapeHtml(x.note)}</p>`:''}</div><div class="flex gap-2 shrink-0"><button onclick="openCareerEventModal(${i})" class="text-cyan-400" title="Editar"><i class="fa-solid fa-pen"></i></button><button onclick="deleteCareerEvent(${i})" class="text-rose-400" title="Excluir"><i class="fa-solid fa-trash"></i></button></div></div></div>`;});

    container.innerHTML = `<section class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-calendar-days text-cyan-400 mr-2"></i>Calendário</h3><p>Agenda e resultados</p></div><button onclick="openCalendarModal()" class="feature-action">+ Jogo</button></div><div class="space-y-2 max-h-64 overflow-y-auto">${rows(calendar,'Nenhum jogo registrado.',x=>`<div class="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between"><div><strong class="text-white text-sm">${escapeHtml(x.date||'-')}</strong><span class="text-cyan-400 text-xs ml-2">${escapeHtml(x.competition||'')}</span><div class="text-xs text-slate-400">${escapeHtml(x.opponent||'')} • ${escapeHtml(x.homeAway||'')}</div></div><span class="text-xs font-bold">${escapeHtml(x.result||'')} ${x.score?'• '+escapeHtml(x.score):''}</span></div>`)}</div></div>
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-clock-rotate-left text-cyan-400 mr-2"></i>Temporadas</h3><p>Histórico de cada temporada</p></div><div class="flex gap-2"><button onclick="openSeasonSummaryModal()" class="feature-action gold">Resumo</button><button onclick="openSeasonModal()" class="feature-action">+ Temporada</button></div></div><div class="space-y-2 max-h-64 overflow-y-auto">${seasonRows}</div></div>
        </div>

        ${isRumo ? `<div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-ranking-star text-purple-400 mr-2"></i>Evolução do Jogador</h3><p>Overall e atributos</p></div><button onclick="openAttributesModal()" class="feature-action purple">Editar</button></div><div class="text-center mb-4"><div class="text-xs text-slate-400">OVERALL</div><div class="text-5xl font-black text-cyan-400">${Number(career.attributes?.overall||0)}</div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-2">${[['Velocidade','velocidade'],['Aceleração','aceleracao'],['Finalização','finalizacao'],['Passe','passe'],['Drible','drible'],['Força','forca'],['Resistência','resistencia'],['Defesa','defesa']].map(x=>`<div class="bg-black/30 rounded-xl p-3"><div class="flex justify-between text-xs"><span class="text-slate-400">${x[0]}</span><strong class="text-white">${Number(career.attributes?.[x[1]]||0)}</strong></div><div class="h-2 bg-slate-800 rounded-full mt-2"><div class="h-2 bg-cyan-400" style="width:${Math.min(100,Number(career.attributes?.[x[1]]||0))}%"></div></div></div>`).join('')}</div></div>` : ''}

        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-route text-cyan-400 mr-2"></i>Linha do Tempo da Carreira</h3><p>Veja sua trajetória por clubes</p></div><button onclick="openCareerClubHistoryModal()" class="feature-action">+ Clube</button></div><div class="pt-2">${history}</div></div>

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

        ${isRumo ? `<div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-wallet text-emerald-400 mr-2"></i>Vida Financeira do Jogador</h3><p>Use seu salário para construir sua vida fora dos gramados</p></div><div class="flex gap-2"><button onclick="openPlayerFinanceModal()" class="feature-action green">Gerenciar</button><button onclick="receivePlayerSalary()" class="feature-action">+ Salário</button></div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><div class="bg-black/30 p-3 rounded-xl">Salário<strong class="block text-emerald-400">R$ ${moneyBR(pf.salary)}</strong></div><div class="bg-black/30 p-3 rounded-xl">Saldo<strong class="block ${playerBalance>=0?'text-cyan-400':'text-rose-400'}">R$ ${moneyBR(playerBalance)}</strong></div><div class="bg-black/30 p-3 rounded-xl">Moradia<strong class="block text-white">${escapeHtml(pf.home?.name||'Apartamento simples')}</strong></div><div class="bg-black/30 p-3 rounded-xl">Carro<strong class="block text-white">${escapeHtml(pf.car?.name||'Sem carro')}</strong></div></div><div class="mt-3 text-xs text-slate-400 flex flex-wrap gap-4"><span>Estilo: <strong class="text-white">${escapeHtml(pf.lifestyle||'Confortável')}</strong></span><span>Investimentos: <strong class="text-amber-300">R$ ${moneyBR(pf.investments||0)}</strong></span></div><div class="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5"><button onclick="playerExpense('restaurante')" class="feature-action">🍽️ Restaurante</button><button onclick="playerExpense('lazer')" class="feature-action">🎮 Lazer</button><button onclick="playerExpense('viagem')" class="feature-action">✈️ Viagem</button><button onclick="playerExpense('presente')" class="feature-action">🎁 Presente</button><button onclick="playerExpense('treinamento')" class="feature-action">🏋️ Treinamento</button><button onclick="investPlayerMoney()" class="feature-action gold">📈 Investir</button></div></div>` : ''}

        ${isRumo ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-arrow-right-arrow-left text-emerald-400 mr-2"></i>Mercado</h3><p>Jogadores e negociações</p></div><button onclick="openMarketModal()" class="feature-action green">+ Jogador</button></div><div class="space-y-2 max-h-52 overflow-y-auto">${marketRows}</div></div><div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-star text-orange-400 mr-2"></i>Popularidade</h3><p>Impacto do jogador</p></div><button onclick="openPopularityModal()" class="feature-action">Editar</button></div><div class="text-center py-5"><div class="text-5xl font-black text-orange-400">${popularity}%</div><div class="h-2 bg-slate-800 rounded-full mt-3"><div class="h-2 bg-orange-400" style="width:${popularity}%"></div></div></div></div></div>` : ''}


        ${!isRumo ? `<div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-bullseye text-cyan-400 mr-2"></i>Objetivos da Temporada</h3><p>Metas da diretoria e do clube</p></div><button onclick="openObjectiveModal()" class="feature-action">+ Objetivo</button></div><div class="space-y-2 max-h-60 overflow-y-auto">${objectiveRows}</div></div>` : ''}

        ${!isRumo ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-coins text-emerald-400 mr-2"></i>Finanças</h3><p>Somente na Master Liga</p></div><button onclick="openFinanceModal()" class="feature-action green">Editar</button></div><div class="grid grid-cols-2 gap-2 text-xs"><div class="bg-black/30 p-3 rounded-xl">Orçamento<strong class="block text-emerald-400">€ ${money(f.budget)}M</strong></div><div class="bg-black/30 p-3 rounded-xl">Folha<strong class="block text-white">€ ${money(f.salaryBudget)}M</strong></div><div class="bg-black/30 p-3 rounded-xl">Receitas<strong class="block text-cyan-400">€ ${money(f.revenue)}M</strong></div><div class="bg-black/30 p-3 rounded-xl">Despesas<strong class="block text-rose-400">€ ${money(f.expenses)}M</strong></div></div><div class="text-center text-sm font-bold mt-3 ${balance>=0?'text-emerald-400':'text-rose-400'}">Saldo: € ${money(balance)}M</div></div><div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-user-tie text-amber-400 mr-2"></i>Sistema de Treinador</h3><p>Diretoria, reputação e torcida</p></div><button onclick="openManagerModal()" class="feature-action gold">Editar</button></div><div class="grid grid-cols-3 gap-2 text-center"><div><strong class="text-amber-300 text-2xl">${m.reputation||1}/5</strong><span class="block text-[10px] text-slate-400">Reputação</span></div><div><strong class="text-cyan-400 text-2xl">${m.confidence||0}%</strong><span class="block text-[10px] text-slate-400">Diretoria</span></div><div><strong class="text-emerald-400 text-2xl">${m.fanSupport||0}%</strong><span class="block text-[10px] text-slate-400">Torcida</span></div></div></div></div>` : ''}



        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-newspaper text-cyan-400 mr-2"></i>Central de Notícias</h3><p>Momentos importantes da carreira</p></div><button onclick="openNewsModal()" class="feature-action">+ Notícia</button></div><div class="space-y-2 max-h-64 overflow-y-auto">${newsRows}</div></div>

        ${isRumo ? `<div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-crown text-amber-400 mr-2"></i>Recordes Pessoais</h3><p>Marcas históricas do jogador</p></div><button onclick="openRecordsModal()" class="feature-action gold">Editar</button></div>${recordCards}</div>` : ''}

        ${isRumo ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-award text-amber-400 mr-2"></i>Prêmios Individuais</h3><p>Bola de Ouro, Chuteira de Ouro e outros</p></div><button onclick="openAwardModal()" class="feature-action gold">+ Prêmio</button></div><div class="space-y-2 max-h-60 overflow-y-auto">${awardRows}</div></div>
            <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-heart-pulse text-rose-400 mr-2"></i>Histórico de Lesões</h3><p>Períodos afastado e jogos perdidos</p></div><button onclick="openInjuryModal()" class="feature-action">+ Lesão</button></div><div class="space-y-2 max-h-60 overflow-y-auto">${injuryRows}</div></div>
        </div>` : ''}

        <div class="feature-panel"><div class="feature-head"><div><h3><i class="fa-solid fa-timeline text-cyan-400 mr-2"></i>Linha do Tempo da Carreira</h3><p>Momentos marcantes da trajetória</p></div><button onclick="openCareerEventModal()" class="feature-action">+ Evento</button></div><div class="max-h-60 overflow-y-auto pt-2">${eventRows}</div></div>

        <div class="feature-panel"><div class="flex flex-wrap justify-between items-center gap-3"><div><h3 class="font-bold text-white"><i class="fa-solid fa-cloud-arrow-up text-cyan-400 mr-2"></i>Sincronização e Backup</h3><p class="text-xs text-slate-400">Google: sincronização online entre dispositivos. Backup: arquivo manual.</p></div><div class="flex gap-2"><button onclick="syncToServer().then(()=>alert('Sincronização concluída.'))" class="feature-action">Sincronizar</button><button onclick="exportCareerBackup()" class="feature-action">Exportar</button><label class="feature-action cursor-pointer">Importar<input type="file" accept="application/json" onchange="importCareerBackup(event)" class="hidden"></label></div></div></div>
    </section>`;
}

function openCalendarModal() {
    if (!featureCareer()) return alert('Selecione uma carreira primeiro.');
    showFeatureModal('Registrar Jogo', `<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Data</label><input id="fm-date" type="date" class="feature-input w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Competição</label><input id="fm-comp" placeholder="Brasileirão" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Adversário</label><input id="fm-opp" placeholder="Flamengo" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Casa/Fora</label><select id="fm-ha" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Casa</option><option>Fora</option><option>Neutro</option></select></div><div><label class="text-xs text-slate-400">Resultado</label><select id="fm-result" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Pendente</option><option>Vitória</option><option>Empate</option><option>Derrota</option></select></div><div><label class="text-xs text-slate-400">Placar</label><input id="fm-score" placeholder="2 x 1" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Adicionar', 'saveCalendarMatch()');
}
function saveCalendarMatch() { const c=featureCareer(); if(!c)return; c.calendar.push({date:document.getElementById('fm-date').value,competition:document.getElementById('fm-comp').value.trim(),opponent:document.getElementById('fm-opp').value.trim(),homeAway:document.getElementById('fm-ha').value,result:document.getElementById('fm-result').value,score:document.getElementById('fm-score').value.trim()}); saveLocalData(); closeFeatureModal(); renderData(); }
function deleteCalendarMatch(i) { const c=featureCareer(); if(c&&confirm('Remover este jogo?')){c.calendar.splice(i,1);saveLocalData();renderData();} }

function openSquadModal() { showFeatureModal('Adicionar Jogador ao Elenco', `<div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="text-xs text-slate-400">Nome</label><input id="fm-player" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Posição</label><input id="fm-pos" placeholder="ATA" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Overall</label><input id="fm-overall" type="number" min="1" max="100" value="70" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Status</label><select id="fm-status" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option>Titular</option><option>Reserva</option><option>Rotação</option><option>Lesionado</option></select></div><div><label class="text-xs text-slate-400">Valor (€M)</label><input id="fm-value" type="number" step="0.1" value="1" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`, 'Adicionar', 'saveSquadPlayer()'); }
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
                <div><label class="text-xs text-slate-400">Salário mensal (R$)</label><input id="pf-salary" type="number" min="0" step="1000" value="${Number(pf.salary||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
                <div><label class="text-xs text-slate-400">Saldo atual (R$)</label><input id="pf-balance" type="number" min="0" step="1000" value="${Number(pf.balance||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
            </div>
            <div><label class="text-xs text-slate-400">Estilo de vida</label><select id="pf-lifestyle" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${lifeOptions.map(([n,v])=>`<option value="${n}" data-cost="${v}" ${pf.lifestyle===n?'selected':''}>${n} — R$ ${moneyBR(v)}/mês</option>`).join('')}</select></div>
            <div><label class="text-xs text-slate-400">Moradia</label><select id="pf-home" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${homeOptions.map(([n,v])=>`<option value="${n}" data-value="${v}" ${pf.home?.name===n?'selected':''}>${n}${v?' — R$ '+moneyBR(v):''}</option>`).join('')}</select></div>
            <div><label class="text-xs text-slate-400">Carro</label><select id="pf-car" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white">${carOptions.map(([n,v])=>`<option value="${n}" data-value="${v}" ${pf.car?.name===n?'selected':''}>${n}${v?' — R$ '+moneyBR(v):''}</option>`).join('')}</select></div>
            <div><label class="text-xs text-slate-400">Investimentos (R$)</label><input id="pf-investments" type="number" min="0" step="1000" value="${Number(pf.investments||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div>
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
    const custom = prompt(`${label}\nValor da despesa em R$ (padrão: ${moneyBR(amount)}):`, amount);
    if (custom === null) return;
    const value = Number(String(custom).replace(/[^0-9.,]/g,'').replace(/\./g,'').replace(',','.'));
    if (value > 0) spendPlayerMoney(value, label);
}

function investPlayerMoney() {
    if (!currentCareerId || currentMode !== 'rumo_ao_estrelato') return;
    const c = featureCareer();
    const value = Number(prompt('Quanto deseja investir? (R$)', '10000'));
    if (!value || value <= 0) return;
    if (Number(c.playerFinance.balance || 0) < value) return alert('Saldo insuficiente.');
    c.playerFinance.balance -= value;
    c.playerFinance.investments = Number(c.playerFinance.investments || 0) + value;
    logPlayerTransaction(c, 'investimento', 'Aplicação financeira', -value);
    saveLocalData();
    renderData();
}

function openFinanceModal(){const c=featureCareer();if(!c)return;const f=c.finance;showFeatureModal('Editar Finanças',`<div class="grid grid-cols-2 gap-3"><div><label class="text-xs text-slate-400">Orçamento (€M)</label><input id="fin-budget" type="number" step="0.1" value="${Number(f.budget||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Folha Salarial (€M)</label><input id="fin-salary" type="number" step="0.1" value="${Number(f.salaryBudget||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Receitas (€M)</label><input id="fin-revenue" type="number" step="0.1" value="${Number(f.revenue||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div><div><label class="text-xs text-slate-400">Despesas (€M)</label><input id="fin-expenses" type="number" step="0.1" value="${Number(f.expenses||0)}" class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"></div></div>`,'Salvar','saveFinance()');}
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
