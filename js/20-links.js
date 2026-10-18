/* =========================================================================
   Colador de Links — 20-links.js
   A lista: guardar (nome + endereço), marcar, remover, fixar como aba,
   colar vários de uma vez, backup. "🚀 Abrir Selecionados" abre o visor.
   ========================================================================= */
(function (CL) {
  'use strict';
  const $ = CL.$;
  let filtro = '';

  function montar() {
    const el = $('#tela-links');
    el.innerHTML =
      '<div class="cartao">' +
      '  <div class="cab"><h1>🔗 Colador de Links</h1><p>Guarde os endereços dos seus apps e abra aqui dentro</p></div>' +
      '  <div class="listas" id="l-listas"></div>' +
      '  <div class="numeros"><div class="num"><b id="n-total">0</b><span>Total de links</span></div><div class="num"><b id="n-marc">0</b><span>Marcados</span></div></div>' +
      '  <h2>➕ Adicionar link</h2>' +
      '  <div class="campo"><label for="l-nome">Nome do link</label><input id="l-nome" placeholder="Ex.: Playground, Chat IA…"></div>' +
      '  <div class="campo"><label for="l-url">Endereço (URL)</label><input id="l-url" inputmode="url" autocapitalize="off" placeholder="https://…"></div>' +
      '  <button class="btn forte" id="l-salvar">💾 Salvar link</button>' +
      '  <details class="mais" open><summary>📋 Colar vários de uma vez</summary><textarea id="l-varios" placeholder="Cole aqui um texto com vários endereços (um por linha ou misturados) — eu acho todos. Se tiver um nome antes do endereço na mesma linha (ex.: Chat 1 - https://…), ele vira o nome."></textarea><button class="btn" id="l-varios-ok">Adicionar todos</button></details>' +
      '  <h2>📋 Seus links</h2>' +
      '  <input id="l-busca" class="busca" placeholder="🔍 Procurar…" autocapitalize="off">' +
      '  <div id="l-lista" class="lista"></div>' +
      '  <div class="acoes">' +
      '    <button class="btn forte grande" id="l-abrir">🚀 Abrir selecionados</button>' +
      '    <button class="btn" id="l-todos">✅ Marcar todos</button>' +
      '    <button class="btn" id="l-nenhum">⬜ Desmarcar</button>' +
      '    <button class="btn" id="l-backup">💾 Backup (baixar)</button>' +
      '    <button class="btn" id="l-md">📄 Baixar em texto (.md)</button>' +
      '    <button class="btn" id="l-copiar">📋 Copiar a lista</button>' +
      '    <button class="btn" id="l-restaurar">📥 Restaurar (backup .json ou texto .md)</button><input type="file" id="l-arq" accept=".json,.md,.txt,application/json,text/*" hidden>' +
      '    <button class="btn perigo" id="l-limpar">🗑️ Limpar tudo</button>' +
      '  </div>' +
      '  <p class="mut pequeno">Fica guardado neste aparelho. Faça um 💾 Backup de vez em quando: se o celular apagar os dados do navegador, você restaura. · ' + CL.versao + '</p>' +
      '</div>';
    $('#l-listas').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.lista) { CL.listaAtual = b.dataset.lista; CL.salvar(); pintar(); return; }
      if (b.id === 'l-nova') { const n = prompt('Nome da nova lista:', 'Ger. ' + (CL.listas.length + 1)); if (!n) return; const li = { id: CL.uid(), nome: n.trim().slice(0, 24) }; CL.listas.push(li); CL.listaAtual = li.id; CL.salvar(); pintar(); CL.aviso('Lista criada: ' + li.nome); return; }
      const atual = CL.listas.find((x) => x.id === CL.listaAtual);
      if (b.id === 'l-renomear') { const n = prompt('Novo nome da lista:', atual.nome); if (n) { atual.nome = n.trim().slice(0, 24); CL.salvar(); pintar(); } return; }
      if (b.id === 'l-apagar-lista') {
        if (CL.listas.length < 2) return CL.aviso('Precisa ter pelo menos uma lista.');
        const qtd = CL.links.filter((l) => l.lista === atual.id).length;
        const destino = CL.listas.find((x) => x.id !== atual.id);
        if (!confirm('Apagar a lista "' + atual.nome + '"?' + (qtd ? '\n\nOs ' + qtd + ' links dela NÃO são apagados: vão para "' + destino.nome + '".' : ''))) return;
        CL.links.forEach((l) => { if (l.lista === atual.id) l.lista = destino.id; });
        CL.listas = CL.listas.filter((x) => x !== atual); CL.listaAtual = destino.id; CL.salvar(); pintar();
      }
    });
    $('#l-salvar').onclick = salvar;
    $('#l-url').addEventListener('keydown', (e) => { if (e.key === 'Enter') salvar(); });
    $('#l-varios-ok').onclick = () => { const n = CL.colarVarios($('#l-varios').value); $('#l-varios').value = ''; pintar(); CL.aviso(n ? n + ' link(s) adicionado(s).' : 'Não achei endereço novo nesse texto.'); };
    $('#l-busca').addEventListener('input', (e) => { filtro = e.target.value.trim().toLowerCase(); pintar(); });
    $('#l-todos').onclick = () => { daLista().forEach((l) => (l.marcado = true)); CL.salvar(); pintar(); };
    $('#l-nenhum').onclick = () => { daLista().forEach((l) => (l.marcado = false)); CL.salvar(); pintar(); };
    $('#l-abrir').onclick = () => { const sel = daLista().filter((l) => l.marcado); if (!sel.length) return CL.aviso('Marque pelo menos um link.'); CL.visor.abrir(sel, 0); };
    $('#l-backup').onclick = () => CL.backup().then(() => CL.aviso('Backup baixado (todas as listas e os códigos).'));
    $('#l-md').onclick = () => { CL.baixarMD(); CL.aviso('📄 Lista baixada em texto (todas as listas).'); };
    $('#l-copiar').onclick = () => CL.copiar(CL.textoMD(CL.listaAtual), '📋 Lista "' + (CL.listas.find((x) => x.id === CL.listaAtual) || {}).nome + '" copiada.');
    $('#l-restaurar').onclick = () => $('#l-arq').click();
    $('#l-arq').onchange = async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const n = await CL.restaurar(f); pintar(); CL.abasUI.pintar(); CL.abasUI.pintar(); CL.aviso('Restaurado: ' + n + ' link(s) novo(s).'); } catch (er) { CL.aviso('❌ ' + er.message); } };
    $('#l-limpar').onclick = () => {
      const b = $('#l-limpar');
      if (b.dataset.certeza) { CL.links = CL.links.filter((l) => l.lista !== CL.listaAtual); CL.salvar(); pintar(); delete b.dataset.certeza; b.textContent = '🗑️ Limpar tudo'; CL.aviso('Lista apagada.'); return; }
      b.dataset.certeza = '1'; b.textContent = '⚠️ Toque de novo para APAGAR os links desta lista';
      setTimeout(() => { delete b.dataset.certeza; b.textContent = '🗑️ Limpar tudo'; }, 4000);
    };
    $('#l-lista').addEventListener('click', (e) => {
      const b = e.target.closest('[data-acao]'); if (!b) return;
      const l = CL.links.find((x) => x.id === b.dataset.id); if (!l) return;
      const acao = b.dataset.acao;
      if (acao === 'abrir') CL.visor.abrir([l], 0);
      if (acao === 'fixar') CL.abasUI.fixar(l.nome, l.url);
      if (acao === 'remover') {
        if (b.dataset.certeza) { CL.links = CL.links.filter((x) => x !== l); CL.salvar(); pintar(); return; }
        b.dataset.certeza = '1'; b.textContent = 'Certeza?'; setTimeout(() => { if (b.isConnected) { delete b.dataset.certeza; b.textContent = 'Remover'; } }, 3000);
      }
      if (acao === 'editar') {
        const card = b.closest('.item');
        card.innerHTML = '<div class="editar"><input value="' + CL.esc(l.nome) + '" class="e-nome" aria-label="Nome"><input value="' + CL.esc(l.url) + '" class="e-url" aria-label="Endereço" autocapitalize="off"><select class="e-lista" aria-label="Lista">' + CL.listas.map((x) => '<option value="' + x.id + '"' + (x.id === l.lista ? ' selected' : '') + '>Lista: ' + CL.esc(x.nome) + '</option>').join('') + '</select><div class="e-bts"><button class="btn forte" data-acao="gravar" data-id="' + l.id + '">Salvar</button><button class="btn" data-acao="cancelar" data-id="' + l.id + '">Cancelar</button></div></div>';
      }
      if (acao === 'gravar') { const card = b.closest('.item'); const url = CL.arrumarUrl(card.querySelector('.e-url').value); if (!url) return CL.aviso('Endereço inválido.'); l.nome = card.querySelector('.e-nome').value.trim() || url; l.url = url; l.lista = card.querySelector('.e-lista').value; CL.salvar(); pintar(); }
      if (acao === 'cancelar') pintar();
    });
    $('#l-lista').addEventListener('change', (e) => { const c = e.target.closest('[data-marca]'); if (!c) return; const l = CL.links.find((x) => x.id === c.dataset.marca); if (l) { l.marcado = c.checked; CL.salvar(); contar(); } });
    pintar();
  }

  function salvar() {
    const url = CL.arrumarUrl($('#l-url').value);
    if (!url) return CL.aviso('Cole um endereço válido.');
    if (daLista().some((l) => l.url === url)) return CL.aviso('Esse link já está nesta lista.');
    const nome = $('#l-nome').value.trim() || new URL(url).hostname.split('.')[0];
    CL.links.unshift({ id: CL.uid(), nome, url, marcado: true, lista: CL.listaAtual });
    CL.salvar(); $('#l-nome').value = ''; $('#l-url').value = ''; pintar(); CL.aviso('💾 Salvo: ' + nome);
  }

  const daLista = () => CL.links.filter((l) => l.lista === CL.listaAtual);
  function contar() { const d = daLista(); $('#n-total').textContent = d.length; $('#n-marc').textContent = d.filter((l) => l.marcado).length; }
  function pintarListas() {
    $('#l-listas').innerHTML = CL.listas.map((x) => '<button class="lista-chip' + (x.id === CL.listaAtual ? ' ativa' : '') + '" data-lista="' + x.id + '">' + CL.esc(x.nome) + ' <small>' + CL.links.filter((l) => l.lista === x.id).length + '</small></button>').join('') +
      '<button class="lista-chip mais-lista" id="l-nova" title="Nova lista">＋</button><button class="lista-chip mais-lista" id="l-renomear" title="Renomear esta lista">✏️</button><button class="lista-chip mais-lista" id="l-apagar-lista" title="Apagar esta lista">🗑️</button>';
  }

  function pintar() {
    pintarListas();
    const lista = (filtro ? CL.links : daLista()).filter((l) => !filtro || (l.nome + ' ' + l.url).toLowerCase().includes(filtro));
    $('#l-lista').innerHTML = lista.length ? lista.map((l) =>
      '<div class="item"><label class="marca"><input type="checkbox" data-marca="' + l.id + '"' + (l.marcado ? ' checked' : '') + ' aria-label="Marcar ' + CL.esc(l.nome) + '"></label>' +
      '<div class="info"><button class="nome" data-acao="abrir" data-id="' + l.id + '">' + CL.esc(l.nome) + '</button><small>' + CL.esc(l.url) + (filtro ? ' · ' + CL.esc((CL.listas.find((x) => x.id === l.lista) || {}).nome || '') : '') + '</small></div>' +
      '<div class="bts"><button class="mini" data-acao="fixar" data-id="' + l.id + '" title="Fixar como aba">📌</button><button class="mini" data-acao="editar" data-id="' + l.id + '" title="Editar">✏️</button><button class="remover" data-acao="remover" data-id="' + l.id + '">Remover</button></div></div>').join('')
      : '<p class="mut">' + (filtro ? 'Nada com "' + CL.esc(filtro) + '".' : 'Nenhum link ainda. Cole o primeiro lá em cima.') + '</p>';
    contar();
  }

  CL.linksUI = { montar, pintar };
})(window.CL);
