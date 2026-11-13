/* Pet 10 by Brooklin — site demo Patron */
(function () {
  'use strict';

  // WhatsApp confirmado pelo link da bio do Instagram da loja (13/11/2026): +55 11 2368-4597.
  // CONFIRMAR com o dono se este é o número de agendamento do dia a dia.
  var ZAP = '551123684597';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var linkZap = function (txt) { return 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(txt); };

  $$('[data-zap]').forEach(function (a) { a.href = linkZap(a.dataset.zap); });

  /* ---------- topo, botão flutuante, entrada das seções ---------- */
  var topo = $('#topo'), flut = $('#flutuante'), hero = $('#inicio');
  function aoRolar() {
    topo.classList.toggle('rolou', window.scrollY > 8);
    // some enquanto o montador está na tela, para não cobrir o botão de enviar
    var m = document.getElementById('mont').getBoundingClientRect();
    var noMontador = m.top < window.innerHeight * 0.75 && m.bottom > window.innerHeight * 0.5;
    flut.classList.toggle('visivel', window.scrollY > hero.offsetHeight * 0.55 && !noMontador);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.revelar').forEach(function (el) { obs.observe(el); });
  } else {
    $$('.revelar').forEach(function (el) { el.classList.add('visivel'); });
  }

  /* ---------- montador de agendamento ---------- */
  // CONFIRMAR: as opções de cada frente são genéricas; trocar pela lista real da loja.
  var FRENTES = {
    banho: { nome: 'Banho e tosa', verbo: 'Quero agendar', pergunta: 'Qual serviço?', dia: 'Qual dia fica melhor?', pet: true,
      opcoes: ['Banho', 'Tosa', 'Saber sobre pacotes de banho'] },
    loja: { nome: 'Loja', verbo: 'Quero saber se vocês têm', pergunta: 'O que você procura?', dia: 'Quando pretende passar na loja?', pet: false,
      opcoes: ['Ração', 'Petiscos', 'Acessórios e brinquedos', 'Higiene e cuidados'] },
    clinica: { nome: 'Clínica veterinária', verbo: 'Quero marcar', pergunta: 'Como podemos ajudar?', dia: 'Qual dia fica melhor?', pet: true,
      opcoes: ['Consulta veterinária', 'Saber quais atendimentos a clínica faz'] },
    creche: { nome: 'Creche, hotel e adestramento', verbo: 'Quero saber sobre', pergunta: 'Qual serviço?', dia: 'A partir de quando?', pet: true,
      opcoes: ['Creche', 'Hotel', 'Adestramento', 'Visita para conhecer o espaço'] }
  };
  var est = { frente: null, servicos: [], porte: null, dia: null, periodo: null };
  var mont = $('#mont'), chipsServ = $('#chips-servico'), dias = $('#dias');
  var fala = $('#pedido-fala'), btnZap = $('#btn-zap'), btnCopiar = $('#btn-copiar'), aviso = $('#aviso');
  var petNome = $('#pet-nome'), produto = $('#produto');

  // dias: os próximos 8, pulando domingos fora de novembro e dezembro (agenda especial publicada em 6/11/2026)
  var SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var SEM_L = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  (function montaDias() {
    var hoje = new Date(), html = '', n = 0;
    for (var i = 0; n < 8 && i < 14; i++) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
      var dom = d.getDay() === 0, mes = d.getMonth();
      if (dom && mes !== 10 && mes !== 11) continue;
      var dd = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (mes + 1)).slice(-2);
      var rot = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : SEM[d.getDay()];
      html += '<button type="button" class="dia' + (dom ? ' dom' : '') + '" role="radio" aria-checked="false" data-dom="' + (dom ? 1 : 0) +
        '" data-dia="' + (i === 0 ? 'hoje' : i === 1 ? 'amanhã' : SEM_L[d.getDay()]) + ', ' + dd + '" aria-label="' + SEM_L[d.getDay()] + ', ' + dd + '"><small>' + rot + '</small><b>' + d.getDate() + '</b></button>';
      n++;
    }
    html += '<button type="button" class="dia livre" role="radio" aria-checked="false" data-dom="0" data-dia="a combinar"><b>Ainda não sei</b></button>';
    dias.innerHTML = html;
  })();

  function marcaUnico(lista, alvo) { lista.forEach(function (b) { b.setAttribute('aria-checked', b === alvo ? 'true' : 'false'); }); }

  function escolheFrente(chave) {
    var f = FRENTES[chave];
    est.frente = chave; est.servicos = [];
    marcaUnico($$('.frente'), $('.frente[data-frente="' + chave + '"]'));
    $('#leg-2').textContent = f.pergunta;
    $('#leg-3').textContent = f.dia;
    $('#dica-2').textContent = 'Pode marcar mais de uma opção.';
    chipsServ.innerHTML = f.opcoes.map(function (o) { return '<button type="button" class="chip" aria-pressed="false" data-servico="' + o + '">' + o + '</button>'; }).join('');
    $('#campos-pet').hidden = false;
    $('#pet-nome').closest('.campo').hidden = !f.pet;
    $('#campo-porte').hidden = !f.pet;
    $('#campo-produto').hidden = f.pet;
    $('#passo-2').classList.remove('travado');
    atualiza();
  }

  function mensagem() {
    var f = FRENTES[est.frente];
    var l = ['Olá! Vim pelo site da Pet 10 by Brooklin.'];
    l.push(f.verbo + ': ' + est.servicos.join(', ').toLowerCase() + ' (' + f.nome + ').');
    if (f.pet) {
      var nome = petNome.value.trim(), p = [];
      if (nome) p.push(nome);
      if (est.porte) p.push('porte ' + est.porte);
      if (p.length) l.push('Pet: ' + p.join(', ') + '.');
    } else if (produto.value.trim()) {
      l.push('Produto: ' + produto.value.trim() + '.');
    }
    if (est.dia) {
      var quando = est.dia === 'a combinar' ? 'dia a combinar' : est.dia;
      if (est.periodo) quando += ', ' + est.periodo;
      l.push((f.pet ? 'Preferência: ' : 'Pretendo passar: ') + quando + '.');
    }
    l.push(f.pet ? 'Podem me confirmar horário e valor?' : 'Podem me confirmar se tem e o valor?');
    return l.join('\n');
  }

  function atualiza() {
    var temServ = est.servicos.length > 0;
    var pronto = !!(est.frente && temServ && est.dia);
    $('#passo-3').classList.toggle('travado', !temServ);
    var humor = !est.frente ? 0 : !temServ ? 1 : !est.dia ? 2 : 3;
    mont.dataset.humor = humor;
    $$('.mont-trilha li').forEach(function (li, i) {
      li.classList.toggle('feito', i < humor);
      li.classList.toggle('ativo', i === Math.min(humor, 2) && humor < 3);
    });
    $('#pedido').classList.toggle('pronto', pronto);
    if (est.frente && temServ) {
      var txt = mensagem();
      fala.textContent = txt;
      btnZap.href = linkZap(txt);
      btnZap.setAttribute('aria-disabled', 'false');
      btnCopiar.disabled = false;
    } else {
      fala.textContent = est.frente ? 'Agora escolha o que você precisa.' : 'Toque nas opções acima e a mensagem aparece aqui, pronta para enviar.';
      btnZap.setAttribute('aria-disabled', 'true'); btnZap.href = '#agendar';
      btnCopiar.disabled = true;
    }
    var d = $('.dia[aria-checked="true"]');
    $('#dica-dom').hidden = !(d && d.dataset.dom === '1');
  }

  mont.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.frente) { escolheFrente(b.dataset.frente); return; }
    if (b.dataset.servico) {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      est.servicos = $$('.chip[aria-pressed="true"]', chipsServ).map(function (c) { return c.dataset.servico; });
    } else if (b.dataset.porte) {
      var mesmo = est.porte === b.dataset.porte;
      est.porte = mesmo ? null : b.dataset.porte;
      marcaUnico($$('[data-porte]'), mesmo ? null : b);
    } else if (b.dataset.dia) {
      if (!est.servicos.length) return;
      est.dia = b.dataset.dia; marcaUnico($$('.dia'), b);
    } else if (b.dataset.periodo) {
      if (!est.servicos.length) return;
      var igual = est.periodo === b.dataset.periodo;
      est.periodo = igual ? null : b.dataset.periodo;
      marcaUnico($$('[data-periodo]'), igual ? null : b);
    } else { return; }
    aviso.textContent = '';
    atualiza();
  });
  petNome.addEventListener('input', atualiza);
  produto.addEventListener('input', atualiza);

  btnZap.addEventListener('click', function (ev) {
    if (btnZap.getAttribute('aria-disabled') === 'true') ev.preventDefault();
  });

  btnCopiar.addEventListener('click', function () {
    var txt = fala.textContent;
    function ok() { aviso.textContent = 'Mensagem copiada. É só colar no WhatsApp.'; }
    function reserva() {
      var t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); ok(); } catch (e) { aviso.textContent = 'Não deu para copiar. Selecione o texto acima.'; }
      document.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, reserva); else reserva();
  });

  // botões das seções que levam ao montador já com a frente escolhida
  $$('[data-ir]').forEach(function (b) {
    b.addEventListener('click', function () {
      escolheFrente(b.dataset.ir);
      var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      $('#agendar').scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
    });
  });

  atualiza();
})();
