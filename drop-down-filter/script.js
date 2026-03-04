let currentoptions = [];
let allRecords = [];
let sessionID = "";  
let column = "";
let column2 = "";
const typeAND = "AND", typeOR = 'OR';

function showError(msg) {
  let el = document.getElementById('error');
  if (!msg) {
    el.style.display = 'none';
  } else {
    el.innerHTML = msg;
    el.style.display = 'block';
  }
}

function updateDropdown(options, idx) {
  const uniqoptions = [""].concat(uniq(options).sort());

  const dropdown = document.getElementById('dropdown' + idx);
  dropdown.classList.remove('hiddenItem'); // show it
  let currentvalue = uniqoptions.includes(dropdown.value) ? dropdown.value: undefined;
  if (currentvalue === undefined && sessionID.length > 0) {
     //if session ID defined, use it to auto select the dropdown value
    const selection = sessionStorage.getItem(sessionID + "_Dropdownfilter_Item" + ((idx > 1) ? idx : ''));
    if (selection.length > 0) {
      currentvalue = selection;
    }
  }

  dropdown.innerHTML = '';
  if (uniqoptions.length === 0) {
    const optionElement = document.createElement('option');
    optionElement.textContent = 'No options available';
    dropdown.appendChild(optionElement);
    grist.setSelectedRows(null);
  } else {
    uniqoptions.forEach((option, index) => {
      const optionElement = document.createElement('option');
      optionElement.value = String(option);
      optionElement.textContent = String(option);
      if (String(option) === currentvalue) optionElement.setAttribute('selected','');

      dropdown.appendChild(optionElement);
    }); 
    
    selectRows(currentvalue);
  }
}

function saveOption() {
  const sid = document.getElementById("sessionid").value;
  grist.widgetApi.setOption('sessionid', sid);
}

function initGrist() {
  grist.ready({
    columns: [{ name: "OptionsToSelect", title: 'Options to select', type: 'Any' },
              { name: "OptionsToSelect2", title: '2nd options to select', type: 'Any', optional:true }],
    requiredAccess: 'read table',
    allowSelectBy: true,
    onEditOptions() {
      document.getElementById("container").style.display = 'none';
      document.getElementById("config").style.display = '';
      document.getElementById("sessionid").value = sessionID;
    },
  });

  grist.onOptions((customOptions, _) => {
    customOptions = customOptions || {};
    sessionID = customOptions.sessionid || "";   

    document.getElementById("container").style.display = '';
    document.getElementById("config").style.display = 'none';
  });

  grist.onRecords(function (records, mappings) {
    console.log('dropdown', records);
    if (!records || records.length === 0) {
      //showError("No records received");
      updateDropdown([]);
      grist.setSelectedRows(null);
      return;
    }
    
    allRecords = records;
    column = mappings.OptionsToSelect;
    column2 = mappings.OptionsToSelect2;
    const mapped = grist.mapColumnNames(records);

    showError("");
    options = mapped.map(record => record.OptionsToSelect).filter(option => option !== null && option !== undefined);
    
    if (options.length === 0) {
      showError("No valid options found");
    }
    updateDropdown(options, 1);    
    console.log('dropdown 1 options', options);

    const td1 = document.getElementById("td1");
    console.log('dropdown 2 colum', column2);
    if (column2 === null || column2?.length === 0) {
      //display
      td1.classList = "td100";
      document.getElementById('dropdown2').classList.add('hiddenItem');
      document.getElementById('type').classList.add('hiddenItem');
    } else {
      options = mapped.map(record => record.OptionsToSelect2).filter(option => option !== null && option !== undefined);
      updateDropdown(options, 2);    
      console.log('dropdown 2 options', options);

      // display
      td1.classList = "td50";
      document.getElementById('type').classList.remove('hiddenItem');
    }

  });

  grist.onRecord(function (record, mappings) {
    console.log('dropdown rec', record);
  });

  grist.onNewRecord(function () {
    console.log('dropdown new');
  });

  document.getElementById('dropdown1').addEventListener('change', function(event) {  
    selectRows(event.target.value, document.getElementById('dropdown2').value, document.getElementById("type").innerHTML);    
  });

  document.getElementById('dropdown2').addEventListener('change', function(event) {  
    selectRows(document.getElementById('dropdown1').value, event.target.value, document.getElementById("type").innerHTML);    
  });
}


function selectRows(value1, value2, type) {
  console.log('dropdown value', value1, value2);

  if (value1?.length === 0 && value2?.length === 0) {
    console.log('dropdown selRecord full');
    grist.setSelectedRows(null);
  } else {
    let rows;
    if (value2?.length === 0) {
      rows = allRecords.filter((item) => String(item[column]) === value1).map(({id})=> id);
      if (sessionID.length > 0) sessionStorage.setItem(sessionID + "_Dropdownfilter_Item1", value1);
    } else if (value1?.length === 0) {
      rows = allRecords.filter((item) => String(item[column2]) === value2).map(({id})=> id);
      if (sessionID.length > 0) sessionStorage.setItem(sessionID + "_Dropdownfilter_Item2", value2);
    } else {
      if (type === typeOR) {
        rows = allRecords.filter((item) => String(item[column]) === value1 || String(item[column2]) === value2).map(({id})=> id);
      } else {
        rows = allRecords.filter((item) => String(item[column]) === value1 && String(item[column2]) === value2).map(({id})=> id);
      }
      
      if (sessionID.length > 0) sessionStorage.setItem(sessionID + "_Dropdownfilter_Item1", value1);
      if (sessionID.length > 0) sessionStorage.setItem(sessionID + "_Dropdownfilter_Item2", value2);
    }

    console.log('dropdown res', rows);
    grist.setSelectedRows(rows);
  }
}

function clearsearch() {
  console.log("clear");
  document.getElementById("dropdown1").value = "";
  document.getElementById("dropdown2").value = "";
  selectRows('','', typeAND);
}

function tagclick() {
  const type = document.getElementById("type");
  if (type.innerHTML === typeOR) {
    type.innerHTML = typeAND;
  } else {
    type.innerHTML = typeOR;
  }
  selectRows(document.getElementById('dropdown1').value, document.getElementById('dropdown2').value, document.getElementById("type").innerHTML);
}

function uniq(a) {
  var seen = {};
  return a.filter(function(item) {
      return (seen.hasOwnProperty(item) || item.length <= 0 )? false : (seen[item] = true);
  });
}

document.addEventListener('DOMContentLoaded', initGrist);