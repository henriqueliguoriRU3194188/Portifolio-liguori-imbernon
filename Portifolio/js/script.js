/* =====================================================================
   PORTFÓLIO — Henrique Liguori Imbernon (RU 3194188)
   Script responsável por:
   1. Alternância de tema claro/escuro (com memória via localStorage)
   2. Menu responsivo (abrir/fechar em telas pequenas)
   3. Validação e simulação de envio do formulário de contato
   4. Fechamento automático do menu ao clicar em um link (âncora)
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------
     1. TEMA CLARO / ESCURO
     Guarda a preferência do usuário em localStorage. Se o navegador
     bloquear o acesso (ex.: modo privado), o site continua funcionando
     normalmente, apenas sem lembrar a escolha entre visitas.
  ----------------------------------------------------------------*/
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  function getSavedTheme() {
    try {
      return localStorage.getItem('ue-theme');
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem('ue-theme', theme);
    } catch (e) {
      /* Armazenamento indisponível: a preferência não será lembrada,
         mas isso não impede o uso do site. */
    }
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      themeToggle.setAttribute('aria-pressed', 'true');
    } else {
      root.removeAttribute('data-theme');
      themeToggle.setAttribute('aria-pressed', 'false');
    }
  }

  // Aplica tema salvo, ou respeita a preferência do sistema operacional
  const savedTheme = getSavedTheme();
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  }

  themeToggle.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    applyTheme(newTheme);
    saveTheme(newTheme);
  });

  /* ---------------------------------------------------------------
     2. MENU RESPONSIVO (mobile)
  ----------------------------------------------------------------*/
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Fecha o menu automaticamente ao navegar para uma seção (âncora)
  mainNav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------------------------------------------------------------
     3. FORMULÁRIO DE CONTATO — validação e envio real por e-mail
     Utiliza a API pública do Web3Forms (https://web3forms.com) via
     fetch() nativo do navegador — sem bibliotecas ou frameworks.
     O e-mail chega diretamente na caixa de entrada configurada na
     Access Key (ver campo oculto "access_key" no HTML).
  ----------------------------------------------------------------*/
  const form = document.getElementById('contactForm');
  const modal = document.getElementById('confirmModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const btnEnviar = document.getElementById('btnEnviar');
  const erroEnvio = document.getElementById('erroEnvio');

  const campos = {
    nome: {
      input: document.getElementById('nome'),
      erro: document.getElementById('erroNome'),
    },
    email: {
      input: document.getElementById('email'),
      erro: document.getElementById('erroEmail'),
    },
    mensagem: {
      input: document.getElementById('mensagem'),
      erro: document.getElementById('erroMensagem'),
    },
  };

  // Expressão regular simples para validar formato de e-mail (usuario@dominio.com)
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function marcarErro(campo, mensagem) {
    campo.input.closest('.form-field').classList.add('has-error');
    campo.erro.textContent = mensagem;
  }

  function limparErro(campo) {
    campo.input.closest('.form-field').classList.remove('has-error');
    campo.erro.textContent = '';
  }

  function validarFormulario() {
    let valido = true;

    // Nome: obrigatório
    if (campo_vazio(campos.nome.input.value)) {
      marcarErro(campos.nome, 'Informe seu nome.');
      valido = false;
    } else {
      limparErro(campos.nome);
    }

    // E-mail: obrigatório e formato válido
    if (campo_vazio(campos.email.input.value)) {
      marcarErro(campos.email, 'Informe seu e-mail.');
      valido = false;
    } else if (!REGEX_EMAIL.test(campos.email.input.value.trim())) {
      marcarErro(campos.email, 'Informe um e-mail válido (ex.: usuario@dominio.com).');
      valido = false;
    } else {
      limparErro(campos.email);
    }

    // Mensagem: obrigatória
    if (campo_vazio(campos.mensagem.input.value)) {
      marcarErro(campos.mensagem, 'Escreva uma mensagem.');
      valido = false;
    } else {
      limparErro(campos.mensagem);
    }

    return valido;
  }

  function campo_vazio(valor) {
    return valor.trim().length === 0;
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // Controlamos o envio via JavaScript (fetch), não recarrega a página

    erroEnvio.textContent = '';

    if (!validarFormulario()) {
      return;
    }

    const accessKey = document.getElementById('accessKey').value;
    if (!accessKey || accessKey === 'COLE_AQUI_SUA_ACCESS_KEY') {
      erroEnvio.textContent = 'Configuração pendente: adicione sua Access Key do Web3Forms no HTML.';
      return;
    }

    // Trava o botão para evitar múltiplos envios enquanto a requisição está em andamento
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    try {
      const resposta = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: 'Nova mensagem pelo portfólio',
          from_name: campos.nome.input.value.trim(),
          name: campos.nome.input.value.trim(),
          email: campos.email.input.value.trim(),
          message: campos.mensagem.input.value.trim(),
        }),
      });

      const resultado = await resposta.json();

      if (resultado.success) {
        form.reset();
        Object.values(campos).forEach(limparErro);
        abrirModal();
      } else {
        erroEnvio.textContent = 'Erro: ' + (resultado.message || 'não foi possível enviar sua mensagem.');
        console.error('Resposta do Web3Forms:', resultado); // Ajuda a depurar durante os testes
      }
    } catch (erro) {
      // Falha de rede/conexão
      erroEnvio.textContent = 'Falha de conexão. Verifique sua internet e tente novamente.';
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar mensagem';
    }
  });

  function abrirModal() {
    modal.hidden = false;
  }

  function fecharModal() {
    modal.hidden = true;
  }

  modalCloseBtn.addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal(); // Fecha ao clicar fora da caixa
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modal.hidden) fecharModal();
  });

  /* ---------------------------------------------------------------
     4. ANO ATUAL NO RODAPÉ
  ----------------------------------------------------------------*/
  document.getElementById('anoAtual').textContent = new Date().getFullYear();
});
