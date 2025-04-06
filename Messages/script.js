//Quil

const defaultTheme = "snow";

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike', { 'script': 'sub'}, { 'script': 'super' }, { 'color': [] }, { 'background': [] },{ 'align': [] }, 'blockquote', 'code-block', { 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }, 'link', 'image', 'formula'],        // toggled buttons

  [{ 'header': [1, 2, 3, 4, 5, 6, false] }, { 'size': ['small', false, 'large', 'huge'] }],

  ['clean'],                                        // remove formatting button
];

let quill = {};

let id;
let column;
let user;
let lastContent;
let culture = 'en-US';
localize();
const table = grist.getTable();

function localize() {
  var urlParams = new URLSearchParams(window.location.search);  
  if (urlParams.has('culture')) culture = urlParams.get('culture');

  var lang = culture.split('-')[0];
  switch (lang) {
    case 'fr':
      document.getElementById('new-title').innerHTML = 'Nouveau message';
      document.getElementById('send').innerHTML = 'Envoyer';
      break;

    case 'es':
      document.getElementById('new-title').innerHTML = 'Nuevo mensaje';
      document.getElementById('send').innerHTML = 'Enviar';
      break;

    default:
      document.getElementById('new-title').innerHTML = 'New message';
      document.getElementById('send').innerHTML = 'Send';
  }

}

function Datereviver(key, value) {
  if (typeof value === 'string') {
    const date = Date.parse(value);
    if (!isNaN(date)) {
      return new Date(date);
    }
  }
  return value;
}

function makeQuill(theme){
  var quillDiv = document.createElement('div');
  quillDiv.id = 'quill';
  document.getElementById('editor').innerHTML = '';
  document.getElementById('editor').appendChild(quillDiv);

  const quill = new Quill('#quill', {
    theme: theme,
    modules: {
      toolbar: toolbarOptions,
      // imageResize: {
      //   displaySize: true
      // }
    }
  });

  // Set up config save callback
  document.getElementById("configuration").addEventListener("submit", async function(event){
    event.preventDefault();
    await saveOptions();
  });

  return quill;
}

// Helper to show or hide panels.
function showPanel(name) {
  document.getElementById("configuration").style.display = 'none';
  document.getElementById("chat").style.display = 'none';
  if(name.length !== 0)
    document.getElementById(name).style.display = '';
}

// Define handler for the Save button.
async function saveOptions() {
  const theme = document.getElementById("quillTheme").value;
  await grist.widgetApi.setOption('quillTheme', theme);
  showPanel('chat');
}

// Subscribe to grist data
grist.ready({requiredAccess: 'full', columns: [{name: 'Messages', type: 'Text'}, {name: 'User', type: 'Text', optional: true}],
  // Register configuration handler to show configuration panel.
  onEditOptions() {
    showPanel('configuration');
  },
});

grist.onRecord(function (record, mappings) {
  quill.enable();
  showPanel('chat');
  // If this is a new record, or mapping is diffrent.
  if (id !== record.id || mappings?.Messages !== column) {
    id = record.id;
    column = mappings?.Messages;
    user = mappings?.User
    const mapped = grist.mapColumnNames(record);
    if (!mapped) {
      // Log but don't bother user - maybe we are just testing.
      console.error('Please map columns');
    } else { //if (lastContent !== mapped.Content) 
      // We will remember last thing sent, to not remove progress.
      msg = mapped.Messages?.replace('|-¤-|','');
      if (!msg || msg.trim().length === 0) {
        lastContent = [];
      } else {
        lastContent = JSON.parse(msg, Datereviver);
      }

      //load content
      LoadMesssages(lastContent);
    }
  }
});

grist.onNewRecord(function () {
  document.getElementById('msg-container').innerHTML = '';
  showPanel('');
  id = null;
  lastContent = [];
  quill.setContents(null);
  quill.disable();
})

// Register onOptions handler.
grist.onOptions((customOptions, _) => {
  customOptions = customOptions || {};
  theme = customOptions.quillTheme || defaultTheme;
  document.getElementById("quillTheme").value = theme;
  quill = makeQuill(theme);
  showPanel("chat");
});


function DisplayMessage(author, date, message) {
  const card = document.createElement('div');
  card.className = 'card';
  if (!author || author.trim().length === 0) author = '&nbsp' //force blank space to ensure the layout

  card.innerHTML = `
      <div class="card-header">
        <span class="author">${author}</span>
        <span class="date">${date.toLocaleString(culture)}</span>
      </div>
      <div class="card-content">${message}</div>
    `;
  
    document.getElementById('msg-container').append(card);
}

function LoadMesssages(messages) {
  document.getElementById('msg-container').innerHTML = '';

  let data;
  for (let i = 0; i < messages.length; i++) {
    data = messages[i];
    if (data.length > 2)
      DisplayMessage(data[0], data[1], data[2]);
  }
}

function AddMessage(author, date, message){
  //Display the message
  DisplayMessage(author, date, message);    
    
  //Update the table
  lastContent.push([author, date, message]);  
  table.update({id, fields: {[column]: JSON.stringify(lastContent)}});
}

function AddNewMessage() {
  // If we are mapped.
  if (column && id) {  
    let author = '';
    
    //Prepare data
    let date = new Date();
    const message = quill.getSemanticHTML();

    if (!message || message.trim().length === 0 || message == '<p></p>') return;

    //update table to refresh user
    if (!user || user.trim().length !== 0) {
      table.update({id, fields: {[column]: JSON.stringify(lastContent)+'|-¤-|'}}).then((result)=> {
        grist.fetchSelectedRecord(id).then((row)=> {
          author = row[user];
          //Display message
          AddMessage(author, date, message);
          //reset editor
          quill.setContents(null);

        }, (error) => {console.error(error)});      
      }, (error) => {console.error(error)});
    } else {
      //Display message
      AddMessage(author, date, message);
      //reset editor
      quill.setContents(null);
    }    
  }  
}







