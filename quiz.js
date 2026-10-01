/* ===== Quiz de Avaliação Inicial — JS encapsulado (não usa nem altera variáveis globais) ===== */
(function () {
  "use strict";

  // >>> Número de WhatsApp da clínica (formato internacional, só dígitos). Troque aqui se precisar. <<<
  var NUMERO_WHATSAPP_CLINICA = "5515992726907";

  var QUESTIONS = [
    { key: "motivo", text: "Qual é o principal motivo que trouxe você até nós?",
      options: ["Dependência de álcool", "Dependência de outras substâncias", "Álcool e outras substâncias", "Outro motivo", "Prefiro não informar"] },
    { key: "tempo", text: "Há quanto tempo você enfrenta essa situação?",
      options: ["Menos de 6 meses", "De 6 meses a 1 ano", "De 1 a 3 anos", "Mais de 3 anos", "Prefiro não informar"] },
    { key: "tratamento", text: "Você já tentou algum tratamento anteriormente?",
      options: ["Sim", "Não", "Prefiro não informar"] },
    { key: "sentimento", text: "Como você se sente em relação a iniciar um tratamento?",
      options: ["Estou pronto(a) para buscar ajuda", "Estou pensando em buscar ajuda", "Ainda tenho dúvidas", "Prefiro conversar primeiro com a equipe"] },
    { key: "apoio", text: "Você conta com apoio da família ou de pessoas próximas?",
      options: ["Sim", "Parcialmente", "Não", "Prefiro não informar"] },
    { key: "contato", text: "Gostaria que nossa equipe entrasse em contato para conversar sobre sua situação?",
      options: ["Sim", "Não"] }
  ];
  var TOTAL = QUESTIONS.length + 1; // +1 = pergunta 7 (identificação, opcional)

  var answers = {};      // respostas só em memória; nada é salvo
  var current = 0;
  var lastTrigger = null;
  var els = {};

  function create(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function build() {
    var overlay = create("div", "clinicaQuizOverlay");
    overlay.id = "clinicaQuizOverlay";

    var modal = create("div", "clinicaQuizModal clinicaQuizContainer");
    modal.id = "clinicaQuizModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "clinicaQuizTitle");
    modal.tabIndex = -1;

    var header = create("div", "clinicaQuizHeader");
    header.id = "clinicaQuizHeader";
    var title = create("h2", "clinicaQuizTitle", "Avaliação Inicial");
    title.id = "clinicaQuizTitle";
    header.appendChild(title);
    header.appendChild(create("p", "clinicaQuizSubtitle", "Responda algumas perguntas para nos ajudar a entender melhor como podemos ajudar."));
    header.appendChild(create("p", "clinicaQuizDisclaimer", "Esta avaliação é apenas uma triagem inicial e não substitui uma avaliação profissional."));
    var close = create("button", "clinicaQuizClose", "\u00D7");
    close.type = "button";
    close.setAttribute("aria-label", "Fechar avaliação");
    header.appendChild(close);

    var scroll = create("div", "clinicaQuizScroll");
    var info = create("div", "clinicaQuizProgressInfo");
    var counter = create("span", "clinicaQuizCounter");
    counter.setAttribute("aria-live", "polite");
    info.appendChild(counter);
    var progress = create("div", "clinicaQuizProgress");
    progress.id = "clinicaQuizProgress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", String(TOTAL));
    var bar = create("div", "clinicaQuizProgressBar");
    bar.id = "clinicaQuizProgressBar";
    progress.appendChild(bar);
    var stage = create("div", "clinicaQuizStage");
    var error = create("p", "clinicaQuizError");
    error.setAttribute("role", "alert");
    scroll.appendChild(info);
    scroll.appendChild(progress);
    scroll.appendChild(stage);
    scroll.appendChild(error);

    var footer = create("div", "clinicaQuizFooter");
    var back = create("button", "clinicaQuizBtn clinicaQuizBack", "Voltar");
    back.type = "button"; back.id = "clinicaQuizBack";
    var next = create("button", "clinicaQuizBtn clinicaQuizNext", "Próximo");
    next.type = "button"; next.id = "clinicaQuizNext";
    footer.appendChild(back);
    footer.appendChild(next);

    modal.appendChild(header);
    modal.appendChild(scroll);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    els = { overlay: overlay, modal: modal, close: close, counter: counter, progress: progress, bar: bar,
            stage: stage, error: error, footer: footer, back: back, next: next, info: info };

    close.addEventListener("click", closeQuiz);
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) closeQuiz(); });
    back.addEventListener("click", goBack);
    next.addEventListener("click", goNext);
    document.addEventListener("keydown", onKey);
  }

  function setProgress(step) {
    var pct = Math.round((step / TOTAL) * 100);
    els.bar.style.width = pct + "%";
    els.progress.setAttribute("aria-valuenow", String(step));
  }

  function renderStep(direction) {
    els.error.textContent = "";
    els.info.style.display = "";
    els.progress.style.display = "";
    els.footer.style.display = "";
    els.counter.textContent = "Pergunta " + (current + 1) + " de " + TOTAL;
    setProgress(current + 1);
    els.back.hidden = current === 0;
    els.next.textContent = current === TOTAL - 1 ? "Finalizar avaliação" : "Próximo";
    els.next.className = "clinicaQuizBtn " + (current === TOTAL - 1 ? "clinicaQuizFinish" : "clinicaQuizNext");
    els.next.id = current === TOTAL - 1 ? "clinicaQuizFinish" : "clinicaQuizNext";

    els.stage.innerHTML = "";
    var step = create("div", "clinicaQuizStep" + (direction === "back" ? " clinicaQuizStepBack" : ""));
    var fs = create("fieldset", "clinicaQuizFieldset");

    if (current < QUESTIONS.length) {
      var q = QUESTIONS[current];
      var legend = create("legend", "clinicaQuizQuestion", q.text);
      fs.appendChild(legend);
      var list = create("div", "clinicaQuizOptions");
      q.options.forEach(function (opt, i) {
        var label = create("label", "clinicaQuizOption");
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "clinicaQuiz_" + q.key;
        input.value = opt;
        input.id = "clinicaQuiz_" + q.key + "_" + i;
        if (answers[q.key] === opt) input.checked = true;
        input.addEventListener("change", function () { answers[q.key] = opt; els.error.textContent = ""; });
        label.appendChild(input);
        label.appendChild(create("span", "clinicaQuizOptionLabel", opt));
        list.appendChild(label);
      });
      fs.appendChild(list);
    } else {
      fs.appendChild(create("legend", "clinicaQuizQuestion", "Para finalizar, como podemos identificar você?"));
      fs.appendChild(field("nome", "Nome", "text", "name", "Seu nome"));
      fs.appendChild(field("whatsapp", "WhatsApp", "tel", "tel", "(00) 00000-0000"));
      fs.appendChild(create("p", "clinicaQuizPrivacy", "Os dois campos são opcionais. Nada é enviado ou guardado: as informações ficam só neste aparelho e só vão para a clínica se você decidir enviar a mensagem pelo WhatsApp."));
    }
    step.appendChild(fs);
    els.stage.appendChild(step);
    els.scrollEl.scrollTop = 0;
  }

  function field(key, labelText, type, autocomplete, placeholder) {
    var wrap = create("label", "clinicaQuizField");
    var name = create("span", "clinicaQuizFieldName", labelText + " ");
    name.appendChild(create("span", "clinicaQuizFieldHint", "(opcional)"));
    var input = document.createElement("input");
    input.className = "clinicaQuizInput";
    input.type = type;
    input.id = "clinicaQuizInput_" + key;
    input.autocomplete = autocomplete;
    input.placeholder = placeholder;
    input.maxLength = key === "nome" ? 60 : 20;
    if (type === "tel") input.inputMode = "tel";
    input.value = answers[key] || "";
    input.addEventListener("input", function () { answers[key] = input.value; });
    wrap.appendChild(name);
    wrap.appendChild(input);
    return wrap;
  }

  function goNext() {
    if (current < QUESTIONS.length && !answers[QUESTIONS[current].key]) {
      els.error.textContent = "Por favor, selecione uma opção para continuar.";
      return;
    }
    if (current === TOTAL - 1) { renderResult(); return; }
    current += 1;
    renderStep("next");
  }

  function goBack() {
    if (current === 0) return;
    current -= 1;
    renderStep("back");
  }

  function clean(v) { return (v || "").replace(/\s+/g, " ").trim(); }

  function buildMessage() {
    var nome = clean(answers.nome);
    var lines = [];
    lines.push(nome
      ? "Olá, meu nome é " + nome + ". Fiz a avaliação inicial pelo site da Clínica Semear com Amor e gostaria de conversar com a equipe."
      : "Olá! Fiz a avaliação inicial pelo site da Clínica Semear com Amor e gostaria de conversar com a equipe.");
    var parts = [
      ["Meu principal motivo para buscar ajuda é: ", answers.motivo],
      ["Enfrento essa situação há: ", answers.tempo],
      ["Já tentei realizar tratamento anteriormente: ", answers.tratamento],
      ["Em relação ao tratamento, eu me sinto: ", answers.sentimento],
      ["Tenho apoio da família ou de pessoas próximas: ", answers.apoio]
    ];
    parts.forEach(function (p) { if (p[1]) lines.push(p[0] + p[1] + "."); }); // só inclui o que foi realmente respondido
    var zap = clean(answers.whatsapp);
    if (zap) lines.push("Meu WhatsApp para contato: " + zap + ".");
    lines.push("Gostaria de conversar com a equipe para receber mais informações.");
    return lines.join("\n\n");
  }

  function renderResult() {
    els.error.textContent = "";
    els.info.style.display = "none";
    els.progress.style.display = "none";
    els.footer.style.display = "none";
    els.stage.innerHTML = "";
    var mensagem = buildMessage();

    var box = create("div", "clinicaQuizStep clinicaQuizResult");
    box.id = "clinicaQuizResult";
    box.appendChild(create("h3", "clinicaQuizResultTitle", "Avaliação concluída"));
    box.appendChild(create("p", "clinicaQuizResultText", "Com base nas respostas que você informou, preparamos um resumo para facilitar seu contato com a equipe da Clínica Semear com Amor."));
    box.appendChild(create("p", "clinicaQuizPreviewLabel", "Prévia da mensagem:"));
    box.appendChild(create("div", "clinicaQuizPreview", mensagem)); // textContent: sem risco de injeção
    var note = "Ao tocar no botão abaixo, o WhatsApp abrirá com esta mensagem já escrita. Ela só será enviada se você tocar em \u201cEnviar\u201d dentro do WhatsApp.";
    if (answers.contato === "Não") note = "Você indicou que prefere não receber contato agora. O envio é totalmente opcional. " + note;
    box.appendChild(create("p", "clinicaQuizNote", note));

    var actions = create("div", "clinicaQuizResultActions");
    var wa = create("button", "clinicaQuizBtn clinicaQuizWhatsapp", "Enviar pelo WhatsApp");
    wa.type = "button"; wa.id = "clinicaQuizWhatsapp";
    wa.addEventListener("click", function () {
      var whatsappURL = "https://wa.me/" + NUMERO_WHATSAPP_CLINICA + "?text=" + encodeURIComponent(mensagem);
      window.open(whatsappURL, "_blank", "noopener");
    });
    var edit = create("button", "clinicaQuizBtn clinicaQuizEdit", "Revisar respostas");
    edit.type = "button";
    edit.addEventListener("click", function () { current = TOTAL - 1; renderStep("back"); });
    actions.appendChild(wa);
    actions.appendChild(edit);
    box.appendChild(actions);
    els.stage.appendChild(box);
    els.scrollEl.scrollTop = 0;
    wa.focus({ preventScroll: true });
  }

  var prevOverflow = "";
  function openQuiz(trigger) {
    if (!els.overlay) { build(); els.scrollEl = els.overlay.querySelector(".clinicaQuizScroll"); }
    lastTrigger = trigger || null;
    answers = {}; current = 0;
    renderStep("next");
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    els.overlay.classList.add("clinicaQuizIsOpen");
    els.modal.focus({ preventScroll: true });
  }

  function closeQuiz() {
    if (!els.overlay) return;
    els.overlay.classList.remove("clinicaQuizIsOpen");
    document.body.style.overflow = prevOverflow;
    answers = {}; // nada fica guardado
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }

  function onKey(e) {
    if (!els.overlay || !els.overlay.classList.contains("clinicaQuizIsOpen")) return;
    if (e.key === "Escape") { closeQuiz(); return; }
    if (e.key === "Tab") { // mantém o foco dentro do modal
      var f = els.modal.querySelectorAll("button, input, [href], [tabindex]:not([tabindex='-1'])");
      var vis = Array.prototype.filter.call(f, function (n) { return n.offsetParent !== null && !n.disabled; });
      if (!vis.length) return;
      var first = vis[0], last = vis[vis.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === els.modal)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-clinica-quiz-open]") : null;
    if (t) { e.preventDefault(); openQuiz(t); }
  });
})();
