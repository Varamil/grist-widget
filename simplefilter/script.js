var search_col = [];
var target = "shown";
var placeholder = "";
var helpmsg = "";
var displayall = true;
var defsearchtype = 0;
var cursearchtype = 0;
var savesession = false;
var sessionID = "";
var sessionUUID = "";
var defval = "";
const searchtypes = ["+", "&", "&&"];
// const searchtypesnames = ["OU", "ET", "ET col"];
const searchtypesnames = ["OR", "AND", "AND col"];

const defplaceholder = "Search (? + Enter to get help)" ;
// const defplaceholder = "Recherche (? + Entrer pour obtenir de l'aide)" ;


// const defhelp = `Aide
// Effectue une recherche de type OU des mots listés (séparés par des espaces) dans les différentes colonnes.\n
// • Commencer une recherche par un '&' ⇒ tous les mots doivent être présents dans la ligne
// • Commencer une recherche par '&&' ⇒ tous les mots doivent être présent dans une même colonne
// • '!' avant un mot ⇒ le mot ne doit pas être présent
// • '=', '<' ou '>' avant un mot (et après le '!' s'il y a) ⇒ la cellule doit être exactement égale, commencer par ou terminer par le mot. Avec le '=', remplacer les espaces par '\\s', sinon le mot sera découpé
// • '"..."' ⇒ considère tous ce qu'il y a entre guillemets comme un mot (incluant les espaces)
// • ' avant un mot ⇒ le mot doit être présent de manière indépendante ('eau' ne vérifie pas 'gâteaux')
// • Terminer un mot par '@IdCol1,IdCol2' ⇒ le mot doit être présent dans la liste des colonnes indiquée (séparées par des virgules). Si un mot recherché contient '@', alors ajouter un '@' à la fin pour ignorer
// • Utiliser '@IdCol1,IdCol2' comme mot ⇒ les autres mots ne seront cherchés que dans ces colonnes
// • '/' avant un mot ⇒ utiliser une regex. Utiliser '\\s' pour les espaces, sinon la regex sera découpée
// `

const defhelp = `Help
Performs an OR search of the words listed (separated by spaces) in the various columns.\n
• Start a search with '&' ⇒ all words must be present in the row
• Start a search with '&&' ⇒ all words must be present in the same column
• '!' before a word ⇒ the word must not be present
• '=', '<' or '>' before a word (and after the '!' if present) ⇒ cell must be exactly equal to, begin with or end with the word. With the '=', replace spaces with '\\s', otherwise the word will be split
'"..."' ⇒ considers everything between quotation marks as a word (including spaces)
' before a word ⇒ the word need to be present independently ('ok' doesn't match 'books')
• End a word with '@IdCol1,IdCol2' ⇒ the word must be present in the list of columns indicated (separated by commas). If a searched word contains '@', then add an '@' at the end to ignore it
• Use '@IdCol1,IdCol2' as word ⇒ other words will only be searched in these columns
• '/' before a word ⇒ use a regex. Use '\\s' for spaces, otherwise the regex will be split.
`

//TODO
// xor


//Subscribe to grist
grist.ready({requiredAccess: 'read table', allowSelectBy: true,
    // Register configuration handler to show configuration panel.
    onEditOptions() {
        document.getElementById("search").style.display = 'none';
        document.getElementById("config").style.display = '';

        document.getElementById("target").checked = (target === "normal");
        document.getElementById("empty").checked = (displayall === true);
        document.getElementById("defsearchtype").value = defsearchtype;
        document.getElementById("defval").value = defval;
        document.getElementById("savesession").checked = (savesession === true);
        document.getElementById("sessionID").value = sessionID;
        document.getElementById("columns").value = search_col.join(",");
        document.getElementById("placeholder").value = placeholder;
        document.getElementById("help").value = helpmsg;    
    },
  });

// Register onOptions handler.
grist.onOptions((customOptions, _) => {
    customOptions = customOptions || {};
    search_col = customOptions.search_col || [];
    target = customOptions.target || "shown";
    placeholder = customOptions.placeholder || defplaceholder;
    helpmsg = customOptions.helpmsg || defhelp;
    displayall = (customOptions.displayall === undefined) ? true: customOptions.displayall;
    defsearchtype = customOptions.defsearchtype || 0; 
    savesession = (customOptions.savesession === undefined) ? false: customOptions.savesession;
    sessionID = customOptions.sessionID || "";
    defval = customOptions.defval || "";
    sessionUUID = customOptions.sessionUUID || generateUUID();

    //display
    closeConfig();

    const fl = document.getElementById("filter");
    fl.placeholder = placeholder;
    if (savesession) {
        if (sessionID.length > 0) fl.value = sessionStorage.getItem(sessionID + "_Simple_Filter");
        else fl.value = sessionStorage.getItem(sessionUUID);
    }
    if (fl.value.length === 0) fl.value = defval;

    cursearchtype = searchtypes.indexOf(parsetype(fl.value)[0]);
    console.log(cursearchtype);
    updateTag();

    ApplyFilter();
  });

function saveOption() {
    try {
        if (document.getElementById("target").checked) {
            target = document.getElementById("target").value;
        } else {
            target = "shown";
        }
        grist.widgetApi.setOption('target', target);

        displayall = document.getElementById("empty").checked;
        grist.widgetApi.setOption('displayall', displayall);

        defsearchtype = document.getElementById("defsearchtype").value;
        grist.widgetApi.setOption('defsearchtype', defsearchtype);
        cursearchtype = defsearchtype;
        

        defval = document.getElementById("defval").value;
        grist.widgetApi.setOption('defval', defval);

        savesession = document.getElementById("savesession").checked;
        grist.widgetApi.setOption('savesession', savesession);

        sessionID = document.getElementById("sessionID").value;
        grist.widgetApi.setOption('sessionID', sessionID);
        grist.widgetApi.setOption('sessionUUID', sessionUUID);

        let col = document.getElementById("columns").value.replace(/\s/g, '');
        if (col.length !== 0) {
            search_col = col.split(",");
        } else {
            search_col = [];
        }
        grist.widgetApi.setOption('search_col', search_col)      

        placeholder = document.getElementById("placeholder").value;
        grist.widgetApi.setOption('placeholder', (placeholder === defplaceholder)? null: placeholder);
        document.getElementById("filter").placeholder = placeholder;

        helpmsg = document.getElementById("help").value;
        grist.widgetApi.setOption('helpmsg', (helpmsg === defhelp)? null : helpmsg);

        updateTag();
    } catch {}    
}

function closeConfig() {
    document.getElementById("search").style.display = '';
    document.getElementById("config").style.display = 'none';
}

function onLeave() {
    ApplyFilter();
}

function onKey() {
    if (event.key === 'Enter') {
        ApplyFilter();
    } else {
        const s = event.target.value;
        if (s.startsWith("&&")) {cursearchtype = 2; updateTag();}
        else if (s.startsWith("&")) {cursearchtype = 1; updateTag();}
        else if (s.startsWith("+")) {cursearchtype = 0; updateTag();}
        else  {cursearchtype = defsearchtype; updateTag();}
    }
}

function tagclick() {
    cursearchtype = (cursearchtype + 1) % searchtypes.length;
    updateTag();

    const f = document.getElementById("filter");
    if (f.value.startsWith("&&")) f.value = searchtypes[cursearchtype] + f.value.substring(2);
    else if (f.value.startsWith("&")) f.value = searchtypes[cursearchtype] + f.value.substring(1);
    else if (f.value.startsWith("+")) f.value = searchtypes[cursearchtype] + f.value.substring(1);
    else f.value = searchtypes[cursearchtype] + f.value;
}

function updateTag() {
    document.getElementById("type").innerHTML = searchtypesnames[cursearchtype];
}

function clearsearch() {
    console.log("clear");
    document.getElementById("filter").value = "";
    cursearchtype = defsearchtype;
    updateTag();
    ApplyFilter();
}

function ApplyFilter() {
    try {
        //get serche text
        let search = document.getElementById("filter").value;
        if (savesession) sessionStorage.setItem((sessionID.length > 0)? sessionID + "_Simple_Filter": sessionUUID, search);
        
        //if empty, display all the table
        if (!search || search.trim().length === 0) {
            grist.setSelectedRows(displayall? null: []);
        } else {
            //help
            if (search.startsWith('?')) {
                alert(helpmsg);
                document.getElementById("filter").value = "";
                return;
            }

            // fetch the table
            grist.fetchSelectedTable(format="columns", includeColumns=target).then((records) => {    
                let scol, re, neg, tp, searches, type;

                // get columns names
                let columns;
                if (!search_col || search_col.length === 0) {
                    columns = Object.keys(records).filter((c) => c !== 'id');
                } else {
                    columns = search_col;
                }

                [type, searches] = parseinput(search);

                // custom columns ? **************************************************************
                if (search.includes("@")) {
                    scol = null;
                    let finalsearches = [];
                    for (c of searches) {
                        if (c.startsWith('@')) {
                            scol = [scol, c.substring(1)].join(",");
                        } else {
                            finalsearches.push(c);
                        }
                    }

                    if (finalsearches.length === 0) {
                        grist.setSelectedRows(displayall? null: []);
                        return;
                    } else {
                        searches = finalsearches;
                    }

                    if (scol) {
                        scol = scol.substring(1).split(",");
                    if (scol.length > 0) columns = scol;
                    }                
                }     

                /*if (search.startsWith('/')) {
                    //regex search **************************************************************
                    re = getregex(search);

                    let match = records['id'].filter((id) => {
                        for (c of columns) {
                            if(regex.test(text?.toString())) return true;                  
                        } 

                        return false;
                    });
            
                    grist.setSelectedRows(match);
                
                } else */
                if (type === "&&") {
                    //AND search, all in the same column **************************************************************
                    //let searches = parseinput(search, 2); //search.substring(2).split(" ");

                    let ok;
                    let match = records['id'].filter((idgrist, id) => {
                        for (c of columns) {
                            ok = true;
                            for (s of searches) {
                                [s, re, neg, tp, _] = parsesearch(s, columns);
                                if (neg) {
                                    if (matchtxt(records[c][id], s, re, tp)){ //(records[c][id-1]?.toString().toLowerCase().includes(s))
                                        ok = false;
                                        break;
                                    }
                                } else {
                                    if (!matchtxt(records[c][id], s, re, tp)){
                                        ok = false;
                                        break;
                                    }
                                }                            
                            }
                            if (ok) return true;                   
                        } 

                        return false;
                    });
            
                    grist.setSelectedRows(match);
                } else if (type === "&") {
                    //AND search with matches in any column **************************************************************
                    //let searches = parseinput(search, 1); //search.substring(1).split(" ");                

                    let match = records['id'].filter((idgrist, id) => {
                        let matches = [];

                        for (si in searches) {
                            let s = searches[si];
                            [s, re, neg, tp, scol] = parsesearch(s, columns);
                            if (neg) {
                                matches.push(true)

                                for (c of scol) {
                                    if (matchtxt(records[c][id], s, re, tp))  {
                                        matches[si] = false;
                                        break;
                                    }
                                }
                            } else {
                                matches.push(false)
                                for (c of scol) {
                                    if (matchtxt(records[c][id], s, re, tp))  {
                                        matches[si] = true;
                                        break;
                                    }
                                }
                            }                        
                        }
                        
                        return !matches.includes(false);
                    });
            
                    grist.setSelectedRows(match);
                } else {
                    //OR **************************************************************
                    //let searches = parseinput(search); //search.split(" ");

                    let match = records['id'].filter((idgrist, id) => {
                        for (s of searches) {
                            [s, re, neg, tp, scol] = parsesearch(s, columns);
                            if (neg) {
                                let ok = true;
                                for (c of scol) {
                                    if (matchtxt(records[c][id], s, re, tp)) {
                                        ok = false
                                        break;
                                    };
                                } 
                                if (ok) return true; //the word is no where, so this part is true
                            } else {
                                for (c of scol) {
                                    if (matchtxt(records[c][id], s, re, tp)) return true;                                    
                                } 
                            }                                               
                        } 
                        return false;
                    });
            
                    grist.setSelectedRows(match);
                }            
            });
        }
    } catch {
        grist.setSelectedRows([]);
    }   
}

function matchtxt(text, value, regex, tp) {
    if (regex) {
        return regex.test(text?.toString())
    } else  {
        switch (tp) {
            case '=':
                return text?.toString().toLowerCase() === value;      
            case '<':
                return text?.toString().toLowerCase().startsWith(value);
            case '>':
                return text?.toString().toLowerCase().endsWith(value);
            default:
                return text?.toString().toLowerCase().includes(value);
        }        
    }
}

function getregex(text) {
    if (text.startsWith('/')) {
        let r = text.split("/");
        const opt = r.pop();
        if (r.length > 2) {
            return new RegExp(r.join("/").substring(1), opt.length > 0 ? opt : 'im');
        } else {
            return new RegExp(opt, 'im'); //only one / at start
        }        
    } else {
        return null;
    }
}

function gettype(text) {
    let neg = false;
    if (text.startsWith('!')) {
        neg = true;
        text = text.substring(1);
    }

    switch (text.substring(0, 1)) {
        case '=':
            return [text.substring(1), neg, '='];        
        case '<':
            return [text.substring(1), neg, '<'];
        case '>':
            return [text.substring(1), neg, '>'];
        case "'":
            return ["/\\b" + text.substring(1).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "\\b", neg, ""];
        default:
            return [text, neg, ''];
    }
}

function parsesearch(text, columns) {
    let c = text.split("@");
    if (c.length > 1) {
        const col = c.pop();;
        c = gettype(c.join("@"));
        return [c[0].toLowerCase(), getregex(c[0]), c[1], c[2], col.length > 0 ? col.split(",") : columns];
    } else {
        c = gettype(text);
        return [c[0].toLowerCase(), getregex(c[0]), c[1], c[2], columns];
    }
}

function parsetype(input) {
    if (input.startsWith('&&')) return ["&&", 2];
    else if (input.startsWith('&')) return ["&", 1];
    else if (input.startsWith('+')) return ["+", 0];
    else if (input.startsWith('@')) return ["@", 1];
    else return [searchtypes[defsearchtype], 0];
}

function parseinput(input) {
    let quote = false;
    let data = [];
    let word = "";
    let type;
    let start;

    [type, start] = parsetype(input);
    //if (input.startsWith('/')) {type = "/"; start = 1;} 
    // if (input.startsWith('&&')) {type = "&&"; start = 2;}
    // else if (input.startsWith('&')) {type = "&"; start = 1;}
    // else if (input.startsWith('+')) {type = ""; start = 1;}
    // else if (input.startsWith('@')) {type = "@"; start = 1;}
    // else {type = defsearchtype; start = 0;}


    for (let i = start; i < input.length; i++) {
        if (input[i] === " " && !quote) {
            if (word.length > 0) {
                data.push(word);
                word = "";
            }
        } else if (input[i] === '"') {
            quote = !quote;
        } else if(input[i] === '\\') {
            if (i < input.length && input[i+1] === '"') {
                word += '"';
                i++; //jump next
            }
        } else {
            word += input[i];
        }
    }

    //last word
    if (word.length > 0) data.push(word);

    return [type, data];
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}