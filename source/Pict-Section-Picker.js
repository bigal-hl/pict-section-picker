// The container for all the Pict-Section-Picker related code.
//
// pict-section-picker is a themeable, pict-native searchable select / combobox: a jQuery- and
// select2-free widget supporting single & multi select, search, server pagination, categorized
// groups and creatable entries. It is driven by a host-agnostic async DataProvider, and ships a
// built-in adapter for the pict EntityProvider (Meadow entities) for the common case.

// The picker provider (primary API surface — registers the widget view + CSS, and exposes
// createPicker() / data-source adapters).
const PictProviderPicker = require('./providers/Pict-Provider-Picker.js');

// The widget view (also auto-registered by the provider).
const PictViewPicker = require('./views/PictView-Picker.js');

module.exports = PictProviderPicker;

module.exports.PictProviderPicker = PictProviderPicker;
module.exports.PictViewPicker = PictViewPicker;

module.exports.default_configuration = PictProviderPicker.default_configuration;
