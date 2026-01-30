(function(){
  // Banner simples para informar que o usuário precisa logar novamente
  function createBanner() {
    if (document.getElementById('login-required-banner')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'login-required-banner';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.right = '0';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '9999';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'center';
    wrapper.style.padding = '12px';
    wrapper.style.background = 'linear-gradient(90deg,#c62828,#7b1f1f)';
    wrapper.style.color = 'white';
    wrapper.style.fontWeight = '600';
    wrapper.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';

    const text = document.createElement('span');
    text.textContent = 'Sua sessão expirou. Por favor, faça login novamente.';
    text.style.marginRight = '12px';

    const btn = document.createElement('button');
    btn.textContent = 'Ir para Login';
    btn.style.background = 'white';
    btn.style.color = '#7b1f1f';
    btn.style.border = '0';
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      window.location.href = '/login.html';
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = '0';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', hideBanner);

    wrapper.appendChild(text);
    wrapper.appendChild(btn);
    wrapper.appendChild(closeBtn);

    document.body.appendChild(wrapper);

    // for small screens, ensure content doesn't hide page
    document.body.style.paddingTop = '56px';
  }

  function hideBanner(){
    const el = document.getElementById('login-required-banner');
    if (el) el.remove();
    // restore padding-top
    document.body.style.paddingTop = '';
  }

  window.showLoginBanner = createBanner;
  window.hideLoginBanner = hideBanner;
})();
