export = PictViewPicker;
declare class PictViewPicker extends libPictView {
    constructor(pFable: any, pOptions: any, pServiceHash: any);
    _StateAddress: string;
    _open: boolean;
    _search: string;
    _highlight: number;
    _loadedResults: any[];
    _page: number;
    _hasMore: boolean;
    _loading: boolean;
    _loaded: boolean;
    _searchTimer: NodeJS.Timeout;
    _selectedText: any;
    _values: any[];
    _selectedRecords: {};
    /** @return {boolean} True when a DataProvider function is configured (async/server mode). */
    _isAsync(): boolean;
    /** @return {boolean} True when the picker is in multi-select (chips) mode. */
    _isMulti(): boolean;
    /** @return {Record<string, any>} The AppData state slot for this picker. */
    _state(): Record<string, any>;
    /** Resolve display text for any pre-bound value(s) via the async ResolveValue hook, then repaint. */
    _resolveInitialValues(): void;
    /**
     * @return {any} The current selection: a scalar in single mode, or an array of values in multi mode
     *   (normalizing a csv string or scalar at the bound address into an array).
     */
    getValue(): any;
    /**
     * Persist the selection to the bound address(es). Single mode writes the scalar; multi mode writes
     * the array to ValueAddress and mirrors it to the optional csv / records addresses.
     * @param {any} pValue - The new value (scalar in single mode, array in multi mode).
     */
    _setValue(pValue: any): void;
    _value: any;
    /**
     * Public: set the picker's value programmatically (e.g. when a host form marshals data into it).
     * Accepts a scalar (single mode) or an array / csv string (multi mode), seeds display text for any
     * unknown values (from the source rows, else async ResolveValue), then repaints.
     * @param {any} pValue
     * @return {PictViewPicker} this
     */
    setValue(pValue: any): PictViewPicker;
    /**
     * Ensure each value has a {Value,Text} in _selectedRecords — from the current source rows when
     * present, else (async mode) fetched via ResolveValue and painted in when it resolves.
     * @param {Array<any>} pValues
     */
    _seedSelectedRecords(pValues: Array<any>): void;
    /** @return {Array<{Value:any, Text:string}>} The current option source rows (async results or static Options). */
    _sourceRows(): Array<{
        Value: any;
        Text: string;
    }>;
    /**
     * (Re)compute the picker's render state into AppData: the displayed value / chips + the
     * (search-filtered) option list with selected/highlight flags.
     */
    _buildState(): Record<string, any>;
    /**
     * Find the {Value,Text} record for a value: the stored selection record (authoritative for chips /
     * async), else a row in the current source (static Options or loaded results).
     * @param {any} pValue
     * @return {{Value:any, Text:string}|null}
     */
    _lookupRecord(pValue: any): {
        Value: any;
        Text: string;
    } | null;
    /**
     * Load a page of results from the async DataProvider, accumulating (append) or replacing the list.
     * @param {number} pPage - zero-based page index.
     * @param {boolean} pAppend - true to append (Load more), false to replace (new search / first open).
     */
    _loadPage(pPage: number, pAppend: boolean): void;
    /** Toggle the dropdown open/closed. */
    toggle(pEvent: any): void;
    /** Keyboard on the control: open the dropdown on Enter / Space / ArrowDown. */
    onControlKey(pEvent: any): void;
    /** Open the dropdown and focus the search box. */
    open(): void;
    /**
     * Position the (fixed) dropdown against the control, flipping above when there's more room there.
     * Because the popover is position:fixed (viewport-anchored), no ancestor overflow can clip it; the
     * trade-off is we set its top/left/width ourselves from the control's rect on open.
     */
    _positionPop(): void;
    /** Async mode: load + append the next page of results. */
    loadMore(): void;
    /** Close the dropdown. */
    close(): void;
    /** Reflect the open/closed state on the widget container. */
    _paintOpen(): void;
    /** Re-render only the option list (keeps the search input + its focus intact). */
    _renderList(): void;
    /** Re-render only the control's value area (the value span or the chips) — used in multi mode so
     *  toggling a selection updates the chips without tearing down the open dropdown + search box. */
    _renderValue(): void;
    /** @param {string} pValue - Filter the option list by this search term. */
    search(pValue: string): void;
    /** Keyboard navigation within the search box: arrows highlight, Enter selects, Escape closes. */
    onSearchKey(pEvent: any): void;
    /**
     * Select an option. Single mode: set the value + close. Multi mode: toggle the value in/out of the
     * selection, keep the dropdown open, and refocus the search box for rapid multi-pick.
     * @param {string} pValueKey - String(Value) of the option.
     */
    select(pValueKey: string): void;
    /** @return {Array<{Value:any, Text:string}>} The full record list for the current multi selection. */
    getSelectedRecords(): Array<{
        Value: any;
        Text: string;
    }>;
    /**
     * Creatable: build a new option from the current search term via OnCreate, then select it (single:
     * set + close; multi: add a chip). The created record is inserted into the source list so it shows
     * as a normal, checked option.
     */
    createFromSearch(): void;
    /** Multi mode: remove a selected value (chip ×). Keeps the dropdown state as-is. */
    removeChip(pValueKey: any): void;
}
declare namespace PictViewPicker {
    export { _DEFAULT_CONFIGURATION as default_configuration };
}
import libPictView = require("pict-view");
/** @type {Record<string, any>} */
declare const _DEFAULT_CONFIGURATION: Record<string, any>;
//# sourceMappingURL=PictView-Picker.d.ts.map