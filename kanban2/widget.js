// ========== GLOBAL VARIABLES & DEFAULTS ==========
/** WidgetSDK object 
 * @type WidgetSDK
*/
let W;
/** Translation function 
 * @type function
*/
let T;

/* Widget global variables */
// let COLONNES_DEFAUT = [
//     { id: '🖐️ À faire', libelle: 'À faire', couleur: '#f95c5e', btajout: true, isdone: false, useconfetti: false },
//     { id: '♻️ En cours', libelle: 'En cours', couleur: '#417DC4', btajout: false, isdone: false, useconfetti: false },
//     { id: '✅ Fait', libelle: 'Fait', couleur: '#27a658', btajout: false, isdone: true, useconfetti: true },
//     { id: '❌ Annulé', libelle: 'Annulé', couleur: '#301717', btajout: false, isdone: true, useconfetti: false }
//   ];
const DEADLINE_PRIORITE = new Date('3000-01-01');
const BACKCOLOR = '#DCDCDC';
const TEXTCOLOR = '#000000';
let RECS;
let TAGSLIST = [];

// ========== INITILIZATION ==========
/** Asynchonous load of the widget */
window.addEventListener('load', async (event) => {
    /** Create widget manager object */
    W = new WidgetSDK();

    /** Load localization 
     * Optional but recommended, even only one language is available, let other 
     * propose their translation easily
     * In the first argument we list this file and other linked scripts if needed ⇒ this way any use can make his own translation
     * The second (by default 'en') defines the default language used to write any string in this script. Use iso two letter format if
     * you write your widget in another default language
    */
    T = await W.loadTranslations(['widget.js']); 


    const lookup_details = `If empty, the widget use the column properties (based on choices or references) to make the list. Else, you can either:\n• Provides a list, separated by ";"\n• Provides a reference to a table or a column starting with a "$" ($TableID or $TableID.ColumnID)`;
    /** Configure options */
    W.configureOptions(
        [
            /** List all options that need to be stored by Grist 
             * Two options are possibles, use a short version: 
             * • WidgetSDK.newItem('option_id', default_value, 'title',  'subtitle', 'group'))
             *      ⇒ option_id: need to be a unique alpha numeric string with - or _
             *      ⇒ default_value: the default value assigned to the option, can be any type
             *      ⇒ title: displayed option title
             *      ⇒ subtitle: displayed short description
             *      ⇒ group: can be common to several option to group them together
             * 
             * • or provide an object with possible keys:
             *      ⇒ id: mandatory, need to be a unique alpha numeric string with - or _
             *      ⇒ default: default value, may defines the type (see below)
             *      ⇒ title: displayed option title
             *      ⇒ subtitle: displayed short description
             *      ⇒ description: displayed long description
             *      ⇒ group: can be common to several option to group them together
             *      ⇒ hidden: if true, option will be available on the backend, but not displayed to the user
             *      ⇒ type: defines which kind of UI is used when options are displayed. If possible type is automatically 
             *          deduced from default value if possible. 
             *          Can be: boolean, number, string, longstring, dropdown, object, template, templateform, lookup
             *      ⇒ values: for dropdown type, defines the displayed list. Can be an Array or Grist column reference
             *      ⇒ format: function to format the raw value to a more standard type can can be used by the SDK
             *      ⇒ parse: function to back to a raw value from a formated value
             *      ⇒ columnId: column ID as defined in grist.ready. If defined and type is not set, set type to dropdown
             *      ⇒ template: object or array of object that defines a template for a dynamic list of options. Use the same 
             *          kind of object as for main options, but less keys are usefull:
             *              id, title, subtitle, description, type, values, format, parse
             * 
             * Remark: for Title, subtitle, description and group, do not translate them with T function, the translation will
             * be automatically managed by the SDK.
            */
            WidgetSDK.newItem('columns', null, 'Behavior',  'Configure the behavior of each columns', 'Columns',
                {
                    columnId:'STATUT',
                    template:[
                        WidgetSDK.newItem('addbutton', true, 'Can add card', 'If checked, display a button to add card to the column.'),
                        WidgetSDK.newItem('isdone',false,'Is done','If checked, cards in the columns are considered as over.'),
                        WidgetSDK.newItem('useconfetti',false,'Use confetti','If checked, confetti apprear when a card enter in the column.'),
                    ]
                }
            ),
            WidgetSDK.newItem('ref', '', 'References',  'List of task references available.', 'Cards options', 
                    {description:lookup_details, columnId:'REFERENCE_PROJET', type:'lookup'}),
            WidgetSDK.newItem('types', '', 'Type', 'List of task types available.', 'Cards options', 
                    {description:lookup_details, columnId:'TYPE', type:'lookup'}),
            WidgetSDK.newItem('incharge', '', 'In charge', 'List of people that can be in charge of the task.', 'Cards options', 
                    {description:lookup_details, columnId:'RESPONSABLE', type:'lookup'}),
            WidgetSDK.newItem('cardcolor', '', 'Card color', 'List of color available for card background.', 'Cards options', 
                {description:lookup_details, columnId:'COULEUR', type:'lookup'}),
            WidgetSDK.newItem('rotation', true, 'Tilt',  'If checked, cards are randomly tilted.', 'Display'),
            WidgetSDK.newItem('compact', false, 'Compact',  'If checked, use a compact rendering.', 'Display'),
            WidgetSDK.newItem('readonly', false, 'Read only', 'If checked, kanban is ready only.', 'Display'),
        ], 
        '#config-view', // DOM element or ID where insert options interface
        '#main-view', // DOM element or ID where the widget is encapsuled, used to hide it when option are shown
        {onOptChange:optionsChanged, onOptLoad:optionsChanged} //even subcription, onOptLoad also available
    );


    /** Configure Columns meta data 
     * Optional, but usefull to access many information about table columns configuration.
     * Mandatory to manage properly Reference and ReferenceList columns
    */
    W.initMetaData();

    /** Initialize widget subscription to Grist */
    W.ready({
        requiredAccess: 'full', // can be also 'readonly'
        columns: [
            /** List of object that defines all columns linkable to the widget. Be carefull that
             * only column linked will be accessible, if you need to access all of them, let the
             * array empty.
             * 
             * Objects can contains keys:
             *      ⇒ name: unique id. This id is used when you deal with data
             *      ⇒ title: title displayed by Grist
             *      ⇒ description: short description displayed by Grist
             *      ⇒ type: list (comma separated) of column type that can be associated. Any by default, can be:
             *              Any, Date, DateTime, Numeric, Int, Bool, Choice, Text, Ref, RefList
             *      ⇒ optional: true if the association is not mandatory for the widget (false by default)
             *      ⇒ allowMultiple: true if more than one column can be assiciated (false by default)
             *      ⇒ strictType: true to not allow implicite type conversion (false by default)
             * 
             * Remark: for title and description do not translate them with T function, the translation will
             * be automatically managed by the SDK.
             */
            {name:'STATUT', title:'Status', description:'Defines the Kanban column', type:'Choice', strictType:true},
            {name:'DESCRIPTION', title:'Task', description:'Main card content', type:'Any'}, 
            {name:'DEADLINE', title:'Deadline', description:'Can also be use as priority', type:'Date'},             
            {name:'REFERENCE_PROJET', title:'Reference', description:'Reference associated with the task', type:'Any', optional:true},
            {name:'TYPE', title:'Type', description:'Type associated with the task', type:'Any', optional:true},              
            {name:'RESPONSABLE', title:'In charge', description:'Who is in charge', type:'Any', optional:true}, 
            {name:'CREE_PAR', title:'Created by', type:'Any', optional:true}, 
            {name:'CREE_LE', title:'Creation date', type:'DateTime', optional:true}, 
            {name:'DERNIERE_MISE_A_JOUR', title:'Last update date', description:'Updated after any change', type:'DateTime', optional:true},
            {name:'NOTES', title:'Notes', description:'Additional notes', type:'Any', optional:true},
            {name:'COULEUR', title:'Card color', description:'Choice or html value', type:'Choice,Text', optional:true},
            {name:'TAGS', title:'Tags', description:'Additional fields to display', type:'Any', optional:true, allowMultiple:true}
        ],
        // async onEditOptions() {
        //     await W?.showConfig(); // manage the display of options when user click on "Open configuration" in Grist interface
        // },
    });

    /** Subscribe to Grist onRecords with a correct loading management 
     * (ensure that options are loaded before, widget is properly initialized...)
     *      ⇒ main: function that managed the widget when records are updated
     *      ⇒ args: object with same option as grist.onRecords + mapRef key. 
     *              • mapRef: By default references are not managed and their content depends on expandRefs and keepEncoded.
     *                  If mapRef is true, all references are mapped to provide their content AND their id
     *              • For optimization, prefer {expandRefs:false, keepEncoded:false} if working with ref ids, 
     *                  or {expandRefs:true, keepEncoded:false} if working with ref content
     */
    W.onRecords(afficherKanban, {expandRefs:false, keepEncoded:false, mapRef:true});

    /** When all configurations have been loaded, proceed to widget initialization.
     * This way, it ensures that all information are available to render your widget
      */
    W.isLoaded().then(async () => {
        /** Below put your widget initilization code */

        /** Allways end with this line, to let the widget accepts data from Grist,
         * else, main function in W.onRecords will be never called.
         */
        W.initDone = true;
    });

    /** Trigger event when mapping (ie columns properties) is changed */
    grist.on('message', async (e) => {
        if (e.mappingsChange) mappingChanged();
    });
});

// ========== WIDGET MANAGEMENT ==========
/** Main widget function, render the widget after each update on records
 * @param {*} recs - Mapped records, which means that value are accessible using IDs defines in columns on grist.ready()
  */
async function afficherKanban(recs) {
    RECS = recs;

    /** Place here the codes that update your widget each time the records */
    const conteneurKanban = document.getElementById('conteneur-kanban');
    conteneurKanban.innerHTML = '';

    // Création des colonnes //TODO => move to init and option change
    const colonnes = await W.col.STATUT.getChoices();
    if (!colonnes || colonnes.length === 0) {
        console.error(T('No choice available in the Status column'));
        return;
    }
    //W.opt.colonnes
    colonnes.forEach((col, idx) => {
        conteneurKanban.appendChild(creerColonneKanban(col, idx));
    });

    // Distribution des tâches dans les colonnes
    if (recs?.length > 0) {
        recs.forEach( todo => {
            const carte = creerCarteTodo(todo);
            const col = document.querySelector(`.contenu-colonne[data-statut="${todo.STATUT}"]`);
            if (col) {
              // Insertion au début de la colonne
              col.insertBefore(carte, col.firstChild);
            }
          });


        // Configuration du drag & drop et mise à jour des compteurs
        if(!W.opt.readonly) {
            document.querySelectorAll('.contenu-colonne').forEach(colonne => {
                // Configuration de Sortable pour le drag & drop
                new Sortable(colonne, {
                    group: 'kanban-todo',
                    animation: 150,
                    onEnd: async function(evt) {
                        const colonneArrivee = evt.to.dataset.statut;
                        // Déplacé dans la même colonne
                        if (colonneArrivee === evt.from.dataset.statut) {
                            let deadline = evt.item.dataset.deadline || '9999-12-31';

                            if (evt.oldIndex !== evt.newIndex && (new Date(deadline)) >= DEADLINE_PRIORITE) {
                                let start = DEADLINE_PRIORITE.getFullYear();              
                                let data = [];
                                document.querySelectorAll('.contenu-colonne').forEach(colonne => { 
                                    if (colonne.getAttribute('data-statut') === colonneArrivee) {
                                        colonne.querySelectorAll('.carte').forEach(async carte => { 
                                            deadline = carte.getAttribute('data-deadline') || '9999-12-31';
                                            if ((new Date(deadline)) >= DEADLINE_PRIORITE) {
                                                deadline = `${start}-01-01`;
                                                carte.setAttribute('data-deadline', deadline);
                                                start += 1;
                                            
                                                data.push(W.formatRecord(carte.getAttribute('data-todo-id'), {DEADLINE: deadline}));
                                            }
                                        });
                                    }
                                }); 
                                
                                try {
                                    await W.updateRecords(data);
                                } catch (erreur) {
                                    console.error(T('Error during status update:'), erreur);
                                }
                            }                
                        } else {
                            try {
                                await mettreAJourChamp(evt.item.dataset.todoId, 'STATUT', colonneArrivee);
                            } catch (erreur) {
                                console.error(T('Error during status update:'), erreur);
                            }
                        } 
                        
                        // Tri des cartes dans chaque colonne
                        trierTodo(colonne);
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

/** Function called when options are updated.
 * @param {Object} opts - Options values with ids as keys
 */
async function optionsChanged(opts) {    
    /** If you don't need mapping to be done before managing options change, you can remove this line */
    await W.isMapped();

    /** Place here the code that update your widget each time option are changed */
    afficherKanban(RECS);
}

/** Place here all the code and function related to the widget rendering and management */

// ========== CRÉATION DES CARTES ET COLONNES ==========
/* Création d'une colonne */
function creerColonneKanban(colonne, idx) {
    const opt = W.opt.columns[idx];
    const colonneElement = document.createElement('div');
    colonneElement.className = `colonne-kanban${(!opt.addbutton && !W.opt.compact)? ' colonne-nobouton':''}`; //colonne
    colonneElement.id = colonne;
    
    const savedState = localStorage.getItem(`column-todo-${colonne}`); //colonne.libelle
    if (savedState === 'true') {
        colonneElement.classList.add('collapsed');
    }

    colonneElement.innerHTML = `
        <div class="entete-colonne" style="background-color: ${W.col.STATUT.getColor(colonne) ?? BACKCOLOR};color:${W.col.STATUT.getTextColor(colonne) ?? TEXTCOLOR}">
            <div class="titre-statut">${colonne} <span class="compteur-colonne">(0)</span></div>
            ${(opt.addbutton && !W.opt.readonly) ? `
            <button class="bouton-ajouter-entete ${W.opt.compact ? ' compact': ''}" onclick="creerNouvelleTache('${colonne}')">+</button>
            ` : ''}
            <button class="bouton-toggle" onclick="toggleColonne(this.closest('.colonne-kanban'), event)">⇄</button>
        </div>
        ${(opt.addbutton && !W.opt.readonly) ? `
            <button class="bouton-ajouter ${W.opt.compact ? ' compact': ''}" onclick="creerNouvelleTache('${colonne}')">+ ${T('Add a new task')}</button>
        ` : ''}
        <div class="contenu-colonne" data-statut="${colonne}"></div>
    `;
  
    return colonneElement;
}

/** Called when STATUT column perperties are modified */
function mappingChanged() {
    // Update column color
    const colonnes = document.getElementsByClassName('colonne-kanban');
    Array.prototype.forEach.call(colonnes, col => {
        col.style = `background-color: ${W.col.STATUT.getColor(col.id) ?? BACKCOLOR};color:${W.col.STATUT.getTextColor(col.id) ?? TEXTCOLOR}`;
    });

    updateTagsList();    
}

/** Update lists for each Tags columns */
async function updateTagsList() {
    await W.isMapped();

    // make TAGS lists
    TAGSLIST = [];
    if (W.map.TAGS) {
        TAGSLIST = await W.map.TAGS.map(async t => {
            const cmeta = await W.meta.getColMeta(t);
            return await cmeta?.getChoices() ?? [];
        });
        TAGSLIST = await Promise.all(TAGSLIST);
    }
}

/* Création d'une carte TODO */
function creerCarteTodo(todo) { 
    const carte = document.createElement('div');
    carte.className =`carte ${W.opt.rotation ? '': ' norotate'}${W.opt.compact ? ' compact': ''}`;
    
    carte.setAttribute('data-todo-id', todo.id);
    carte.setAttribute('data-last-update', todo.DERNIERE_MISE_A_JOUR || '');
    carte.setAttribute('data-deadline', todo.DEADLINE || '');
    if (todo.COULEUR) {
        if (W.col.COULEUR.type === 'Choice')
            if (W.col.COULEUR.getColor(todo.COULEUR)) carte.setAttribute('style', `background-color: ${W.col.COULEUR.getColor(todo.COULEUR)}`);
        else
            carte.setAttribute('style', `background-color: ${(todo.COULEUR.startsWith("#")? '': '#') + todo.COULEUR}`);        
    }

    const type = todo.TYPE || '';
    const description = todo.DESCRIPTION || T('No description');
    const deadline = todo.DEADLINE ? formatDate(todo.DEADLINE) : '';
    const responsable = todo.RESPONSABLE || '';
    const projetRef = todo.REFERENCE_PROJET;
    const tags = todo.TAGS || [];
    let taglist= '';
    tags.forEach(t => taglist += t?`<div class="more-tag">${t}</div>`:'');
    const infoColonne = W.getValueListOption('columns', todo.STATUT); //.find((colonne) => {return colonne.id === todo.STATUT});

    carte.innerHTML = `
        ${projetRef && projetRef.length > 0 ? `<div class="projet-ref truncate">#${projetRef}</div>` : ''}
        ${type ? `<div class="type-tag truncate">${type}</div>` : (projetRef && projetRef.length > 0 ? '<div>&nbsp;</div>':'')}
        ${tags.length > 0 ? `<div>${taglist}</div>`:''}
        <div class="description">${description}</div>
        ${deadline ? `<div class="deadline${todo.DEADLINE < Date.now() ? ' late':''} truncate">📅 ${deadline}</div>` : (responsable ? '<div>&nbsp;</div>':'')}
        ${responsable ? `<div class="responsable-badge truncate">${responsable}</div>` : ''}
        ${infoColonne?.isdone ? `<div class="tampon-termine" style="color: ${W.col.STATUT.getColor(todo.STATUT) ?? BACKCOLOR};">${todo.STATUT}</div>` : ''}      
    `;
  
    carte.addEventListener('click', () => togglePopupTodo(todo));
    return carte;
}

/* Mise à jour d'un champ dans Grist */
async function mettreAJourChamp(todoId, champ, valeur, e) {
    try {
        e?.stopPropagation();
        // Déclencher les confettis si on passe en "Fait"
        if (champ === 'STATUT') {
            const infoColonne = W.getValueListOption('columns', valeur); //.find((colonne) => {return colonne.id === valeur});
            if (infoColonne && infoColonne.useconfetti)
                triggerConfetti();
        }
        let data = {[champ]: valeur ? valeur : undefined};
        if (W.map.DERNIERE_MISE_A_JOUR) data.DERNIERE_MISE_A_JOUR = new Date().toISOString();

        await W.updateRecords(W.formatRecord(todoId, data));
    } catch (erreur) {
        console.error(T('Error during update:'), erreur);
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
            const delta = new Date(dateB) - new Date(dateA);
            if (delta === 0) {
                const idA = parseInt(a.getAttribute('data-todo-id')) || 0;
                const idB = parseInt(b.getAttribute('data-todo-id')) || 0;
                return idA - idB;
            }
            else 
                return delta; // Plus récent en premier
        } else {
            // Pour les autres colonnes, tri par deadline
            const dateA = a.getAttribute('data-deadline') || '9999-12-31';
            const dateB = b.getAttribute('data-deadline') || '9999-12-31';
            const delta = new Date(dateA) - new Date(dateB);
            if (delta === 0) {
                const idA = parseInt(a.getAttribute('data-todo-id')) || 0;
                const idB = parseInt(b.getAttribute('data-todo-id')) || 0;
                return idA - idB;
            }
            else 
                return delta; // Plus urgent en premier
        }
    });
    
    cartes.forEach(carte => conteneur.appendChild(carte));
}

/* Mise à jour des compteurs */
function mettreAJourCompteur(colonne) {
    const contenu = colonne.querySelector('.contenu-colonne');
    const compteur = colonne.querySelector('.compteur-colonne');
    if (contenu && compteur) {
        compteur.textContent = `(${contenu.children.length})`;
    }
}

// ========== GESTION DU POPUP ==========
/* Affichage et gestion du popup */
function togglePopupTodo(todo) {
    const popup = document.getElementById('popup-todo');
    const carteActive = document.querySelector('.carte.active');
    const carteCliquee = document.querySelector(`[data-todo-id="${todo.id}"]`);
    const infoColonne = W.getValueListOption('columns', todo.STATUT); //.find((colonne) => {return colonne.id === todo.STATUT});

    if (W.opt.readonly) { 
        fermerPopup();
        return;
    }

    carteActive?.classList.remove('active');
    carteCliquee?.classList.add('active');

    popup.style = `border-left-color: ${W.col.STATUT.getColor(todo.STATUT) ?? BACKCOLOR}`;

    popup.dataset.statut = todo.STATUT;
    popup.dataset.isdone = infoColonne? false : infoColonne.isdone;
    popup.dataset.currentTodo = todo.id;
    
    const popupTitle = popup.querySelector('.popup-title');
    const content = popup.querySelector('.popup-content');
    const popupheader = popup.querySelector('.popup-header');
    popupheader.style = `background-color: ${W.col.STATUT.getColor(todo.STATUT) ?? BACKCOLOR};color:${W.col.STATUT.getTextColor(todo.STATUT) ?? TEXTCOLOR}`;
    
    popupTitle.textContent = todo.DESCRIPTION || T('New task');

    let count = 1;
    let form = '<div class="field-row">';
    form += `
        <div class="field">
          <label class="field-label">${W.map.DEADLINE}</label>
          <input type="date" class="field-input" 
                 value="${formatDateForInput(todo.DEADLINE)}"
                 onchange="mettreAJourChamp(${todo.id}, 'DEADLINE', this.value, event)">
        </div>
    `;

    if (W.map.REFERENCE_PROJET) {
        form += insererChamp(todo.id, todo.REFERENCE_PROJET, W.valuesList.ref, W.map.REFERENCE_PROJET, 'REFERENCE_PROJET', W.col.REFERENCE_PROJET.getIsFormula()); 
        count += 1;
    }
    if (count % 2 === 0) form += `</div><div class="field-row">`;
    if (W.map.TYPE) {
        form += insererChamp(todo.id, todo.TYPE, W.valuesList.types, W.map.TYPE, 'TYPE', W.col.TYPE.getIsFormula());
        count += 1; 
    }
    if (count % 2 === 0) form += `</div><div class="field-row">`;
    if (W.map.RESPONSABLE) {
        form += insererChamp(todo.id, todo.RESPONSABLE, W.valuesList.incharge, W.map.RESPONSABLE, 'RESPONSABLE', W.col.RESPONSABLE.getIsFormula());
        count += 1;   
    }
    if (count % 2 === 0) form += `</div><div class="field-row">`;
    if (W.map.TAGS) {
        W.map.TAGS.forEach((t, i) => {
            form += insererChamp(todo.id, todo.TAGS[i], TAGSLIST[i], t, t, W.col[t].getIsFormula()); // TODO get column title
            count += 1;
            if (count % 2 === 0) form += `</div><div class="field-row">`;
        });
    }
    if (W.map.COULEUR) {
        form += insererChamp(todo.id, todo.COULEUR, W.valuesList.cardcolor, W.map.COULEUR, 'COULEUR'), W.col.COULEUR.getIsFormula();
        count += 1;   
    }

    form += `</div>
        <div class="field">
            <label class="field-label">${W.map.DESCRIPTION}</label>
            <textarea class="field-textarea auto-expand" 
                    onchange="mettreAJourChamp(${todo.id}, 'DESCRIPTION', this.value, event)"
                    oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'">${todo.DESCRIPTION || ''}</textarea>
        </div>
    `;
    if (W.map.NOTES) {
        form += `<div class="field">
            <label class="field-label">${W.map.NOTES}</label>
            <textarea class="field-textarea auto-expand" 
                      onchange="mettreAJourChamp(${todo.id}, 'NOTES', this.value, event)"
                      oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'">${todo.NOTES || ''}</textarea>
          </div>
        `;
    }
    if ((W.map.CREE_LE && todo.CREE_LE) || (W.map.CREE_PAR && todo.CREE_PAR) || (W.map.DERNIERE_MISE_A_JOUR && todo.DERNIERE_MISE_A_JOUR)) {
        form += `<div class="info-creation">
                ${T('Created')} ${(W.map.CREE_LE && todo.CREE_LE) ? T('on %on', {on:formatDate(todo.CREE_LE)}): ''} 
                ${(W.map.CREE_PAR && todo.CREE_PAR) ? T('by %by', {by:(todo.CREE_PAR || '-')}): ''}
                ${(W.map.DERNIERE_MISE_A_JOUR && todo.DERNIERE_MISE_A_JOUR) ? ('<br>' + T('Last update on %on', {on:(formatDate(todo.DERNIERE_MISE_A_JOUR) || '-')})): ''}
            </div>
        `;
    }

    if (!W.opt.readonly) {
        form += ` 
          <div class="popup-actions">
            <button class="popup-action-button bouton-supprimer" onclick="supprimerTodo(${todo.id}, event)" 
                    title="${T('Remove the task')}">🗑️</button>
          </div>
        `;
    }
    content.innerHTML = form;

    // Initialisation des champs auto-expandables
    setTimeout(() => {
        const textareas = document.querySelectorAll('.auto-expand');
        textareas.forEach(textarea =>    {
            textarea.style.height = '';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    }, 0);
    
    popup.classList.add('visible');
}

/** Insert a field in the todo form as text or a dropdown */
function insererChamp(id, value, list, title, col, disable) {
    let form='';
    if (list?.length > 0) {
        if( list.length < 10) {
            form += `
                <div class="field">
                    <label class="field-label">${title}</label>
                    <select class="field-select" onchange="mettreAJourChamp(${id}, '${col}', this.value, event)">
                    <option value="" ${disable?"disabled":""}></option>`;
            list.forEach(element => {
                form += `<option value="${element}" ${value === element ? 'selected' : ''}>${element}</option>`;  
            });
            form += `</select>
                </div>        
            `;
        } else {
            form += `
                <div class="field">
                    <label class="field-label">${title}</label>
                    <input type="text" list="list-${col}" class="field-select" onchange="mettreAJourChamp(${id}, '${col}', this.value, event)" ${disable?"disabled":""}/>
                    <datalist id="list-${col}">`;
            list.forEach(element => {
                form += `<option value="${element}" ${value === element ? 'selected' : ''}>${element}</option>`;  
            });
            form += `</datalist>
                </div>        
            `;
        }
    } else {
        form += `
            <div class="field">
                <label class="field-label">${title}</label>
                <input type="text" class="field-input" value="${value || ''}" 
                    onchange="mettreAJourChamp(${id}, '${col}', this.value, event)" ${disable?"disabled":""}>
            </div>
        `;
    }
    return form;
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

// ========== GESTION DES TÂCHES ==========
/* Création d'une nouvelle tâche */
async function creerNouvelleTache(colonneId) {
    try {
        let data = {DESCRIPTION: '', STATUT: colonneId};
        if (W.map.TYPE && !W.col.TYPE.getIsFormula()) data.TYPE = '';
        if (W.map.REFERENCE_PROJET && !W.col.REFERENCE_PROJET.getIsFormula()) data.REFERENCE_PROJET = null;
        if (W.map.DERNIERE_MISE_A_JOUR && !W.col.DERNIERE_MISE_A_JOUR.getIsFormula()) data.DERNIERE_MISE_A_JOUR = new Date().toISOString();
        if (W.map.CREE_LE && !W.col.CREE_LE.getIsFormula()) data.CREE_LE = new Date().toISOString();

        const res = await W.createRecords({fields: data});
        if (res.id && res.id > 0) {
            const rec = await W.fetchSelectedRecord(res.id); 
            togglePopupTodo(rec);
        }
    } catch (erreur) {
            console.error(T('Error on creation:'), erreur);
    }
}

/* Suppression d'une tâche */
async function supprimerTodo(todoId, e) {
    e?.stopPropagation();
    if (confirm(T('Are you sure you want to delete this task?'))) {
        try {
            await W.destroyRecords(todoId);
            fermerPopup();
        } catch (erreur) {
            console.error(T('Error on delete:'), erreur);
        }
    }
}

// ========== HELPERS ==========
/** Place here the code for helper functions */
/* Gestion du repli/dépli des colonnes */
function toggleColonne(colonne, e) {
    e?.stopPropagation();
    colonne.classList.toggle('collapsed');
    localStorage.setItem(`column-todo-${colonne.querySelector('.titre-statut').textContent.trim()}`, colonne.classList.contains('collapsed'));
}
  
/* Fonction pour déclencher l'animation de confettis */
function triggerConfetti() {
    const duration = 2 * 1000;
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

/* Formatage des dates */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (date >= DEADLINE_PRIORITE) return null;

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString(W.cultureFull, { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

/* Formatage des dates pour les champs input */
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    //if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
        const date = new Date(dateStr);
        if (date >= DEADLINE_PRIORITE)
            return '';
        else 
            return date.toISOString().split('T')[0];
    } catch (e) {
        console.error(T('Error on date formating:'), e);
        return '';
    }
}

// ========== EXPORT DES FONCTIONS GLOBALES ==========
  window.toggleColonne = toggleColonne;
  window.togglePopupTodo = togglePopupTodo;
  window.fermerPopup = fermerPopup;
  window.mettreAJourChamp = mettreAJourChamp;
  window.creerNouvelleTache = creerNouvelleTache;
  window.supprimerTodo = supprimerTodo;