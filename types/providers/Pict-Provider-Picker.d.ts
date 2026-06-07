export = PictProviderPicker;
/**
 * The pict-section-picker provider — the primary API surface. Registers the widget CSS once and
 * creates/manages picker view instances.
 */
declare class PictProviderPicker extends libPictProvider {
    constructor(pFable: any, pOptions: any, pServiceHash: any);
    /**
     * Create (or reconfigure + reuse) a picker widget instance.
     *
     * @param {string} pPickerHash - A unique hash/id for this picker; the widget renders its control
     *   into the DOM element `#<pPickerHash>` unless a DestinationAddress is given.
     * @param {Record<string, any>} pConfig - Picker configuration:
     *   - DestinationAddress {string} - CSS selector to render into (default `#<pPickerHash>`).
     *   - ValueAddress {string} - AppData address the selection is read from / written to.
     *   - Mode {'single'} - selection mode (multi/categories/creatable land in later phases).
     *   - Placeholder {string} - text shown when nothing is selected.
     *   - Searchable {boolean} - show the search box (default true).
     *   - Options {Array<{Value:any, Text:string}>} - static option list.
     *   - OnChange {function} - optional callback invoked with the new value after a selection.
     * @return {any} The picker view instance.
     */
    createPicker(pPickerHash: string, pConfig: Record<string, any>): any;
    /**
     * Build the Meadow FoxHound filter for a search term across one or more fields.
     *
     * Single field → a clean AND-connected `FBV~Field~LK~%term%`. Multiple fields → the LIKEs are
     * OR'd together inside a paren group (`FOP…FCP`) so the OR can't bleed into a sibling AND base
     * filter. The term is `encodeURIComponent`-wrapped exactly as pict-section-recordset does, so the
     * structural `~` separators stay literal in the URL path while the value is escaped.
     *
     * @param {Array<string>} pSearchFields - The entity fields to LIKE-match.
     * @param {string} pTerm - The (raw) search term.
     * @return {string} The FoxHound filter stanza(s).
     */
    buildSearchFilter(pSearchFields: Array<string>, pTerm: string): string;
    /**
     * Build an async picker DataProvider backed by a Meadow entity (via `pict.EntityProvider`).
     * Returns a `(searchTerm, page) => Promise<{ results:[{Value,Text,Record}], hasMore }>` function —
     * the exact contract PictViewPicker consumes for server search + pagination.
     *
     * @param {Record<string, any>} pConfig - Entity source configuration:
     *   - Entity {string} (required) - the Meadow entity name (e.g. `Author`).
     *   - SearchFields {Array<string>} - fields to LIKE-search (default `['Name']`).
     *   - ValueField {string} - record field used as the option Value (default `ID<Entity>`).
     *   - TextField {string} - record field used as the option Text (default `Name`).
     *   - PageSize {number} - records per page (default 20).
     *   - Sort {string} - optional field to sort ascending (adds `FSF~<field>~ASC~0`).
     *   - BaseFilter {string|Array<string>|function} - optional always-applied FoxHound filter (AND),
     *     e.g. `FBV~IDCustomer~EQ~1`. May be a **function** `(searchTerm, page) => string|string[]`
     *     evaluated on every search — the generic hook for host-injected CONTEXTUAL scoping (project,
     *     tenant, spec-year, …). The module stays agnostic; the host supplies the closure.
     *   - MapRecord {function} - optional `(record) => {Value, Text}` mapper (overrides Value/TextField).
     * @return {(pSearchTerm: string, pPage: number) => Promise<{results: Array<any>, hasMore: boolean}>}
     */
    createEntityDataProvider(pConfig: Record<string, any>): (pSearchTerm: string, pPage: number) => Promise<{
        results: Array<any>;
        hasMore: boolean;
    }>;
    /**
     * Build a `ResolveValue(value) => Promise<{Value,Text}>` for an entity-backed picker, so a
     * pre-bound ID resolves to its display text on first render (fetched + cached by `getEntity`).
     *
     * @param {Record<string, any>} pConfig - Same shape as {@link createEntityDataProvider}.
     * @return {(pValue: any) => Promise<any>}
     */
    createEntityResolveValue(pConfig: Record<string, any>): (pValue: any) => Promise<any>;
    /**
     * Create a picker backed by a Meadow entity — the high-level entry point for the real
     * lims/config/bridge entity pickers. Wires a server DataProvider + ResolveValue from `pConfig`
     * and delegates to {@link createPicker}. Any picker option (DestinationAddress, ValueAddress,
     * Placeholder, OnChange, …) may also be supplied and is passed through.
     *
     * @param {string} pPickerHash - Unique hash/id for this picker.
     * @param {Record<string, any>} pConfig - {@link createEntityDataProvider} config + picker options.
     * @return {any} The picker view instance.
     */
    createEntityPicker(pPickerHash: string, pConfig: Record<string, any>): any;
}
declare namespace PictProviderPicker {
    export { _DEFAULT_CONFIGURATION as default_configuration };
}
import libPictProvider = require("pict-provider");
/** @type {Record<string, any>} */
declare const _DEFAULT_CONFIGURATION: Record<string, any>;
//# sourceMappingURL=Pict-Provider-Picker.d.ts.map