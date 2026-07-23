// Logique pour la page Contacts
(function() {
  let allContacts = [];
  let currentList = [];
  let editingContactId = null;
  let menuOpenContactId = null;
  let allGroups = [];
  let groupNameMap = {};
  let activeGroupFilter = '';
  let currentSearchText = '';
  let addingContact = false;

  // Initialisation
  async function init() {
    try {
      await loadContacts();
      await loadGroups();
      setupEventListeners();
      applyFilters();
    } catch (error) {
      console.error('Erreur init contacts:', error);
      showError('Impossible de charger les contacts');
    }
  }

  // Charger les contacts depuis Supabase
  async function loadContacts() {
    try {
      const client = supabaseClient.getClient();
      const user = authManager.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const { data, error } = await client
        .from('contacts')
        .select(`
          *,
          contact_groups (
            groups (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      allContacts = data.map(c => ({
        id: c.id,
        name: c.name,
        firstName: c.first_name,
        lastName: c.last_name,
        phones: c.phones || [],
        emails: c.emails || [],
        notes: c.notes,
        photo: c.photo_url,
        groups: c.contact_groups?.map(cg => cg.groups.id) || [],
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));

      logDebug(`${allContacts.length} contacts chargés`);
    } catch (error) {
      console.error('Erreur loadContacts:', error);
      throw error;
    }
  }

  // Charger les groupes
  async function loadGroups() {
    try {
      const client = supabaseClient.getClient();
      const user = authManager.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const { data, error } = await client
        .from('groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      allGroups = data;
      groupNameMap = {};
      allGroups.forEach(g => {
        groupNameMap[g.id] = g.name;
      });

      renderGroupDropdown();
    } catch (error) {
      console.error('Erreur loadGroups:', error);
      throw error;
    }
  }

  // Configuration des écouteurs d'événements
  function setupEventListeners() {
    // Recherche
    const searchInput = document.getElementById('contact-search');
    searchInput.addEventListener('input', (e) => {
      currentSearchText = e.target.value;
      applyFilters();
    });

    // Bouton nouveau contact
    const addBtn = document.getElementById('add-contact-btn');
    addBtn.addEventListener('click', () => {
      addingContact = !addingContact;
      renderNewContactForm();
    });

    // Liste des contacts
    const contactsList = document.getElementById('contacts-list');
    contactsList.addEventListener('click', handleContactListClick);
  }

  // Gérer les clics sur la liste
  function handleContactListClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    e.stopPropagation();
    const action = btn.getAttribute('data-action');
    const contactId = btn.getAttribute('data-contact-id');

    switch (action) {
      case 'menu-toggle':
        menuOpenContactId = menuOpenContactId === contactId ? null : contactId;
        renderContacts(currentList);
        break;
      case 'edit':
        menuOpenContactId = null;
        editingContactId = contactId;
        renderContacts(currentList);
        break;
      case 'cancel':
        editingContactId = null;
        renderContacts(currentList);
        break;
      case 'save':
        saveContact(contactId);
        break;
      case 'delete':
        deleteContact(contactId, btn.getAttribute('data-name'));
        break;
    }
  }

  // Appliquer les filtres
  function applyFilters() {
    const filter = currentSearchText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtered = allContacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(filter);
      const matchesGroup = !activeGroupFilter || c.groups.includes(activeGroupFilter);
      return matchesSearch && matchesGroup;
    });
    renderContacts(filtered);
  }

  // Afficher les contacts
  function renderContacts(list) {
    currentList = list;
    const container = document.getElementById('contacts-list');
    
    if (!list.length) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">Aucun contact trouvé.</p>';
      return;
    }

    container.innerHTML = list.map(c => {
      const isEditing = editingContactId === c.id;
      const initial = c.name.charAt(0).toUpperCase();
      const avatar = c.photo
        ? `<img src="${c.photo}" referrerpolicy="no-referrer" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
        : `<div style="width:44px;height:44px;border-radius:50%;background:var(--border-color);display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;">${initial}</div>`;

      if (isEditing) {
        return renderEditForm(c, avatar);
      }

      const groupNames = c.groups.map(g => groupNameMap[g]).filter(Boolean);
      const groupsLine = groupNames.length
        ? `<div>${groupNames.map(n => `<span class="group-badge">${escapeHtml(n)}</span>`).join('')}</div>`
        : '';
      const isMenuOpen = menuOpenContactId === c.id;

      const menuHtml = isMenuOpen
        ? `<div class="contact-menu">
            <button data-action="edit" data-contact-id="${c.id}">✏️ Modifier</button>
            <button class="danger" data-action="delete" data-contact-id="${c.id}" data-name="${escapeHtml(c.name)}">🗑️ Supprimer</button>
           </div>`
        : '';

      return `<div class="contact-item" style="display:flex; align-items:center; gap:15px; padding:12px 15px; border:1px solid var(--border-color); border-radius:10px; background: var(--card-bg);">
        ${avatar}
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600;">${escapeHtml(c.name)}</div>
          <div style="font-size:13px; color: var(--text-sub);">📞 ${c.phones.join(' / ') || '—'}</div>
          <div style="font-size:13px; color: var(--text-sub);">✉️ ${c.emails.join(' / ') || '—'}</div>
          ${c.notes ? `<div style="font-size:13px; color: var(--text-sub); margin-top:2px;">📝 ${escapeHtml(c.notes)}</div>` : ''}
          ${groupsLine}
        </div>
        <div class="contact-menu-wrap">
          <button class="contact-menu-btn" data-action="menu-toggle" data-contact-id="${c.id}">⋯</button>
          ${menuHtml}
        </div>
      </div>`;
    }).join('');
  }

  // Formulaire d'édition
  function renderEditForm(c, avatar) {
    return `<div class="contact-item" style="display:flex; align-items:flex-start; gap:15px; padding:12px 15px; border:1px solid var(--accent-color); border-radius:10px; background: var(--card-bg);">
      ${avatar}
      <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <input type="text" class="edit-firstname" placeholder="Prénom" value="${escapeHtml(c.firstName || '')}" style="flex:1; min-width:100px; padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:14px; box-sizing:border-box;">
          <input type="text" class="edit-lastname" placeholder="Nom" value="${escapeHtml(c.lastName || '')}" style="flex:1; min-width:100px; padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:14px; box-sizing:border-box;">
        </div>
        <input type="text" class="edit-phones" placeholder="Téléphone(s), séparés par une virgule" value="${c.phones.join(', ')}" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:13px; box-sizing:border-box;">
        <input type="text" class="edit-emails" placeholder="Email(s), séparés par une virgule" value="${c.emails.join(', ')}" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:13px; box-sizing:border-box;">
        <textarea class="edit-notes" placeholder="Notes" rows="2" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:13px; box-sizing:border-box; resize:vertical; font-family:inherit;">${escapeHtml(c.notes || '')}</textarea>
        <div style="display:flex; gap:8px; margin-top:2px;">
          <button class="btn-oval" style="padding:6px 18px; font-size:13px;" data-action="save" data-contact-id="${c.id}">💾 Enregistrer</button>
          <button class="btn-oval" style="padding:6px 18px; font-size:13px; background:transparent; color:var(--text-color); border:1px solid var(--border-color);" data-action="cancel">Annuler</button>
          <button class="btn-oval" style="padding:6px 18px; font-size:13px; margin-left:auto; background:transparent; color:#e74c3c; border:1px solid #e74c3c;" data-action="delete" data-contact-id="${c.id}" data-name="${escapeHtml(c.name)}">🗑️ Supprimer</button>
        </div>
      </div>
    </div>`;
  }

  // Formulaire nouveau contact
  function renderNewContactForm() {
    const wrap = document.getElementById('new-contact-form-wrap');
    if (!wrap) return;

    if (!addingContact) {
      wrap.innerHTML = '';
      return;
    }

    wrap.innerHTML = `
      <div class="contact-item" style="display:flex; align-items:flex-start; gap:15px; padding:12px 15px; border:1px solid var(--accent-color); border-radius:10px; background: var(--card-bg);">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--border-color);display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;">➕</div>
        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <input type="text" class="new-firstname" placeholder="Prénom" style="flex:1; min-width:100px; padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:14px; box-sizing:border-box;">
            <input type="text" class="new-lastname" placeholder="Nom" style="flex:1; min-width:100px; padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:14px; box-sizing:border-box;">
          </div>
          <input type="text" class="new-phones" placeholder="Téléphone(s), séparés par une virgule" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:13px; box-sizing:border-box;">
          <input type="text" class="new-emails" placeholder="Email(s), séparés par une virgule" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:13px; box-sizing:border-box;">
          <textarea class="new-notes" placeholder="Notes" rows="2" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); font-size:13px; box-sizing:border-box; resize:vertical; font-family:inherit;"></textarea>
          <div style="display:flex; gap:8px; margin-top:2px;">
            <button class="btn-oval new-save" style="padding:6px 18px; font-size:13px;">💾 Créer</button>
            <button class="btn-oval new-cancel" style="padding:6px 18px; font-size:13px; background:transparent; color:var(--text-color); border:1px solid var(--border-color);">Annuler</button>
          </div>
        </div>
      </div>
    `;

    wrap.querySelector('.new-save').addEventListener('click', createContact);
    wrap.querySelector('.new-cancel').addEventListener('click', () => {
      addingContact = false;
      renderNewContactForm();
    });
  }

  // Créer un contact
  async function createContact() {
    const wrap = document.getElementById('new-contact-form-wrap');
    const firstName = wrap.querySelector('.new-firstname').value.trim();
    const lastName = wrap.querySelector('.new-lastname').value.trim();
    const phones = wrap.querySelector('.new-phones').value.split(',').map(s => s.trim()).filter(Boolean);
    const emails = wrap.querySelector('.new-emails').value.split(',').map(s => s.trim()).filter(Boolean);
    const notes = wrap.querySelector('.new-notes').value.trim();

    if (!firstName && !lastName) {
      alert('Merci de renseigner au moins un prénom ou un nom.');
      return;
    }

    const name = `${firstName} ${lastName}`.trim();

    try {
      const client = supabaseClient.getClient();
      const user = authManager.getUser();

      const { data, error } = await client
        .from('contacts')
        .insert({
          user_id: user.id,
          name,
          first_name: firstName,
          last_name: lastName,
          phones,
          emails,
          notes
        })
        .select()
        .single();

      if (error) throw error;

      allContacts.push({
        id: data.id,
        name,
        firstName,
        lastName,
        phones,
        emails,
        notes,
        groups: []
      });

      allContacts.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      addingContact = false;
      renderNewContactForm();
      applyFilters();
      logDebug(`Contact créé: ${name}`);
    } catch (error) {
      console.error('Erreur création contact:', error);
      alert('Impossible de créer ce contact.');
    }
  }

  // Sauvegarder un contact
  async function saveContact(contactId) {
    const itemEl = document.querySelector(`[data-contact-id="${contactId}"]`).closest('.contact-item');
    const firstName = itemEl.querySelector('.edit-firstname').value.trim();
    const lastName = itemEl.querySelector('.edit-lastname').value.trim();
    const phones = itemEl.querySelector('.edit-phones').value.split(',').map(s => s.trim()).filter(Boolean);
    const emails = itemEl.querySelector('.edit-emails').value.split(',').map(s => s.trim()).filter(Boolean);
    const notes = itemEl.querySelector('.edit-notes').value.trim();

    const name = `${firstName} ${lastName}`.trim();

    try {
      const client = supabaseClient.getClient();

      const { data, error } = await client
        .from('contacts')
        .update({
          name,
          first_name: firstName,
          last_name: lastName,
          phones,
          emails,
          notes
        })
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      const idx = allContacts.findIndex(c => c.id === contactId);
      if (idx !== -1) {
        allContacts[idx] = {
          ...allContacts[idx],
          name,
          firstName,
          lastName,
          phones,
          emails,
          notes
        };
      }

      editingContactId = null;
      applyFilters();
      logDebug(`Contact mis à jour: ${name}`);
    } catch (error) {
      console.error('Erreur mise à jour contact:', error);
      alert('Impossible d\'enregistrer ce contact.');
    }
  }

  // Supprimer un contact
  async function deleteContact(contactId, name) {
    if (!confirm(`Supprimer définitivement "${name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const client = supabaseClient.getClient();

      const { error } = await client
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      allContacts = allContacts.filter(c => c.id !== contactId);
      currentList = currentList.filter(c => c.id !== contactId);
      renderContacts(currentList);
      logDebug(`Contact supprimé: ${name}`);
    } catch (error) {
      console.error('Erreur suppression contact:', error);
      alert('Impossible de supprimer ce contact.');
    }
  }

  // Dropdown des groupes
  function renderGroupDropdown() {
    const wrap = document.getElementById('group-dropdown-wrap');
    if (!wrap) return;

    const activeLabel = activeGroupFilter ? (groupNameMap[activeGroupFilter] || 'Groupe') : 'Tous les contacts';
    const btn = `<button type="button" class="group-dropdown-btn" data-action="filter-dropdown-toggle">🏷️ ${escapeHtml(activeLabel)} ▾</button>`;

    // Pour simplifier, on n'implémente pas le dropdown complet pour l'instant
    wrap.innerHTML = btn;
  }

  // Utilitaires
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function showError(message) {
    const container = document.getElementById('contacts-list');
    container.innerHTML = `<p style="text-align: center; color: #d93025;">${message}</p>`;
  }

  // Démarrage
  init();
})();
