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

## Theming

The widget paints from `--theme-color-*` tokens with sensible hex fallbacks, so it inherits the host app's theme. Relevant tokens: `--theme-color-brand-primary`, `--theme-color-text-primary`, `--theme-color-text-muted`, `--theme-color-border-default`, `--theme-color-border-light`, `--theme-color-border-strong`, `--theme-color-background-primary`, `--theme-color-background-panel`, `--theme-color-background-tertiary`.

## Example application

`example_applications/picker_demo` exercises every mode (static / async / entity, single / multi, categorized, creatable). Build it with `npm run build` in that folder and open `dist/index.html`. The entity pickers in the demo talk to a live Meadow harness.

## License

MIT
