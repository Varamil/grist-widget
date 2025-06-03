// ========== CONFIGURATION DU KANBAN ==========
/* Configuration des colonnes du kanban
   Vous pouvez modifier ces paramètres selon vos besoins :
   - id : identifiant unique de la colonne (conservez les émojis)
   - libelle : texte affiché en haut de la colonne
   - classe : nom CSS utilisé pour le style (doit correspondre au CSS)
*/
const COLONNES_AFFICHAGE_DEFAUT = [
    { id: '🖐️ À faire', libelle: 'À faire', classe: 'a-faire', couleur: '#f95c5e', btajout: true, isdone: false, useconfetti: false },
    { id: '♻️ En cours', libelle: 'En cours', classe: 'en-cours', couleur: '#417DC4', btajout: false, isdone: false, useconfetti: false },
    { id: '✅ Fait', libelle: 'Fait', classe: 'fait', couleur: '#27a658', btajout: false, isdone: true, useconfetti: true },
    { id: '❌ Annulé', libelle: 'Annulé', classe: 'annule', couleur: '#301717', btajout: false, isdone: true, useconfetti: false }
  ];
let COLONNES_AFFICHAGE;
let TABLE_KANBAN;
let COLONNES_MAP;
let PERSONNES;
let PERSONNES_RAW;
let TYPES;
let TYPES_RAW;

  // ========== FONCTIONS UTILITAIRES ==========
  /* Gestion du repli/dépli des colonnes */
  function toggleColonne(colonne, e) {
    e?.stopPropagation();
    colonne.classList.toggle('collapsed');
    localStorage.setItem(`column-todo-${colonne.querySelector('.titre-statut').textContent.trim()}`, colonne.classList.contains('collapsed'));
  }
  
  /* Fonction pour déclencher l'animation de confettis */
  function triggerConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
  
    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }
  
    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
  
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
  
      const particleCount = 50 * (timeLeft / duration);
      
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }));
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }));
    }, 250);
  }
  
  /* Mise à jour d'un champ dans Grist */
  async function mettreAJourChamp(todoId, champ, valeur, e) {
    try {
      e?.stopPropagation();
      // Déclencher les confettis si on passe en "Fait"
      if (champ === COLONNES_MAP.STATUT) {
        const infoColonne = COLONNES_AFFICHAGE.find((colonne) => {return colonne.id === valeur});
        if (infoColonne && infoColonne.useconfetti)
          triggerConfetti();
      }
      await grist.docApi.applyUserActions([
        ['UpdateRecord', TABLE_KANBAN, parseInt(todoId), {
          [champ]: valeur,
          [COLONNES_MAP.DERNIERE_MISE_A_JOUR]: new Date().toISOString()
        }]
      ]);
    } catch (erreur) {
      console.error('Erreur mise à jour:', erreur);
    }
  }
  
  /* Formatage des dates */
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }
  
  /* Formatage des dates pour les champs input */
  function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return '';
    }
  }
  
  // ========== CRÉATION DES CARTES ET COLONNES ==========
  /* Création d'une carte TODO */
  function creerCarteTodo(todo) {
    const carte = document.createElement('div');
    carte.className = 'carte';
    carte.setAttribute('data-todo-id', todo.id);
    carte.setAttribute('data-last-update', todo[COLONNES_MAP.DERNIERE_MISE_A_JOUR] || '');
  
    const type = todo[COLONNES_MAP.TYPE] || '';
    const description = todo[COLONNES_MAP.DESCRIPTION] || 'Sans titre';
    const deadline = todo[COLONNES_MAP.DEADLINE] ? formatDate(todo[COLONNES_MAP.DEADLINE]) : '';
    const responsable = todo[COLONNES_MAP.RESPONSABLE] || '';
    const projetRef = todo[COLONNES_MAP.REFERENCE_PROJET];
    const infoColonne = COLONNES_AFFICHAGE.find((colonne) => {return colonne.id === todo[COLONNES_MAP.STATUT]});

    carte.innerHTML = `
      ${projetRef && projetRef !== 0 ? `<div class="projet-ref">#${projetRef}</div>` : ''}
      ${type ? `<div class="type-tag">${type}</div>` : ''}
      <div class="description">${description}</div>
      ${deadline ? `<div class="deadline">📅 ${deadline}</div>` : ''}
      ${responsable ? `<div class="responsable-badge">${responsable}</div>` : ''}
      ${infoColonne.isdone ? `<div class="tampon-termine">${todo[COLONNES_MAP.STATUT]}</div>` : ''}      
    `;
  
    carte.addEventListener('click', () => togglePopupTodo(todo));
    return carte;
  }
  
  /* Création d'une colonne */
  function creerColonneKanban(colonne) {
    const colonneElement = document.createElement('div');
    colonneElement.className = `colonne-kanban ${colonne.btajout? '': 'colonne-nobouton'}`;
    
    const savedState = localStorage.getItem(`column-todo-${colonne.libelle}`);
    if (savedState === 'true') {
      colonneElement.classList.add('collapsed');
    }
  
    colonneElement.innerHTML = `
      <div class="entete-colonne" style="background-color: ${colonne.couleur}">
        <div class="titre-statut">${colonne.libelle} <span class="compteur-colonne">(0)</span></div>
        <button class="bouton-toggle" onclick="toggleColonne(this.closest('.colonne-kanban'), event)">⇄</button>
      </div>
      ${(colonne.btajout && TABLE_KANBAN !== "-") ? `
        <button class="bouton-ajouter" onclick="creerNouvelleTache('${colonne.id}')">+ Ajouter une tâche</button>
      ` : ''}
      <div class="contenu-colonne" data-statut="${colonne.id}"></div>
    `;
  
    return colonneElement;
  }
  
  /* Mise à jour des compteurs */
  function mettreAJourCompteur(colonne) {
    const contenu = colonne.querySelector('.contenu-colonne');
    const compteur = colonne.querySelector('.compteur-colonne');
    if (contenu && compteur) {
      compteur.textContent = `(${contenu.children.length})`;
    }
  }
  
  /* Tri des cartes */
  function trierTodo(conteneur) {
    const cartes = Array.from(conteneur.children);
    const colonne = conteneur.dataset.isdone;
    
    cartes.sort((a, b) => {
      if (colonne) {
        // Pour les colonnes Fait et Annulé, tri par date de dernière mise à jour
        const dateA = a.getAttribute('data-last-update') || '1970-01-01';
        const dateB = b.getAttribute('data-last-update') || '1970-01-01';
        return new Date(dateB) - new Date(dateA); // Plus récent en premier
      } else {
        // Pour les autres colonnes, tri par deadline
        const dateA = a.querySelector('.deadline')?.textContent?.replace('📅 ', '') || '9999-12-31';
        const dateB = b.querySelector('.deadline')?.textContent?.replace('📅 ', '') || '9999-12-31';
        return new Date(dateA) - new Date(dateB); // Plus urgent en premier
      }
    });
    
    cartes.forEach(carte => conteneur.appendChild(carte));
  }
  
  // ========== GESTION DU POPUP ==========
  /* Affichage et gestion du popup */
  function togglePopupTodo(todo) {
    const popup = document.getElementById('popup-todo');
    const currentId = popup.dataset.currentTodo;
    const carteActive = document.querySelector('.carte.active');
    const carteCliquee = document.querySelector(`[data-todo-id="${todo.id}"]`);
    const infoColonne = COLONNES_AFFICHAGE.find((colonne) => {return colonne.id === todo[COLONNES_MAP.STATUT]});
    
    if (TABLE_KANBAN === "-" || popup.classList.contains('visible') && currentId === todo.id.toString()) {
      fermerPopup();
      return;
    }
  
    if (carteActive) {
      carteActive.classList.remove('active');
    }
    
    if (carteCliquee) {
      carteCliquee.classList.add('active');
    }
    
    popup.style = `border-left-color: ${infoColonne? infoColonne.couleur: '#009058'}`;

    popup.dataset.statut = todo[COLONNES_MAP.STATUT];
    popup.dataset.isdone = infoColonne? false : infoColonne.isdone;
    popup.dataset.currentTodo = todo.id;
    
    const popupTitle = popup.querySelector('.popup-title');
    const content = popup.querySelector('.popup-content');
    const popupheader = popup.querySelector('.popup-header');
    popupheader.style = `background-color: ${infoColonne? infoColonne.couleur: '#009058'}`;
    
    popupTitle.textContent = todo[COLONNES_MAP.DESCRIPTION] || 'Nouvelle tâche';
    
    let form = "";
    form = `
      <div class="field-row">
        <div class="field">
          <label class="field-label">Référence Projet</label>
          <input type="text" class="field-input" value="${todo[COLONNES_MAP.REFERENCE_PROJET] || ''}" 
                 onchange="mettreAJourChamp(${todo.id}, '${[COLONNES_MAP.REFERENCE_PROJET]}', this.value, event)">
        </div>
        <div class="field">
          <label class="field-label">Date limite</label>
          <input type="date" class="field-input" 
                 value="${formatDateForInput(todo[COLONNES_MAP.DEADLINE])}"
                 onchange="mettreAJourChamp(${todo.id}, '${COLONNES_MAP.DEADLINE}', this.value, event)">
        </div>
      </div>
  
      <div class="field-row">
    `;
    
    if (COLONNES_MAP.TYPE && TYPES?.length > 0) {
      form += `
          <div class="field">
            <label class="field-label">Type</label>
            <select class="field-select" onchange="mettreAJourChamp(${todo.id}, '${COLONNES_MAP.TYPE}', this.value, event)">`;
      TYPES.forEach(element => {
        form += `<option value="${element}" ${todo[COLONNES_MAP.TYPE] === element ? 'selected' : ''}>${element}</option>`;  
      });
      form += `</select>
          </div>        
      `;
    }
    if (COLONNES_MAP.RESPONSABLE && PERSONNES?.length > 0) {
      form += `
          <div class="field">
            <label class="field-label">Responsable</label>
            <select class="field-select" onchange="mettreAJourChamp(${todo.id}, '${COLONNES_MAP.RESPONSABLE}', this.value, event)">`;
      PERSONNES.forEach(element => {
        form += `<option value="${element}" ${todo[COLONNES_MAP.RESPONSABLE] === element ? 'selected' : ''}>${element}</option>`;  
      });
      form += `</select>
          </div>        
      `;
    }
    form += `
      </div>
      <div class="field">
        <label class="field-label">Description</label>
        <textarea class="field-textarea auto-expand" 
                  onchange="mettreAJourChamp(${todo.id}, '${COLONNES_MAP.DESCRIPTION}', this.value, event)"
                  oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'">${todo[COLONNES_MAP.DESCRIPTION] || ''}</textarea>
      </div>
    `;
    if (COLONNES_MAP.NOTES) {
      form += `  
        <div class="field">
          <label class="field-label">Notes</label>
          <textarea class="field-textarea auto-expand" 
                    onchange="mettreAJourChamp(${todo.id}, '${COLONNES_MAP.NOTES}', this.value, event)"
                    oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'">${todo[COLONNES_MAP.NOTES] || ''}</textarea>
        </div>
      `;
    }
    if (COLONNES_MAP.CREE_LE || COLONNES_MAP.CREE_PAR) {
      form += ` 
        <div class="info-creation">
          Créé ${COLONNES_MAP.CREE_LE ? 'le ' + formatDate(todo[COLONNES_MAP.CREE_LE]): ''} ${COLONNES_MAP.CREE_PAR ? 'par ' + (todo[COLONNES_MAP.CREE_PAR] || '-'):''}
        </div>
      `;
    }    

    if (TABLE_KANBAN !== "-") {
      form += ` 
        <div class="popup-actions">
          <button class="popup-action-button bouton-supprimer" onclick="supprimerTodo(${todo.id}, event)" 
                  title="Supprimer la tâche">🗑️</button>
        </div>
      `;
    }
    content.innerHTML = form;

    // Initialisation des champs auto-expandables
    setTimeout(() => {
      const textareas = document.querySelectorAll('.auto-expand');
      textareas.forEach(textarea => {
        textarea.style.height = '';
        textarea.style.height = textarea.scrollHeight + 'px';
      });
    }, 0);
  
    popup.classList.add('visible');
  }
  
  /* Fermeture du popup */
  function fermerPopup() {
    const popup = document.getElementById('popup-todo');
    const todoId = popup.dataset.currentTodo;
    const carteActive = document.querySelector(`[data-todo-id="${todoId}"]`);
    if (carteActive) {
      carteActive.classList.remove('active');
    }
    popup.classList.remove('visible');
  }
  
  // ========== GESTION DES TÂCHES ==========
  /* Création d'une nouvelle tâche */
  async function creerNouvelleTache(colonneId) {
    try {
      let data = {[COLONNES_MAP.DESCRIPTION]: 'Nouvelle tâche', [COLONNES_MAP.STATUT]: colonneId};
      if (COLONNES_MAP.TYPE) data[COLONNES_MAP.TYPE] = '';
      if (COLONNES_MAP.REFERENCE_PROJET) data[COLONNES_MAP.REFERENCE_PROJET] = null;
      if (COLONNES_MAP.DERNIERE_MISE_A_JOUR) data[COLONNES_MAP.DERNIERE_MISE_A_JOUR] = new Date().toISOString();
      if (COLONNES_MAP.CREE_LE) data[COLONNES_MAP.CREE_LE] = new Date().toISOString();

      const res = await grist.docApi.applyUserActions([
        ['AddRecord', TABLE_KANBAN, null, data]
      ]);
      if (res.retValues && res.retValues.length > 0) {
        const rec = await grist.fetchSelectedRecord(res.retValues[0]);
        togglePopupTodo(rec);
      }
    } catch (erreur) {
      console.error('Erreur création:', erreur);
    }
  }
  
  /* Suppression d'une tâche */
  async function supprimerTodo(todoId, e) {
    e?.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await grist.docApi.applyUserActions([
          ['RemoveRecord', TABLE_KANBAN, parseInt(todoId)]
        ]);
        fermerPopup();
      } catch (erreur) {
        console.error('Erreur suppression:', erreur);
      }
    }
  }
  
  // ========== AFFICHAGE PRINCIPAL ==========
  /* Fonction principale d'affichage du kanban */
  function afficherKanban(todos) {
    const conteneurKanban = document.getElementById('conteneur-kanban');
    conteneurKanban.innerHTML = '';
  
    // Création des colonnes
    COLONNES_AFFICHAGE.forEach(colonneConfig => {
      const colonne = creerColonneKanban(colonneConfig);
      conteneurKanban.appendChild(colonne);
    });
  
    // Distribution des tâches dans les colonnes
    if (todos?.length > 0) {
      todos.forEach(todo => {
        const carte = creerCarteTodo(todo);
        const conteneurCartes = document.querySelector(`.contenu-colonne[data-statut="${todo[COLONNES_MAP.STATUT]}"]`);
        if (conteneurCartes) {
          // Insertion au début de la colonne
          conteneurCartes.insertBefore(carte, conteneurCartes.firstChild);
        }
      });
  
      // Configuration du drag & drop et mise à jour des compteurs
      if(TABLE_KANBAN !== "-") {
        document.querySelectorAll('.contenu-colonne').forEach(colonne => {
          // Configuration de Sortable pour le drag & drop
          new Sortable(colonne, {
            group: 'kanban-todo',
            animation: 150,
            onEnd: async function(evt) {
              const todoId = evt.item.dataset.todoId;
              const colonneArrivee = evt.to.dataset.statut;
              try {
                await mettreAJourChamp(todoId, COLONNES_MAP.STATUT, colonneArrivee);
              } catch (erreur) {
                console.error('Erreur mise à jour statut:', erreur);
              }
            }
          });
    
          // Tri des cartes dans chaque colonne
          trierTodo(colonne);
        });
      }      
  
      // Mise à jour des compteurs
      document.querySelectorAll('.colonne-kanban').forEach(mettreAJourCompteur);
    }
  }
  
  // ========== GESTION DE LA CONFIGURATION ==========
  /* Affichage de la configuration */
  function ShowConfig(show) {
    const popup = document.getElementById('popup-todo');
    const kanban = document.getElementById('conteneur-kanban');
    const config = document.getElementById('config-kanban');

    if (show) {
      popup.classList.remove('visible');
      kanban.classList.remove('visible');
      config.classList.add('visible');

      const liste_table = document.getElementById('liste-table');
      grist.docApi.listTables().then(tables => {
        liste_table.innerHTML = '<option value="">-</option>';
        tables.forEach(element => {
          liste_table.innerHTML += `<option value="${element}" ${element === TABLE_KANBAN ? 'selected' : ''}>${element}</option>`;
        });
      });

      document.getElementById('liste-colonnes').value = JSON.stringify(COLONNES_AFFICHAGE);

      document.getElementById('liste-personnes').value = PERSONNES_RAW;
      document.getElementById('liste-types').value = TYPES_RAW;

    } else {
      popup.classList.remove('visible');
      kanban.classList.add('visible');
      config.classList.remove('visible');
    }
  }

  /* Ferme la page de configuration et affiche e kanban */
  function closeConfig() {
    ShowConfig(false);
  }

  /* Sauvegarde des options du widget */
  async function saveOption() {
    try {
      TABLE_KANBAN = document.getElementById("liste-table").value;
      grist.widgetApi.setOption('table', TABLE_KANBAN);
      
      const colonnes = document.getElementById("liste-colonnes").value;
      if (!colonnes || colonnes.trim().length === 0) 
        COLONNES_AFFICHAGE = COLONNES_AFFICHAGE_DEFAUT;
      else
        COLONNES_AFFICHAGE = JSON.parse(colonnes);
      
      grist.widgetApi.setOption('colonnes', COLONNES_AFFICHAGE);

      PERSONNES_RAW = document.getElementById('liste-personnes').value;
      grist.widgetApi.setOption('personnes', PERSONNES_RAW);
      PERSONNES = await getLookUpData(PERSONNES_RAW);

      TYPES_RAW = document.getElementById('liste-types').value;
      grist.widgetApi.setOption('types', TYPES_RAW);
      TYPES = await getLookUpData(TYPES_RAW);      
    } catch (erreur) {console.error('Erreur sauvegarde des options:', erreur);}
  }

  /* Gère la conversion d'une référence ou d'une liste en tableau */
  async function getLookUpData(target) {
    //On gère les chaînes vides
    if (!target || target.trim().length === 0) {
      return [];
  }
    else if (target.startsWith("$")) {
      target = target.substring(1); //On supprime le $ au début
      let data = target.split(".");
      if (data.length === 1) {
        //Juste une référence de table fournie => 1ère colonne utilisée
        let records = await grist.docApi.fetchTable(data[0]);
        let colonne = Object.keys(records || {}).filter(k => k !== 'id' && k !== 'manualSort');          
        if (colonne.length > 0)
          return [""].concat(records[colonne[0]].filter(item => item.length > 0));
        else
          return [];
      } else if (data.length > 1) {
        //Une référence + une colonne fournie
        let records = await grist.docApi.fetchTable(data[0]);
        records = records[data[1]];
        if (records)
          return [""].concat(records.filter(item => item.length > 0));
        else
          return [];
      } else {
        return [target];
      }
    } else {
      return target.split(";");
    }    
  }


  // ========== INITIALISATION ET ÉVÉNEMENTS ==========
  /* Configuration initiale de Grist */
  grist.ready({
    requiredAccess: 'full',
    columns: [
      {name:'TYPE', title:'Type de tâche', type:'Any', optional:true}, 
      {name:'DESCRIPTION', title:'Description tâche', type:'Any'}, 
      {name:'DEADLINE', title:'Date cible', type:'Date'}, 
      {name:'STATUT', title:'Statut tâche', type:'Any'},
      {name:'REFERENCE_PROJET', title:'Référence associée', type:'Any'},
      {name:'NOTES', title:'Notes complémentaires', type:'Any', optional:true}, 
      {name:'RESPONSABLE', title:'Tâche assignée à', type:'Any', optional:true}, 
      {name:'CREE_PAR', title:'Tâche créée par', type:'Any', optional:true}, 
      {name:'CREE_LE', title:'Tâche créée le', type:'DateTime', optional:true}, 
      {name:'DERNIERE_MISE_A_JOUR', title:'Mis à jour le', type:'DateTime'}
    ],
    onEditOptions() {
      ShowConfig(true);
    },
  });

  /* Chargement des options du widget */
  grist.onOptions(async function(customOptions, _) {
    customOptions = customOptions || {};

    TABLE_KANBAN = customOptions.table || "-";
    COLONNES_AFFICHAGE = customOptions.colonnes || COLONNES_AFFICHAGE_DEFAUT;

    PERSONNES_RAW = customOptions.personnes || '';
    PERSONNES = await getLookUpData(PERSONNES_RAW);
    TYPES_RAW = customOptions.types  || '';
    TYPES = await getLookUpData(TYPES_RAW);

    ShowConfig(false);
  });
  
  /* Écoute des modifications de données */
  grist.onRecords((records, mappings) => {
    console.log("Tâches reçues:", records);
    COLONNES_MAP = mappings;
    afficherKanban(records);
  });
  
  /* Écoute des modifications individuelles */
  grist.onRecord(record => {
    console.log("Modification reçue:", record);

    // Mise à jour de la carte modifiée
    const carte = document.querySelector(`[data-todo-id="${record.id}"]`);
    if (carte) {
      const nouvelleCarte = creerCarteTodo(record);
      const conteneurCartes = document.querySelector(`.contenu-colonne[data-statut="${record[COLONNES_MAP.STATUT]}"]`);
      if (conteneurCartes === carte.parentElement) {
        carte.replaceWith(nouvelleCarte);
      } else {
        carte.remove();
        conteneurCartes.insertBefore(nouvelleCarte, conteneurCartes.firstChild);
      }
    }
    
    // Mise à jour du popup si ouvert
    const popup = document.getElementById('popup-todo');
    if (popup.classList.contains('visible') && popup.dataset.currentTodo === record.id.toString()) {
      togglePopupTodo(record);
    }
    
    // Mise à jour des compteurs et tri
    document.querySelectorAll('.colonne-kanban').forEach(mettreAJourCompteur);
    document.querySelectorAll('.contenu-colonne').forEach(trierTodo);
  });
  
  // ========== EXPORT DES FONCTIONS GLOBALES ==========
  window.toggleColonne = toggleColonne;
  window.togglePopupTodo = togglePopupTodo;
  window.fermerPopup = fermerPopup;
  window.mettreAJourChamp = mettreAJourChamp;
  window.creerNouvelleTache = creerNouvelleTache;
  window.supprimerTodo = supprimerTodo;
  
  // ========== GESTION DES ÉVÉNEMENTS DU POPUP ==========
  /* Fermeture avec la touche Echap */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fermerPopup();
    }
  });
  
  /* Fermeture au clic en dehors */
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('popup-todo');
    if (popup.classList.contains('visible')) {
      const popupContent = popup.querySelector('.popup-content');
      if (!popupContent.contains(e.target) && !e.target.closest('.carte') && !e.target.closest('.popup-header')) {
        fermerPopup();
      }
    }
  });