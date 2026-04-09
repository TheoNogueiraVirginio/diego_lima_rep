document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    try {
        const response = await fetch('/api/enrollment/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, pass })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('nomeAluno', data.userName);
            localStorage.setItem('userStatus', data.status);
            localStorage.setItem('userEmail', email);
            window.location.href = "/modulos";
        } else {
            alert(data.error);
        }

    } catch (error) {
        alert("Erro de conexão com o servidor.");
    }
});