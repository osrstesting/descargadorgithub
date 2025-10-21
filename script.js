document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const fetchBtn = document.getElementById('fetch-btn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const resultsDiv = document.getElementById('results');
    const userDisplay = document.getElementById('user-display');
    const reposList = document.getElementById('repos-list');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const downloadSelectedBtn = document.getElementById('download-selected-btn');
    const generateLinksBtn = document.getElementById('generate-links-btn');
    const selectedCountSpan = document.getElementById('selected-count');
    const totalCountSpan = document.getElementById('total-count');
    const linksSection = document.getElementById('links-section');
    const downloadLinks = document.getElementById('download-links');
    
    let currentRepos = [];
    let selectedReposCount = 0;
    
    // Inicializar
    fetchBtn.addEventListener('click', fetchRepositories);
    selectAllBtn.addEventListener('click', selectAllRepos);
    deselectAllBtn.addEventListener('click', deselectAllRepos);
    downloadSelectedBtn.addEventListener('click', downloadSelectedRepos);
    generateLinksBtn.addEventListener('click', generateDownloadLinks);
    
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchRepositories();
        }
    });
    
    function fetchRepositories() {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showError('Por favor, ingresa un nombre de usuario de GitHub');
            return;
        }
        
        // Limpiar resultados anteriores
        hideError();
        hideResults();
        hideLinksSection();
        showLoading();
        
        // Hacer la petición a la API de GitHub
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Usuario no encontrado');
                    } else if (response.status === 403) {
                        throw new Error('Límite de la API excedido. Intenta más tarde.');
                    } else {
                        throw new Error('Error al obtener los repositorios');
                    }
                }
                return response.json();
            })
            .then(repos => {
                hideLoading();
                if (repos.length === 0) {
                    showError('Este usuario no tiene repositorios públicos');
                } else {
                    currentRepos = repos;
                    displayRepositories(username, repos);
                }
            })
            .catch(error => {
                hideLoading();
                showError(error.message);
            });
    }
    
    function displayRepositories(username, repos) {
        userDisplay.textContent = username;
        reposList.innerHTML = '';
        selectedReposCount = repos.length;
        
        totalCountSpan.textContent = repos.length;
        selectedCountSpan.textContent = selectedReposCount;
        
        repos.forEach((repo, index) => {
            const repoItem = document.createElement('div');
            repoItem.className = 'repo-item';
            
            const repoInfo = document.createElement('div');
            repoInfo.className = 'repo-info';
            
            const repoCheckbox = document.createElement('input');
            repoCheckbox.type = 'checkbox';
            repoCheckbox.className = 'repo-checkbox';
            repoCheckbox.checked = true;
            repoCheckbox.dataset.repoUrl = repo.html_url;
            repoCheckbox.dataset.repoName = repo.name;
            repoCheckbox.dataset.repoBranch = repo.default_branch;
            repoCheckbox.addEventListener('change', updateSelectedCount);
            
            const repoDetails = document.createElement('div');
            repoDetails.className = 'repo-details';
            
            const repoName = document.createElement('div');
            repoName.className = 'repo-name';
            repoName.textContent = repo.name;
            
            const repoDescription = document.createElement('div');
            repoDescription.className = 'repo-description';
            repoDescription.textContent = repo.description || 'Sin descripción';
            
            const repoMeta = document.createElement('div');
            repoMeta.className = 'repo-meta';
            
            const stars = document.createElement('span');
            stars.innerHTML = `⭐ ${repo.stargazers_count}`;
            
            const forks = document.createElement('span');
            forks.innerHTML = `🔱 ${repo.forks_count}`;
            
            const language = document.createElement('span');
            language.innerHTML = `💻 ${repo.language || 'N/A'}`;
            
            repoMeta.appendChild(stars);
            repoMeta.appendChild(forks);
            repoMeta.appendChild(language);
            
            repoDetails.appendChild(repoName);
            repoDetails.appendChild(repoDescription);
            repoDetails.appendChild(repoMeta);
            
            repoInfo.appendChild(repoCheckbox);
            repoInfo.appendChild(repoDetails);
            
            const actions = document.createElement('div');
            actions.className = 'actions';
            
            const downloadBtn = document.createElement('a');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'Descargar ZIP';
            downloadBtn.href = `${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip`;
            downloadBtn.target = '_blank';
            
            actions.appendChild(downloadBtn);
            
            repoItem.appendChild(repoInfo);
            repoItem.appendChild(actions);
            
            reposList.appendChild(repoItem);
        });
        
        showResults();
        updateButtonStates();
    }
    
    function updateSelectedCount() {
        const selectedRepos = getSelectedRepos();
        selectedReposCount = selectedRepos.length;
        selectedCountSpan.textContent = selectedReposCount;
        updateButtonStates();
    }
    
    function updateButtonStates() {
        const hasSelectedRepos = selectedReposCount > 0;
        downloadSelectedBtn.disabled = !hasSelectedRepos;
        generateLinksBtn.disabled = !hasSelectedRepos;
    }
    
    function selectAllRepos() {
        const checkboxes = document.querySelectorAll('.repo-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        updateSelectedCount();
    }
    
    function deselectAllRepos() {
        const checkboxes = document.querySelectorAll('.repo-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSelectedCount();
    }
    
    function downloadSelectedRepos() {
        const selectedRepos = getSelectedRepos();
        
        if (selectedRepos.length === 0) {
            showError('Por favor, selecciona al menos un repositorio');
            return;
        }
        
        if (selectedRepos.length > 10) {
            showInstructions(`Se abrirán ${selectedRepos.length} pestañas. Si tu navegador las bloquea, permite ventanas emergentes para este sitio.`);
        }
        
        // Abrir cada repositorio seleccionado en una nueva pestaña
        selectedRepos.forEach((repo, index) => {
            setTimeout(() => {
                const downloadUrl = `${repo.url}/archive/refs/heads/${repo.branch}.zip`;
                window.open(downloadUrl, '_blank');
            }, index * 500); // Espaciar las descargas para evitar bloqueos
        });
        
        showSuccessMessage(`Iniciando descarga de ${selectedRepos.length} repositorios...`);
    }
    
    function generateDownloadLinks() {
        const selectedRepos = getSelectedRepos();
        
        if (selectedRepos.length === 0) {
            showError('Por favor, selecciona al menos un repositorio');
            return;
        }
        
        downloadLinks.innerHTML = '';
        
        // Crear enlaces de descarga directa
        selectedRepos.forEach(repo => {
            const downloadUrl = `${repo.url}/archive/refs/heads/${repo.branch}.zip`;
            
            const linkItem = document.createElement('div');
            linkItem.className = 'download-link-item';
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.textContent = `📦 ${repo.name}.zip`;
            link.target = '_blank';
            link.download = `${repo.name}.zip`;
            
            const fileInfo = document.createElement('span');
            fileInfo.className = 'file-size';
            fileInfo.textContent = 'Haz clic para descargar';
            
            linkItem.appendChild(link);
            linkItem.appendChild(fileInfo);
            
            downloadLinks.appendChild(linkItem);
        });
        
        showLinksSection();
        showSuccessMessage(`Se generaron ${selectedRepos.length} enlaces de descarga directa.`);
    }
    
    function getSelectedRepos() {
        const checkboxes = document.querySelectorAll('.repo-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => {
            return {
                name: checkbox.dataset.repoName,
                url: checkbox.dataset.repoUrl,
                branch: checkbox.dataset.repoBranch
            };
        });
    }
    
    function showSuccessMessage(message) {
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        resultsDiv.insertBefore(successDiv, reposList);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
    
    function showInstructions(message) {
        const existingInstructions = document.querySelector('.instructions');
        if (existingInstructions) {
            existingInstructions.remove();
        }
        
        const instructionsDiv = document.createElement('div');
        instructionsDiv.className = 'instructions';
        instructionsDiv.textContent = message;
        
        resultsDiv.insertBefore(instructionsDiv, reposList);
        
        setTimeout(() => {
            instructionsDiv.remove();
        }, 8000);
    }
    
    function showLoading() {
        loadingDiv.classList.remove('hidden');
        fetchBtn.disabled = true;
    }
    
    function hideLoading() {
        loadingDiv.classList.add('hidden');
        fetchBtn.disabled = false;
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    
    function hideError() {
        errorDiv.classList.add('hidden');
    }
    
    function showResults() {
        resultsDiv.classList.remove('hidden');
    }
    
    function hideResults() {
        resultsDiv.classList.add('hidden');
    }
    
    function showLinksSection() {
        linksSection.classList.remove('hidden');
    }
    
    function hideLinksSection() {
        linksSection.classList.add('hidden');
    }
});
