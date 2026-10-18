/* =========================================================================
   Colador de Links — 00-dados.js
   Onde tudo fica guardado (neste aparelho) + backup em arquivo.
   CL.links  = [{ id, nome, url, marcado }]
   CL.abas   = [{ id, nome, url }]        (as abas fixadas no topo)
   ========================================================================= */
(function (g) {
  'use strict';
  const CL = (g.CL = g.CL || {});
  CL.versao = 'v18/10-a';
  const K_LINKS = 'colador_links_v1', K_ABAS = 'colador_abas_v1', K_LISTAS = 'colador_listas_v1', K_ATUAL = 'colador_lista_atual';

  // Links que apareciam nos seus prints (já entram na primeira vez)
  const INICIAIS = [
    ['1.play', 'https://bucolic-babka-4c12ea.netlify.app/'],
    ['2.SkTools', 'https://hilarious-profiterole-c0c785.netlify.app/'],
    ['3.chat', 'https://iridescent-speculoos-1db22c.netlify.app/'],
    ['4.sk', 'https://phenomenal-caramel-18cdfe.netlify.app/'],
    ['5', 'https://bejewelled-bienenstitch-3f78dd.netlify.app/'],
    ['Conversa (Claude)', 'https://claude.ai/share/0f4958a1-a87a-4180-a09a-dd15341a65cd'],
    ['proj22-pwa', 'https://maikonadvogadomg-alt.github.io/proj22-pwa/index.html'],
    ['mini6-pwa', 'https://jorgecaldeira62-gif.github.io/mini6-pwa/'],
    ['Monica 1', 'https://monica.im/share/chat?shareId=nfi0FGbnUIDxyh7O'],
    ['Monica 2', 'https://monica.im/share/chat?shareId=rjMdNehXJOdwRxoQ'],
    ['Mini SK', 'https://maikonadvogadomg-alt.github.io/mini-sk/'],
    ['Caça-Bug 2', 'https://maikonadvogadomg-alt.github.io/caca-bug-2/'],
    ['Caca1', 'https://maikonadvogadomg-alt.github.io/caca-tudo/'],
  ];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function ler(k, padrao) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { CL.aviso('⚠️ Não consegui guardar (memória cheia?). Faça um backup.'); return false; } }

  CL.links = ler(K_LINKS, null);
  if (!CL.links) { CL.links = INICIAIS.map(([nome, url]) => ({ id: uid(), nome, url, marcado: true })); gravar(K_LINKS, CL.links); }
  CL.abas = ler(K_ABAS, []);
  // várias listas (Ger. 1, Ger. 2, …): cada link pertence a uma
  CL.listas = ler(K_LISTAS, null) || [{ id: 'l1', nome: 'Ger. 1' }, { id: 'l2', nome: 'Ger. 2' }];
  CL.links.forEach((l) => { if (!l.lista || !CL.listas.some((x) => x.id === l.lista)) l.lista = CL.listas[0].id; });
  CL.listaAtual = ler(K_ATUAL, CL.listas[0].id);
  if (!CL.listas.some((x) => x.id === CL.listaAtual)) CL.listaAtual = CL.listas[0].id;

  CL.salvar = () => { gravar(K_LINKS, CL.links); gravar(K_ABAS, CL.abas); gravar(K_LISTAS, CL.listas); gravar(K_ATUAL, CL.listaAtual); };
  CL.uid = uid;
  CL.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  CL.$ = (s, el) => (el || document).querySelector(s);

  // aceita "site.com" sem https
  CL.arrumarUrl = (u) => { u = String(u || '').trim(); if (!u) return ''; if (!/^[a-z][\w+.-]*:/i.test(u)) u = 'https://' + u; try { return new URL(u).href; } catch { return ''; } };

  // ── aviso rápido ────────────────────────────────────────────────────────────
  let t;
  CL.aviso = (msg) => { const a = document.getElementById('aviso'); if (!a) return; a.textContent = msg; a.hidden = false; clearTimeout(t); t = setTimeout(() => (a.hidden = true), 2600); };

  // ── backup ─────────────────────────────────────────────────────────────────
  CL.backup = async () => {
    let codigos = [];
    try { codigos = CL.codigosDB ? await CL.codigosDB.todos() : []; } catch (e) {}
    const dados = JSON.stringify({ app: 'colador-de-links', versao: 2, data: new Date().toISOString(), listas: CL.listas, links: CL.links, abas: CL.abas, codigos }, null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([dados], { type: 'application/json' }));
    a.download = 'colador-links-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  // ── copiar e lista em TEXTO (.md): fácil de ler, copiar e colar em qualquer lugar ──
  CL.copiar = async (texto, msg) => {
    try { await navigator.clipboard.writeText(texto); }
    catch { const t = document.createElement('textarea'); t.value = texto; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
    CL.aviso(msg || '📋 Copiado.');
  };
  CL.textoMD = (soLista) => {
    const listas = soLista ? CL.listas.filter((x) => x.id === soLista) : CL.listas;
    let md = '# Meus links — Colador (' + new Date().toLocaleDateString('pt-BR') + ')\n';
    for (const li of listas) {
      const ls = CL.links.filter((l) => l.lista === li.id);
      md += '\n## ' + li.nome + '\n\n' + (ls.length ? ls.map((l) => '- ' + l.nome + ' — ' + l.url).join('\n') : '(vazia)') + '\n';
    }
    return md;
  };
  CL.baixarMD = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([CL.textoMD()], { type: 'text/markdown;charset=utf-8' }));
    a.download = 'meus-links-' + new Date().toISOString().slice(0, 10) + '.md';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  // lê um texto/.md: cada "## Nome" vira (ou acha) uma lista; os endereços abaixo entram nela
  CL.importarTexto = (texto) => {
    const antes = CL.listaAtual; let n = 0;
    const partes = String(texto || '').split(/^##\s+/m);
    if (partes.length < 2) return CL.colarVarios(texto);
    n += CL.colarVarios(partes[0]);
    for (const p of partes.slice(1)) {
      const nome = p.split('\n')[0].trim().slice(0, 24) || 'Lista';
      let li = CL.listas.find((x) => x.nome.toLowerCase() === nome.toLowerCase());
      if (!li) { li = { id: uid(), nome }; CL.listas.push(li); }
      CL.listaAtual = li.id;
      n += CL.colarVarios(p.slice(p.indexOf('\n') + 1));
    }
    CL.listaAtual = antes; CL.salvar();
    return n;
  };
  CL.restaurar = async (arquivo) => {
    const texto = await arquivo.text();
    let j; try { j = JSON.parse(texto); } catch { return CL.importarTexto(texto); }
    if (!Array.isArray(j.links)) throw new Error('Este arquivo não é um backup do Colador.');
    for (const li of j.listas || []) if (!CL.listas.some((x) => x.id === li.id)) CL.listas.push({ id: li.id, nome: li.nome });
    const ja = new Set(CL.links.map((l) => (l.lista || '') + '|' + l.url));
    let n = 0;
    for (const l of j.links) { const lista = CL.listas.some((x) => x.id === l.lista) ? l.lista : CL.listas[0].id; if (l.url && !ja.has(lista + '|' + l.url)) { CL.links.push({ id: uid(), nome: l.nome || l.url, url: l.url, marcado: !!l.marcado, lista }); n++; } }
    if (Array.isArray(j.codigos) && CL.codigosDB) { const tem = new Set((await CL.codigosDB.todos()).map((c) => c.nome + '|' + c.codigo.length)); for (const c of j.codigos) if (c && c.codigo != null && !tem.has(c.nome + '|' + c.codigo.length)) { await CL.codigosDB.guardar(Object.assign({}, c, { id: uid() })); n++; } }
    const jaAba = new Set(CL.abas.map((a) => a.url));
    for (const a of j.abas || []) if (a.url && !jaAba.has(a.url)) CL.abas.push({ id: uid(), nome: a.nome, url: a.url });
    CL.salvar();
    return n;
  };
  // cola um texto qualquer com vários endereços dentro → vira links
  CL.colarVarios = (texto) => {
    const urls = String(texto || '').match(/https?:\/\/[^\s"'<>)]+/g) || [];
    const ja = new Set(CL.links.filter((l) => l.lista === CL.listaAtual).map((l) => l.url));
    let n = 0;
    // tenta aproveitar o texto antes do endereço na mesma linha como nome (ex.: "Chat 1 - https://…")
    const linhas = String(texto || '').split(/\n/);
    const nomeDe = (url) => { const ln = linhas.find((x) => x.includes(url)); const antes = ln ? ln.slice(0, ln.indexOf(url)).replace(/^[\s>*•+-]+/, '').replace(/[\[\]()*_`]/g, '').replace(/[-:–—|•\s]+$/, '').trim() : ''; return antes && antes.length <= 40 ? antes : new URL(url).hostname.split('.')[0]; };
    for (const u of urls) { const url = CL.arrumarUrl(u.replace(/[.,;]+$/, '')); if (url && !ja.has(url)) { ja.add(url); CL.links.push({ id: uid(), nome: nomeDe(u.replace(/[.,;]+$/, '')), url, marcado: true, lista: CL.listaAtual }); n++; } }
    CL.salvar();
    return n;
  };
})(window);
