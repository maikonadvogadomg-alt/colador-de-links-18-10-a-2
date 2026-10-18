/* =========================================================================
   Colador de Links — 40-codigos.js
   🧪 MEUS CÓDIGOS: um playground que GUARDA.
   Cole ou importe um código (HTML, JS, texto…), ele fica salvo aqui no aparelho.
   Para cada código: ▶ Rodar ao vivo (celular ou largo), 📝 ver/mexer no código
   (abre e fecha), 📋 copiar tudo, ⬇ baixar, ↗ abrir em tela própria, 💾 salvar.
   Fica no IndexedDB (aguenta códigos grandes). Entra no 💾 Backup da lista.
   ========================================================================= */
(function (CL) {
  'use strict';
  const $ = CL.$;

  // ── banco (IndexedDB) ──────────────────────────────────────────────────────
  const abrirDB = () => new Promise((ok, erro) => {
    const r = indexedDB.open('colador-codigos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('codigos', { keyPath: 'id' });
    r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error);
  });
  async function tx(modo, fn) { const db = await abrirDB(); return new Promise((ok, erro) => { const t = db.transaction('codigos', modo); const st = t.objectStore('codigos'); const res = fn(st); t.oncomplete = () => ok(res && res.result !== undefined ? res.result : res); t.onerror = () => erro(t.error); }); }
  CL.codigosDB = {
    todos: () => tx('readonly', (st) => st.getAll()),
    guardar: (c) => tx('readwrite', (st) => st.put(c)),
    apagar: (id) => tx('readwrite', (st) => st.delete(id)),
  };

  let lista = [], aberto = null, filtro = '', larguraCel = false, timer = null;
  const humano = (n) => n < 1024 ? n + ' letras' : (n / 1024).toFixed(1).replace('.', ',') + ' KB';
  const tipoDe = (nome, cod) => /\.html?$/i.test(nome) || /<(!doctype|html|body|head|div|script|style)\b/i.test(cod) ? 'html' : /\.(m?js|ts|tsx|jsx)$/i.test(nome) ? 'js' : /\.css$/i.test(nome) ? 'css' : /\.md$/i.test(nome) ? 'md' : 'texto';
  const ICONE = { html: '🌐', js: '⚙️', css: '🎨', md: '📑', texto: '📄' };

  function montar() {
    const el = $('#tela-codigos');
    el.innerHTML =
      '<div class="cartao" id="cod-lista-tela">' +
      '  <div class="cab"><h1>🧪 Meus Códigos</h1><p>Guarde, rode e copie os seus códigos — aqui mesmo</p></div>' +
      '  <div class="numeros"><div class="num"><b id="c-total">0</b><span>Códigos guardados</span></div><div class="num"><b id="c-tam">0</b><span>Tamanho total</span></div></div>' +
      '  <h2>➕ Guardar um código</h2>' +
      '  <div class="campo"><label for="c-nome">Nome</label><input id="c-nome" placeholder="Ex.: Calculadora de tempo de contribuição"></div>' +
      '  <div class="campo"><label for="c-cod">Código (cole aqui)</label><textarea id="c-cod" class="mono" rows="6" spellcheck="false" autocapitalize="off" placeholder="Cole o código inteiro aqui (HTML, JS, texto…)"></textarea></div>' +
      '  <button class="btn forte" id="c-guardar">💾 Guardar código</button>' +
      '  <button class="btn" id="c-importar">📂 Importar arquivos (pode escolher vários)</button><input type="file" id="c-arq" multiple hidden accept=".html,.htm,.js,.mjs,.ts,.tsx,.jsx,.css,.md,.txt,.json,text/*">' +
      '  <h2>📚 Guardados</h2>' +
      '  <input id="c-busca" class="busca" placeholder="🔍 Procurar pelo nome ou por algo DENTRO do código…" autocapitalize="off">' +
      '  <div id="c-lista" class="lista"></div>' +
      '  <p class="mut pequeno">Ficam guardados neste aparelho. O 💾 Backup da aba 🔗 Links leva junto todos os códigos.</p>' +
      '</div>' +
      '<div id="cod-visor" class="cod-visor" hidden>' +
      '  <div class="visor-topo"><button class="vbtn" id="cv-voltar" title="Voltar à lista">←</button><b id="cv-nome" class="visor-titulo"></b><button class="vbtn" id="cv-cel" title="Tamanho celular / largo">📱</button><button class="vbtn" id="cv-fora" title="Abrir em tela própria">↗</button></div>' +
      '  <div class="cv-bts"><button class="mini-t ativo" id="cv-ver-rodar">▶ Rodar</button><button class="mini-t" id="cv-ver-cod">📝 Código</button><button class="mini-t" id="cv-copiar">📋 Copiar</button><button class="mini-t" id="cv-baixar">⬇ Baixar</button><button class="mini-t" id="cv-salvar" disabled>💾 Salvar</button><button class="mini-t" id="cv-renomear">✏️</button><button class="mini-t perigo" id="cv-apagar">🗑️</button></div>' +
      '  <div class="cv-corpo"><div id="cv-palco" class="cv-palco"><iframe id="cv-frame" title="Código rodando" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads" allow="clipboard-read; clipboard-write; microphone; camera"></iframe></div>' +
      '  <textarea id="cv-texto" class="cv-texto mono" spellcheck="false" autocapitalize="off" hidden></textarea></div>' +
      '</div>';

    $('#c-guardar').onclick = async () => {
      const cod = $('#c-cod').value; if (!cod.trim()) return CL.aviso('Cole um código primeiro.');
      const nome = $('#c-nome').value.trim() || ((cod.match(/<title[^>]*>([^<]{1,60})/i) || [])[1] || 'Código de ' + new Date().toLocaleDateString('pt-BR')).trim();
      await CL.codigosDB.guardar({ id: CL.uid(), nome, codigo: cod, tipo: tipoDe(nome, cod), criado: Date.now(), mudado: Date.now() });
      $('#c-cod').value = ''; $('#c-nome').value = ''; await carregar(); CL.aviso('💾 Guardado: ' + nome);
    };
    $('#c-importar').onclick = () => $('#c-arq').click();
    $('#c-arq').onchange = async (e) => {
      const fs = [...e.target.files]; e.target.value = ''; let n = 0;
      for (const f of fs) { try { const cod = await f.text(); await CL.codigosDB.guardar({ id: CL.uid(), nome: f.name, codigo: cod, tipo: tipoDe(f.name, cod), criado: Date.now(), mudado: f.lastModified || Date.now() }); n++; } catch (x) {} }
      await carregar(); CL.aviso(n + ' código(s) importado(s).');
    };
    $('#c-busca').addEventListener('input', (e) => { filtro = e.target.value.trim().toLowerCase(); pintar(); });
    $('#c-lista').addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      const c = lista.find((x) => x.id === b.dataset.id); if (!c) return;
      if (b.dataset.c === 'abrir') abrir(c, 'rodar');
      if (b.dataset.c === 'codigo') abrir(c, 'cod');
      if (b.dataset.c === 'copiar') copiar(c.codigo);
    });

    // visor
    $('#cv-voltar').onclick = fecharVisor;
    $('#cv-ver-rodar').onclick = () => modo('rodar');
    $('#cv-ver-cod').onclick = () => modo('cod');
    $('#cv-copiar').onclick = () => copiar($('#cv-texto').value);
    $('#cv-baixar').onclick = () => baixar(aberto.nome, $('#cv-texto').value);
    $('#cv-cel').onclick = () => { larguraCel = !larguraCel; $('#cv-palco').classList.toggle('cel', larguraCel); $('#cv-cel').textContent = larguraCel ? '💻' : '📱'; };
    $('#cv-fora').onclick = () => { const u = URL.createObjectURL(new Blob([$('#cv-texto').value], { type: aberto.tipo === 'html' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8' })); window.open(u, '_blank'); };
    $('#cv-texto').addEventListener('input', () => { $('#cv-salvar').disabled = false; clearTimeout(timer); timer = setTimeout(rodar, 700); });
    $('#cv-texto').addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); const t = e.target; t.setRangeText('  ', t.selectionStart, t.selectionEnd, 'end'); } });
    $('#cv-salvar').onclick = async () => { aberto.codigo = $('#cv-texto').value; aberto.mudado = Date.now(); aberto.tipo = tipoDe(aberto.nome, aberto.codigo); await CL.codigosDB.guardar(aberto); $('#cv-salvar').disabled = true; await carregar(); CL.aviso('💾 Mudanças salvas.'); };
    $('#cv-renomear').onclick = async () => { const n = prompt('Novo nome:', aberto.nome); if (!n) return; aberto.nome = n.trim(); await CL.codigosDB.guardar(aberto); $('#cv-nome').textContent = aberto.nome; await carregar(); };
    $('#cv-apagar').onclick = async () => { if (!confirm('Apagar "' + aberto.nome + '" dos guardados?\n\n(Dica: faça um 💾 Backup antes, na aba 🔗 Links.)')) return; await CL.codigosDB.apagar(aberto.id); fecharVisor(); await carregar(); CL.aviso('Apagado.'); };
    carregar();
  }

  async function carregar() { try { lista = (await CL.codigosDB.todos()).sort((a, b) => (b.mudado || 0) - (a.mudado || 0)); } catch (e) { lista = []; CL.aviso('⚠️ Este navegador não deixou guardar códigos.'); } pintar(); }
  function pintar() {
    $('#c-total').textContent = lista.length;
    $('#c-tam').textContent = humano(lista.reduce((s, c) => s + c.codigo.length, 0));
    const v = lista.filter((c) => !filtro || c.nome.toLowerCase().includes(filtro) || c.codigo.toLowerCase().includes(filtro));
    $('#c-lista').innerHTML = v.length ? v.map((c) =>
      '<div class="item"><div class="marca cod-icone">' + (ICONE[c.tipo] || '📄') + '</div><div class="info"><button class="nome" data-c="abrir" data-id="' + c.id + '">' + CL.esc(c.nome) + '</button><small>' + humano(c.codigo.length) + ' · ' + new Date(c.mudado || c.criado).toLocaleDateString('pt-BR') + (filtro && !c.nome.toLowerCase().includes(filtro) ? ' · achado dentro do código' : '') + '</small></div>' +
      '<div class="bts">' + (c.tipo === 'html' ? '<button class="mini" data-c="abrir" data-id="' + c.id + '" title="Rodar">▶</button>' : '') + '<button class="mini" data-c="codigo" data-id="' + c.id + '" title="Ver o código">📝</button><button class="mini" data-c="copiar" data-id="' + c.id + '" title="Copiar tudo">📋</button></div></div>').join('')
      : '<p class="mut">' + (filtro ? 'Nada achado com "' + CL.esc(filtro) + '".' : 'Nenhum código guardado ainda. Cole o primeiro lá em cima, ou 📂 importe arquivos.') + '</p>';
  }

  function abrir(c, m) {
    aberto = c;
    $('#cod-lista-tela').hidden = true; $('#cod-visor').hidden = false;
    $('#cv-nome').textContent = c.nome; $('#cv-texto').value = c.codigo; $('#cv-salvar').disabled = true;
    $('#cv-ver-rodar').hidden = c.tipo !== 'html' && c.tipo !== 'js';
    modo(c.tipo === 'html' || c.tipo === 'js' ? m : 'cod');
    if (c.tipo === 'html' || c.tipo === 'js') rodar();
  }
  function modo(m) {
    $('#cv-palco').hidden = m !== 'rodar'; $('#cv-texto').hidden = m !== 'cod';
    $('#cv-ver-rodar').classList.toggle('ativo', m === 'rodar'); $('#cv-ver-cod').classList.toggle('ativo', m === 'cod');
  }
  function rodar() {
    if (!aberto) return; const cod = $('#cv-texto').value;
    const pag = aberto.tipo === 'js' ? '<!doctype html><meta charset="utf-8"><body><pre id="saida" style="font:14px monospace;white-space:pre-wrap"></pre><script>const __s=document.getElementById("saida");console.log=(...a)=>{__s.textContent+=a.map(x=>typeof x==="object"?JSON.stringify(x,null,1):x).join(" ")+"\\n"};window.onerror=(m)=>{__s.textContent+="❌ "+m+"\\n"};<\/script><script>' + cod.replace(/<\/script/gi, '<\\/script') + '<\/script>' : cod;
    $('#cv-frame').srcdoc = pag;
  }
  function fecharVisor() {
    if (!$('#cv-salvar').disabled && !confirm('Você mudou o código e não salvou. Sair mesmo assim?')) return;
    aberto = null; $('#cv-frame').srcdoc = ''; $('#cod-visor').hidden = true; $('#cod-lista-tela').hidden = false;
  }
  async function copiar(t) { try { await navigator.clipboard.writeText(t); CL.aviso('📋 Copiado. É só colar onde quiser.'); } catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); CL.aviso('📋 Copiado.'); } catch (x) { CL.aviso('Não consegui copiar.'); } ta.remove(); } }
  function baixar(nome, txt) { const n = /\.[a-z0-9]{1,5}$/i.test(nome) ? nome : nome.replace(/[\\/:*?"<>|]+/g, '-') + (aberto && aberto.tipo === 'html' ? '.html' : '.txt'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a.download = n; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }

  CL.codigosUI = { montar, carregar };
})(window.CL);
