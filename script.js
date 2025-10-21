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
    const downloadAllZipBtn = document.getElementById('download-all-zip-btn');
    const selectedCountSpan = document.getElementById('selected-count');
    const totalCountSpan = document.getElementById('total-count');
    const downloadProgress = document.getElementById('download-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    let currentRepos = [];
    let selectedReposCount = 0;
    
    // Inicializar
    fetchBtn.addEventListener('click', fetchRepositories);
    selectAllBtn.addEventListener('click', selectAllRepos);
    deselectAllBtn.addEventListener('click', deselectAllRepos);
    downloadSelectedBtn.addEventListener('click', downloadSelectedReposIndividual);
    downloadAllZipBtn.addEventListener('click', downloadAllAsZip);
    
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
        downloadAllZipBtn.disabled = !hasSelectedRepos;
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
    
    function downloadSelectedReposIndividual() {
        const selectedRepos = getSelectedRepos();
        
        if (selectedRepos.length === 0) {
            showError('Por favor, selecciona al menos un repositorio');
            return;
        }
        
        // Abrir cada repositorio seleccionado en una nueva pestaña
        selectedRepos.forEach(repo => {
            const downloadUrl = `${repo.url}/archive/refs/heads/${repo.branch}.zip`;
            window.open(downloadUrl, '_blank');
        });
        
        // Mostrar mensaje de éxito
        showSuccessMessage(`Se abrieron ${selectedRepos.length} repositorios en pestañas nuevas`);
    }
    
    async function downloadAllAsZip() {
        const selectedRepos = getSelectedRepos();
        
        if (selectedRepos.length === 0) {
            showError('Por favor, selecciona al menos un repositorio');
            return;
        }
        
        if (selectedRepos.length > 20) {
            if (!confirm(`Vas a descargar ${selectedRepos.length} repositorios. Esto puede tomar varios minutos. ¿Continuar?`)) {
                return;
            }
        }
        
        showDownloadProgress();
        progressText.textContent = 'Iniciando descarga masiva...';
        
        const zip = new JSZip();
        const username = usernameInput.value.trim();
        let completed = 0;
        
        // Función para descargar un repositorio
        const downloadRepo = async (repo, index) => {
            try {
                progressText.textContent = `Descargando ${repo.name} (${index + 1}/${selectedRepos.length})...`;
                
                const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`${repo.url}/archive/refs/heads/${repo.branch}.zip`)}`);
                
                if (!response.ok) {
                    throw new Error(`Error al descargar ${repo.name}`);
                }
                
                const data = await response.json();
                
                // Convertir base64 a blob
                const binaryString = atob(data.contents);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Agregar al ZIP
                zip.file(`${repo.name}.zip`, bytes);
                
                completed++;
                const progress = (completed / selectedRepos.length) * 100;
                progressFill.style.width = `${progress}%`;
                
            } catch (error) {
                console.error(`Error descargando ${repo.name}:`, error);
                // Continuar con los siguientes repositorios
                completed++;
                const progress = (completed / selectedRepos.length) * 100;
                progressFill.style.width = `${progress}%`;
            }
        };
        
        // Descargar todos los repositorios en paralelo con límite de concurrencia
        const concurrencyLimit = 3;
        for (let i = 0; i < selectedRepos.length; i += concurrencyLimit) {
            const batch = selectedRepos.slice(i, i + concurrencyLimit);
            await Promise.all(batch.map((repo, batchIndex) => downloadRepo(repo, i + batchIndex)));
        }
        
        // Generar y descargar el ZIP final
        progressText.textContent = 'Generando archivo ZIP...';
        
        zip.generateAsync({ type: 'blob' })
            .then(function(content) {
                saveAs(content, `${username}-repositories.zip`);
                hideDownloadProgress();
                showSuccessMessage(`¡Descarga completada! Se descargaron ${selectedRepos.length} repositorios en un archivo ZIP.`);
            })
            .catch(error => {
                hideDownloadProgress();
                showError('Error al generar el archivo ZIP: ' + error.message);
            });
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
    
    function showDownloadProgress() {
        downloadProgress.classList.remove('hidden');
        progressFill.style.width = '0%';
    }
    
    function hideDownloadProgress() {
        downloadProgress.classList.add('hidden');
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
});