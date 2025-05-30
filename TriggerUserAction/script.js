// Config format: Array of Trigger
// where Trigger is a dictionnary with:
//      type: ['OnNewRow', 'OnDeleteRow', 'OnValueChanged', 'OnSelectionChanged']
//      columnsID: columns ID to survey
//      actions: array of Actions, where Action is an array with:
//          [0] type: 'AddRecord', 'UpdateRecord', 'RemoveRecord'
//          [1] tableID: string ID of the table to be modified, empty = current table
//          [2] rowsID: rows ID that will be updated or deleted, None when add a record
//          [3] data: dictionnary with key:value corresponding to columnName:newValue
let config = [];

// Table data before changes occur. Dictionnary where keys are table columns, and 
// values are arrays of row values.
var tableData;

var rows;



//First save current table state
grist.fetchSelectedTable(format="rows").then((records) => {
    tableData = records;
});
//And save row ids list
grist.fetchSelectedTable(format="columns").then((records) => {
    rows = records['id'];
});

//Then subscribe to grist
grist.ready({requiredAccess: 'full',
    // Register configuration handler to show configuration panel.
    onEditOptions() {
      //showPanel('configuration'); //TODO
    },
  });

// Register onOptions handler.
grist.onOptions((customOptions, _) => {
    customOptions = customOptions || {};
    config = customOptions.config || [
        {
            'type': 'OnNewRow',
            'columnsID': null,
            'actions': [
                ['AddRecord', 'TableID', null, {"ColID": "Value"}],
            ]
        }
    ];
    console.log(config);
    document.getElementById("json").value = JSON.stringify(config);
    //showPanel("chat"); //TODO
  });

// Define handler for the Save button.
function saveOptions() {
    //TODO
    conf = document.getElementById("json").value;
    console.log(conf);
    try {
        config = JSON.parse(conf);
        grist.widgetApi.setOption('config', config).then();
        console.log(config);
    } catch {
        console.error("save config");
    }
    //showPanel('chat');
  }

// Register onRecord    
grist.onRecords(function (records, mappings) {
    //TODO
    console.log(records);
    let new_rows = [];
    let old_rows = [];

    //iterate triggers
    for (const trigger of config) {
        // trigger type
        switch (trigger['type']) {
            case "OnNewRow":
                console.log("OnNewRow");
                //look if new row added
                for (const rec of records) {                    
                    if (!rows.includes(rec['id'])) {
                        //new row added
                        console.log("new row added");  
                        //save the new id
                        new_rows.push(rec['id']);
                        //perform actions
                        doActions(trigger, rec);
                    }
                }
                break;

            case "OnDeleteRow":
                //look if some row removed
                
                break;

            case "OnValueChanged":
                //for each columns, check if any value has changed
                break;

            case "OnSelectionChanged":
                //trigger each time this function is called
                for (const rec of records) {
                    //perform actions
                    doActions(trigger, rec);
                }
                break;
        }
    }

    //First save current table state
    grist.fetchSelectedTable(format="rows").then((records) => {
        tableData = records;
    });
    //And save row ids list
    grist.fetchSelectedTable(format="columns").then((records) => {
        rows = records['id'];
    });

  }, includeColumns="all", keepEncoded=true);

grist.onNewRecord(function () {
    //TODO

  });

// Perform all actions listed in the provided trigger
function doActions(trigger, record) {
    //TODO : replace dynamic values
    console.log("doActions"); 
    
    let text = JSON.stringify(trigger['actions']);

    let obj = /(?<=[$])[_A-Za-z0-9]+/.exec(text);
    while (obj !== null) {
        if (record[obj[0]] !== undefined) {
            text = text.replace('$' + obj[0], record[obj[0]])
        }

        //next one
        obj = /(?<=[$])[_A-Za-z0-9]+/.exec(text);
    }
    data = JSON.parse(text);
    console.log(data);
    //run actions
    grist.docApi.applyUserActions(data);
};
