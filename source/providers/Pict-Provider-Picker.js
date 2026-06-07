const libPictProvider = require('pict-provider');

const libPictViewPicker = require('../views/PictView-Picker.js');

// Themeable widget CSS. Registered once (by hash) regardless of how many picker instances exist.
// Host apps brand by defining the --theme-color-* tokens; the hardcoded values are fallbacks.
const _PickerCSS = /*css*/`
.pps { position: relative; width: 100%; box-sizing: border-box; }
.pps *, .pps *::before, .pps *::after { box-sizing: border-box; }
.pps-control { display: flex; align-items: center; gap: 0.5rem; width: 100%; cursor: pointer; font: inherit; font-size: 0.92rem;
	padding: 0.45rem 0.7rem; border-radius: 8px; border: 1px solid var(--theme-color-border-default, #d7dce3);
	background: var(--theme-color-background-primary, #fff); color: var(--theme-color-text-primary, #1f2733); text-align: left; }
.pps-control:hover { border-color: var(--theme-color-border-strong, #c2c9d2); }
.pps.pps-open .pps-control { border-color: var(--theme-color-brand-primary, #156dd1);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color-brand-primary, #156dd1) 16%, transparent); }
.pps-valuearea { flex: 1 1 auto; min-width: 0; }
.pps-value { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pps-value.pps-placeholder { color: var(--theme-color-text-muted, #6b7686); }
.pps-chevron { flex: 0 0 auto; display: inline-flex; color: var(--theme-color-text-muted, #6b7686); font-size: 0.8rem; transition: transform 0.15s ease; }
.pps.pps-open .pps-chevron { transform: rotate(180deg); }

/* Multi-select chips. The control hosts a wrapping row of removable tags + a muted placeholder. */
.pps-multi .pps-control { align-items: flex-start; }
.pps-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem; min-width: 0; }
.pps-chips-ph { color: var(--theme-color-text-muted, #6b7686); }
.pps-chip { display: inline-flex; align-items: center; gap: 0.3rem; max-width: 100%; font-size: 0.82rem; line-height: 1.4;
	padding: 0.1rem 0.2rem 0.1rem 0.5rem; border-radius: 6px;
	background: color-mix(in srgb, var(--theme-color-brand-primary, #156dd1) 12%, transparent);
	color: var(--theme-color-brand-primary, #156dd1); }
.pps-chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pps-chip-x { flex: 0 0 auto; display: inline-flex; align-items: center; cursor: pointer; font-size: 0.78rem; border-radius: 4px; padding: 0.1rem; opacity: 0.7; }
.pps-chip-x:hover { opacity: 1; background: color-mix(in srgb, var(--theme-color-brand-primary, #156dd1) 22%, transparent); }

/* Transparent full-viewport backdrop: closes on outside click (no document listener). Only present
   while OPEN — otherwise a fixed full-viewport layer would swallow every click on the page. When open,
   the control is raised above it so its chips/× stay clickable; the dropdown sits above both. */
.pps-backdrop { position: fixed; inset: 0; z-index: 0; display: none; }
.pps.pps-open .pps-backdrop { display: block; }
.pps.pps-open .pps-control { position: relative; z-index: 1; }
/* Fixed (viewport-anchored) + JS-positioned in open(), so no ancestor's overflow:hidden — a card, a
   slide-out drawer, a scroll pane — can ever clip the dropdown, whatever the host's layout. */
.pps-pop { position: fixed; z-index: 40; min-width: 200px; display: none; }
.pps.pps-open .pps-pop { display: block; }
.pps-panel { position: relative; z-index: 1; display: flex; flex-direction: column; max-height: min(60vh, 360px);
	background: var(--theme-color-background-panel, #fff); border: 1px solid var(--theme-color-border-default, #d7dce3);
	border-radius: 10px; box-shadow: 0 10px 28px rgba(17, 24, 39, 0.14); overflow: hidden; }
.pps-search { flex: 0 0 auto; display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.7rem; border-bottom: 1px solid var(--theme-color-border-light, #e8ebf0); }
.pps-search-ic { display: inline-flex; color: var(--theme-color-text-muted, #6b7686); font-size: 0.9rem; }
.pps-search input { flex: 1 1 auto; min-width: 0; font: inherit; font-size: 0.9rem; border: none; outline: none; background: transparent; color: var(--theme-color-text-primary, #1f2733); }
.pps-list { flex: 1 1 auto; overflow-y: auto; padding: 0.25rem; }
.pps-option { display: flex; align-items: center; gap: 0.5rem; width: 100%; text-align: left; cursor: pointer; font: inherit; font-size: 0.9rem;
	padding: 0.45rem 0.6rem; border: none; border-radius: 6px; background: transparent; color: var(--theme-color-text-primary, #1f2733); }
.pps-option:hover, .pps-option.pps-highlight { background: var(--theme-color-background-tertiary, #eceef2); }
.pps-option.pps-selected { color: var(--theme-color-brand-primary, #156dd1); font-weight: 600; }
.pps-option-check { flex: 0 0 auto; display: inline-flex; width: 1em; color: var(--theme-color-brand-primary, #156dd1); }
.pps-option-check.pps-hidden { visibility: hidden; }
.pps-empty { padding: 0.7rem 0.6rem; color: var(--theme-color-text-muted, #6b7686); font-size: 0.86rem; text-align: center; }
.pps-loading { padding: 0.6rem; text-align: center; color: var(--theme-color-text-muted, #6b7686); font-size: 0.85rem; }
.pps-more { display: block; width: calc(100% - 0.5rem); margin: 0.25rem; padding: 0.4rem; cursor: pointer; font: inherit; font-size: 0.85rem;
	border: 1px solid var(--theme-color-border-light, #e8ebf0); border-radius: 6px; background: transparent; color: var(--theme-color-brand-primary, #156dd1); }
.pps-more:hover { background: var(--theme-color-background-tertiary, #eceef2); }

/* Category header (groups) + creatable "Create …" row. */
.pps-group { padding: 0.45rem 0.6rem 0.2rem; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--theme-color-text-muted, #6b7686); }
.pps-create { display: flex; align-items: center; gap: 0.5rem; width: 100%; text-align: left; cursor: pointer; font: inherit; font-size: 0.9rem;
	padding: 0.45rem 0.6rem; border: none; border-radius: 6px; background: transparent; color: var(--theme-color-brand-primary, #156dd1); font-weight: 600; }
.pps-create:hover { background: var(--theme-color-background-tertiary, #eceef2); }
.pps-create-ic { flex: 0 0 auto; display: inline-flex; }

/* Form-input adapter (pict-section-picker/form): the picker host fills its row like the host's
   native inputs (width:100% forces it to wrap below the label span + fill, matching a scalar input). */
.pps-form-host { flex: 1 1 100%; min-width: 0; width: 100%; }
`;

/** @type {Record<string, any>} */
const _DEFAULT_CONFIGURATION =
{
	ProviderIdentifier: 'Pict-Section-Picker',

	AutoInitialize: true,
	AutoInitializeOrdinal: 0,
};

/**
 * The pict-section-picker provider — the primary API surface. Registers the widget CSS once and
 * creates/manages picker view instances.
 */
class PictProviderPicker extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, _DEFAULT_CONFIGURATION, pOptions);
		super(pFable, tmpOptions, pServiceHash);

		if (this.pict && this.pict.CSSMap && typeof this.pict.CSSMap.addCSS === 'function')
		{
			this.pict.CSSMap.addCSS('Pict-Section-Picker-CSS', _PickerCSS, 500);
		}
	}

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
	createPicker(pPickerHash, pConfig)
	{
		const tmpConfig = Object.assign(
			{
				DestinationAddress: `#${pPickerHash}`,
				Mode: 'single',
				Searchable: true,
				Placeholder: 'Select…',
				Options: [],
			},
			pConfig || {},
			{ PickerHash: pPickerHash });

		if (this.pict.views[pPickerHash])
		{
			Object.assign(this.pict.views[pPickerHash].options, tmpConfig);
			return this.pict.views[pPickerHash];
		}
		return this.pict.addView(pPickerHash, tmpConfig, libPictViewPicker);
	}

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
	buildSearchFilter(pSearchFields, pTerm)
	{
		const tmpEncoded = encodeURIComponent(`%${pTerm}%`);
		if (pSearchFields.length === 1)
		{
			return `FBV~${pSearchFields[0]}~LK~${tmpEncoded}`;
		}
		const tmpInner = pSearchFields.map((pField, pIndex) => `${pIndex === 0 ? 'FBV' : 'FBVOR'}~${pField}~LK~${tmpEncoded}`).join('~');
		return `FOP~0~(~0~${tmpInner}~FCP~0~)~0`;
	}

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
	createEntityDataProvider(pConfig)
	{
		const tmpEntity = pConfig.Entity;
		const tmpSearchFields = (Array.isArray(pConfig.SearchFields) && pConfig.SearchFields.length > 0) ? pConfig.SearchFields : [ 'Name' ];
		const tmpValueField = pConfig.ValueField || `ID${tmpEntity}`;
		const tmpTextField = pConfig.TextField || 'Name';
		const tmpPageSize = pConfig.PageSize || 20;
		const tmpSort = pConfig.Sort || false;
		const tmpBaseFilterConfig = pConfig.BaseFilter || '';
		const tmpMapRecord = (typeof pConfig.MapRecord === 'function') ? pConfig.MapRecord : false;

		return (pSearchTerm, pPage) => new Promise((resolve, reject) =>
		{
			if (!this.pict.EntityProvider || typeof this.pict.EntityProvider.getEntitySetPage !== 'function')
			{
				return reject(new Error('Pict-Section-Picker: pict.EntityProvider is not available for entity-backed pickers.'));
			}

			// Resolve the base filter at SEARCH time. A function form lets the host inject contextual
			// scoping (e.g. "only this project's line items") without the module knowing the context;
			// it can return a single stanza, an array of stanzas, or nothing.
			let tmpBaseFilter = tmpBaseFilterConfig;
			if (typeof tmpBaseFilterConfig === 'function')
			{
				try { tmpBaseFilter = tmpBaseFilterConfig(pSearchTerm, pPage); }
				catch (pScopeError) { this.pict.log.warn(`Pict-Section-Picker [${tmpEntity}] BaseFilter() threw; ignoring contextual scope.`, pScopeError); tmpBaseFilter = ''; }
			}
			if (Array.isArray(tmpBaseFilter)) { tmpBaseFilter = tmpBaseFilter.filter(Boolean).join('~'); }

			const tmpStanzas = [];
			if (tmpBaseFilter) { tmpStanzas.push(tmpBaseFilter); }
			if (pSearchTerm) { tmpStanzas.push(this.buildSearchFilter(tmpSearchFields, pSearchTerm)); }
			if (tmpSort) { tmpStanzas.push(`FSF~${tmpSort}~ASC~0`); }
			const tmpFilter = tmpStanzas.filter(Boolean).join('~');

			const tmpCursor = (pPage || 0) * tmpPageSize;
			this.pict.EntityProvider.getEntitySetPage(tmpEntity, tmpFilter, tmpCursor, tmpPageSize,
				(pError, pRecords) =>
				{
					if (pError) { return reject(pError); }
					const tmpList = Array.isArray(pRecords) ? pRecords : [];
					const tmpResults = tmpList.map((pRecord) => tmpMapRecord
						? tmpMapRecord(pRecord)
						: { Value: pRecord[tmpValueField], Text: pRecord[tmpTextField], Record: pRecord });
					// hasMore: a full page came back, so there is (probably) another. Avoids a Count round-trip.
					return resolve({ results: tmpResults, hasMore: (tmpList.length >= tmpPageSize) });
				});
		});
	}

	/**
	 * Build a `ResolveValue(value) => Promise<{Value,Text}>` for an entity-backed picker, so a
	 * pre-bound ID resolves to its display text on first render (fetched + cached by `getEntity`).
	 *
	 * @param {Record<string, any>} pConfig - Same shape as {@link createEntityDataProvider}.
	 * @return {(pValue: any) => Promise<any>}
	 */
	createEntityResolveValue(pConfig)
	{
		const tmpEntity = pConfig.Entity;
		const tmpValueField = pConfig.ValueField || `ID${tmpEntity}`;
		const tmpTextField = pConfig.TextField || 'Name';
		const tmpMapRecord = (typeof pConfig.MapRecord === 'function') ? pConfig.MapRecord : false;

		return (pValue) => new Promise((resolve) =>
		{
			if (pValue === undefined || pValue === null || pValue === '' || !this.pict.EntityProvider)
			{
				return resolve(null);
			}
			this.pict.EntityProvider.getEntity(tmpEntity, pValue,
				(pError, pRecord) =>
				{
					if (pError || !pRecord) { return resolve(null); }
					return resolve(tmpMapRecord ? tmpMapRecord(pRecord) : { Value: pRecord[tmpValueField], Text: pRecord[tmpTextField], Record: pRecord });
				});
		});
	}

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
	createEntityPicker(pPickerHash, pConfig)
	{
		const tmpConfig = Object.assign({}, pConfig);
		tmpConfig.DataProvider = this.createEntityDataProvider(pConfig);
		if (!tmpConfig.ResolveValue) { tmpConfig.ResolveValue = this.createEntityResolveValue(pConfig); }
		return this.createPicker(pPickerHash, tmpConfig);
	}
}

module.exports = PictProviderPicker;

module.exports.default_configuration = _DEFAULT_CONFIGURATION;
