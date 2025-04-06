var search_col = [];
var target = "shown";
var placeholder = "";
var helpmsg = "";
const defplaceholder = "Search (? + Enter to get help)" ;
// const defplaceholder = "Recherche (? + Entrer pour obtenir de l'aide)" ;


// const defhelp = `Aide
// Effectue une recherche de type OU des mots listés (séparés par des espaces) dans les différentes colonnes.\n
// • Commencer une recherche par un '&' ⇒ tous les mots doivent être présents dans la ligne
// • Commencer une recherche par '&&' ⇒ tous les mots doivent être présent dans une même colonne
// • Commmencer une recherche par '/' ⇒ faire une recherche par expression régilière (regex). Utilise directement le format JavaScript\n
// • '!' avant un mot ⇒ le mot ne doit pas être présent
// • '=', '<' ou '>' avant un mot (et après le '!' s'il y a) ⇒ la cellule doit être exactement égale, commencer par ou terminer par le mot. Avec le '=', remplacer les espaces par '\\s', sinon le mot sera découpé
// • Terminer un mot par '@IdCol1,IdCol2' ⇒ le mot doit être présent dans la liste des colonnes indiquée (séparées par des virgules). Si un mot recherché contient '@', alors ajouter un '@' à la fin pour ignorer
// • Utiliser '@IdCol1,IdCol2' comme mot ⇒ les autres mots ne seront cherchés que dans ces colonnes
// • '/' avant un mot ⇒ utiliser une regex. Utiliser '\\s' pour les espaces, sinon la regex sera découpée
// `

const defhelp = `Help
Performs an OR search of the words listed (separated by spaces) in the various columns.\n
• Start a search with '&' ⇒ all words must be present in the row
• Start a search with '&&' ⇒ all words must be present in the same column
• Start search with '/' ⇒ search by regular expression (regex). Uses JavaScript format directly\n
• '!' before a word ⇒ the word must not be present
• '=', '<' or '>' before a word (and after the '!' if present) ⇒ cell must be exactly equal to, begin with or end with the word. With the '=', replace spaces with '\\s', otherwise the word will be split
• End a word with '@IdCol1,IdCol2' ⇒ the word must be present in the list of columns indicated (separated by commas). If a searched word contains '@', then add an '@' at the end to ignore it
• Use '@IdCol1,IdCol2' as word ⇒ other words will only be searched in these columns
• '/' before a word ⇒ use a regex. Use '\\s' for spaces, otherwise the regex will be split.
`

//Subscribe to grist
grist.ready({requiredAccess: 'read table', allowSelectBy: true,
    // Register configuration handler to show configuration panel.
    onEditOptions() {
        const fl = document.getElementById("filter");
        fl.value = fl.placeholder;
        fl.placeholder = "";
        document.getElementById("columns").style.display = '';
        document.getElementById("columns").value = search_col.join(",");      
        document.getElementById("target").style.display = '';
        document.getElementById("target").checked = (target === "normal");
        document.getElementById("labtarget").style.display = '';
        document.getElementById("help").style.display = '';
        document.getElementById("help").value = helpmsg;    
        document.getElementById("save").style.display = '';
    },
  });

// Register onOptions handler.
grist.onOptions((customOptions, _) => {
    customOptions = customOptions || {};
    search_col = customOptions.search_col || [];
    target = customOptions.target || "shown";
    placeholder = customOptions.placeholder || defplaceholder;
    helpmsg = customOptions.helpmsg || defhelp;

    document.getElementById("save").style.display = 'none';
    document.getElementById("columns").style.display = 'none';
    document.getElementById("target").style.display = 'none';
    document.getElementById("labtarget").style.display = 'none';
    document.getElementById("help").style.display = 'none';
    const fl = document.getElementById("filter");
    fl.placeholder = placeholder;
    fl.value = "";
  });

function saveOption() {
    try {
        let col = document.getElementById("columns").value.replace(/\s/g, '');
        if (col.length !== 0) {
            search_col = col.split(",");
        } else {
            search_col = [];
        }
        grist.widgetApi.setOption('search_col', search_col)

        if (document.getElementById("target").checked) {
            target = document.getElementById("target").value;
        } else {
            target = "shown";
        }
        grist.widgetApi.setOption('target', target);

        placeholder = document.getElementById("filter").value;
        grist.widgetApi.setOption('placeholder', (placeholder === defplaceholder)? null: placeholder);

        helpmsg = document.getElementById("help").value;
        grist.widgetApi.setOption('helpmsg', (helpmsg === defhelp)? null : helpmsg);
    } catch {}    
}

function onLeave() {
    ApplyFilter();
}

function onKey() {
    if (event.key === 'Enter') {
        ApplyFilter();
    }   
}

function ApplyFilter() {
    try {
        //get serche text
        let search = document.getElementById("filter").value;
        
        //if empty, display all the table
        if (!search || search.trim().length === 0) {
            grist.setSelectedRows(null);
        } else {
            //help
            if (search.startsWith('?')) {
                alert(helpmsg);
                document.getElementById("filter").value = "";
                return;
            }

            // fetch the table
            grist.fetchSelectedTable(format="columns", includeColumns=target).then((records) => {    
                let scol;
                let re;
                let neg;
                let tp;

                // get columns names
                let columns;
                if (!search_col || search_col.length === 0) {
                    columns = Object.keys(records).filter((c) => c !== 'id');
                } else {
                    columns = search_col;
                }

                // custom columns ?
                if (search.includes("@")) {
                    scol = null;
                    let finalsearches = [];
                    for (c of search.split(" ")) {
                        if (c.startsWith('@')) {
                            scol = [scol, c.substring(1)].join(",");
                        } else {
                            finalsearches.push(c);
                        }
                    }

                    if (finalsearches.length === 0) {
                        grist.setSelectedRows(null);
                        return;
                    } else {
                        search = finalsearches.join(" ");
                    }

                    if (scol) {
                        scol = scol.substring(1).split(",");
                    if (scol.length > 0) columns = scol;
                    }                
                }       

                if (search.startsWith('&&')) {
                    //AND search, all in the same column
                    let searches = search.substring(2).split(" ");

                    let ok;
                    let match = records['id'].filter((id) => {
                        for (c of columns) {
                            ok = true;
                            for (s of searches) {
                                [s, re, neg, tp, _] = parsesearch(s, columns);
                                if (neg) {
                                    if (matchtxt(records[c][id-1], s, re, tp)){ //(records[c][id-1]?.toString().toLowerCase().includes(s))
                                        ok = false;
                                        break;
                                    }
                                } else {
                                    if (!matchtxt(records[c][id-1], s, re, tp)){
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
                } else if (search.startsWith('&')) {
                    //AND search with matches in any column
                    let searches = search.substring(1).split(" ");                

                    let match = records['id'].filter((id) => {
                        let matches = [];

                        for (si in searches) {
                            let s = searches[si];
                            [s, re, neg, tp, scol] = parsesearch(s, columns);
                            if (neg) {
                                matches.push(true)

                                for (c of scol) {
                                    if (matchtxt(records[c][id-1], s, re, tp))  {
                                        matches[si] = false;
                                        break;
                                    }
                                }
                            } else {
                                matches.push(false)
                                for (c of scol) {
                                    if (matchtxt(records[c][id-1], s, re, tp))  {
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
                    //OR
                    let searches = search.split(" ");
                    let match = records['id'].filter((id) => {
                        for (s of searches) {
                            [s, re, neg, tp, scol] = parsesearch(s, columns);
                            if (neg) {
                                let ok = true;
                                for (c of scol) {
                                    if (matchtxt(records[c][id-1], s, re, tp)) {
                                        ok = false
                                        break;
                                    };
                                } 
                                if (ok) return true; //the word is no where, so this part is true
                            } else {
                                for (c of scol) {
                                    if (matchtxt(records[c][id-1], s, re, tp)) return true;
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
            return [text.substring(1).replace(/(?<![\\])[\\]s/gim, " "), neg, '='];        
        case '<':
            return [text.substring(1), neg, '<'];
        case '>':
            return [text.substring(1), neg, '>'];
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