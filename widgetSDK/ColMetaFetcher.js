//==========================================================================================
// ColMetaFetcher class
//==========================================================================================
import ColMeta from './ColMeta.js';

/** Class helper to manage Grist columns metadata 
 * @remark - Based on the work of Raphael Guenot : https://github.com/rague
*/
export default class ColMetaFetcher {
    /** Fetch columns meta data for all tables */
    static async fetchMetas() {
        const columns = await grist.docApi.fetchTable('_grist_Tables_column');
        const fields = Object.keys(columns);    
        const colIndexes = columns.parentId.map((id, i) => i);
        const types = colIndexes.map(index => {
            let t = Object.fromEntries(fields.map(f => [f, columns[f][index]]));
            t.widgetOptions = ColMetaFetcher.safeParse(t.widgetOptions);
            return t;
        });

        const tables = await grist.docApi.fetchTable('_grist_Tables');
        const tableRef = Object.fromEntries(tables.tableId.map((id, i) => [id, tables.id[i]]));        

        return {col:types, tab:tableRef};
    }

    static getTableMeta(meta, tableId) {
        return meta.col.filter(item => item.parentId === meta.tab[tableId]);
    }
  
    constructor() {
      this._tableId = null;
      this._colIds = null;
      this._metaPromise = null; //Promise.resolve([null, null]);
      this._colPromise = null;
      this._col = null;
      this._accessLevel = '';
      this.loaded = false;

      grist.on('message', (e) => {
        if (e.settings && this._accessLevel !== e.settings.accessLevel) {
            this._accessLevel = e.settings.accessLevel;
            this.fetchColumns();
        }
        if (e.tableId && e.mappingsChange) {
            this._tableId = e.tableId;
            this.fetchColumns(); 
        }
      });
    }

    fetchColumns() {
      // Can't fetch metadata when no full access.
      if (this._accessLevel !== 'full') { return; }
      this._col = null;
      this._metaPromise = ColMetaFetcher.fetchMetas();
      this._colPromise = new Promise((r) => {this._metaPromise.then(res => r(ColMetaFetcher.getTableMeta(res, this._tableId)))})
    }

    mapColumns(col, map) {
        return col
    }
  
    async getTypes() {
      return this._colPromise.then(
        types => Object.fromEntries(types.map(t => [t.colId, t?.type]))
      );
    }

    async getColType(colId) {
        return this._colPromise.then(
          types => types.find(t => t.colId === colId)?.type
        );
      }
  
    async getOptions() {
      return this._colPromise.then(
        types => Object.fromEntries(types.map(t => [t.colId, t?.widgetOptions]))
      );
    }

    async getColOption(colId) {
        return this._colPromise.then(
          types => types.find(t => t.colId === colId)?.widgetOptions
        );
    }
  
    async IsFormula() {
      return this._colPromise.then(
        types => Object.fromEntries(types.map(t => [t.colId, t?.isFormula && (t?.formula?.length ?? 0) !== 0]))
      );
    }

    async IsColFormula(colId) {
        return this._colPromise.then(
          types => { 
            const t = types.find(t => t.colId === colId);
            return t?.isFormula && (t?.formula?.length ?? 0) !== 0;
          }
        );
      }

    async getColor(colId, ref) {
        return this.getColOption(colId)?.choiceOptions?.[ref]?.fillColor;
    }

    /** get URL for attachment id or array of id
     * @param {Number|Array<Number>} id - attachment id or array of attachment id
     */
    async getURL(id) {
      const access = await grist.docApi.getAccessToken({ readOnly: true });
      if (Array.isArray(id)) {
        return id.map(item => `${access.baseUrl}/attachments/${item}/download?auth=${access.token}`);
      }
      return `${access.baseUrl}/attachments/${id}/download?auth=${access.token}`;
    }
  
    /** Get current table columns meta data
     * @returns Object with each entries as column Id
     */
    async getMeta() {
        if(!this._col) {
            this._col =  this._colPromise.then(
                types => Object.fromEntries(types.map(t => [t.colId, new ColMeta(t, this._metaPromise.then(v => v))]))
            );
        }        
        return this._col;
    }

    /** Get given column meta data
     * @param {string} colId - Column Grist id
     */
    async getColMeta(colId) {
        return this._colPromise.then(
            types => { 
                const t = types.find(t => t.colId === colId);
                return t? new ColMeta(t, this._metaPromise.value):null;
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
        return this._colPromise ? this._colPromise?.state !== 'pending' : false;
    }

    static safeParse(value) {
        try {
          return JSON.parse(value);
        } catch (err) {
          return null;
        }
    }
}
