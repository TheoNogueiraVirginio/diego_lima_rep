function carregarNavbar() {
    // 1. O HTML da sua Navbar (Copiado do seu código)
    const navbarHTML = `
    <nav class="navbar">
        <div class="diego">
            <img src="images/logo_diego.png" class="logo" alt="">
            <h3 style="color: white; margin-left: 20px; font-weight: 700; font-size: 24px;">Diego Lima Matemática</h3>
        </div>
        
        <div class="pgs">
            <a href="/videoaulas.html">Videoaulas</a>
            <a href="/simulados.html">Simulados</a>
            <a href="/informes.html">Informes</a>
        </div>

        <div class="user">
            <img src="images/white_user.png" alt="" class="logo" style="margin-right: 20px;">
        </div>
    </nav> `;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    destacarPaginaAtual();
}


function destacarPaginaAtual() {
    const caminhoAtual = window.location.pathname
    const links = document.querySelectorAll('.pgs a')

    links.forEach(link => {
        // Pega o href do link (ex: /simulados.html)
        // O atributo getAttribute é melhor aqui para pegar o valor exato escrito no HTML
        const linkPath = link.getAttribute('href');

        // Verifica se a URL atual contém o link (ou é exatamente igual)
        if (caminhoAtual.includes(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        } 
        // Caso especial para a Home se for apenas barra '/'
        else if (caminhoAtual === '/' && linkPath === '/') {
            link.classList.add('active')
        }
    });


    if (caminhoAtual === '/assistir.html') {
        links.forEach(link => link.classList.remove('active'));

        const videoaulasLink = document.querySelector('a[href="/videoaulas.html"]');
        videoaulasLink.classList.add('active');
    };
}


document.addEventListener('DOMContentLoaded', carregarNavbar);