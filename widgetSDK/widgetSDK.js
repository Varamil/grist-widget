import ColMetaFetcher from './ColMetaFetcher.js';
import './widgetSDK.css';

// Config
// object
//  configID : container id for config
//  mainViewID : container id for the main viex
//  parameters Array[Object]: item = 1 paramètre de config
//      id : identifiant (html, grist...)
//      title : titre
//      subtitle : short description
//      description : long detailled explaination
//      default : default value => gives the type
//      type : boolean, number, string, longstring, dropdown, object=>JSON
//      values : for select : Array, lookup
//      format : function to format the raw value to a standard
//      parse : function to format a standard value into raw value
//      group : group title 
//      hidden: true to not display it in UI
//      template : Config Object (in group) or Array of Config Object (1 group dedicated)
//  events : 
//      onChange : event triggered when value is changed in the config
//      onLoad : event triggered config is loaded
//  opt : build object based on parameters with current values
//  col : current table columns meta data
//  meta : all grist culumns meta data (used mainly for references)
//  valuesList : Object of Array to access dynamic list associated to an option (from reference, choice, or user defined)

/**  */
export default class WidgetSDK {
    constructor() {
        console.log("WidgetSDK: 1.2.0.60");
        const urlParams = new URLSearchParams(window.location.search);
        this.cultureFull = urlParams.has('culture')?urlParams.get('culture'):'en-US';
        this.culture = this.cultureFull.split('-')[0];
        this.currency = urlParams.has('currency')?urlParams.get('currency'):'USD';
        this.timeZone = urlParams.has('timeZone')?urlParams.get('timeZone'):'';
        this._gristloaded = false;
        this._optloaded = false;
        this._ismapped = false;
        this.initDone = false;
        this.urlSDK = 'https://varamil.github.io/grist-widget/widgetSDK';

        grist.on('message', async (e) => {
            if (e.fromReady) {this._gristloaded = e.fromReady;}
          });
    }

    //==========================================================================================
    // Commons
    //==========================================================================================
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    triggerEvent(event, args) {
        if (this.events['on' + event]) {
            this.events['on' + event].apply(this, args);
        }
    }

    /** Returns true is not undefined and not nul */
    is(value) {
        return !(value === undefined || value === null);
    }

    /** Provide a Promise that resolved when the full widget configuration and grist are loaded */
    async isLoaded() {
        return new Promise(async (resolved, rejected) => {
            try {
                if (this.meta) {
                    while(!this.meta.isLoaded()) { //checked every time because may change at any time
                        await WidgetSDK.sleep(50);
                    }
                    this.col = this.mapColumnNames(await this.meta.getMeta());
                } 
                if (this.opt) {                    
                    while(!this._optloaded) {
                        await WidgetSDK.sleep(50);
                    }
                }
                while(!this._gristloaded) {
                    await WidgetSDK.sleep(50);
                }
                resolved(true);
            } catch (err) { 
                rejected(err);
            }
        });
    }

    /**  */
    async isInit() {
        if (this.initDone && await this.isLoaded())
            return new Promise(resolve => resolve(true));
        else 
            return new Promise(async (resolved, rejected) => {
                try {
                    await this.isLoaded();
                    while(!this.initDone) {
                        await WidgetSDK.sleep(50);
                    }
                    resolved(true);
                } catch (err) { 
                    rejected(err);
                }
            });
    }

    async isMapped() {
        if (!this.meta || this._ismapped) 
            return new Promise(resolve => resolve(true));
        else {
            return new Promise(async (resolved, rejected) => {
                try {
                    while(!this._ismapped) {
                        await WidgetSDK.sleep(50);
                    }
                    resolved(true);
                } catch (err) { 
                    rejected(err);
                }
            });
        }
    }

    /** Manage the parsing of a reference or a list into an Array */
    async getLookUpData(target) {        
        if (!target) return [];
        if (Array.isArray(target)) {
            return target.sort();
        } else if (!target.trim()) { //manage empty string
            return [];
        } else if (target.startsWith("$")) {
            target = target.substring(1); //remove the first $
            let data = target.split(".");
            if (data.length === 1) {
                //Only a ref to a table => 1st column used 
                let records = await grist.docApi.fetchTable(data[0]);
                let colonne = Object.keys(records || {}).filter(k => k !== 'id' && k !== 'manualSort');          
                if (colonne.length > 0)
                    return [""].concat(records[colonne[0]].filter(item => item.length > 0).sort());
                else
                    return [];
            } else if (data.length > 1) {
                //Ref to a table + ref to a column 
                let records = await grist.docApi.fetchTable(data[0]);
                records = records[data[1]];
                if (records)
                    return [""].concat(records.filter(item => item.length > 0).sort());
                else
                    return [];
            } else {
                return [target];
            }
        } else {
            return [""].concat(target.split(";").filter(item => item.length > 0).sort());
        }    
    }

    /** Function that mimics basic GNU/Linux grep command;
     * @param  {String} multiLineString      The multiline string
     * @param  {String} patternToSearch      The RegEx pattern to search for
     * @return {Array}                       An Array containing all the matching row(s) for patternToSearch in multiLineString
     */
    grep(string, patternToSearch) {
        var regexPatternToSearch = new RegExp(patternToSearch, "img");
        return string.match(regexPatternToSearch);
    }


    /** Checks if a file exist on server side
     * @param {string} url - absolute or relative url
     */
    urlExists(url)
    {
        if (!url) return false;
        var http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status!=404;
    }

    /** Assign sources properties to the target only if they are defined (i.e. if(value) is true) */
    assignDefined(target, ...sources) {
        if (target) {
            for (const src of sources) {
                for (const [k,v] of Object.entries(src)) {
                    if (v) target[k] = v;
                }
            }
        }        
        return target;
    }

    /** Check if an object has defined properties (i.e. null, undefined, ''... are ignored) */
    isObjectEmpty(value) {
        for (let prop in value) {
            if (value.hasOwnProperty(prop) && prop) return false;
        }
        return true;
    }


    //==========================================================================================
    // Localization
    //==========================================================================================

    /** Load translation data
     * @param {Array<string>} files - List of files that use the translation. Use relative path to the main script
     * @param {string} [lang='en'] - Default language used to write keys
     * @param {string|Object} [json=null] - Path to the json file to be loaded, or the i18n object directly
     * @returns function to use for translation
     */
    async loadTranslations(files = [], lang = 'en', json = null){
        this.translatedFiles = files;
        this.translatedFiles.push(this.urlSDK + '/min/widgetSDK.umd.js');

        if (!json || typeof json === 'string') {
            json=json?json:('i18n/' + this.culture + '.json');
            if (lang !== this.culture && this.urlExists(json)) {
                let response = await fetch(json);
                if (response.ok) {
                    const data = await response.text();            
                    this.I18N = JSON.parse(data);
                } // use default          
            }      
        } else if (typeof json === 'object') {
            this.I18N = json;
        }
        else 
            console.error("Loading translation error");

        if (lang !== this.culture && this.urlExists(this.urlSDK + '/i18n/' + this.culture + '.json')) {
            let response = await fetch(this.urlSDK + '/i18n/' + this.culture + '.json');
            if (response.ok) {
                const data = await response.text();            
                this.assignDefined(this.I18N, JSON.parse(data));
            } 
        }
        
        if (!this.I18N) this.I18N = {}; 
        return this.t.bind(this);
    }

    /** Provide translated text 
     * @param {string|Array<string>} text - Original text
     * @param {object} [args=null] - Dynamic text to replace 
    */
    t(text, args = null) {
        if (Array.isArray(text)) {
            return text.map(txt => this.t(txt, args));
        } else {
            let trans = text.replaceAll('\n', '\\n').replaceAll('  ', ' ');
            trans = this.I18N[trans] || text; //TODO if '' ?
            if (args) {
                Object.entries(args).forEach(([k,v]) => {
                    trans = trans.replaceAll('%' + k, v);
                });
            }
            return trans.replaceAll('\\n', '\n');
        }           
    }

    /** Load listed files and look for translation function 
     * @param {Array<string>} files - List of files to load and analyze
     * @param {string} [f='t'] - The translation function name used
    */
    async extractTranslations(files, f = 't' ) {
        let loc = {};
        await Promise.all(files.map(async file => {
            let rep = await fetch(file);
            if (rep.ok) {
                rep = await rep.text();
                let data;
                ["'", '"', '`'].forEach(q => {
                    data = this.grep(rep, `(?<=[^a-zA-Z0-9_]${f}[(])${q}(.*?)(?<!\\\\)${q}(?=[),])`);
                    if (data) {
                        data = data.map(d => [d.replace(/^['"`]|['"`]$/g, ''), '']);
                        loc = {...loc, ...Object.fromEntries(data)};
                    }                    
                });                
            }            
        }));

        if (this._parameters) {
            this._parameters.forEach(opt => loc = {...loc, ...this.getOptionStrings(opt)});
        }

        if (this.I18Ngrist) {
            loc = {...loc, ...this.I18Ngrist};
        }
 
        return loc;
    }

    /** Get all options strings (for translation purpose)
     * @param {Object} opt - Option to get strings 
     */
    getOptionStrings(opt) {
        let i18n = {}
        if (opt) {            
            if (opt.title) i18n[opt.title] = '';
            if (opt.subtitle) i18n[opt.subtitle] = '';
            if (opt.description) i18n[opt.description] = '';
            if (opt.group) i18n[opt.group] = '';
            if (opt.template) {
                if (Array.isArray(opt.template))
                    opt.template.forEach(t => i18n = {...i18n, ...this.getOptionStrings(t)});
                else
                    i18n = {...i18n, ...this.getOptionStrings(opt.template)};
            }
        }
        return i18n;
    }

    saveTranslations() {
        
    }

    //==========================================================================================
    // Columns Meta Data
    //==========================================================================================

    /** Initialize column meta data fetcher */
    initMetaData(noRecord = false) {
        this.meta = new ColMetaFetcher();
        if(noRecord) this._ismapped = true;
        return this.meta;
    }

    /** Save mappings and map records
     * @param {*} records - raw records provided by grist.onRecords
     * @param {*} mappings - mappings provided by grist.onRecords
     * @returns mapped records
     */
    async mapData(rec, map, mapdata = false){
        this.dataMapped = mapdata;
        return new Promise(async resolve => {
            if(map) this.map = map;
            await this.mapOptions();            
            if (this.meta && mapdata && this.col) {                
                let r = this.mapColumnNames(rec); //this.mapColumnNames(rec);

                let fetch = {};
                if (Array.isArray(r)) {
                    //format:rows => r = Array                    
                    // need to await this map, else code will continue before reference will be managed
                    await Promise.all(Object.entries(this.col).map( ([c,v]) => {
                        return new Promise(async res => {
                            if (v) {
                                if (Array.isArray(v)) {
                                    await Promise.all(v.map(async sv => {
                                        await this.#mapRowData(fetch, r, c, sv);
                                    }));
                                } else {
                                    await this.#mapRowData(fetch,r, c, v);
                                }                                    
                            }
                            res(true);
                        });
                    }));            
                } else {
                    //format:columns => r = Object
                    // need to await this map, else code will continue before reference will be managed
                    await Promise.all(Object.entries(this.col).map(async ([c,v]) => {
                        if (v) {
                            if (Array.isArray(v)) {
                                await Promise.all(v.map(async sv => {
                                    await this.#mapColumnData(fetch,r, c, sv);
                                }));
                            } else {
                                await this.#mapColumnData(fetch,r,c,v);
                            }
                        }
                    }));
                }
                this._ismapped = true;
                resolve(r);
            }
            this._ismapped = true;
            resolve(this.mapColumnNames(rec, map));
        });        
    }

    async #mapRowData(f, r, c, v) {
        const t = v.type.split(':');
        if ((t[0] === 'RefList' || t[0] === 'Ref') && v.visibleCol > 0) {                                
            if (!f[t[1]]) f[t[1]] = await grist.docApi.fetchTable(t[1]);                               
            const cmeta = await v.getMeta(v.visibleCol);
            r = r.map(async item => {
                item[c] = await v.parse(item[c], f[t[1]], cmeta);
                item[c + '_id'] = await v.parseId(item[c], f[t[1]], cmeta);
                return item;
            });                                        
        } else {
            r = r.map(async item => {
                item[c] = await v.parse(item[c]);
                return item;
            });
        }

        r = await Promise.all(r); // need to wait at each loop, else item will be a Promise for the next loop
    }

    async #mapColumnData(f, r, c, v) {
        const t = v.type.split(':');
        if ((t[0] === 'RefList' || t[0] === 'Ref') && v.visibleCol > 0) { 
            if (!f[t[1]]) f[t[1]] = await grist.docApi.fetchTable(t[1]);                               
            const cmeta = await v.getMeta(v.visibleCol);
            r[c + '_id'] = r[c].map(async item => await v.parseId(item, f[t[1]], cmeta));
            r[c] = r[c].map(async item => await v.parse(item, f[t[1]], cmeta));                                
            r[c + '_id'] = await Promise.all(r[c + '_id']); 
        } else {                                
            r[c] = r[c].map(async item => await v.parse(item));
        }  
        r[c] = await Promise.all(r[c]);    
    }

    /** Encode data to prepare them before sending to Grist. Manage properly references 
     * @param {*} rec - Array of data (object) or record ({id: 0, fields:{data}})
     * @returns same object but with data properly encoded
    */
    async encodeData(rec) {
        return new Promise(async resolve => {
            if (this.meta && this.col) {
                let fetch = {};
                if (Array.isArray(rec)) { // array of records
                    await Promise.all(Object.entries(this.col).map(([c,vc]) => {
                        return new Promise(async res => {
                            if (vc) {
                                if (!Array.isArray(vc)) vc = [vc];
                                await Promise.all(vc.map(async v => {
                                    const t = v.type.split(':');
                                    
                                    if ((t[0] === 'RefList' || t[0] === 'Ref') && v.visibleCol > 0) {    
                                        if (!fetch[t[1]]) fetch[t[1]] = await grist.docApi.fetchTable(t[1]);                               
                                        const cmeta = await v.getMeta(v.visibleCol);

                                        rec = rec.map(async r => {
                                            if (r.fields)
                                                if (this.is(r.fields[c])) r.fields[c] = await v.encode(r.fields[c], fetch[t[1]], cmeta);
                                            else 
                                                if (this.is(r[c])) r[c] = await v.encode(r[c], fetch[t[1]], cmeta);
                                            return r;
                                        });
                                        
                                    } else {
                                        rec = rec.map(async r => {
                                            if (r.fields)
                                                if (this.is(r.fields[c])) r.fields[c] = await v.encode(r.fields[c]);
                                            else 
                                            if (this.is(r[c])) r[c] = await v.encode(r[c]);
                                            return r;
                                        });
                                    }
                                    rec = await Promise.all(rec); // need to wait at each loop, else item will be a Promise for the next loop
                                }));                                
                            }
                            res(true);
                        });
                    }));
                } else { // one record
                    let r = rec.fields ?? rec // one full record {id: i, fields:{data}} OR one record with data only                    
                    // need to await this map, else code will continue before reference will be managed
                    await Promise.all(Object.entries(this.col).map(async ([c,vc]) => {
                        if (vc && this.is(r[c])) {
                            if (!Array.isArray(vc)) vc = [vc];
                            await Promise.all(vc.map(async v => {
                                const t = v.type.split(':');
                                if ((t[0] === 'RefList' || t[0] === 'Ref') && v.visibleCol > 0) {
                                    if (!fetch[t[1]]) fetch[t[1]] = await grist.docApi.fetchTable(t[1]);                               
                                    const cmeta = await v.getMeta(v.visibleCol);
                                    r[c] = await v.encode(r[c], fetch[t[1]], cmeta);
                                } else {
                                    r[c] = await v.encode(r[c]);
                                } 
                            }));                                  
                        }
                    }));
                    if (rec.fields) rec.fields = r;
                    resolve(rec)
                }
            }
            resolve(rec); //else nothing to do
        });
    }

    //==========================================================================================
    // Settings
    //==========================================================================================

    /** Initialize Options management 
     * @param {(object|[object])} para - Options configuration object
     * @param {(string|HTMLElement)} [configID='#config-view'] 
     * @param {(string|HTMLElement)} [mainViewID='#main-view'] 
     * @param {object} [events={}] 
    */
    configureOptions(para, configID = '#config-view', mainViewID = '#main-view', events = {}) {   
        // Look for configID
        // CSS Selector is passed
        if (typeof configID === 'string') {
            let el = document.querySelector(configID);
            if (!el) {
                throw new ReferenceError(
                    `CSS selector "${configID}" could not be found in DOM`,
                );
            }
            configID = el;
        }
        if (configID instanceof HTMLElement) {
            this._config = configID;
        } else {
            throw new TypeError(
                "Widget Config only supports usage of a string CSS selector or HTML DOM element element for the 'configID' parameter",
            );
        }
        // Look for mainViewID
        if (typeof mainViewID === 'string') {
            let el = document.querySelector(mainViewID);
            if (!el) {
                throw new ReferenceError(
                    `CSS selector "${mainViewID}" could not be found in DOM`,
                );
            }
            mainViewID = el;
        }
        if (mainViewID instanceof HTMLElement) {
            this._mainview = mainViewID;
        } else {
            this._mainview = null;
        }
        // Check parameters
        if (!para) {
            throw new TypeError(
                "Parameters argument for Widget Config is not defined ",
            );
        }
        if (!Array.isArray(para)) para = [para];
        this._parameters = para;        
        this.parseOptions(this._parameters);        
        this.#reset();

        if (!this._config.classList.contains('grist-config'))
            this._config.classList.add('grist-config'); 
        
        this.events = events;
        grist.onOptions(function(customOptions, _) {
            this.loadOptions(customOptions);
        }.bind(this));
        grist.on('message', async (e) => {
            if (!this._optloaded && e.fromReady) {this.loadOptions(await grist.widgetApi.getOptions())}
          });
    }

    /** Provide a simple setting option 
     * @param {string} id - Unique id to identify the option, use only alpha numeric caracters
     * @param {*} defValue - Default value to assign to the option
     * @param {string} title - Main string used to present the option to the user
     * @param {string} [subtitle=undefined] - Short description for the option
     * @param {string} [group=''] - Group name to attach the option
    */
    static newItem(id,  defValue, title, subtitle=undefined, group = '', others = {}) {
        return {id: id, default:defValue, title:title, subtitle:subtitle, group:group, ...others};
    }    

    /** Define handler for options changed trigger */
    onOptChange(handler) {
        if (typeof handler === 'function') this.events.onChange = handler;
    }

    /** Define handler for options loaded trigger */
    onOptLoad(handler) {
        if (typeof handler === 'function') this.events.onLoad = handler;
    } 

    parseOptions(options) {        
        options.forEach(opt => {
            if (this.is(opt.template)) {
                if (Array.isArray(opt.template)) {
                    opt.type = 'templateform';
                    opt.collapse = true;
                    opt.inbloc = true;
                    opt.default = {};
                    opt.template.forEach(t => {
                        this.#parseOption(t);
                        opt.default[t.id] = t.default;
                        //t.id=opt.id;
                    });                    
                } else { //object
                    opt.type = 'template';
                    opt.collapse = true;
                    opt.inbloc = true;
                    this.#parseOption(opt.template); 
                    opt.default = opt.template.default;
                    //opt.template.id = opt.id;                 
                }
            } else {
                this.#parseOption(opt);
            }            
        });
    }

    #parseOption(opt) {
        if (!this.is(opt.type)) {
            if(opt.columnId) {
                opt.type = 'dropdown';
            } else if(typeof opt.default === 'boolean') {
                opt.type = 'boolean';
            } else if (typeof opt.default === 'number') {
                opt.type = !this.is(opt.values) ? 'number': 'dropdown';
            } else if (typeof opt.default === 'object') {
                if (opt.label && opt.event) opt.type = 'button';
                else opt.type = 'object'; //Array.isArray(opt.default)? 'array':
            } else { //if (typeof opt.default === 'string') {
                opt.type = !this.is(opt.values) ? 'string': 'dropdown';
            }
        } // else let it as it is
        // collapsible ?
        opt.inbloc = opt.type === 'longstring' || opt.type === 'object' || opt.type === 'template' || opt.type === 'templateform';
        opt.collapse = (this.is(opt.description) && opt.description.trim().length > 0) || opt.inbloc;
    }

    /** Load options from Grist into the object
     * @param {object} options - Grist object provided by grist.onOptions or grist.widgetApi.getOptions()
     */
    async loadOptions(options) {
        this._optloaded = false;
        try {
            options = options || {};
            // Options
            const widget = options.options || {};
            this._parameters.forEach(opt => {
                this.opt[opt.id] = widget[opt.id] ?? (opt.type === 'template' || opt.type === 'templateform' ? []:opt.default);                
            });
            // Localization
            if (this.I18N) {
                this.I18Nuser = options.localization || {};
                this.assignDefined(this.I18N, this.I18Nuser);
            }

            this.triggerEvent('OptLoad', [this.opt]);
        } catch (err) {
            console.error('Error occurs on loading options:', err);
        }
        this._optloaded = true;
    }

    async mapOptions() {
        if (this._parameters) {
            //Wait for loading and mapping
            await this.isLoaded();

            this.valuesList = {};

            this._parameters.forEach(async opt => {                
                let values;
                if (opt.columnId) {
                    const cmeta = await this.col[opt.columnId];
                    values = await cmeta?.getChoices();
                    if(!values && opt.type !== 'template' && opt.type !== 'templateform') values = await this.getLookUpData(this.opt[opt.id]);   
                } else if (opt.values) {
                    values = Array.isArray(opt.values) ? opt.values : await this.getLookUpData(opt.values);                    
                }

                this.valuesList[opt.id] = (values && values.length > 0) ? values : undefined;
                if(opt.type === 'template' || opt.type === 'templateform') {
                    if ((values)) {
                        const count = this.opt[opt.id].length;
                        this.opt[opt.id].length = values.length;
                        if (count < values.length) {
                            this.opt[opt.id].fill((opt.type === 'template'? opt.default:{...opt.default}), count); //TODO if default is object ?
                        }
                    } else {
                        this.opt[opt.id] = [];
                    }
                }
            });
            await Promise.all(this._parameters);
        }
    }

    /** Called when configuration modification is applied */
    async saveOptions() {
        try {
            this._parameters.forEach(opt => {
                const elmt = this._config.querySelector('#' + opt.id);
                if (elmt) {
                    this.opt[opt.id] = this.#getOptValue(opt, elmt, this.opt[opt.id]);              
                }
            });    
            await grist.widgetApi.setOption('options', this.opt);

            const i18n =this.getUserTranslations();
            if (!this.isObjectEmpty(i18n)) {
                this.I18Nuser = i18n;
                this.assignDefined(this.I18N, i18n);
                await grist.widgetApi.setOption('localization', i18n);
            }

            this.showConfig(false);
            this.triggerEvent('OptChange', [this.opt]);
        } catch (err) {
            console.error('Error occurs on saving options:', err);
        }        
    }

    async readOptionValues(options, view, values) {
        if(!values) values = {};
        options.forEach(opt => {
            const elmt = view.querySelector('#' + opt.id);
            if (elmt) {
                values[opt.id] = this.#getOptValue(opt, elmt, values[opt.id]);              
            }
        });   
        return values;
    }

    #reset() {
        this.opt = {};
        this._parameters.forEach(opt => {
            this.opt[opt.id] = (opt.type === 'template' || opt.type === 'templateform' ? []:opt.default);
        });
    }

    /** Reset all options to default values */
    async resetOptions() {
        this.#reset();
        await this.mapOptions();
        await grist.widgetApi.setOption('options', this.opt);
        await grist.widgetApi.setOption('localization', {});
        this.showConfig(false);
        this.triggerEvent('OptChange', [this.opt]);
    }

    /** Manage the display of the config form */
    async showConfig(show = true) {
        if (show) {
            await this.isMapped();
            if (this._mainview) this._mainview.style = 'display: none';
            this._config.style = '';
            // Build UI and load data 
            let html = `<div class="config-header"><button id="apply-button" class="config-button">${this.t('Apply')}</button><button id="close-button" class="config-button">${this.t('Close')}</button></div>`;
            html += this.getOptionsHtml(this._parameters, this.opt, this.valuesList);
            // Object.entries(this.#groupBy(this._parameters, 'group')).forEach(([gp, opts]) => {
            //     html += `<div class="config-section"><div class="config-section-title">${this.t(gp)}</div>`; //if gp not null
            //     opts.forEach(opt => {
            //         html += this.#getOptHtml(opt, this.opt[opt.id], -1, opt.id);      
            //     });
            //     html += `</div>`;
            // });

            //localization
            if (this.I18N) {
                html += `<div class="config-section"><div class="config-section-title">${this.t('Localization')}</div>`;
                html += `<div class="config-row"><div class="config-row-header"><div class="config-title"><div class="collapse"></div>${this.t('Extract strings')}</div>`;
                html += `<div class="config-subtitle">${this.t('Click on the button to parse widget files and list all strings to translate.')}</div>`;
                html += `<div class="config-value"><button id="extract-loc" class="config-button dyn">${this.t('Extract')}</button></div></div> `;
                html += `<div class="bloc" style="max-height: 0px;"><div id="config-loc">`;
                html += this.#getLocHtml();                              
                html += `</div></div></div></div>`;
            }

            this._config.innerHTML = html + `<div class="config-header"><button id="reset-button" class="config-button">${this.t('Reset')}</button></div>`;;

            // events
            this._config.querySelectorAll("div.config-switch")?.forEach(element => {
                element.addEventListener('click', function(event) {this.toggleswitch(event);}.bind(this));
            });
            this._config.querySelectorAll("div.collapse")?.forEach(element => {
                element.parentElement.parentElement.addEventListener('click', function(event) {this.togglecollapse(event);}.bind(this));
            });
            this._config.querySelectorAll("#add-button")?.forEach(element => {
                element.addEventListener('click', function(event) {this.addItem(event);}.bind(this));
            });
            this._config.querySelector('#apply-button')?.addEventListener('click', function() {this.saveOptions();}.bind(this));
            this._config.querySelector('#close-button')?.addEventListener('click', function() {this.showConfig(false);}.bind(this));
            this._config.querySelector('#reset-button')?.addEventListener('click', function() {this.resetOptions();}.bind(this));
            this._config.querySelector('#extract-loc')?.addEventListener('click', function() {this.extractLocStrings();}.bind(this));
            this._config.querySelector('#export-loc')?.addEventListener('click', function() {this.exportLocStrings();}.bind(this));


            // Auto-expandables fields init
            setTimeout(() => {
                const textareas = document.querySelectorAll('.auto-expand');
                textareas.forEach(textarea => {
                textarea.style.height = '';
                textarea.style.height = textarea.scrollHeight + 'px';
                });
            }, 0);
        } else {
            if (this._mainview) this._mainview.style = '';
            this._config.style = 'display: none';
        }
    }

    getOptionsHtml(options, values, valuesList = {}) {
        let html = '';
        Object.entries(this.#groupBy(options, 'group')).forEach(([gp, opts]) => {
            html += `<div class="config-section"><div class="config-section-title">${this.t(gp)}</div>`; //if gp not null
            opts.forEach(opt => {
                html += this.#getOptHtml(opt, values[opt.id], valuesList, -1, opt.id);      
            });
            html += `</div>`;
        });
        return html;
    }

    setOptionsEvent(doc) {
        doc.querySelectorAll("div.config-switch")?.forEach(element => {
            element.addEventListener('click', function(event) {this.toggleswitch(event);}.bind(this));
        });
        doc.querySelectorAll("div.collapse")?.forEach(element => {
            element.parentElement.parentElement.addEventListener('click', function(event) {this.togglecollapse(event);}.bind(this));
        });
        doc.querySelectorAll("#add-button")?.forEach(element => {
            element.addEventListener('click', function(event) {this.addItem(event);}.bind(this));
        });

        // Auto-expandables fields init
        setTimeout(() => {
            const textareas = document.querySelectorAll('.auto-expand');
            textareas.forEach(textarea => {
            textarea.style.height = '';
            textarea.style.height = textarea.scrollHeight + 'px';
            });
        }, 0);
    }

    #groupBy = function(xs, key) {
        return xs.reduce(function(rv, x) {
            (rv[x[key]] ??= []).push(x);
            return rv;
        }, {});
    };

    #getOptHtml(opt, value, valuesList, idx = -1, id = '', lock = false) {
        let html = '';
        if (!opt.hidden) {
            
            const title = idx >= 0 ? (valuesList[opt.id]?valuesList[opt.id][idx]:(this.t(opt.title) + ' #'+(idx+1))) : this.t(opt.title);
            html += `<div class="config-row"><div class="config-row-header"><div class="config-title`
            html += `${opt.collapse?`"><div class="collapse"></div>`:' nocollapse">'}${title}</div>`;
            html += `<div class="config-subtitle">${this.t(opt.subtitle)}</div>`;
            html += (!opt.inbloc?`<div class="config-value">${this.#getOptValueHtml(opt, value, valuesList, idx, id)}</div>`:'')+ ((idx>=0 && !lock)?'<div class="delete"></div>':'') + `</div>`;
            if (opt.collapse) {
                html += `<div class="bloc" style="max-height: 0px;">` + (this.is(opt.description)?`<div class="details">${this.t(opt.description).replaceAll("\n", "<br>").replaceAll("\\n", "<br>")}</div>`:'');
                if (opt.type === 'template') {                    
                    html += `<div id="${opt.id}" class="config-dyn">`;
                    value?.forEach((v, i) => {
                        html += this.#getOptHtml(opt.template, v, valuesList, i, id + '_' + i, valuesList[opt.id]);
                    });
                    html += `</div>`;
                    html += valuesList[opt.id]? '' : `<div class="config-header"><button id="add-button" data-id="${opt.id}" class="config-button dyn">+</button></div>`;
                } else if (opt.type === 'templateform') {
                    html += `<div id="${opt.id}" class="config-dyn">`;
                    value?.forEach((v, i) => {
                        if (v) {
                            html += `<div class="config-section"><div class="config-section-title">${valuesList[opt.id][i]}</div>`;
                            Object.entries(v).forEach(([tk,tv]) => {
                                html += this.#getOptHtml(opt.template.find(t => t.id === tk), tv, valuesList, -1, id + '_' + i + '_' + tk, valuesList[opt.id]); 
                            });
                            html += `</div>`;
                        }                        
                    });
                    html += `</div>`;
                    html += valuesList[opt.id]? '': `<div class="config-header"><button id="add-button" data-id="${opt.id}" class="config-button dyn">+</button></div>`;
                } else if (opt.inbloc) {
                    html += this.#getOptValueHtml(opt, value, valuesList, idx, id);   
                }
                html += `${opt.type !== 'templateform'?`<div class="bloc-bottom">`:''}</div></div>`;
            }
            html += `</div>`;
        }
        return html;  
    }

    #getOptValueHtml(opt, value, valuesList, idx = -1, vid = '') {
        const val = this.#formatValue(opt, value);
        const id = `id="${vid}" ${idx>=0?`data-idx="${idx}" `:''}`;
        switch (opt.type) { 
            case 'boolean':
                return `<div ${id}class="config-switch switch_transition ${val? 'switch_on':''}" ${this.#getEvent(opt.event)}>
<div class="switch_slider"></div><div class="switch_circle"></div></div>`;

            case 'number':
                return `<input ${id}type="number" class="config-input" value="${val}" ${this.#getEvent(opt.event)}>`;

           
            case 'longstring':
                return `<textarea ${id}class="config-textarea auto-expand" oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'" ${this.#getEvent(opt.event)}>${val}</textarea>`;

            case 'object':
                return `<textarea ${id}class="config-textarea auto-expand" oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'" ${this.#getEvent(opt.event)}>${JSON.stringify(val, null, 2)}</textarea>`;


            case 'dropdown': //keep it before default
                let html = `<select ${id}class="field-select" ${this.#getEvent(opt.event)}>`;
                if(valuesList[opt.id]) {                    
                    valuesList[opt.id].forEach(v => {html += `<option value="${v}" ${v === val ? 'selected':''}>${v}</option>`}); //TODO if in template with values ?                    
                } //else default                
                return html + '</select>';

            case 'button':
                return `<button id="action-button" class="config-button" ${this.#getEvent(opt.event)}>${this.t(opt.label??'Execute')}</button>`;
                
            default: //string
                return `<input ${id}class="config-input" value="${val}" ${this.#getEvent(opt.event)}>`;
        }
    }

    #getEvent(events) {
        if (!events) return '';
        let html = '';
        Object.entries(events).forEach(([k, v]) => {
            html += `${k}="${v}"`;
        });
        return html;
    }

    #getOptValue(opt, elmt, v) {
        switch (opt.type) {
            case 'boolean':
                return this.#parseValue(opt, elmt.classList?.contains('switch_on'));
            case 'number':
                return this.#parseValue(opt, parseFloat(elmt.value));
            case 'object':
                return this.#parseValue(opt, JSON.parse(elmt.value));
            case 'template':
                var r = [];
                v.forEach((_, i) => {
                    let e = elmt.querySelector('#' + elmt.id + '_' + i);
                    if (e) r.push(this.#getOptValue(opt.template, e));
                    else r.push(undefined);
                });
                return r; 
            case 'templateform':
                //var r = [];
                v.forEach((sv, i) => {
                    //let ri = [];
                    Object.keys(sv).forEach(tk => {
                        let e = elmt.querySelector('#' + elmt.id + '_' + i + '_' + tk);
                        if (e) sv[tk] = this.#getOptValue(opt.template.find(t => t.id === tk), e);
                        else sv[tk] = undefined;
                    });     
                });
                return v;
            default:  //number, dropdown, string, longstring
                return this.#parseValue(opt, elmt.value);
        }
    }

    #getLocHtml() {
        let html = '';
        let keys = this.I18Nuser ? Object.entries(this.I18Nuser) : [];
        keys = keys.length > 0 ? keys : Object.entries(this.I18N);
        if (keys.length > 0) {
            keys.sort();
            keys.forEach(([k,v]) => {
                html += `<div class="config-row"><div class="config-row-header"><div class="config-vo">${k.replaceAll("\n", '\\n')}</div>`;
                html += `<div class="config-value large"><input class="config-input" value="${v.replaceAll("\n", '\\n').replaceAll("\"", '&quot;')}" data-key="${k.replaceAll("\n", '\\n').replaceAll("\"", '&quot;')}"></div></div></div>`;
            });
            html += `<div class="config-header"><button id="export-loc" class="config-button dyn">${this.t('Export')}</button></div>`;
        } else {
            html += `<div class="details">${this.t('No string to translate, please extract them before.')}</div>`;
        }  
        return html;
    }

    getValueListOption(id, value) {
        return this.opt[id][this.valuesList[id].indexOf(value)];
    }

    #parseValue(opt, v) {
        if (this.is(opt.parse)) return opt.parse(v);
        return v;
    }

    #formatValue(opt, v) {
        if (this.is(opt.format)) return opt.format(v);
        return v;
    }

    toggleswitch(event) {
        if (event.currentTarget.classList.contains('switch_on')) event.currentTarget.classList.remove('switch_on');
        else event.currentTarget .classList.add('switch_on');
    }

    togglecollapse(event) {
        if (event.target.getAttribute('id')) return;
        const elmt = event.currentTarget;
        const bloc = elmt.parentElement.querySelector('div.bloc');
        if (elmt.classList.contains('open')) {
            elmt.classList.remove('open');
            bloc.style = 'max-height: 0px;';
        }
        else { 
            elmt.classList.add('open');
            bloc.style = 'max-height: unset;';
        }
    }

    addItem(event) {
        const elmt = event.currentTarget;
        const bloc = elmt.parentElement.parentElement.querySelector('div.config-dyn');
        const id = elmt.getAttribute('data-id');
        const opt = this._parameters.find(e => e.id === id);
        if (opt.type === 'template') {
            const newDiv = document.createElement('div');
            newDiv.innerHTML = this.#getOptHtml(opt.template, opt.default, this.opt[opt.id].length, opt.id + '_' + (this.opt[opt.id].length+1));
            bloc.appendChild(newDiv); // need to add child and not change directly innerHTML to not erase other element values
            bloc.querySelector('div.collapse:last-of-type')?.parentElement.parentElement.addEventListener('click', function(event) {this.togglecollapse(event);}.bind(this));
            this.opt[opt.id].push(opt.default);
        }
        else if (opt.type === 'templateform') {
            const newDiv = document.createElement('div');
            let html = `<div class="config-section"><div class="config-section-title">${this.t(opt.title) + ' #' + (this.opt[opt.id].length+1)}</div>`;
            Object.entries(opt.template).forEach(([tk,tv]) => {
                html += this.#getOptHtml(tv, opt.default[tk], -1, id + '_' + i + '_' + tk); 
            });
            newDiv.innerHTML = html + `</div>`;
            bloc.appendChild(newDiv);
            newDiv.querySelectorAll("div.collapse")?.forEach(element => {
                element.parentElement.parentElement.addEventListener('click', function(event) {this.togglecollapse(event);}.bind(this));
            });
            this.opt[opt.id].push(opt.default);
        }            
        // else shouldn't happen
    }

    /** Find string in the scripts and generate a form for the user to let translate them */
    async extractLocStrings() {
        this.I18Nuser = this.assignDefined(await this.extractTranslations(this.translatedFiles), this.I18Nuser);
        
        const loc = this._config.querySelector('#config-loc');
        if (loc) {
            loc.innerHTML = this.#getLocHtml();
            this._config.querySelector('#export-loc')?.addEventListener('click', function() {this.exportLocStrings();}.bind(this));
        }
    }

    /** Get user translation from the options form */
    getUserTranslations() {
        let i18n = {};
        const loc = this._config.querySelector('#config-loc');
        if (loc) {            
            loc.querySelectorAll("input.config-input")?.forEach(input => {
                i18n[input.getAttribute('data-key')] = input.value.replaceAll('\\n', '\n').replaceAll('&quot;', '"');
            });
        }
        return i18n;
    }

    /** Export to clipboard user translation */
    exportLocStrings() {
        const i18n = this.getUserTranslations();
        if (!this.isObjectEmpty(i18n)) {
            navigator.clipboard.writeText(JSON.stringify(i18n, null, 2)).then(() => {
                alert(this.t('Your translation has been copied to the clipboard, share it with the widget creator throw the Grist forum or his Github.\nThanks a lot for your time !'));
            })
        } else {
            alert(this.t('No new translation found.'));
        }
    }

    //==========================================================================================
    // Grist helper
    //==========================================================================================
    /** Encapsulate grist.ready to ensure correct initialization and translation
     * @param {Object} config - Usual object provided to grist.ready
     */
    ready(config) {
        if (config) {
            if (config.columns) {
                this.I18Ngrist = {};
                config.columns.map(c => {
                    if (c.title) {
                        this.I18Ngrist[c.title] = '';
                        c.title = this.t(c.title);}
                    if (c.description) {
                        this.I18Ngrist[c.description] = '';
                        c.description = this.t(c.description);
                    }
                    return c;
                });
            }            
            if (config.onEditOptions) {
                this.onEditOptionsUser = config.onEditOptions
            }
            config.onEditOptions = this.onEditOptions.bind(this);
        }

        grist.ready(config);
    }

    async onEditOptions() {
        await this.showConfig(); // manage the display of options when user click on "Open configuration" in Grist interface
        if (this.onEditOptionsUser) await this.onEditOptionsUser.apply();
    }

    /** Format record data for interaction with grist
     * @param {number} id - id of the record. Automatically parsed as integer
     * @param {object} data - Object with prop as column id and value
     */
    formatRecord(id, data) {
        return {id: parseInt(id), fields:data}; //TODO manage encoding
    }

    /** Get Grist current table reference */
    #getTable() {
        if(!this.table) this.table = grist.getTable();
        return this.table?true:false;
    }

    /** Update the current Grist table with given data 
     * @param {object|[object]} rec - Object with prop as column id and value as new value
     * @param {boolean} encode - True if data need to be encoded before
     * @returns the answer of the update or null
    */
    async updateRecords(rec, encode) {       
        encode = encode ?? this.dataMapped;
        if(!this.#getTable()) return null;

        if (encode) rec = await this.encodeData(rec); //encode data if needed
        rec = Array.isArray(rec)? rec.map(item => this.mapColumnNamesBack(item)):this.mapColumnNamesBack(rec);
        return this.applyModificationOnGrist(async () => this.table.update(rec));
    }

    /** Create a new record in the current Grist table
     * @param {object|[object]} rec - Object with prop as column id and value as new value
     * @param {boolean} encode - True if data need to be encoded before
     * @returns the answer of the create or null
     */
    async createRecords(rec, encode) {
        encode = encode ?? this.dataMapped;        
        if(!this.#getTable()) return null;

        if (encode) rec = await this.encodeData(rec); //encode data if needed
        rec = Array.isArray(rec)? rec.map(item => this.mapColumnNamesBack(item)):this.mapColumnNamesBack(rec);
        return this.applyModificationOnGrist(async () => this.table.create(rec));
    }

    /** Delete given record(s) in the current Grist table
     * @param {number|Array<number>} id - id(s) to remove from the table
     * @returns the answer of the delete
     */
    async destroyRecords(id) {
        if(!this.#getTable()) return null;
        return this.applyModificationOnGrist(async () => Array.isArray(id) ? await this.table.destroy(id.map(i => parseInt(i))) : await this.table.destroy(id));     
    }

    /** When applying modification on Grist table, ensure that data mapping
     * is correctly performed
     */
    async applyModificationOnGrist(f) {
        if(!f) return null;
        if(this.dataMapped) this._ismapped = false;
        const res = await f();
        if(this.dataMapped) await this.isMapped();
        return res;
    }

    /** Maps back properly records columns to be compatible with Grist */
    mapColumnNamesBack(rec) {
        rec.fields = Object.fromEntries(Object.entries(rec.fields).map((kv) => [this.map[kv[0]] ?? kv[0], kv[1]]));
        return rec;
    }

    /** Maps columns from grist to widget name, but keeping all non mapped column (instead of grist.mapColumnNames) */
    mapColumnNames(rec, map = null) {      
        if(!map) map = this.map;
        if(!map) return rec;
        if(Array.isArray(rec)) {
            //return grist.mapColumnNames(rec);
            return rec.map(v => this.mapColumnNames(v, map));
        } else {
            return Object.fromEntries(Object.entries(map).map((kv) => {
                const v = kv[1];
                if (v && Array.isArray(v)) {
                    return [kv[0], v.map(sv => rec[sv])];
                }
                return [kv[0], v ? rec[v] : v];
            }));
        }        
    }

    /** Encapsulate grist.OnRecords to ensure the correct timing between the options and mapping loading 
     * and the execution of the main function
     * @param {function} main - Function to call when loading is ended. 
     * @param {Object} args - Grist object option for grist.onRecords
     */
    onRecords(main, args) {
        grist.onRecords(async (records, mappings) => {
            this._ismapped = false;
            // Wait for init finish to not miss the first onRecords
            await this.isInit();
            main(await this.mapData(records, mappings, args.mapRef));
        }, args);
    }

    /** Encapsulate grist.OnRecord to ensure the correct timing between the options and mapping loading 
     * and the execution of the main function
     * @param {function} main - Function to call when loading is ended. 
     * @param {Object} args - Grist object option for grist.onRecord
     */
    onRecord(main, args) {
        grist.onRecord(async (records, mappings) => {
            this._ismapped = false;
            // Wait for init finish to not miss the first onRecords
            await this.isInit();
            main(await this.mapData(records, mappings, args.mapRef));
        }, args);
    }

    /** Subscribe to table mapping change
     * @param {function} main - Function to call when the mapping has been changed 
     */
    onMappingChange(main) {
        grist.on('message', async (e) => {
            if (e.mappingsChange) main();
        });
    }

    async fetchSelectedRecord(id) {
        let rec = await grist.fetchSelectedRecord(id); 
        const res = this.mapColumnNames(rec); //TODO mapData ? await this.mapData(rec, null, true); //
        if(this.dataMapped) await this.isMapped();
        return res;
    }
}


