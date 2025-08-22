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
// form templates
let templateTable = [
    WidgetSDK.newItem('table', null, 'Target table',  'Select which table to manage.', 'Table', {type:'dropdown',event:{onchange:"selectionTable(this)"}}),    
];
let templateActionTable = [
  WidgetSDK.newItem('colaon', true, 'Selection',  'Select all columns or nothing.', 'Table structure', {event:{onClick:"switchColumns()"}}),
  WidgetSDK.newItem('columns', true, 'Columns',  'Select which columns to copy.', 'Table structure',
    { 
      template:WidgetSDK.newItem('column_export', true, 'Copy', 'If checked, copy the column metadata.'),
    }
  ),
  WidgetSDK.newItem('export', null, 'Copy', 'Copy metadata to the clipboard.', 'Table structure', {event:{onClick:"exporter()"}, label:"Copy"}),
  WidgetSDK.newItem('import_clipboard', '', 'Data to paste', '(optional) Paste metadata here.', 'Table structure', {type:'longstring', 
    description:'On some browser (like Chrome), the access from the clipboard is denied, so you need to paste manually its content in the text area below (using ctrl+V) and then click on the "Paste" button.'}),
  WidgetSDK.newItem('import', null, 'Paste', 'Paste metadata from the clipboard.', 'Table structure', {event:{onClick:"importer()"}, label:"Paste"}),  
  WidgetSDK.newItem('column', null, 'Target column', 'Select which column to manage.', 'Column', {type:'dropdown',event:{onchange:"selectionColumn(this)"}}),
];
let templateActionColumn = [
  WidgetSDK.newItem('propaon', true, 'Selection',  'Select all properties or nothing.', 'Column properties', {event:{onClick:"switchProp()"}}),
  WidgetSDK.newItem('properties', null, 'Properties',  'Select which properties to copy.', 'Column properties',
    {
        template:WidgetSDK.newItem('property_export', true, 'Copy', 'If checked, copy the property.'),
    }
  ),
  WidgetSDK.newItem('copy', null, 'Copy',  'Copy properties to the clipboard.', 'Column properties', {event:{onClick:"copyProp()"}, label:"Copy"}),
  WidgetSDK.newItem('paste_clipboard', '', 'Data to paste', '(optional) Paste metadata here.', 'Column properties', {type:'longstring', 
    description:'On some browser (like Chrome), the access from the clipboard is denied, so you need to paste manually its content in the text area below (using ctrl+V) and then click on the "Paste" button.'}),
  WidgetSDK.newItem('paste', null, 'Paste',  'Paste properties from the clipboard.', 'Column properties', {event:{onClick:"pasteProp()"}, label:"Paste"}),
];
let actionValues = {}; // Form values
let tableID; // selected table ID
let columns; // columns of selected table ID
let columnID; // selected column ID
// Supported columns properties
const properties = ['colId', 'type', 'widgetOptions', 'isFormula', 'formula', 'label', 'description', 'recalcWhen'];
const propertiesName = ['Type', 'Options', 'Is formula', 'Formula', 'Label', 'Description', 'Recalc trigger']; // without the colId 




// ========== INITILIZATION ==========
/** Asynchonous load of the widget */
window.addEventListener('load', async (event) => {
    /** Create widget manager object */
    W = new WidgetSDK();

    /** Load localization 
     * Optional but recommended, even only one language is available, let other 
     * propose their translation easily
     * In the first argument, we list this file and other linked scripts if needed ⇒ this way any user can make his own translation
     * The second (by default 'en') defines the default language used to write any string in this script. Use iso two letter format if
     * you write your widget in another default language
    */
    T = await W.loadTranslations(['widget.js']);

    /** Configure Columns meta data 
     * Optional, but usefull to access many information about table columns configuration.
     * Mandatory to manage properly Reference and ReferenceList columns
     * Needs to be called before configureOptions, 
    */
    W.initMetaData(true);

    /** Configure options */
    W.configureOptions(
      [], 
      '#config-view', // DOM element or ID where insert options interface
      '#main-view', // DOM element or ID where the widget is encapsuled, used to hide it when option are shown
      {} //even subcription, onOptLoad also available
  );

    /** Initialize widget subscription to Grist */
    W.ready({
        requiredAccess: 'full', // can be also 'readonly'
        allowSelectBy: false, //true to allow linked widget selection using: grist.setCursorPos({rowId: rowId});
    });

    /** When all configurations have been loaded, proceed to widget initialization.
     * This way, it ensures that all information are available to render your widget
    */
    W.isLoaded().then(async () => {
        /** Below put your widget initilization code */
        W.parseOptions(templateTable);
        W.parseOptions(templateActionTable);
        W.parseOptions(templateActionColumn);  

        /** Allways end with this line, to let the widget accepts data from Grist,
         * else, main function in W.onRecords will be never called.
         */
        W.initDone = true;

        // Display the form
        main();
    });

    /** Trigger event when mapping (ie columns properties) is changed */
    W.onMappingChange(main);
});

// ========== WIDGET MANAGEMENT ==========
/** Main widget function, render the widget after each update on records
 * @param {*} recs - Mapped records, which means that value are accessible using IDs defines in columns on grist.ready()
 * and references are resolved
  */
async function main() {
  if (W.initDone) {
    /** Place here the codes that update your widget each time the records change */
    const mainview = document.getElementById('main-view');
    const tables = [""].concat(await grist.docApi.listTables());
    
    // Table selection
    let html =  W.getOptionsHtml(templateTable, {table:tableID}, {table:tables});

    if (tableID) {
      // Manage default values
      const c = filterColumns(columns);
      if (!actionValues.columns) {
        actionValues.colaon = true;
        actionValues.columns = c.map(k => true);
        actionValues.import_clipboard = actionValues.import_clipboard ?? '';
      }

      // Generate form
      html += W.getOptionsHtml(templateActionTable, actionValues, {columns:true, column_export:c, column:[""].concat(c)});

      if(columnID) {
        // Manage default values
        if (!actionValues.properties) {
          actionValues.propaon = true;
          actionValues.properties = properties.slice(1).map(k => true);
        }

        // Generate form
        html += W.getOptionsHtml(templateActionColumn, actionValues, {properties:true, property_export:T(propertiesName)});
      }
    }

    html += `<div style="color:red"><p>${T('This widget affects the structure of tables, so even though it has been tested in various situations, it is possible that the document may become corrupted after applying the changes.')}</p>
      <p>${T('It is always strongly recommended to use the Work on a copy feature provided by Grist, and then, if everything went well, apply the changes to the main document.')}</p>
      <p>${T('The widget is therefore provided as it is, and the author cannot be held responsible for any problems that the widget may cause.')}</p></div>`
    

    mainview.innerHTML = html;  

    // Set standard form events after innerHTML set
    W.setOptionsEvent(mainview);
  }    
}

/** Place here all the code and function related to the widget rendering and management */
async function selectionTable(src) {
  tableID = src.value;
  columnID = undefined;

  columns = tableID ? await W.meta.getMeta(tableID) : undefined;
  actionValues = {};

  main();
}

async function selectionColumn(src) {
  columnID = src.value;
  actionValues.column = columnID;
  main();
}

async function switchColumns() {
  if (actionValues.columns) {
    // Get value
    await W.readOptionValues(templateActionTable, document.getElementById('main-view'), actionValues);
    actionValues.colaon = !actionValues.colaon;
    actionValues.columns = actionValues.columns.map(k => actionValues.colaon);

    main();
  }
}

async function switchProp () {
  if (actionValues.properties) {
    // Get value
    await W.readOptionValues(templateActionColumn, document.getElementById('main-view'), actionValues);
    actionValues.propaon = !actionValues.propaon;
    actionValues.properties = actionValues.properties.map(k => actionValues.propaon);

    main();
  }
}

async function exporter() {
  // List columns
  const col = filterColumns(columns);
  // Get columns to export
  await W.readOptionValues(templateActionTable, document.getElementById('main-view'), actionValues);

  // Get data
  let data = [];
  col.forEach((id, i) => {
    if(actionValues.columns[i]) {
      const c = columns[id];
      data.push([c.colId, Object.fromEntries(properties.map(k => {
        if(k === 'widgetOptions' && c[k]) return [k, JSON.stringify(c[k])]; // important to have a string and not an object, else the document will be corrupted.
        return [k, c[k]];
      }).filter(d => d[1]?true:false))]);
    }
  });

  // Copy to clipboard
  if (data.length > 0) {
    await navigator.clipboard.writeText(JSON.stringify(data));
    alert(T('Data has been copied into the clipboard.'));
  } else alert(T('No data to copy.'));  
}

async function importer() {
  // Get clipboard content
  let d;
  try {
    d = await navigator.clipboard.readText();
  } catch (e) {
    d = document.getElementById('import_clipboard').value;
    
    if (!d) {
      alert(T('Your browser denies access to clipboard, so you need to paste manually first its content into the previous section "Data to paste".'));
      return;
    }    
  }  
    
  if (d) {
    try {
      const data = JSON.parse(d);
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length === 2) {
        // format looks OK
        const col = filterColumns(columns);
  
        //generate user actions
        let actions = [];
        data.forEach(a => {
          if(a[1]) {
            a[1] = Object.fromEntries(Object.entries(a[1]).filter(d => d[1]?true:false)); //clean not defined properties
          }
          if(a[1] && a[1].widgetOptions && typeof a[1].widgetOptions === 'object') { // double check
            a[1].widgetOptions = JSON.stringify(a[1].widgetOptions);
          }
  
          if (col.includes(a[0])) {
            //Update
            actions.push(['ModifyColumn', tableID, a[0], a[1]]);
          } else {
            //Add
            actions.push(['AddColumn', tableID, a[0], a[1]]);
          }
        });
  
        // Import in Grist
        if (actions.length > 0) {
          await grist.docApi.applyUserActions(actions);
          alert(T('Structure imported successfully (be careful, new columns are hidden by default).'))
  
          // refresh the form to display new columns
          main();
        } else alert(T('No data to paste.'));
      } else alert(T('The data in the clipboard is not in the correct format.'));    
    } catch (e) {
      alert(T('The data in the clipboard is not in the correct format.')); 
    }
  } else alert(T('No data present in the clipboard.'));   
}

async function copyProp() {
  // Get properties to export
  await W.readOptionValues(templateActionColumn, document.getElementById('main-view'), actionValues);
  // Get column metadata
  let column = columns[columnID];

  // Get data
  let data = properties.slice(1).filter((p, i) => actionValues.properties[i]).map(k => [k, column[k]]).filter(d => d[1]?true:false);
  
  if (data.length > 0) {
    data = Object.fromEntries(data);
    if (data.widgetOptions) data.widgetOptions = JSON.stringify(data.widgetOptions); // important to have a string and not an object, else the document will be corrupted.
    await navigator.clipboard.writeText(JSON.stringify({exportColumn:data}));
    alert(T('Data has been copied into the clipboard.'));
  } else alert(T('No data to copy.'));
}

async function pasteProp() {
  let d;
  try {   
    d = await navigator.clipboard.readText();
  } catch (e) {
    d = document.getElementById('paste_clipboard').value;
    
    if (!d) {
      alert(T('Your browser denies access to clipboard, so you need to paste manually first its content into the previous section "Data to paste".'));
      return;
    }    
  } 

  if (d) {
    try {
      const data = JSON.parse(d);
      if(data && typeof data === 'object' && data.exportColumn) {
        if(Object.keys(data.exportColumn).length > 0) {
          // clean not defined properties
          data.exportColumn = Object.fromEntries(Object.entries(data.exportColumn).filter(d => d[1]?true:false));

          if (data.exportColumn.widgetOptions && typeof data.exportColumn.widgetOptions === 'object' ) { // double check
            data.exportColumn.widgetOptions = JSON.stringify(data.exportColumn.widgetOptions);
          }

          await grist.docApi.applyUserActions([['ModifyColumn', tableID, columnID, data.exportColumn]]);
          alert(T('Properties pasted successfully.'))
        } else alert(T('No data to paste.'));
      } else alert(T('The data in the clipboard is not in the correct format.'));
    } catch (e) {
      alert(T('The data in the clipboard is not in the correct format.')); 
    }
  } else alert(T('No data present in the clipboard.'));
}

// ========== HELPERS ==========
/** Place here the code for helper functions */
function filterColumns(c) {
  return Object.keys(c).filter(n => n != 'id' && n != 'manualSort' && !n.startsWith("gristHelper"));
}

// ========== GLOBAL FUNCTIONS EXPORT ==========
/** Place here export of function that need to be accessible from html (throw event for example) 
 * example: 
 *      window.myFunction = myFunction;
 * else, due to compilation, they won't be available
*/
window.exporter = exporter;
window.importer = importer;
window.switchColumns = switchColumns;
window.switchProp = switchProp;
window.selectionTable = selectionTable;
window.selectionColumn = selectionColumn;
window.copyProp = copyProp;
window.pasteProp = pasteProp

