/* =========================================================================
   Colador de Links — 30-visor.js
   VISOR POR LISTA: cada lista (Ger. 1, Ger. 2…) tem o SEU visor, que fica
   aberto por trás quando você troca. Ex.: no Ger. 1 a conversa da Monica,
   no Ger. 2 o Mini SK — troca na aba de cima e cada um continua onde estava.
   Dentro de cada visor: "3/37 - nome", ← Anterior / Próximo →, Tela cheia,
   Abrir fora, Fechar. Os últimos 5 abertos de cada lista ficam vivos.
   ========================================================================= */
(function (CL) {
  'use strict';
  const $ = CL.$;
  const MAX_VIVOS = 5;
  const visores = new Map();   // id da lista → { lista, pos, caixa, vivos }
  let atual = null;            // id da lista do visor que está na tela

  function caixaDe(id) {
    let v = visores.get(id);
    if (!v) {
      const caixa = document.createElement('div');
      caixa.className = 'visor-caixa'; caixa.dataset.lista = id;
      $('#visor-quadros').appendChild(caixa);
      v = { lista: [], pos: 0, caixa, vivos: new Map() };
      visores.set(id, v);
    }
    return v;
  }

  function quadro(v, url) {
    if (v.vivos.has(url)) { const f = v.vivos.get(url); v.vivos.delete(url); v.vivos.set(url, f); return f; }
    const f = document.createElement('iframe');
    f.className = 'quadro';
    f.src = url;
    f.setAttribute('allow', 'clipboard-read; clipboard-write; microphone; camera; fullscreen; autoplay');
    f.setAttribute('allowfullscreen', '');
    v.caixa.appendChild(f);
    v.vivos.set(url, f);
    while (v.vivos.size > MAX_VIVOS) { const [u, velho] = v.vivos.entries().next().value; velho.remove(); v.vivos.delete(u); }
    return f;
  }

  const nomeLista = (id) => (CL.listas.find((x) => x.id === id) || {}).nome || 'Lista';

  function mostrar() {
    const v = visores.get(atual); if (!v) return;
    visores.forEach((x, k) => (x.caixa.hidden = k !== atual));
    const l = v.lista[v.pos]; if (!l) return;
    const f = quadro(v, l.url);
    v.vivos.forEach((q) => (q.hidden = q !== f));
    $('#visor-titulo').textContent = nomeLista(atual) + ' · ' + (v.pos + 1) + '/' + v.lista.length + ' - ' + l.nome;
    $('#ant').disabled = v.pos === 0;
    $('#prox').disabled = v.pos === v.lista.length - 1;
  }

  // abre os links "sel" no visor da lista "id" (por padrão, a lista que está aberta na tela de links)
  function abrir(sel, i, id) {
    id = id || CL.listaAtual;
    const v = caixaDe(id);
    v.lista = sel.slice(); v.pos = i || 0;
    atual = id;
    CL.abasUI.ir('visor:' + id);
  }
  function fechar(id) {
    id = id || atual;
    const v = visores.get(id);
    if (v) { v.caixa.remove(); visores.delete(id); }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.body.classList.remove('cheia');
    const outro = [...visores.keys()][0];
    CL.abasUI.ir(id === atual && outro ? 'visor:' + outro : 'links');
  }
  // chamado pela barra de abas quando você toca em "▶ Ger. 1"
  function ver(id) { if (!visores.has(id)) return false; atual = id; mostrar(); return true; }

  function iniciar() {
    $('#visor-fechar').onclick = () => fechar();
    $('#ant').onclick = () => { const v = visores.get(atual); if (v && v.pos > 0) { v.pos--; mostrar(); } };
    $('#prox').onclick = () => { const v = visores.get(atual); if (v && v.pos < v.lista.length - 1) { v.pos++; mostrar(); } };
    $('#visor-fora').onclick = () => { const v = visores.get(atual); const l = v && v.lista[v.pos]; if (l) window.open(l.url, '_blank', 'noopener'); };
    $('#visor-copiar').onclick = () => { const v = visores.get(atual); const l = v && v.lista[v.pos]; if (l) CL.copiar(l.url, 'Endereço copiado.'); };
    $('#visor-cheia').onclick = () => {
      const el = document.documentElement;
      if (document.fullscreenElement || document.body.classList.contains('cheia')) { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); document.body.classList.remove('cheia'); return; }
      document.body.classList.add('cheia');
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    };
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('cheia'); });
  }

  CL.visor = {
    iniciar, abrir, fechar, ver,
    get abertos() { return [...visores.keys()]; },   // listas que têm visor aberto (viram abas "▶")
    get atual() { return atual; },
  };
})(window.CL);
