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
    ensureCareerCurrency(career);
    updateCurrencyDisplay();
    if (!Array.isArray(career.clubes)) career.clubes = [];
    
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
        
        if (document.getElementById('market-value-display')) document.getElementById('market-value-display').innerText = `${currencySymbol()} ${market.marketValue || 0}M`;
        if (document.getElementById('release-clause-display')) document.getElementById('release-clause-display').innerText = `${currencySymbol()} ${market.releaseClause || 0}M`;

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
                            <span class="font-mono text-emerald-400 font-bold">${t.fee > 0 ? `${currencySymbol()} ${t.fee}M` : 'Grátis'}</span>
                            <button onclick="deleteTransfer(${idx})" class="text-rose-400 hover:text-rose-300"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `;
                    transferListEl.appendChild(trItem);
                });
            }
        }

        if (document.getElementById('highest-fee-display')) document.getElementById('highest-fee-display').innerText = `${currencySymbol()} ${highestFee}M`;
        if (document.getElementById('rejected-offers-display')) document.getElementById('rejected-offers-display').innerText = rejectedCount;
    }

    // Estatísticas dos Clubes
    let totalJogos = 0, totalVitorias = 0, totalEmpates = 0, totalDerrotas = 0;
    let totalDyn1 = 0, totalDyn2 = 0;
    let totalYellowCards = 0, totalRedCards = 0;
    let totalPenaltiesTaken = 0, totalPenaltiesScored = 0, totalPenaltiesMissed = 0;
    let tLiga = 0, tContinental = 0, tCopa = 0, tMundial = 0, tSupercopa = 0, tIndividual = 0, tTotalTitles = 0;

    const clubes = career.clubes || [];

    clubes.forEach((c, index) => {
        totalJogos += Number(c.jogos || 0);
        totalVitorias += Number(c.vitorias || 0);
        totalEmpates += Number(c.empates || 0);
        totalDerrotas += Number(c.derrotas || 0);
        totalDyn1 += Number(c.dyn1 || 0);
        totalDyn2 += Number(c.dyn2 || 0);
        if (currentMode === 'rumo_ao_estrelato') {
            totalYellowCards += Number(c.yellowCards || 0);
            totalRedCards += Number(c.redCards || 0);
            totalPenaltiesTaken += Number(c.penaltiesTaken || 0);
            totalPenaltiesScored += Number(c.penaltiesScored || 0);
            totalPenaltiesMissed += Number(c.penaltiesMissed || 0);
        }

        // Títulos podem ser digitados como: "Brasileirão Série B", "Copa do Brasil", etc.
        // O código antigo só procurava literalmente por "liga"/"copa", fazendo títulos válidos ficarem fora da galeria.
        const titulos = String(c.titulos || '')
            .split(/[,;\n|]+/)
            .map(t => t.trim())
            .filter(Boolean);

        titulos.forEach(titulo => {
            const titulosStr = titulo
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            tTotalTitles++;

            if (titulosStr.includes('bola de ouro') || titulosStr.includes('the best') || titulosStr.includes('artilheiro')) {
                tIndividual++;
            } else if (titulosStr.includes('supercopa') || titulosStr.includes('recopa')) {
                tSupercopa++;
            } else if (titulosStr.includes('mundial')) {
                tMundial++;
            } else if (titulosStr.includes('champions') || titulosStr.includes('libertadores') || titulosStr.includes('continental') || titulosStr.includes('intercontinental')) {
                tContinental++;
            } else if (titulosStr.includes('copa')) {
                tCopa++;
            } else if (
                titulosStr.includes('liga') ||
                titulosStr.includes('brasileirao') ||
                titulosStr.includes('brasileiro') ||
                titulosStr.includes('campeonato brasileiro') ||
                /\bserie\s*[a-d]\b/.test(titulosStr)
            ) {
                tLiga++;
            }
        });

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
                    <p class="text-xs text-slate-400">${contratoLabel}: <strong class="text-slate-200">${c.contrato || '-'}</strong>${tempoClubeHtml} | Salário: <strong class="text-slate-200">${escapeHtml(c.salario || '0')} ${currencySymbol()}</strong></p>
                    <p class="text-xs text-amber-400 font-medium"><i class="fa-solid fa-trophy mr-1"></i> ${c.titulos || 'Nenhum título registrado'}</p>
                </div>
                <div class="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <div class="text-right text-xs">
                        <div class="text-slate-300 font-mono"><strong>${c.jogos}J</strong> (${c.vitorias}V / ${c.empates}E / ${c.derrotas}D)</div>
                        <div class="text-slate-400 font-mono mt-0.5">${currentMode === 'rumo_ao_estrelato' ? 'Gols' : 'GP'}: <strong class="text-cyan-400">${c.dyn1}</strong> | ${currentMode === 'rumo_ao_estrelato' ? 'Assist' : 'GC'}: <strong class="text-purple-400">${c.dyn2}</strong></div>
                        ${currentMode === 'rumo_ao_estrelato' ? `<div class="text-xs font-mono mt-1"><span class="text-amber-300"> ${Number(c.yellowCards || 0)}</span><span class="text-rose-400 ml-3"> ${Number(c.redCards || 0)}</span></div><div class="text-xs font-mono mt-0.5 text-slate-400"> Pênaltis: <strong class="text-cyan-300">${Number(c.penaltiesTaken || 0)}</strong> (Convertidos: <strong class="text-emerald-400">${Number(c.penaltiesScored || 0)}</strong> | Perdidos: <strong class="text-rose-400">${Number(c.penaltiesMissed || 0)}</strong>)</div>` : ''}
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

    // No Become a Legend, os cartões mostrados no topo acompanham o histórico por clube.
    // Se nenhum clube tiver cartões cadastrados, usamos o registro geral como fallback.
    if (currentMode === 'rumo_ao_estrelato') {
        const hasClubCardData = clubes.some(x => Number(x.yellowCards || 0) > 0 || Number(x.redCards || 0) > 0);
        if (!hasClubCardData) {
            const discipline = career.discipline || { yellowCards: 0, redCards: 0 };
            totalYellowCards = Number(discipline.yellowCards || 0);
            totalRedCards = Number(discipline.redCards || 0);
        }
    }

    if (document.getElementById('qtd-clubes')) document.getElementById('qtd-clubes').innerText = clubes.length;
    if (document.getElementById('stat-jogos')) document.getElementById('stat-jogos').innerText = totalJogos;
    if (document.getElementById('stat-vitorias')) document.getElementById('stat-vitorias').innerText = totalVitorias;
    if (document.getElementById('stat-empates')) document.getElementById('stat-empates').innerText = totalEmpates;
    if (document.getElementById('stat-derrotas')) document.getElementById('stat-derrotas').innerText = totalDerrotas;
    if (document.getElementById('stat-dynamic-1')) document.getElementById('stat-dynamic-1').innerText = totalDyn1;
    if (document.getElementById('stat-dynamic-2')) document.getElementById('stat-dynamic-2').innerText = totalDyn2;
    if (document.getElementById('stat-yellow-cards')) document.getElementById('stat-yellow-cards').innerText = totalYellowCards;
    if (document.getElementById('stat-red-cards')) document.getElementById('stat-red-cards').innerText = totalRedCards;
    if (document.getElementById('stat-penalties-taken')) document.getElementById('stat-penalties-taken').innerText = totalPenaltiesTaken;
    if (document.getElementById('stat-penalties-scored')) document.getElementById('stat-penalties-scored').innerText = totalPenaltiesScored;
    if (document.getElementById('stat-penalties-missed')) document.getElementById('stat-penalties-missed').innerText = totalPenaltiesMissed;

    const aproveitamento = totalJogos > 0 ? (((totalVitorias * 3 + totalEmpates) / (totalJogos * 3)) * 100).toFixed(1) : 0;
    if (document.getElementById('stat-aproveitamento')) document.getElementById('stat-aproveitamento').innerText = `${aproveitamento}%`;

    if (document.getElementById('trophy-liga-count')) document.getElementById('trophy-liga-count').innerText = tLiga;
    if (document.getElementById('trophy-continental-count')) document.getElementById('trophy-continental-count').innerText = tContinental;
    if (document.getElementById('trophy-copa-count')) document.getElementById('trophy-copa-count').innerText = tCopa;
    if (document.getElementById('trophy-mundial-count')) document.getElementById('trophy-mundial-count').innerText = tMundial;
    if (document.getElementById('trophy-supercopa-count')) document.getElementById('trophy-supercopa-count').innerText = tSupercopa;
    if (document.getElementById('trophy-individual-count')) document.getElementById('trophy-individual-count').innerText = tIndividual;
    if (document.getElementById('total-trophies-count')) document.getElementById('total-trophies-count').innerText = tTotalTitles;

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
            // Na Master Liga, todos os clubes cadastrados ficam visíveis.
            // O último registro é tratado como o clube atual.
            const currentIndex = clubes.length - 1;
            masterClubDisplay.innerHTML = clubes.map((c, index) => {
                const aproveitamentoAtual = Number(c.jogos || 0) > 0
                    ? (((Number(c.vitorias || 0) * 3 + Number(c.empates || 0)) / (Number(c.jogos || 0) * 3)) * 100).toFixed(1)
                    : '0.0';
                const atual = index === currentIndex;
                return `
                    <div class="bg-black/30 border ${atual ? 'border-cyan-500/30' : 'border-white/5'} rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-bold text-white text-lg">${escapeHtml(c.clube || 'Clube não informado')}</h4>
                                <span class="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">${escapeHtml(c.temporada || 'Temporada não informada')}</span>
                                ${atual ? '<span class="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Clube atual</span>' : ''}
                            </div>
                            <div class="text-xs text-slate-400 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                <span>Contrato: <strong class="text-slate-200">${escapeHtml(c.contrato || '-')}</strong></span>
                                <span>Tempo: <strong class="text-cyan-400">${escapeHtml(c.tempoClube || '-')}</strong></span>
                                <span>Salário: <strong class="text-slate-200">${escapeHtml(c.salario || '0')} ${currencySymbol()}</strong></span>
                            </div>
                            <div class="text-xs text-amber-400 mt-2"> ${escapeHtml(c.titulos || 'Nenhum título registrado')}</div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-right text-xs">
                                <div class="text-slate-300 font-mono"><strong>${Number(c.jogos || 0)}J</strong> (${Number(c.vitorias || 0)}V / ${Number(c.empates || 0)}E / ${Number(c.derrotas || 0)}D)</div>
                                <div class="text-slate-400 font-mono mt-1">GP: <strong class="text-cyan-400">${Number(c.dyn1 || 0)}</strong> | GC: <strong class="text-purple-400">${Number(c.dyn2 || 0)}</strong></div>
                                <div class="text-cyan-400 font-mono font-bold mt-1">Aproveitamento: ${aproveitamentoAtual}%</div>
                            </div>
                            <div class="flex items-center gap-1">
                                <button onclick="openModal(${index})" class="p-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all" title="Editar clube"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button onclick="deleteClube(${index})" class="p-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all" title="Excluir clube"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }
    }
}

function resetStats() {
    const ids = ['qtd-clubes', 'stat-jogos', 'stat-vitorias', 'stat-empates', 'stat-derrotas', 'stat-dynamic-1', 'stat-dynamic-2', 'stat-yellow-cards', 'stat-red-cards', 'stat-penalties-taken', 'stat-penalties-scored', 'stat-penalties-missed', 'total-trophies-count'];
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

    const containerCartoesClube = document.getElementById('container-cartoes-clube');
    const containerPenaltisClube = document.getElementById('container-penaltis-clube');
    if (currentMode === 'rumo_ao_estrelato') {
        if (modalLabel1) modalLabel1.innerText = 'Gols';
        if (modalLabel2) modalLabel2.innerText = 'Assistências';
        if (modalLabelContrato) modalLabelContrato.innerText = 'Término do Contrato';
        if (containerTempoClube) containerTempoClube.style.display = 'block';
        if (containerCartoesClube) containerCartoesClube.style.display = 'grid';
        if (containerPenaltisClube) containerPenaltisClube.style.display = 'grid';
    } else {
        if (modalLabel1) modalLabel1.innerText = 'Gols Pro';
        if (modalLabel2) modalLabel2.innerText = 'Gols Sofridos';
        if (modalLabelContrato) modalLabelContrato.innerText = 'Duração Contrato';
        if (containerTempoClube) containerTempoClube.style.display = 'block';
        if (containerCartoesClube) containerCartoesClube.style.display = 'none';
        if (containerPenaltisClube) containerPenaltisClube.style.display = 'none';
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
        document.getElementById('input-yellow-cards').value = c.yellowCards || 0;
        document.getElementById('input-red-cards').value = c.redCards || 0;
        if (document.getElementById('input-penalties-taken')) document.getElementById('input-penalties-taken').value = c.penaltiesTaken || 0;
        if (document.getElementById('input-penalties-scored')) document.getElementById('input-penalties-scored').value = c.penaltiesScored || 0;
        if (document.getElementById('input-penalties-missed')) document.getElementById('input-penalties-missed').value = c.penaltiesMissed || 0;
        document.getElementById('input-titulos').value = c.titulos || '';
    } else {
        document.getElementById('editForm').reset();
        if (document.getElementById('input-penalties-taken')) document.getElementById('input-penalties-taken').value = 0;
        if (document.getElementById('input-penalties-scored')) document.getElementById('input-penalties-scored').value = 0;
        if (document.getElementById('input-penalties-missed')) document.getElementById('input-penalties-missed').value = 0;
    }

    const salaryCurrencyLabel = document.getElementById('salary-currency-label');
    if (salaryCurrencyLabel) salaryCurrencyLabel.textContent = currencySymbol();
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
            yellowCards: currentMode === 'rumo_ao_estrelato' ? (Number(document.getElementById('input-yellow-cards').value) || 0) : 0,
            redCards: currentMode === 'rumo_ao_estrelato' ? (Number(document.getElementById('input-red-cards').value) || 0) : 0,
            penaltiesTaken: currentMode === 'rumo_ao_estrelato' ? (Number(document.getElementById('input-penalties-taken')?.value) || 0) : 0,
            penaltiesScored: currentMode === 'rumo_ao_estrelato' ? (Number(document.getElementById('input-penalties-scored')?.value) || 0) : 0,
            penaltiesMissed: currentMode === 'rumo_ao_estrelato' ? (Number(document.getElementById('input-penalties-missed')?.value) || 0) : 0,
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

function openSaveMenuModal() {
    if (!currentUser) return;
    const account = appData.users[currentUser] || {};
    const isGoogle = account.authProvider === 'google';
    const lastSync = localStorage.getItem('pes2027_last_sync');
    const syncText = lastSync ? `Última sincronização: ${new Date(lastSync).toLocaleString('pt-BR')}` : 'Nenhuma sincronização registrada nesta sessão.';
    showFeatureModal(
        'Salvar & Sincronizar',
        `
        <div class="space-y-3">
            <div class="bg-black/30 border border-white/10 rounded-xl p-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <i class="fa-solid fa-floppy-disk text-cyan-300"></i>
                    </div>
                    <div>
                        <strong class="text-white text-sm">Gerenciar seus dados</strong>
                        <p class="text-xs text-slate-500 mt-1">${isGoogle ? 'Conta Google conectada: você pode sincronizar entre dispositivos.' : 'Conta local: os dados ficam salvos neste navegador.'}</p>
                    </div>
                </div>
            </div>

            <button type="button" onclick="saveLocalFromMenu()" class="save-menu-option">
                <span><i class="fa-solid fa-hard-drive text-emerald-300 mr-2"></i><strong>Salvar neste dispositivo</strong><small>Grava imediatamente o estado atual no navegador.</small></span>
                <i class="fa-solid fa-chevron-right text-slate-500"></i>
            </button>

            <button type="button" onclick="syncFromSaveMenu()" class="save-menu-option ${isGoogle ? '' : 'opacity-50'}" ${isGoogle ? '' : 'disabled'}>
                <span><i class="fa-solid fa-cloud-arrow-up text-cyan-300 mr-2"></i><strong>Sincronizar com Google</strong><small>${isGoogle ? 'Envia o save atual para a nuvem.' : 'Disponível quando a conta estiver conectada ao Google.'}</small></span>
                <i class="fa-solid fa-chevron-right text-slate-500"></i>
            </button>

            <button type="button" onclick="loadFromSaveMenu()" class="save-menu-option ${isGoogle ? '' : 'opacity-50'}" ${isGoogle ? '' : 'disabled'}>
                <span><i class="fa-solid fa-cloud-arrow-down text-violet-300 mr-2"></i><strong>Carregar da nuvem</strong><small>${isGoogle ? 'Baixa o último save sincronizado.' : 'Disponível para contas Google.'}</small></span>
                <i class="fa-solid fa-chevron-right text-slate-500"></i>
            </button>

            <div id="save-menu-status" class="text-xs text-slate-500 bg-black/20 border border-white/5 rounded-xl p-3">
                ${syncText}
            </div>
        </div>
        `,
        'Fechar',
        'closeFeatureModal()'
    );
}

function saveLocalFromMenu() {
    saveLocalData();
    const status = document.getElementById('save-menu-status');
    if (status) {
        status.innerHTML = '<span class="text-emerald-300"><i class="fa-solid fa-circle-check mr-1"></i>Save salvo neste dispositivo.</span>';
    }
}

async function syncFromSaveMenu() {
    const status = document.getElementById('save-menu-status');
    const account = appData.users[currentUser];
    if (!account || account.authProvider !== 'google') return;
    saveLocalData();
    if (status) status.innerHTML = '<span class="text-cyan-300"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Sincronizando com o Google...</span>';
    await syncToServer();
    const now = new Date().toISOString();
    localStorage.setItem('pes2027_last_sync', now);
    if (status) status.innerHTML = `<span class="text-emerald-300"><i class="fa-solid fa-circle-check mr-1"></i>Sincronizado com o Google em ${new Date(now).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}.</span>`;
}

async function loadFromSaveMenu() {
    const status = document.getElementById('save-menu-status');
    const account = appData.users[currentUser];
    if (!account || account.authProvider !== 'google') return;
    if (status) status.innerHTML = '<span class="text-violet-300"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Carregando dados da nuvem...</span>';
    const ok = await loadCloudData();
    if (ok) {
        updateCareerDropdown();
        renderData();
        if (status) status.innerHTML = '<span class="text-emerald-300"><i class="fa-solid fa-circle-check mr-1"></i>Dados da nuvem carregados.</span>';
    } else if (status) {
        status.innerHTML = '<span class="text-rose-300"><i class="fa-solid fa-circle-xmark mr-1"></i>Não foi possível carregar a nuvem.</span>';
    }
}

async function saveToCloud() {
    openSaveMenuModal();
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
