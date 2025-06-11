let currentoptions = [];
let allRecords = [];
let sessionID = "";  
let column = "";

function showError(msg) {
  let el = document.getElementById('error');
  if (!msg) {
    el.style.display = 'none';
  } else {
    el.innerHTML = msg;
    el.style.display = 'block';
  }
}

function updateDropdown(options) {
  const uniqoptions = [""].concat(uniq(options).sort());
  
  // if (areArraysEqual(currentoptions, uniqoptions)) {
  //   return;
  // } else {
  //   currentoptions = uniqoptions;
  // }

  const dropdown = document.getElementById('dropdown');
  let currentvalue = uniqoptions.includes(dropdown.value) ? dropdown.value: undefined;
  if (currentvalue === undefined && sessionID.length > 0) {
     //if session ID defined, use it to auto select the dropdown value
    const selection = sessionStorage.getItem(sessionID + "_Dropdownfilter_Item");
    if (selection.length > 0) {
      // const dropdown = document.getElementById('dropdown');
      // dropdown.value = selection;
      // dropdown.dispatchEvent(new Event('change'));
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
    columns: [{ name: "OptionsToSelect", title: 'Options to select', type: 'Any' }],
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
    if (!records || records.length === 0) {
      showError("No records received");
      updateDropdown([]);
      grist.setSelectedRows(null);
      return;
    }
    
    allRecords = records;
    column = mappings.OptionsToSelect;
    const mapped = grist.mapColumnNames(records);

    showError("");
    const options = mapped.map(record => record.OptionsToSelect).filter(option => option !== null && option !== undefined);
    
    if (options.length === 0) {
      showError("No valid options found");
    }
    updateDropdown(options);
    
   
  });

  document.getElementById('dropdown').addEventListener('change', function(event) {  
    selectRows(event.target.value);
    
  });
}

 function selectRows(value) {
  if (value.length === 0) {
    grist.setSelectedRows(null);
  } else {
    const rows = allRecords.filter((item) => item[column] === value).map(({id})=> id);
    if (sessionID.length > 0) sessionStorage.setItem(sessionID + "_Dropdownfilter_Item", value);
    grist.setSelectedRows(rows);
  }  
}

function uniq(a) {
  var seen = {};
  return a.filter(function(item) {
      return (seen.hasOwnProperty(item) || item.length <= 0 )? false : (seen[item] = true);
  });
}

// function areArraysEqual(arr1, arr2) {
//   if (arr1.length !== arr2.length) return false;
//   for (let i = 0; i < arr1.length; i++) {
//       if (arr1[i] !== arr2[i]) {
//           return false;
//       }
//   }
//   return true;
// }

document.addEventListener('DOMContentLoaded', initGrist);