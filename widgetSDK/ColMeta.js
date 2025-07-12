//==========================================================================================
// ColMeta class
//==========================================================================================

/** Column meta data with some helper functions */
export default class ColMeta {
    constructor(colMeta, meta) {
        Object.assign(this, colMeta);
        this._fullMeta = meta;
    }

    /** For a Choice column, returns the background color of a given option
     * @param {string} ref - The option on which get the background color 
     * @returns color as HTML format #FFFFFF
     */
    getColor(ref) {
        return this.widgetOptions.choiceOptions?.[ref]?.fillColor;
    }

     /** For a Choice column, returns the text color of a given option
     * @param {string} ref - The option on which get the text color 
     * @returns color as HTML format #000000
     */
    getTextColor(ref) {
        return this.widgetOptions.choiceOptions?.[ref]?.textColor;
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
        const t = this.type.split(':');
        if (t[0] === 'Ref' || t[0] === 'RefList') {
            const recs = await grist.docApi.fetchTable(t[1]);
            const col = await this.getMeta(this.visibleCol);
            return recs[col.colId]
        } else if (t[0] === 'Choice' || t[0] === 'ChoiceList') { // TODO choices ?
            return this.widgetOptions?.choices;
        }
        return null;
    }

    /** For attachment column, return the url for the given id 
     * @param {number} id - id of the attachment
    */
    async getURL(id) {
        const t = this.type.split(':');
        if (t[0] === 'Attachments') {
            return await this._fullMeta.getURL(id);
        }
        return null;
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
    async parse(value, data = null, meta = null) {
        const t = this.type.split(':');
        if (t[0] === 'RefList') {
            if (value && value.length > 0) {
                if (value[0] === 'L') value = value.splice(0,1);
                if (value.length > 0 && typeof value[0] === 'number') {
                    const recs = data ?? await grist.docApi.fetchTable(t[1]);
                    const col = meta ?? await this.getMeta(this.visibleCol);
                    const idx = value.map(v => recs?.id?.indexOf(v));
                    return idx.map(i => recs[col.colId][i]); //TODO Parse each value
                } //TODO if visibleCol = 0              
            } 
        } else if (t[0] === 'Ref') {
            if (Array.isArray(value)) {
                //encoded: [ "R", "TableID", id ]
                if (value[2] > 0) {
                    if (this.visibleCol > 0) {
                        const recs = data ?? await grist.docApi.fetchTable(value[1]);
                        const col = meta ?? await this.getMeta(this.visibleCol);
                        const idx = recs?.id?.indexOf(value[2]);
                        return await this.parse(recs[col.colId][idx]);//recs[col.colId][idx]; 
                    } else return value[2];                   
                } else return undefined;
            } else if (typeof value === 'object') {
                //Object { tableId: "TableID", rowId: id }
                if (value.rowId > 0) { 
                    if (this.visibleCol > 0) {
                        const recs = data ?? await grist.docApi.fetchTable(value.tableId);
                        const col = meta ?? await this.getMeta(this.visibleCol);
                        const idx = recs?.id?.indexOf(value.rowId);
                        return await this.parse(recs[col.colId][idx]); //recs[col.colId][idx];
                    } else return value.rowId;              
                } else return undefined;                
            }
        } else if(t[0] === 'Date') {
            if (Array.isArray(value)) {
                if (value[1] > 0) {
                    return new Date(value[1] * 1000);
                } else return undefined;
            } // else return value
        } else if(t[0] === 'DateTime') {
            if (Array.isArray(value)) {
                if (value[1] > 0) {
                    return new Date(value[1] * 1000); // todo manage time zone
                } else return undefined;
            } // else return value
        }       
        
        //TODO manage other encoded data (if keepEncode === false), all possible list is : Int (Integer column), Numeric (Numeric column), Text, Date, DateTime, Bool (Toggle column), Choice, ChoiceList, Ref (Reference column), RefList (Reference List), Attachments.
        
        return value; //else
    }

    /** Parse a given value ID based on column meta data. Replace references, whatever the encoding is, by their ID. 
     * @param {*} value - Any value provided by Grist, but only Ref and Reflist are treated
     * @returns Reference id(s)
    */
    async parseId(value, data = null, meta = null) {
        const t = this.type.split(':');
        if (t[0] === 'RefList') {
            if (value && value.length > 0) {
                if (value[0] === 'L') value = value.splice(0,1);
                if (value.length > 0 && typeof value[0] !== 'number') {
                    const recs = data ?? await grist.docApi.fetchTable(t[1]);
                    const col = meta ?? await this.getMeta(this.visibleCol);
                    const idx = value.map(v => recs[col.colId]?.indexOf(v));
                    return idx.map(i => recs.id[i]);
                } //TODO if visibleCol = 0 
            }
        } else if (t[0] === 'Ref') {
            if (Array.isArray(value)) { 
                //encoded: [ "R", "TableID", id ]
                return value[2];
            } else if (typeof value === 'object') {
                //Object { tableId: "TableID", rowId: id }
                return value.rowId;
            } else {
                const recs = data ?? await grist.docApi.fetchTable(t[1]);
                const col = meta ?? await this.getMeta(this.visibleCol);
                const idx = recs[col.colId].indexOf(value);
                return recs.id[idx];
            } //TODO if visibleCol = 0 
        }
        return value;
    }

    /** Encode a given value to be compatible by Grist 
     * @param {*} value - Any value that need to be encoded before being sent to Grist
     * @returns Encoded value
    */
    async encode(value, data = null, meta = null) {
        if (value === null || value === undefined) return value
        const t = this.type.split(':');
        if (t[0] === 'RefList') { 
            if (Array.isArray(value) && value.length > 0 && typeof value[0] !== 'number') {
                const recs = data ?? await grist.docApi.fetchTable(t[1]);
                const col = meta ?? await this.getMeta(this.visibleCol);
                const idx = value.map(v => recs[col.colId]?.indexOf(v));
                return idx.map(i => recs.id[i]);
            } //TODO if visibleCol = 0 
        } else if (t[0] === 'Ref') {
            if (typeof value[0] !== 'number') {
                //look for id
                const recs = data ?? await grist.docApi.fetchTable(t[1]);
                const col = meta ?? await this.getMeta(this.visibleCol);
                const idx = recs[col.colId].indexOf(value);
                return recs.id[idx];
            } //TODO if visibleCol = 0 
        }
        return value;
    }

    /** Get current column meta data */
    async getMeta(colId) {
        return this._fullMeta.then(
            meta => { 
                return meta.col.find(t => t.id === colId);
              }
        );
    }
}