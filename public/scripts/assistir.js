document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search)
    const idModulo = params.get('modulo')

    const dadosModulo = cursoData[idModulo]

    const tituloPrincipal = document.getElementById('class-title')
    const playerVideo = document.getElementById('video-player')
    const listaSidebar = document.getElementById('upcoming-classes')



    tituloPrincipal.innerText = `${dadosModulo.tituloModulo}`


});