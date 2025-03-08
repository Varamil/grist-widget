

//Quil

const defaultTheme = "snow";

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike', { 'script': 'sub'}, { 'script': 'super' }],        // toggled buttons
  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'align': [] }],
  ['blockquote', 'code-block'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  ['link'],

  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],  // font sizes

  ['clean'],                                        // remove formatting button
];

let quill = {};

let id;
let column;
let user;
let lastContent;
const table = grist.getTable();

Number.prototype.padLeft = function(base,chr){
  var  len = (String(base || 10).length - String(this).length)+1;
  return len > 0? new Array(len).join(chr || '0')+this : this;
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
      imageResize: {
        displaySize: true
      }
    }
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
      LoadMesssages(lastContent.split('\n'));
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
    data = messages[i].split('###');
    if (data.length > 2)
      DisplayMessage(data[0], data[1], data[2]);
  }
}

function AddMessage() {
  console.log('clic'); //DEBUG

  // If we are mapped.
  if (column && id) {  
    let author = '';
    
    //Prepare data
    let date = new Date();//.toLocaleString('fr-FR');
    date = [date.getFullYear(),
                (date.getMonth()+1).padLeft(),
                date.getDate().padLeft()].join('/') +' ' +
              [date.getHours().padLeft(),
              date.getMinutes().padLeft()].join(':');
    const message = quill.getSemanticHTML();
    console.log(message);//DEBUG
    if (message.trim().length === 0) return;

    //update table to refresh user
    if (user.trim().length !== 0) {
      table.update({id, fields: {[column]: lastContent + '|-¤-|'}});
      row = grist.fetchSelectedRecord(id);
      console.log('user');
      console.log(row);
      author = row[user];
    }

    //Display the message
    DisplayMessage(author, date, message);    
    
    //Update the table
    if (message.trim().length !== 0) lastContent = lastContent + "\n"
    lastContent = lastContent + author + '###' + date + '###' + message
    table.update({id, fields: {[column]: lastContent}});
    console.log(lastContent);//DEBUG
  }
  //reset editor
  quill.setContents(null);
}







