document.addEventListener('DOMContentLoaded', async () => {
    const addForm = document.getElementById('add-form');
    const urlInput = document.getElementById('urlPattern');
    const nameInput = document.getElementById('envName');
    const typeInput = document.getElementById('indicationType');
    const colorInput = document.getElementById('envColor');
    const borderWidthInput = document.getElementById('borderWidth');
    const tbody = document.getElementById('env-tbody');
    const pagination = document.getElementById('pagination');
    const emptyState = document.getElementById('empty-state');

    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let environments = [];
    let editingIndex = null;

    // Check for auto-fill data from popup
    const localData = await chrome.storage.local.get('adding_url');
    if (localData.adding_url) {
        urlInput.value = localData.adding_url;
        await chrome.storage.local.remove('adding_url');
    }

    // Load environments
    const loadEnvs = async () => {
        const data = await chrome.storage.sync.get('environments');
        environments = data.environments || [];
        renderTable();
    };

    // Save environments
    const saveEnvs = async () => {
        await chrome.storage.sync.set({ environments });
    };

    // Get indication type label
    const getTypeLabel = (type) => {
        const labels = {
            'borda-completa': 'Borda Completa',
            'somente-topo': 'Somente Topo',
            'balao': 'Balão'
        };
        return labels[type] || type;
    };

    // Render table
    const renderTable = () => {
        tbody.innerHTML = '';

        if (environments.length === 0) {
            emptyState.classList.add('show');
            pagination.style.display = 'none';
            document.querySelector('.table-wrapper').style.display = 'none';
            return;
        }

        emptyState.classList.remove('show');
        document.querySelector('.table-wrapper').style.display = 'block';

        const totalPages = Math.ceil(environments.length / ITEMS_PER_PAGE);
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = environments.slice(start, end);

        pageItems.forEach((env, idx) => {
            const globalIndex = start + idx;
            const isEditing = editingIndex === globalIndex;

            const tr = document.createElement('tr');
            tr.dataset.index = globalIndex;

            if (isEditing) {
                tr.innerHTML = `
          <td>
            <input type="text" class="edit-input" id="edit-url" value="${env.urlPattern}">
          </td>
          <td>
            <input type="text" class="edit-input" id="edit-name" value="${env.name}">
          </td>
          <td>
            <select class="edit-select" id="edit-type">
              <option value="borda-completa" ${env.indicationType === 'borda-completa' ? 'selected' : ''}>Borda completa</option>
              <option value="somente-topo" ${env.indicationType === 'somente-topo' ? 'selected' : ''}>Somente Topo</option>
              <option value="balao" ${env.indicationType === 'balao' ? 'selected' : ''}>Balão</option>
            </select>
          </td>
          <td>
            <input type="color" class="edit-color" id="edit-color" value="${env.color}">
          </td>
          <td>
            <input type="text" class="edit-input" id="edit-border" value="${env.borderWidth}" style="width: 60px;">
          </td>
          <td>
            <div class="action-cell">
              <button class="action-btn save" data-action="save" title="Salvar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button class="action-btn delete" data-action="cancel" title="Cancelar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </td>
        `;
            } else {
                tr.innerHTML = `
          <td class="url-cell" title="${env.urlPattern}">${env.urlPattern}</td>
          <td>${env.name}</td>
          <td>${getTypeLabel(env.indicationType)}</td>
          <td><span class="color-bar" style="background-color: ${env.color}"></span></td>
          <td>${env.borderWidth}</td>
          <td>
            <div class="action-cell">
              <button class="action-btn edit" data-action="edit" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="action-btn delete" data-action="delete" title="Excluir">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        `;
            }

            tbody.appendChild(tr);
        });

        // Render pagination
        renderPagination(totalPages);

        // Attach event listeners
        attachRowListeners();
    };

    // Render pagination buttons
    const renderPagination = (totalPages) => {
        pagination.innerHTML = '';

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.classList.toggle('active', i === currentPage);
            btn.addEventListener('click', () => {
                currentPage = i;
                editingIndex = null;
                renderTable();
            });
            pagination.appendChild(btn);
        }
    };

    // Attach row event listeners
    const attachRowListeners = () => {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = btn.dataset.action;
                const row = btn.closest('tr');
                const index = parseInt(row.dataset.index);

                if (action === 'edit') {
                    editingIndex = index;
                    renderTable();
                } else if (action === 'cancel') {
                    editingIndex = null;
                    renderTable();
                } else if (action === 'save') {
                    // Save edited data
                    const newUrl = document.getElementById('edit-url').value.trim();
                    const newName = document.getElementById('edit-name').value.trim();
                    const newType = document.getElementById('edit-type').value;
                    const newColor = document.getElementById('edit-color').value;
                    const newBorder = document.getElementById('edit-border').value.trim();

                    if (newUrl && newName) {
                        environments[index] = {
                            urlPattern: newUrl,
                            name: newName,
                            indicationType: newType,
                            color: newColor,
                            borderWidth: newBorder || '5px'
                        };
                        await saveEnvs();
                        editingIndex = null;
                        renderTable();
                    }
                } else if (action === 'delete') {
                    environments.splice(index, 1);
                    await saveEnvs();

                    // Adjust current page if needed
                    const totalPages = Math.ceil(environments.length / ITEMS_PER_PAGE);
                    if (currentPage > totalPages && totalPages > 0) {
                        currentPage = totalPages;
                    }

                    renderTable();
                }
            });
        });
    };

    // Add form submit
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newEnv = {
            urlPattern: urlInput.value.trim(),
            name: nameInput.value.trim(),
            indicationType: typeInput.value,
            color: colorInput.value,
            borderWidth: borderWidthInput.value.trim() || '5px'
        };

        if (!newEnv.urlPattern || !newEnv.name || !newEnv.indicationType) {
            return;
        }

        environments.push(newEnv);
        await saveEnvs();

        // Reset form
        addForm.reset();
        colorInput.value = '#ef4444';
        borderWidthInput.value = '5px';

        // Go to last page
        currentPage = Math.ceil(environments.length / ITEMS_PER_PAGE);
        renderTable();
    });

    // Initial load
    loadEnvs();
});
