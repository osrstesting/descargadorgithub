document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const generateBtn = document.getElementById('generate-btn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const checkReleaseBtn = document.getElementById('check-release-btn');
    
    // Botones de usuarios ejemplo
    document.querySelectorAll('.user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            usernameInput.value = this.dataset.user;
        });
    });
    
    generateBtn.addEventListener('click', generateZip);
    checkReleaseBtn.addEventListener('click', checkReleases);
    
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateZip();
        }
    });
    
    async function generateZip() {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showError('Por favor, ingresa un nombre de usuario de GitHub');
            return;
        }
        
        // Validar formato de usuario
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            showError('El nombre de usuario contiene caracteres inválidos');
            return;
        }
        
        hideError();
        hideResult();
        showLoading();
        generateBtn.disabled = true;
        
        try {
            // Verificar que el usuario existe
            const userResponse = await fetch(`https://api.github.com/users/${username}`);
            if (!userResponse.ok) {
                throw new Error('Usuario de GitHub no encontrado');
            }
            
            // Verificar que tiene repositorios
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=1`);
            const repos = await reposResponse.json();
            
            if (repos.length === 0) {
                throw new Error('Este usuario no tiene repositorios públicos');
            }
            
            // Crear un release usando GitHub API
            await createGitHubRelease(username);
            
        } catch (error) {
            hideLoading();
            generateBtn.disabled = false;
            showError(error.message);
        }
    }
    
    async function createGitHubRelease(username) {
        // Esta función simula la creación de un release
        // En un caso real, necesitarías un backend o GitHub App
        
        // Simulamos el proceso
        setTimeout(() => {
            hideLoading();
            showResult();
            generateBtn.disabled = false;
            
            // Mostrar instrucciones específicas
            const downloadInfo = document.getElementById('download-info');
            downloadInfo.innerHTML = `
                <p><strong>Para completar la descarga:</strong></p>
                <ol>
                    <li>Ve a la <a href="https://github.com/TU-USUARIO/TU-REPOSITORIO/releases" target="_blank">página de Releases</a></li>
                    <li>Busca el release llamado "repos-${username}"</li>
                    <li>Descarga el archivo ZIP adjunto</li>
                </ol>
                <p><em>Nota: Necesitas configurar el workflow de GitHub Actions primero</em></p>
            `;
        }, 2000);
    }
    
    function checkReleases() {
        window.open('https://github.com/TU-USUARIO/TU-REPOSITORIO/releases', '_blank');
    }
    
    function showLoading() {
        loadingDiv.classList.remove('hidden');
    }
    
    function hideLoading() {
        loadingDiv.classList.add('hidden');
    }
    
    function showResult() {
        resultDiv.classList.remove('hidden');
    }
    
    function hideResult() {
        resultDiv.classList.add('hidden');
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    
    function hideError() {
        errorDiv.classList.add('hidden');
    }
});
