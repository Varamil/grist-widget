class u {
  constructor(t, e) {
    Object.assign(this, t), this._fullMeta = e;
  }
  /** For a Choice column, returns the background color of a given option
   * @param {string} ref - The option on which get the background color 
   * @returns color as HTML format #FFFFFF
   */
  getColor(t) {
    return this.widgetOptions.choiceOptions?.[t]?.fillColor;
  }
  /** For a Choice column, returns the text color of a given option
  * @param {string} ref - The option on which get the text color 
  * @returns color as HTML format #000000
  */
  getTextColor(t) {
    return this.widgetOptions.choiceOptions?.[t]?.textColor;
  }
  /** Check if the column is a formula column AND a formula is defined */
  getIsFormula() {
    return this.isFormula && this.formula?.trim();
  }
  /** Gets the list of possible choices for the column. If the column type is 'Choice' or 'ChoiceList', 
   * return the choice list. If the column type is 'Ref' or 'RefList', return the linked
   * column content
   */
  async getChoices() {
    const t = this.type.split(":");
    if (t[0] === "Ref" || t[0] === "RefList") {
      const e = await grist.docApi.fetchTable(t[1]), s = await this.getMeta(this.visibleCol);
      return e[s.colId];
    } else if (t[0] === "Choice" || t[0] === "ChoiceList")
      return this.widgetOptions?.choices;
    return null;
  }
  /** For attachment column, return the url for the given id 
   * @param {number} id - id of the attachment
  */
  async getURL(t) {
    return this.type.split(":")[0] === "Attachments" ? await this._fullMeta.getURL(t) : null;
  }
  // async getRefMeta() {
  //     const t = this.type.split(':');
  //     if (t[0] === 'RefList' || t[0] === 'Ref') {
  //         return [t[1], await this.getMeta(this.visibleCol)];
  //     }
  //     return null;
  // }
  /** Parse a given value based on column meta data. Replace values, whatever the encoding is, by their content.
   * @param {*} value - Any value provided by Grist
   * @returns Decoded value
   */
  async parse(t, e = null, s = null) {
    const a = this.type.split(":");
    if (a[0] === "RefList") {
      if (t && t.length > 0 && (t[0] === "L" && (t = t.splice(0, 1)), t.length > 0 && typeof t[0] == "number")) {
        const n = e ?? await grist.docApi.fetchTable(a[1]), l = s ?? await this.getMeta(this.visibleCol);
        return t.map((o) => n?.id?.indexOf(o)).map((o) => n[l.colId][o]);
      }
    } else if (a[0] === "Ref") {
      if (Array.isArray(t))
        if (t[2] > 0)
          if (this.visibleCol > 0) {
            const n = e ?? await grist.docApi.fetchTable(t[1]), l = s ?? await this.getMeta(this.visibleCol), r = n?.id?.indexOf(t[2]);
            return await this.parse(n[l.colId][r]);
          } else return t[2];
        else return;
      else if (typeof t == "object")
        if (t.rowId > 0)
          if (this.visibleCol > 0) {
            const n = e ?? await grist.docApi.fetchTable(t.tableId), l = s ?? await this.getMeta(this.visibleCol), r = n?.id?.indexOf(t.rowId);
            return await this.parse(n[l.colId][r]);
          } else return t.rowId;
        else return;
    } else if (a[0] === "Date") {
      if (Array.isArray(t))
        return t[1] > 0 ? new Date(t[1] * 1e3) : void 0;
    } else if (a[0] === "DateTime" && Array.isArray(t))
      return t[1] > 0 ? new Date(t[1] * 1e3) : void 0;
    return t;
  }
  /** Parse a given value ID based on column meta data. Replace references, whatever the encoding is, by their ID. 
   * @param {*} value - Any value provided by Grist, but only Ref and Reflist are treated
   * @returns Reference id(s)
  */
  async parseId(t, e = null, s = null) {
    const a = this.type.split(":");
    if (a[0] === "RefList") {
      if (t && t.length > 0 && (t[0] === "L" && (t = t.splice(0, 1)), t.length > 0 && typeof t[0] != "number")) {
        const n = e ?? await grist.docApi.fetchTable(a[1]), l = s ?? await this.getMeta(this.visibleCol);
        return t.map((o) => n[l.colId]?.indexOf(o)).map((o) => n.id[o]);
      }
    } else if (a[0] === "Ref") {
      if (Array.isArray(t))
        return t[2];
      if (typeof t == "object")
        return t.rowId;
      {
        const n = e ?? await grist.docApi.fetchTable(a[1]), l = s ?? await this.getMeta(this.visibleCol), r = n[l.colId].indexOf(t);
        return n.id[r];
      }
    }
    return t;
  }
  /** Encode a given value to be compatible by Grist 
   * @param {*} value - Any value that need to be encoded before being sent to Grist
   * @returns Encoded value
  */
  async encode(t, e = null, s = null) {
    if (t == null) return t;
    const a = this.type.split(":");
    if (a[0] === "RefList") {
      if (Array.isArray(t) && t.length > 0 && typeof t[0] != "number") {
        const n = e ?? await grist.docApi.fetchTable(a[1]), l = s ?? await this.getMeta(this.visibleCol);
        return t.map((o) => n[l.colId]?.indexOf(o)).map((o) => n.id[o]);
      }
    } else if (a[0] === "Ref" && typeof t[0] != "number") {
      const n = e ?? await grist.docApi.fetchTable(a[1]), l = s ?? await this.getMeta(this.visibleCol), r = n[l.colId].indexOf(t);
      return n.id[r];
    }
    return t;
  }
  /** Get current column meta data */
  async getMeta(t) {
    return this._fullMeta.then(
      (e) => e.col.find((s) => s.id === t)
    );
  }
}
class f {
  /** Fetch columns meta data for all tables */
  static async fetchMetas() {
    const t = await grist.docApi.fetchTable("_grist_Tables_column"), e = Object.keys(t), a = t.parentId.map((r, o) => o).map((r) => {
      let o = Object.fromEntries(e.map((c) => [c, t[c][r]]));
      return o.widgetOptions = f.safeParse(o.widgetOptions), o;
    }), n = await grist.docApi.fetchTable("_grist_Tables"), l = Object.fromEntries(n.tableId.map((r, o) => [r, n.id[o]]));
    return { col: a, tab: l };
  }
  static getTableMeta(t, e) {
    return t.col.filter((s) => s.parentId === t.tab[e]);
  }
  constructor() {
    this._tableId = null, this._colIds = null, this._metaPromise = null, this._colPromise = null, this._col = null, this._accessLevel = "", this.loaded = !1, grist.on("message", (t) => {
      t.settings && this._accessLevel !== t.settings.accessLevel && (this._accessLevel = t.settings.accessLevel, this.fetchColumns()), t.tableId && t.mappingsChange && (this._tableId = t.tableId, this.fetchColumns());
    });
  }
  fetchColumns() {
    this._accessLevel === "full" && (this._col = null, this._metaPromise = f.fetchMetas(), this._colPromise = new Promise((t) => {
      this._metaPromise.then((e) => t(f.getTableMeta(e, this._tableId)));
    }));
  }
  mapColumns(t, e) {
    return t;
  }
  async getTypes() {
    return this._colPromise.then(
      (t) => Object.fromEntries(t.map((e) => [e.colId, e?.type]))
    );
  }
  async getColType(t) {
    return this._colPromise.then(
      (e) => e.find((s) => s.colId === t)?.type
    );
  }
  async getOptions() {
    return this._colPromise.then(
      (t) => Object.fromEntries(t.map((e) => [e.colId, e?.widgetOptions]))
    );
  }
  async getColOption(t) {
    return this._colPromise.then(
      (e) => e.find((s) => s.colId === t)?.widgetOptions
    );
  }
  async IsFormula() {
    return this._colPromise.then(
      (t) => Object.fromEntries(t.map((e) => [e.colId, e?.isFormula && (e?.formula?.length ?? 0) !== 0]))
    );
  }
  async IsColFormula(t) {
    return this._colPromise.then(
      (e) => {
        const s = e.find((a) => a.colId === t);
        return s?.isFormula && (s?.formula?.length ?? 0) !== 0;
      }
    );
  }
  async getColor(t, e) {
    return this.getColOption(t)?.choiceOptions?.[e]?.fillColor;
  }
  /** get URL for attachment id or array of id
   * @param {Number|Array<Number>} id - attachment id or array of attachment id
   */
  async getURL(t) {
    const e = await grist.docApi.getAccessToken({ readOnly: !0 });
    return Array.isArray(t) ? t.map((s) => `${e.baseUrl}/attachments/${s}/download?auth=${e.token}`) : `${e.baseUrl}/attachments/${t}/download?auth=${e.token}`;
  }
  /** Get current table columns meta data
   * @returns Object with each entries as column Id
   */
  async getMeta(t = null) {
    return t ? this._metaPromise.then((e) => {
      const s = f.getTableMeta(e, t);
      return Object.fromEntries(s.map((a) => [a.colId, new u(a, this._metaPromise.then((n) => n))]));
    }) : (this._col || (this._col = this._colPromise.then(
      (e) => Object.fromEntries(e.map((s) => [s.colId, new u(s, this._metaPromise.then((a) => a))]))
    )), this._col);
  }
  /** Get given column meta data
   * @param {string} colId - Column Grist id
   */
  async getColMeta(t) {
    return this._colPromise.then(
      (e) => {
        const s = e.find((a) => a.colId === t);
        return s ? new u(s, this._metaPromise.value) : null;
      }
    );
  }
  // async getRawColMeta(colId) {
  //     return this._colPromise.then(
  //         types => { 
  //             return types.find(t => t.colId === colId);
  //           }
  //     );
  // }
  isLoaded() {
    return this._colPromise ? this._colPromise?.state !== "pending" : !1;
  }
  static safeParse(t) {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
}
class d {
  constructor() {
    console.log("WidgetSDK: 1.2.0.59");
    const t = new URLSearchParams(window.location.search);
    this.cultureFull = t.has("culture") ? t.get("culture") : "en-US", this.culture = this.cultureFull.split("-")[0], this.currency = t.has("currency") ? t.get("currency") : "USD", this.timeZone = t.has("timeZone") ? t.get("timeZone") : "", this._gristloaded = !1, this._optloaded = !1, this._ismapped = !1, this.initDone = !1, this.urlSDK = "https://varamil.github.io/grist-widget/widgetSDK", grist.on("message", async (e) => {
      e.fromReady && (this._gristloaded = e.fromReady);
    });
  }
  //==========================================================================================
  // Commons
  //==========================================================================================
  static async sleep(t) {
    return new Promise((e) => setTimeout(e, t));
  }
  triggerEvent(t, e) {
    this.events["on" + t] && this.events["on" + t].apply(this, e);
  }
  /** Returns true is not undefined and not nul */
  is(t) {
    return t != null;
  }
  /** Provide a Promise that resolved when the full widget configuration and grist are loaded */
  async isLoaded() {
    return new Promise(async (t, e) => {
      try {
        if (this.meta) {
          for (; !this.meta.isLoaded(); )
            await d.sleep(50);
          this.col = this.mapColumnNames(await this.meta.getMeta());
        }
        if (this.opt)
          for (; !this._optloaded; )
            await d.sleep(50);
        for (; !this._gristloaded; )
          await d.sleep(50);
        t(!0);
      } catch (s) {
        e(s);
      }
    });
  }
  /**  */
  async isInit() {
    return this.initDone && await this.isLoaded() ? new Promise((t) => t(!0)) : new Promise(async (t, e) => {
      try {
        for (await this.isLoaded(); !this.initDone; )
          await d.sleep(50);
        t(!0);
      } catch (s) {
        e(s);
      }
    });
  }
  async isMapped() {
    return !this.meta || this._ismapped ? new Promise((t) => t(!0)) : new Promise(async (t, e) => {
      try {
        for (; !this._ismapped; )
          await d.sleep(50);
        t(!0);
      } catch (s) {
        e(s);
      }
    });
  }
  /** Manage the parsing of a reference or a list into an Array */
  async getLookUpData(t) {
    if (!t) return [];
    if (Array.isArray(t))
      return t.sort();
    if (t.trim())
      if (t.startsWith("$")) {
        t = t.substring(1);
        let e = t.split(".");
        if (e.length === 1) {
          let s = await grist.docApi.fetchTable(e[0]), a = Object.keys(s || {}).filter((n) => n !== "id" && n !== "manualSort");
          return a.length > 0 ? [""].concat(s[a[0]].filter((n) => n.length > 0).sort()) : [];
        } else if (e.length > 1) {
          let s = await grist.docApi.fetchTable(e[0]);
          return s = s[e[1]], s ? [""].concat(s.filter((a) => a.length > 0).sort()) : [];
        } else
          return [t];
      } else
        return [""].concat(t.split(";").filter((e) => e.length > 0).sort());
    else return [];
  }
  /** Function that mimics basic GNU/Linux grep command;
   * @param  {String} multiLineString      The multiline string
   * @param  {String} patternToSearch      The RegEx pattern to search for
   * @return {Array}                       An Array containing all the matching row(s) for patternToSearch in multiLineString
   */
  grep(t, e) {
    var s = new RegExp(e, "img");
    return t.match(s);
  }
  /** Checks if a file exist on server side
   * @param {string} url - absolute or relative url
   */
  urlExists(t) {
    if (!t) return !1;
    var e = new XMLHttpRequest();
    return e.open("HEAD", t, !1), e.send(), e.status != 404;
  }
  /** Assign sources properties to the target only if they are defined (i.e. if(value) is true) */
  assignDefined(t, ...e) {
    if (t)
      for (const s of e)
        for (const [a, n] of Object.entries(s))
          n && (t[a] = n);
    return t;
  }
  /** Check if an object has defined properties (i.e. null, undefined, ''... are ignored) */
  isObjectEmpty(t) {
    for (let e in t)
      if (t.hasOwnProperty(e) && e) return !1;
    return !0;
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
  async loadTranslations(t = [], e = "en", s = null) {
    if (this.translatedFiles = t, this.translatedFiles.push(this.urlSDK + "/min/widgetSDK.umd.js"), !s || typeof s == "string") {
      if (s = s || "i18n/" + this.culture + ".json", e !== this.culture && this.urlExists(s)) {
        let a = await fetch(s);
        if (a.ok) {
          const n = await a.text();
          this.I18N = JSON.parse(n);
        }
      }
    } else typeof s == "object" ? this.I18N = s : console.error("Loading translation error");
    if (e !== this.culture && this.urlExists(this.urlSDK + "/i18n/" + this.culture + ".json")) {
      let a = await fetch(this.urlSDK + "/i18n/" + this.culture + ".json");
      if (a.ok) {
        const n = await a.text();
        this.assignDefined(this.I18N, JSON.parse(n));
      }
    }
    return this.I18N || (this.I18N = {}), this.t.bind(this);
  }
  /** Provide translated text 
   * @param {string|Array<string>} text - Original text
   * @param {object} [args=null] - Dynamic text to replace 
  */
  t(t, e = null) {
    if (Array.isArray(t))
      return t.map((s) => this.t(s, e));
    {
      let s = t.replaceAll(`
`, "\\n").replaceAll("  ", " ");
      return s = this.I18N[s] || t, e && Object.entries(e).forEach(([a, n]) => {
        s = s.replaceAll("%" + a, n);
      }), s.replaceAll("\\n", `
`);
    }
  }
  /** Load listed files and look for translation function 
   * @param {Array<string>} files - List of files to load and analyze
   * @param {string} [f='t'] - The translation function name used
  */
  async extractTranslations(t, e = "t") {
    let s = {};
    return await Promise.all(t.map(async (a) => {
      let n = await fetch(a);
      if (n.ok) {
        n = await n.text();
        let l;
        ["'", '"', "`"].forEach((r) => {
          l = this.grep(n, `(?<=[^a-zA-Z0-9_]${e}[(])${r}(.*?)(?<!\\\\)${r}(?=[),])`), l && (l = l.map((o) => [o.replace(/^['"`]|['"`]$/g, ""), ""]), s = { ...s, ...Object.fromEntries(l) });
        });
      }
    })), this._parameters && this._parameters.forEach((a) => s = { ...s, ...this.getOptionStrings(a) }), this.I18Ngrist && (s = { ...s, ...this.I18Ngrist }), s;
  }
  /** Get all options strings (for translation purpose)
   * @param {Object} opt - Option to get strings 
   */
  getOptionStrings(t) {
    let e = {};
    return t && (t.title && (e[t.title] = ""), t.subtitle && (e[t.subtitle] = ""), t.description && (e[t.description] = ""), t.group && (e[t.group] = ""), t.template && (Array.isArray(t.template) ? t.template.forEach((s) => e = { ...e, ...this.getOptionStrings(s) }) : e = { ...e, ...this.getOptionStrings(t.template) })), e;
  }
  saveTranslations() {
  }
  //==========================================================================================
  // Columns Meta Data
  //==========================================================================================
  /** Initialize column meta data fetcher */
  initMetaData(t = !1) {
    return this.meta = new f(), t && (this._ismapped = !0), this.meta;
  }
  /** Save mappings and map records
   * @param {*} records - raw records provided by grist.onRecords
   * @param {*} mappings - mappings provided by grist.onRecords
   * @returns mapped records
   */
  async mapData(t, e, s = !1) {
    return this.dataMapped = s, new Promise(async (a) => {
      if (e && (this.map = e), await this.mapOptions(), this.meta && s && this.col) {
        let n = this.mapColumnNames(t), l = {};
        Array.isArray(n) ? await Promise.all(Object.entries(this.col).map(([r, o]) => new Promise(async (c) => {
          o && (Array.isArray(o) ? await Promise.all(o.map(async (h) => {
            await this.#r(l, n, r, h);
          })) : await this.#r(l, n, r, o)), c(!0);
        }))) : await Promise.all(Object.entries(this.col).map(async ([r, o]) => {
          o && (Array.isArray(o) ? await Promise.all(o.map(async (c) => {
            await this.#l(l, n, r, c);
          })) : await this.#l(l, n, r, o));
        })), this._ismapped = !0, a(n);
      }
      this._ismapped = !0, a(this.mapColumnNames(t, e));
    });
  }
  async #r(t, e, s, a) {
    const n = a.type.split(":");
    if ((n[0] === "RefList" || n[0] === "Ref") && a.visibleCol > 0) {
      t[n[1]] || (t[n[1]] = await grist.docApi.fetchTable(n[1]));
      const l = await a.getMeta(a.visibleCol);
      e = e.map(async (r) => (r[s] = await a.parse(r[s], t[n[1]], l), r[s + "_id"] = await a.parseId(r[s], t[n[1]], l), r));
    } else
      e = e.map(async (l) => (l[s] = await a.parse(l[s]), l));
    e = await Promise.all(e);
  }
  async #l(t, e, s, a) {
    const n = a.type.split(":");
    if ((n[0] === "RefList" || n[0] === "Ref") && a.visibleCol > 0) {
      t[n[1]] || (t[n[1]] = await grist.docApi.fetchTable(n[1]));
      const l = await a.getMeta(a.visibleCol);
      e[s + "_id"] = e[s].map(async (r) => await a.parseId(r, t[n[1]], l)), e[s] = e[s].map(async (r) => await a.parse(r, t[n[1]], l)), e[s + "_id"] = await Promise.all(e[s + "_id"]);
    } else
      e[s] = e[s].map(async (l) => await a.parse(l));
    e[s] = await Promise.all(e[s]);
  }
  /** Encode data to prepare them before sending to Grist. Manage properly references 
   * @param {*} rec - Array of data (object) or record ({id: 0, fields:{data}})
   * @returns same object but with data properly encoded
  */
  async encodeData(t) {
    return new Promise(async (e) => {
      if (this.meta && this.col) {
        let s = {};
        if (Array.isArray(t))
          await Promise.all(Object.entries(this.col).map(([a, n]) => new Promise(async (l) => {
            n && (Array.isArray(n) || (n = [n]), await Promise.all(n.map(async (r) => {
              const o = r.type.split(":");
              if ((o[0] === "RefList" || o[0] === "Ref") && r.visibleCol > 0) {
                s[o[1]] || (s[o[1]] = await grist.docApi.fetchTable(o[1]));
                const c = await r.getMeta(r.visibleCol);
                t = t.map(async (h) => (h.fields && (this.is(h.fields[a]) ? h.fields[a] = await r.encode(h.fields[a], s[o[1]], c) : this.is(h[a]) && (h[a] = await r.encode(h[a], s[o[1]], c))), h));
              } else
                t = t.map(async (c) => (c.fields && (this.is(c.fields[a]) ? c.fields[a] = await r.encode(c.fields[a]) : this.is(c[a]) && (c[a] = await r.encode(c[a]))), c));
              t = await Promise.all(t);
            }))), l(!0);
          })));
        else {
          let a = t.fields ?? t;
          await Promise.all(Object.entries(this.col).map(async ([n, l]) => {
            l && this.is(a[n]) && (Array.isArray(l) || (l = [l]), await Promise.all(l.map(async (r) => {
              const o = r.type.split(":");
              if ((o[0] === "RefList" || o[0] === "Ref") && r.visibleCol > 0) {
                s[o[1]] || (s[o[1]] = await grist.docApi.fetchTable(o[1]));
                const c = await r.getMeta(r.visibleCol);
                a[n] = await r.encode(a[n], s[o[1]], c);
              } else
                a[n] = await r.encode(a[n]);
            })));
          })), t.fields && (t.fields = a), e(t);
        }
      }
      e(t);
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
  configureOptions(t, e = "#config-view", s = "#main-view", a = {}) {
    if (typeof e == "string") {
      let n = document.querySelector(e);
      if (!n)
        throw new ReferenceError(
          `CSS selector "${e}" could not be found in DOM`
        );
      e = n;
    }
    if (e instanceof HTMLElement)
      this._config = e;
    else
      throw new TypeError(
        "Widget Config only supports usage of a string CSS selector or HTML DOM element element for the 'configID' parameter"
      );
    if (typeof s == "string") {
      let n = document.querySelector(s);
      if (!n)
        throw new ReferenceError(
          `CSS selector "${s}" could not be found in DOM`
        );
      s = n;
    }
    if (s instanceof HTMLElement ? this._mainview = s : this._mainview = null, !t)
      throw new TypeError(
        "Parameters argument for Widget Config is not defined "
      );
    Array.isArray(t) || (t = [t]), this._parameters = t, this.parseOptions(this._parameters), this.#o(), this._config.classList.contains("grist-config") || this._config.classList.add("grist-config"), this.events = a, grist.onOptions((function(n, l) {
      this.loadOptions(n);
    }).bind(this)), grist.on("message", async (n) => {
      !this._optloaded && n.fromReady && this.loadOptions(await grist.widgetApi.getOptions());
    });
  }
  /** Provide a simple setting option 
   * @param {string} id - Unique id to identify the option, use only alpha numeric caracters
   * @param {*} defValue - Default value to assign to the option
   * @param {string} title - Main string used to present the option to the user
   * @param {string} [subtitle=undefined] - Short description for the option
   * @param {string} [group=''] - Group name to attach the option
  */
  static newItem(t, e, s, a = void 0, n = "", l = {}) {
    return { id: t, default: e, title: s, subtitle: a, group: n, ...l };
  }
  /** Define handler for options changed trigger */
  onOptChange(t) {
    typeof t == "function" && (this.events.onChange = t);
  }
  /** Define handler for options loaded trigger */
  onOptLoad(t) {
    typeof t == "function" && (this.events.onLoad = t);
  }
  parseOptions(t) {
    t.forEach((e) => {
      this.is(e.template) ? Array.isArray(e.template) ? (e.type = "templateform", e.collapse = !0, e.inbloc = !0, e.default = {}, e.template.forEach((s) => {
        this.#a(s), e.default[s.id] = s.default;
      })) : (e.type = "template", e.collapse = !0, e.inbloc = !0, this.#a(e.template), e.default = e.template.default) : this.#a(e);
    });
  }
  #a(t) {
    this.is(t.type) || (t.columnId ? t.type = "dropdown" : typeof t.default == "boolean" ? t.type = "boolean" : typeof t.default == "number" ? t.type = this.is(t.values) ? "dropdown" : "number" : typeof t.default == "object" ? t.label && t.event ? t.type = "button" : t.type = "object" : t.type = this.is(t.values) ? "dropdown" : "string"), t.inbloc = t.type === "longstring" || t.type === "object" || t.type === "template" || t.type === "templateform", t.collapse = this.is(t.description) && t.description.trim().length > 0 || t.inbloc;
  }
  /** Load options from Grist into the object
   * @param {object} options - Grist object provided by grist.onOptions or grist.widgetApi.getOptions()
   */
  async loadOptions(t) {
    this._optloaded = !1;
    try {
      t = t || {};
      const e = t.options || {};
      this._parameters.forEach((s) => {
        this.opt[s.id] = e[s.id] ?? (s.type === "template" || s.type === "templateform" ? [] : s.default);
      }), this.I18N && (this.I18Nuser = t.localization || {}, this.assignDefined(this.I18N, this.I18Nuser)), this.triggerEvent("OptLoad", [this.opt]);
    } catch (e) {
      console.error("Error occurs on loading options:", e);
    }
    this._optloaded = !0;
  }
  async mapOptions() {
    this._parameters && (await this.isLoaded(), this.valuesList = {}, this._parameters.forEach(async (t) => {
      let e;
      if (t.columnId ? (e = await (await this.col[t.columnId])?.getChoices(), !e && t.type !== "template" && t.type !== "templateform" && (e = await this.getLookUpData(this.opt[t.id]))) : t.values && (e = Array.isArray(t.values) ? t.values : await this.getLookUpData(t.values)), this.valuesList[t.id] = e && e.length > 0 ? e : void 0, t.type === "template" || t.type === "templateform")
        if (e) {
          const s = this.opt[t.id].length;
          this.opt[t.id].length = e.length, s < e.length && this.opt[t.id].fill(t.type === "template" ? t.default : { ...t.default }, s);
        } else
          this.opt[t.id] = [];
    }), await Promise.all(this._parameters));
  }
  /** Called when configuration modification is applied */
  async saveOptions() {
    try {
      this._parameters.forEach((e) => {
        const s = this._config.querySelector("#" + e.id);
        s && (this.opt[e.id] = this.#i(e, s, this.opt[e.id]));
      }), await grist.widgetApi.setOption("options", this.opt);
      const t = this.getUserTranslations();
      this.isObjectEmpty(t) || (this.I18Nuser = t, this.assignDefined(this.I18N, t), await grist.widgetApi.setOption("localization", t)), this.showConfig(!1), this.triggerEvent("OptChange", [this.opt]);
    } catch (t) {
      console.error("Error occurs on saving options:", t);
    }
  }
  async readOptionValues(t, e, s) {
    return s || (s = {}), t.forEach((a) => {
      const n = e.querySelector("#" + a.id);
      n && (s[a.id] = this.#i(a, n, s[a.id]));
    }), s;
  }
  #o() {
    this.opt = {}, this._parameters.forEach((t) => {
      this.opt[t.id] = t.type === "template" || t.type === "templateform" ? [] : t.default;
    });
  }
  /** Reset all options to default values */
  async resetOptions() {
    this.#o(), await this.mapOptions(), await grist.widgetApi.setOption("options", this.opt), await grist.widgetApi.setOption("localization", {}), this.showConfig(!1), this.triggerEvent("OptChange", [this.opt]);
  }
  /** Manage the display of the config form */
  async showConfig(t = !0) {
    if (t) {
      await this.isMapped(), this._mainview && (this._mainview.style = "display: none"), this._config.style = "";
      let e = `<div class="config-header"><button id="apply-button" class="config-button">${this.t("Apply")}</button><button id="close-button" class="config-button">${this.t("Close")}</button></div>`;
      e += this.getOptionsHtml(this._parameters, this.opt, this.valuesList), this.I18N && (e += `<div class="config-section"><div class="config-section-title">${this.t("Localization")}</div>`, e += `<div class="config-row"><div class="config-row-header"><div class="config-title"><div class="collapse"></div>${this.t("Extract strings")}</div>`, e += `<div class="config-subtitle">${this.t("Click on the button to parse widget files and list all strings to translate.")}</div>`, e += `<div class="config-value"><button id="extract-loc" class="config-button dyn">${this.t("Extract")}</button></div></div> `, e += '<div class="bloc" style="max-height: 0px;"><div id="config-loc">', e += this.#h(), e += "</div></div></div></div>"), this._config.innerHTML = e + `<div class="config-header"><button id="reset-button" class="config-button">${this.t("Reset")}</button></div>`, this._config.querySelectorAll("div.config-switch")?.forEach((s) => {
        s.addEventListener("click", (function(a) {
          this.toggleswitch(a);
        }).bind(this));
      }), this._config.querySelectorAll("div.collapse")?.forEach((s) => {
        s.parentElement.parentElement.addEventListener("click", (function(a) {
          this.togglecollapse(a);
        }).bind(this));
      }), this._config.querySelectorAll("#add-button")?.forEach((s) => {
        s.addEventListener("click", (function(a) {
          this.addItem(a);
        }).bind(this));
      }), this._config.querySelector("#apply-button")?.addEventListener("click", (function() {
        this.saveOptions();
      }).bind(this)), this._config.querySelector("#close-button")?.addEventListener("click", (function() {
        this.showConfig(!1);
      }).bind(this)), this._config.querySelector("#reset-button")?.addEventListener("click", (function() {
        this.resetOptions();
      }).bind(this)), this._config.querySelector("#extract-loc")?.addEventListener("click", (function() {
        this.extractLocStrings();
      }).bind(this)), this._config.querySelector("#export-loc")?.addEventListener("click", (function() {
        this.exportLocStrings();
      }).bind(this)), setTimeout(() => {
        document.querySelectorAll(".auto-expand").forEach((a) => {
          a.style.height = "", a.style.height = a.scrollHeight + "px";
        });
      }, 0);
    } else
      this._mainview && (this._mainview.style = ""), this._config.style = "display: none";
  }
  getOptionsHtml(t, e, s = {}) {
    let a = "";
    return Object.entries(this.#d(t, "group")).forEach(([n, l]) => {
      a += `<div class="config-section"><div class="config-section-title">${this.t(n)}</div>`, l.forEach((r) => {
        a += this.#e(r, e[r.id], s, -1, r.id);
      }), a += "</div>";
    }), a;
  }
  setOptionsEvent(t) {
    t.querySelectorAll("div.config-switch")?.forEach((e) => {
      e.addEventListener("click", (function(s) {
        this.toggleswitch(s);
      }).bind(this));
    }), t.querySelectorAll("div.collapse")?.forEach((e) => {
      e.parentElement.parentElement.addEventListener("click", (function(s) {
        this.togglecollapse(s);
      }).bind(this));
    }), t.querySelectorAll("#add-button")?.forEach((e) => {
      e.addEventListener("click", (function(s) {
        this.addItem(s);
      }).bind(this));
    }), setTimeout(() => {
      document.querySelectorAll(".auto-expand").forEach((s) => {
        s.style.height = "", s.style.height = s.scrollHeight + "px";
      });
    }, 0);
  }
  #d = function(t, e) {
    return t.reduce(function(s, a) {
      return (s[a[e]] ??= []).push(a), s;
    }, {});
  };
  #e(t, e, s, a = -1, n = "", l = !1) {
    let r = "";
    if (!t.hidden) {
      const o = a >= 0 ? s[t.id] ? s[t.id][a] : this.t(t.title) + " #" + (a + 1) : this.t(t.title);
      r += '<div class="config-row"><div class="config-row-header"><div class="config-title', r += `${t.collapse ? '"><div class="collapse"></div>' : ' nocollapse">'}${o}</div>`, r += `<div class="config-subtitle">${this.t(t.subtitle)}</div>`, r += (t.inbloc ? "" : `<div class="config-value">${this.#c(t, e, s, a, n)}</div>`) + (a >= 0 && !l ? '<div class="delete"></div>' : "") + "</div>", t.collapse && (r += '<div class="bloc" style="max-height: 0px;">' + (this.is(t.description) ? `<div class="details">${this.t(t.description).replaceAll(`
`, "<br>").replaceAll("\\n", "<br>")}</div>` : ""), t.type === "template" ? (r += `<div id="${t.id}" class="config-dyn">`, e?.forEach((c, h) => {
        r += this.#e(t.template, c, s, h, n + "_" + h, s[t.id]);
      }), r += "</div>", r += s[t.id] ? "" : `<div class="config-header"><button id="add-button" data-id="${t.id}" class="config-button dyn">+</button></div>`) : t.type === "templateform" ? (r += `<div id="${t.id}" class="config-dyn">`, e?.forEach((c, h) => {
        c && (r += `<div class="config-section"><div class="config-section-title">${s[t.id][h]}</div>`, Object.entries(c).forEach(([p, m]) => {
          r += this.#e(t.template.find((g) => g.id === p), m, s, -1, n + "_" + h + "_" + p, s[t.id]);
        }), r += "</div>");
      }), r += "</div>", r += s[t.id] ? "" : `<div class="config-header"><button id="add-button" data-id="${t.id}" class="config-button dyn">+</button></div>`) : t.inbloc && (r += this.#c(t, e, s, a, n)), r += `${t.type !== "templateform" ? '<div class="bloc-bottom">' : ""}</div></div>`), r += "</div>";
    }
    return r;
  }
  #c(t, e, s, a = -1, n = "") {
    const l = this.#f(t, e), r = `id="${n}" ${a >= 0 ? `data-idx="${a}" ` : ""}`;
    switch (t.type) {
      case "boolean":
        return `<div ${r}class="config-switch switch_transition ${l ? "switch_on" : ""}" ${this.#t(t.event)}>
<div class="switch_slider"></div><div class="switch_circle"></div></div>`;
      case "number":
        return `<input ${r}type="number" class="config-input" value="${l}" ${this.#t(t.event)}>`;
      case "longstring":
        return `<textarea ${r}class="config-textarea auto-expand" oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'" ${this.#t(t.event)}>${l}</textarea>`;
      case "object":
        return `<textarea ${r}class="config-textarea auto-expand" oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'" ${this.#t(t.event)}>${JSON.stringify(l, null, 2)}</textarea>`;
      case "dropdown":
        let o = `<select ${r}class="field-select" ${this.#t(t.event)}>`;
        return s[t.id] && s[t.id].forEach((c) => {
          o += `<option value="${c}" ${c === l ? "selected" : ""}>${c}</option>`;
        }), o + "</select>";
      case "button":
        return `<button id="action-button" class="config-button" ${this.#t(t.event)}>${this.t(t.label ?? "Execute")}</button>`;
      default:
        return `<input ${r}class="config-input" value="${l}" ${this.#t(t.event)}>`;
    }
  }
  #t(t) {
    if (!t) return "";
    let e = "";
    return Object.entries(t).forEach(([s, a]) => {
      e += `${s}="${a}"`;
    }), e;
  }
  #i(t, e, s) {
    switch (t.type) {
      case "boolean":
        return this.#s(t, e.classList?.contains("switch_on"));
      case "number":
        return this.#s(t, parseFloat(e.value));
      case "object":
        return this.#s(t, JSON.parse(e.value));
      case "template":
        var a = [];
        return s.forEach((n, l) => {
          let r = e.querySelector("#" + e.id + "_" + l);
          r ? a.push(this.#i(t.template, r)) : a.push(void 0);
        }), a;
      case "templateform":
        return s.forEach((n, l) => {
          Object.keys(n).forEach((r) => {
            let o = e.querySelector("#" + e.id + "_" + l + "_" + r);
            o ? n[r] = this.#i(t.template.find((c) => c.id === r), o) : n[r] = void 0;
          });
        }), s;
      default:
        return this.#s(t, e.value);
    }
  }
  #h() {
    let t = "", e = this.I18Nuser ? Object.entries(this.I18Nuser) : [];
    return e = e.length > 0 ? e : Object.entries(this.I18N), e.length > 0 ? (e.sort(), e.forEach(([s, a]) => {
      t += `<div class="config-row"><div class="config-row-header"><div class="config-vo">${s.replaceAll(`
`, "\\n")}</div>`, t += `<div class="config-value large"><input class="config-input" value="${a.replaceAll(`
`, "\\n").replaceAll('"', "&quot;")}" data-key="${s.replaceAll(`
`, "\\n").replaceAll('"', "&quot;")}"></div></div></div>`;
    }), t += `<div class="config-header"><button id="export-loc" class="config-button dyn">${this.t("Export")}</button></div>`) : t += `<div class="details">${this.t("No string to translate, please extract them before.")}</div>`, t;
  }
  getValueListOption(t, e) {
    return this.opt[t][this.valuesList[t].indexOf(e)];
  }
  #s(t, e) {
    return this.is(t.parse) ? t.parse(e) : e;
  }
  #f(t, e) {
    return this.is(t.format) ? t.format(e) : e;
  }
  toggleswitch(t) {
    t.currentTarget.classList.contains("switch_on") ? t.currentTarget.classList.remove("switch_on") : t.currentTarget.classList.add("switch_on");
  }
  togglecollapse(t) {
    if (t.target.getAttribute("id")) return;
    const e = t.currentTarget, s = e.parentElement.querySelector("div.bloc");
    e.classList.contains("open") ? (e.classList.remove("open"), s.style = "max-height: 0px;") : (e.classList.add("open"), s.style = "max-height: unset;");
  }
  addItem(t) {
    const e = t.currentTarget, s = e.parentElement.parentElement.querySelector("div.config-dyn"), a = e.getAttribute("data-id"), n = this._parameters.find((l) => l.id === a);
    if (n.type === "template") {
      const l = document.createElement("div");
      l.innerHTML = this.#e(n.template, n.default, this.opt[n.id].length, n.id + "_" + (this.opt[n.id].length + 1)), s.appendChild(l), s.querySelector("div.collapse:last-of-type")?.parentElement.parentElement.addEventListener("click", (function(r) {
        this.togglecollapse(r);
      }).bind(this)), this.opt[n.id].push(n.default);
    } else if (n.type === "templateform") {
      const l = document.createElement("div");
      let r = `<div class="config-section"><div class="config-section-title">${this.t(n.title) + " #" + (this.opt[n.id].length + 1)}</div>`;
      Object.entries(n.template).forEach(([o, c]) => {
        r += this.#e(c, n.default[o], -1, a + "_" + i + "_" + o);
      }), l.innerHTML = r + "</div>", s.appendChild(l), l.querySelectorAll("div.collapse")?.forEach((o) => {
        o.parentElement.parentElement.addEventListener("click", (function(c) {
          this.togglecollapse(c);
        }).bind(this));
      }), this.opt[n.id].push(n.default);
    }
  }
  /** Find string in the scripts and generate a form for the user to let translate them */
  async extractLocStrings() {
    this.I18Nuser = this.assignDefined(await this.extractTranslations(this.translatedFiles), this.I18Nuser);
    const t = this._config.querySelector("#config-loc");
    t && (t.innerHTML = this.#h(), this._config.querySelector("#export-loc")?.addEventListener("click", (function() {
      this.exportLocStrings();
    }).bind(this)));
  }
  /** Get user translation from the options form */
  getUserTranslations() {
    let t = {};
    const e = this._config.querySelector("#config-loc");
    return e && e.querySelectorAll("input.config-input")?.forEach((s) => {
      t[s.getAttribute("data-key")] = s.value.replaceAll("\\n", `
`).replaceAll("&quot;", '"');
    }), t;
  }
  /** Export to clipboard user translation */
  exportLocStrings() {
    const t = this.getUserTranslations();
    this.isObjectEmpty(t) ? alert(this.t("No new translation found.")) : navigator.clipboard.writeText(JSON.stringify(t, null, 2)).then(() => {
      alert(this.t(`Your translation has been copied to the clipboard, share it with the widget creator throw the Grist forum or his Github.
Thanks a lot for your time !`));
    });
  }
  //==========================================================================================
  // Grist helper
  //==========================================================================================
  /** Encapsulate grist.ready to ensure correct initialization and translation
   * @param {Object} config - Usual object provided to grist.ready
   */
  ready(t) {
    t && (t.columns && (this.I18Ngrist = {}, t.columns.map((e) => (e.title && (this.I18Ngrist[e.title] = "", e.title = this.t(e.title)), e.description && (this.I18Ngrist[e.description] = "", e.description = this.t(e.description)), e))), t.onEditOptions && (this.onEditOptionsUser = t.onEditOptions), t.onEditOptions = this.onEditOptions.bind(this)), grist.ready(t);
  }
  async onEditOptions() {
    await this.showConfig(), this.onEditOptionsUser && await this.onEditOptionsUser.apply();
  }
  /** Format record data for interaction with grist
   * @param {number} id - id of the record. Automatically parsed as integer
   * @param {object} data - Object with prop as column id and value
   */
  formatRecord(t, e) {
    return { id: parseInt(t), fields: e };
  }
  /** Get Grist current table reference */
  #n() {
    return this.table || (this.table = grist.getTable()), !!this.table;
  }
  /** Update the current Grist table with given data 
   * @param {object|[object]} rec - Object with prop as column id and value as new value
   * @param {boolean} encode - True if data need to be encoded before
   * @returns the answer of the update or null
  */
  async updateRecords(t, e) {
    return e = e ?? this.dataMapped, this.#n() ? (e && (t = await this.encodeData(t)), t = Array.isArray(t) ? t.map((s) => this.mapColumnNamesBack(s)) : this.mapColumnNamesBack(t), this.applyModificationOnGrist(async () => this.table.update(t))) : null;
  }
  /** Create a new record in the current Grist table
   * @param {object|[object]} rec - Object with prop as column id and value as new value
   * @param {boolean} encode - True if data need to be encoded before
   * @returns the answer of the create or null
   */
  async createRecords(t, e) {
    return e = e ?? this.dataMapped, this.#n() ? (e && (t = await this.encodeData(t)), t = Array.isArray(t) ? t.map((s) => this.mapColumnNamesBack(s)) : this.mapColumnNamesBack(t), this.applyModificationOnGrist(async () => this.table.create(t))) : null;
  }
  /** Delete given record(s) in the current Grist table
   * @param {number|Array<number>} id - id(s) to remove from the table
   * @returns the answer of the delete
   */
  async destroyRecords(t) {
    return this.#n() ? this.applyModificationOnGrist(async () => Array.isArray(t) ? await this.table.destroy(t.map((e) => parseInt(e))) : await this.table.destroy(t)) : null;
  }
  /** When applying modification on Grist table, ensure that data mapping
   * is correctly performed
   */
  async applyModificationOnGrist(t) {
    if (!t) return null;
    this.dataMapped && (this._ismapped = !1);
    const e = await t();
    return this.dataMapped && await this.isMapped(), e;
  }
  /** Maps back properly records columns to be compatible with Grist */
  mapColumnNamesBack(t) {
    return t.fields = Object.fromEntries(Object.entries(t.fields).map((e) => [this.map[e[0]] ?? e[0], e[1]])), t;
  }
  /** Maps columns from grist to widget name, but keeping all non mapped column (instead of grist.mapColumnNames) */
  mapColumnNames(t, e = null) {
    return e || (e = this.map), e ? Array.isArray(t) ? t.map((s) => this.mapColumnNames(s, e)) : (e = Object.fromEntries(Object.entries(e).map((s) => e[s[1]] ? [s[1], s[0]] : [s[0], s[1]])), Object.fromEntries(Object.entries(t).map((s) => [e[s[0]] ?? s[0], s[1]]))) : t;
  }
  /** Encapsulate grist.OnRecords to ensure the correct timing between the options and mapping loading 
   * and the execution of the main function
   * @param {function} main - Function to call when loading is ended. 
   * @param {Object} args - Grist object option for grist.onRecords
   */
  onRecords(t, e) {
    grist.onRecords(async (s, a) => {
      this._ismapped = !1, await this.isInit(), t(await this.mapData(s, a, e.mapRef));
    }, e);
  }
  /** Encapsulate grist.OnRecord to ensure the correct timing between the options and mapping loading 
   * and the execution of the main function
   * @param {function} main - Function to call when loading is ended. 
   * @param {Object} args - Grist object option for grist.onRecord
   */
  onRecord(t, e) {
    grist.onRecord(async (s, a) => {
      this._ismapped = !1, await this.isInit(), t(await this.mapData(s, a, e.mapRef));
    }, e);
  }
  /** Subscribe to table mapping change
   * @param {function} main - Function to call when the mapping has been changed 
   */
  onMappingChange(t) {
    grist.on("message", async (e) => {
      e.mappingsChange && t();
    });
  }
  async fetchSelectedRecord(t) {
    let e = await grist.fetchSelectedRecord(t);
    const s = this.mapColumnNames(e);
    return this.dataMapped && await this.isMapped(), s;
  }
}
export {
  d as default
};
