# pict-section-picker

A Pict-native, themeable searchable **select / combobox** — a jQuery/`select2`-free replacement for entity pickers and tag inputs in [Pict](https://github.com/fable-retold/pict) applications.

- **Single & multi select** — scalar value, or an array of values rendered as removable chips.
- **Search** with keyboard navigation (↑/↓ + Enter), click-outside to close.
- **Server pagination** — drive options from an async `DataProvider(searchTerm, page)`; "Load more" / infinite scroll.
- **Categorized options** — group rows under headers.
- **Creatable** — let users mint new entries from the search term via `OnCreate`.
- **Built-in Meadow adapter** — point it at a Meadow entity and it builds the server `DataProvider` (FoxHound `LIKE` search + paging) and the pre-bound-value resolver for you.
- **Themeable** via `--theme-color-*` tokens. No jQuery, no `select2`, no `addEventListener` — pure Pict conventions.

## Install

```bash
npm install pict-section-picker
```

## Quick start

Register the provider, then create pickers through it. Each picker renders into a host DOM element and reads/writes its selection from an AppData address.

```javascript
const libPictSectionPicker = require('pict-section-picker');

// In your application's onAfterInitializeAsync:
this.pict.addProvider('Pict-Section-Picker', libPictSectionPicker.default_configuration, libPictSectionPicker);
const tmpPicker = this.pict.providers['Pict-Section-Picker'];

// A simple static single-select.
tmpPicker.createPicker('CountryPicker',
{
    DestinationAddress: '#CountryPicker',     // where to render
    ValueAddress: 'AppData.Form.Country',     // selection is read from / written to here
    Placeholder: 'Select a country…',
    Options: [ { Value: 'us', Text: 'United States' }, { Value: 'ca', Text: 'Canada' } ],
    OnChange: (pValue, pRecord) => { /* … */ },
});
this.pict.views['CountryPicker'].render();
```

The control renders into `#CountryPicker`; `AppData.Form.Country` holds the selected value.

## Picker modes

### Single (default)

`Mode: 'single'` — `ValueAddress` holds the scalar value. Selecting closes the dropdown.

### Multi

`Mode: 'multi'` — `ValueAddress` holds an **array** of values, rendered as chips with × buttons. Selecting toggles membership and keeps the dropdown open for rapid multi-pick. Two optional mirror bindings (the `EntitySelectorMultiple` contract):

| Option | Holds |
|---|---|
| `ValueAddress` | the array of values, e.g. `[2, 10, 141]` |
| `StringArrayValueAddress` | a csv string, e.g. `"2,10,141"` |
| `SelectedValuesAddress` | the full record list, e.g. `[{Value, Text}, …]` |

```javascript
tmpPicker.createPicker('TagsPicker',
{
    Mode: 'multi',
    DestinationAddress: '#TagsPicker',
    ValueAddress: 'AppData.Form.Tags',
    Placeholder: 'Add tags…',
    Options: [ { Value: 'urgent', Text: 'urgent' }, { Value: 'review', Text: 'review' } ],
});
```

## Async data (server search + pagination)

Pass a `DataProvider` instead of (or in addition to) static `Options`. It is called with the current search term and a zero-based page index, and resolves a page of results plus whether more remain:

```javascript
DataProvider: (pSearchTerm, pPage) => Promise.resolve(
{
    results: [ { Value: 1, Text: 'First' }, /* … up to PageSize … */ ],
    hasMore: true,   // show a "Load more" button
})
```

Searches are debounced; "Load more" appends the next page. For a value that is already bound when the picker mounts (e.g. an ID with no text yet), supply `ResolveValue(value) => Promise<{Value, Text}>` so the control can show its label.

## Meadow entity pickers

For the common case — picking a [Meadow](https://github.com/fable-retold/meadow) entity over the REST API — use `createEntityPicker`. It builds the server `DataProvider` (FoxHound `LIKE` search across your fields, offset/limit paging) and the `ResolveValue` resolver from `pict.EntityProvider` automatically.

```javascript
tmpPicker.createEntityPicker('AuthorPicker',
{
    Entity: 'Author',                 // the Meadow entity
    SearchFields: [ 'Name' ],         // fields to LIKE-search (default ['Name'])
    ValueField: 'IDAuthor',           // option Value (default 'ID<Entity>')
    TextField: 'Name',                // option Text  (default 'Name')
    PageSize: 20,
    DestinationAddress: '#AuthorPicker',
    ValueAddress: 'AppData.Form.IDAuthor',
    Placeholder: 'Search authors…',
    // Works in multi mode too — add Mode: 'multi'.
});
this.pict.views['AuthorPicker'].render();
```

Entity-source configuration:

| Option | Default | Purpose |
|---|---|---|
| `Entity` | — (required) | The Meadow entity name. |
| `SearchFields` | `['Name']` | Fields OR'd together in the `LIKE` search. |
| `ValueField` | `ID<Entity>` | Record field used as the option `Value`. |
| `TextField` | `'Name'` | Record field used as the option `Text`. |
| `PageSize` | `20` | Records per page. |
| `Sort` | — | Field to sort ascending (`FSF~<field>~ASC~0`). |
| `BaseFilter` | — | An always-applied FoxHound filter (AND), e.g. `FBV~IDCustomer~EQ~1`. |
| `MapRecord` | — | `(record) => {Value, Text}` mapper, overriding `Value`/`TextField`. |

The lower-level builders are also exposed: `createEntityDataProvider(cfg)` and `createEntityResolveValue(cfg)` return the raw functions if you want to wire them yourself.

## Joined display (parent-entity context)

Sometimes a searched entity is ambiguous on its own — a `LineItem` only makes sense next to its `Project`, a `Review` next to its `Book`. Set `JoinEntity` and the picker renders a **compound** label by joining each searched row to a parent entity through a foreign key the row carries:

```javascript
tmpPicker.createEntityPicker('ReviewPicker',
{
    Entity: 'Review',
    SearchFields: [ 'Summary' ],
    JoinEntity: 'Book',                 // the parent entity to join
    JoinField: 'IDBook',                // the FK on the Review row -> Book
    JoinEntityDisplayField: 'Title',    // the Book field to show
    DestinationAddress: '#ReviewPicker',
    ValueAddress: 'AppData.Form.IDReview',
});
// options render as "Neuromancer - Loved it"; the Value is still IDReview.
```

Meadow can't join in a single read, so this is **fetch-then-merge**: after each search page the picker collects the rows' unique FK ids and issues **one** `FBL~ID{JoinEntity}~INN~<ids>` request, then stitches the joined display onto every row (also exposed as `Record.JoinName` / `Record.JoinRecord` for `MapRecord` / templates). The same join resolves a pre-bound value's label on first render.

| Option | Default | Purpose |
|---|---|---|
| `JoinEntity` | — | Parent entity to join for the compound display. Setting it enables the feature. |
| `JoinField` | `ID<JoinEntity>` | The FK column **on the searched row** pointing at `JoinEntity`. |
| `JoinEntityValueField` | `ID<JoinEntity>` | The PK column on `JoinEntity` to match (the `INN` column). |
| `JoinEntityDisplayField` | `'Name'` | The `JoinEntity` field shown in the compound label. |
| `JoinEntityFirst` | `true` | `true` → `Parent - Row`; `false` → `Row - Parent`. |
| `JoinSeparator` | `' - '` | Separator between the two parts. |

The same options ride through the form-input adapter (`PictForm.JoinEntity`, …) and the pict-section-recordset entity filters (set `JoinEntity` on the clause) — so an entity filter can show parent context for its options with no host code, layered on top of either the 1:1 (direct-FK / `InternalJoin`) or 1:many (junction / `ExternalJoin`) filter relationship.

## Categories

Give option rows an optional `Group` field and the list renders headered sections (preserving order; rows without a `Group` fall into a leading unlabeled section):

```javascript
Options:
[
    { Value: 'us', Text: 'United States', Group: 'Americas' },
    { Value: 'gb', Text: 'United Kingdom', Group: 'Europe' },
    { Value: 'jp', Text: 'Japan',          Group: 'Asia' },
]
```

Async sources can return `Group` on each result row too.

## Creatable

Set `OnCreate(searchTerm) => {Value, Text} | Promise<{Value, Text}>`. When the search term is non-empty and doesn't exactly match an existing row, a **"Create …"** row appears (also triggerable with Enter). The returned record is selected (single) or added as a chip (multi):

```javascript
OnCreate: (pTerm) =>
{
    // A real app would POST the new entity and return the saved row (sync or async).
    return { Value: slugify(pTerm), Text: pTerm };
}
```

## Configuration reference

| Option | Default | Purpose |
|---|---|---|
| `DestinationAddress` | `#<hash>` | CSS selector to render the control into. |
| `ValueAddress` | — | AppData address the selection is read from / written to. |
| `Mode` | `'single'` | `'single'` (scalar) or `'multi'` (array + chips). |
| `Placeholder` | `'Select…'` | Text shown when nothing is selected. |
| `Searchable` | `true` | Show the search box. |
| `Options` | `[]` | Static option list (`{Value, Text, Group?}`). |
| `DataProvider` | — | Async source `(term, page) => Promise<{results, hasMore}>`. |
| `PageSize` | `20` | Page size for async sources. |
| `ResolveValue` | — | `(value) => Promise<{Value, Text}>` to label a pre-bound value. |
| `StringArrayValueAddress` | — | (multi) mirror the value array as a csv string. |
| `SelectedValuesAddress` | — | (multi) mirror the selection as a record array. |
| `OnCreate` | — | `(term) => {Value, Text}` to enable creatable entries. |
| `OnChange` | — | Called after a selection: single → `(value, record)`, multi → `(values, records)`. |

## View methods

Call these on the picker view instance — `this.pict.views['<hash>']`:

| Method | Description |
|--------|-------------|
| `render()` | Paint (or repaint) the control into its destination. |
| `getValue()` | The current selection — a scalar in single mode, an array of values in multi mode. |
| `setValue(pValue)` | Set the selection programmatically — the supported counterpart to `getValue()`. Single mode takes a scalar; multi mode takes an array (or a csv string). Writes through to the bound address(es), resolves the display label of any unknown value (from the loaded options, else via `ResolveValue` in async mode), and repaints. Does **not** fire `OnChange` — it is a programmatic set (e.g. a host marshaling a form value into the control), not a user pick. Returns the view for chaining. |
| `getSelectedRecords()` | (multi) The full `{Value, Text}` record list for the current selection. |

```javascript
const tmpPicker = this.pict.views['AuthorPicker'];
tmpPicker.setValue(141);            // single: select author 141 (label resolves via ResolveValue if async)
tmpPicker.setValue([ 2, 10, 141 ]); // multi: select these values (array or "2,10,141" csv both accepted)
const tmpSelected = tmpPicker.getValue();
```

## Theming

The widget paints from `--theme-color-*` tokens with sensible hex fallbacks, so it inherits the host app's theme. Relevant tokens: `--theme-color-brand-primary`, `--theme-color-text-primary`, `--theme-color-text-muted`, `--theme-color-border-default`, `--theme-color-border-light`, `--theme-color-border-strong`, `--theme-color-background-primary`, `--theme-color-background-panel`, `--theme-color-background-tertiary`.

## Example application

`example_applications/picker_demo` exercises every mode (static / async / entity, single / multi, categorized, creatable). Build it with `npm run build` in that folder and open `dist/index.html`. The entity pickers in the demo talk to a live Meadow harness.

## License

MIT
