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




Number.prototype.padLeft = function(base,chr){
  var  len = (String(base || 10).length - String(this).length)+1;
  return len > 0? new Array(len).join(chr || '0')+this : this;
}

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
  // If this is a new record, or mapping is diffrent.
  if (id !== record.id || mappings?.Messages !== column) {
    console.log('id' + record.id);
    id = record.id;
    column = mappings?.Messages;
    user = mappings?.User
    const mapped = grist.mapColumnNames(record);
    if (!mapped) {
      // Log but don't bother user - maybe we are just testing.
      console.error('Please map columns');
    } else { //if (lastContent !== mapped.Content) 
      // We will remember last thing sent, to not remove progress.
      lastContent = mapped.Messages;

      //load content
      LoadMesssages(lastContent.replace('|-¤-|', '').split('\n'));
    }
  }
});

grist.onNewRecord(function () {
  id = null;
  lastContent = null;
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
        <span class="date">${date}</span>
      </div>
      <div class="card-content">${message}</div>
    `;
  
    //document.querySelector('.chat-container').insertBefore(card, document.querySelector('.chat-container').lastElementChild);
    document.getElementById('msg-container').append(card);
}

function LoadMesssages(messages) {
  document.getElementById('msg-container').innerHTML = '';

  let data;
  for (let i = 0; i < messages.length; i++) {
    data = messages[i].split('¤¤');
    if (data.length > 2)
      DisplayMessage(data[0], data[1], data[2]);
  }
}

function AddMessage(author, date, message){
  //Display the message
  DisplayMessage(author, date, message);    
    
  //Update the table
  if (message && message.trim().length !== 0) {
    console.log('lastcontent' + lastContent);
    lastContent = lastContent + "\n"
  }
  lastContent = lastContent + author + '¤¤' + date + '¤¤' + message
  table.update({id, fields: {[column]: lastContent}});
}

function AddNewMessage() {
  // If we are mapped.
  if (column && id) {  
    let author = '';
    
    //Prepare data
    let date = new Date().toLocaleString(culture);
    // date = [date.getFullYear(),
    //             (date.getMonth()+1).padLeft(),
    //             date.getDate().padLeft()].join('/') +' ' +
    //           [date.getHours().padLeft(),
    //           date.getMinutes().padLeft()].join(':');
    const message = quill.getSemanticHTML();

    if (!message || message.trim().length === 0) return;

    //update table to refresh user
    if (!user || user.trim().length !== 0) {
      table.update({id, fields: {[column]: lastContent + '|-¤-|'}}).then((result)=> {
        grist.fetchSelectedRecord(id).then((row)=> {
          author = row[user];
          //Display message
          AddMessage(author, date, message);
          //reset editor
          quill.setContents(null);

        }, (error) => {error.log(error)});      
      }, (error) => {error.log(error)});
    } else {
      //Display message
      AddMessage(author, date, message);
      //reset editor
      quill.setContents(null);
    }    
  }  
}







