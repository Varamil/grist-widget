

//Quil

const defaultTheme = "snow";

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],

  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],  // font sizes

  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction


  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['link'],

  ['clean'],                                        // remove formatting button
];

let quill = {};

let id;
let column;
let lastContent;

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
grist.ready({requiredAccess: 'full', columns: [{name: 'Messages', type: 'Text'}],
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
    const mapped = grist.mapColumnNames(record);
    if (!mapped) {
      // Log but don't bother user - maybe we are just testing.
      console.error('Please map columns');
    } else if (lastContent !== mapped.Content) {
      // We will remember last thing sent, to not remove progress.
      lastContent = mapped.Content;

      //load content
      console.info(lastContent); //DEBUG
      LoadMesssages(lastContent.split('\n'));
    } else {
      console.error('else');
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
  
    document.querySelector('.chat-container').insertBefore(card, document.querySelector('.chat-container').lastElementChild);
}

function LoadMesssages(messages) {
  let data;
  for (let i = 0; i < messages.length; i++) {
    data = messages[i].split('###');
    if (data.length > 2)
      DisplayMessage(data[0], data[1], data[2]);
  }
}



document.querySelector('form').addEventListener('submit', function(event) {
  event.preventDefault();

  const author = 'Vous';
  const date = new Date();//.toLocaleString('fr-FR');
  date = [(date.getFullYear(),
              date.getMonth()+1).padLeft(),
              date.getDate().padLeft()].join('/') +' ' +
            [date.getHours().padLeft(),
             date.getMinutes().padLeft()].join(':');
  const message = quill.getSemanticHTML();

  if (!message.trim()) return;
  DisplayMessage(author, date, message);
    
  // If we are mapped.
  if (column && id) {    
    if (!message.trim()) lastContent = lastContent + '\n'
    lastContent = lastContent + author + '###' + date + '###' + message
  }
  const table = grist.getTable();

  table.update({id, fields: {[column]: lastContent}});

  quill.setContents(null);
});







