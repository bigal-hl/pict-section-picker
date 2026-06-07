const libPictApplication = require('pict-application');

// The module under test — required by relative path so edits to source/ land in the build.
const libPictSectionPicker = require('../../../source/Pict-Section-Picker.js');

const _Countries =
[
	{ Value: 'us', Text: 'United States' },
	{ Value: 'ca', Text: 'Canada' },
	{ Value: 'mx', Text: 'Mexico' },
	{ Value: 'br', Text: 'Brazil' },
	{ Value: 'gb', Text: 'United Kingdom' },
	{ Value: 'fr', Text: 'France' },
	{ Value: 'de', Text: 'Germany' },
	{ Value: 'es', Text: 'Spain' },
	{ Value: 'it', Text: 'Italy' },
	{ Value: 'jp', Text: 'Japan' },
	{ Value: 'kr', Text: 'South Korea' },
	{ Value: 'cn', Text: 'China' },
	{ Value: 'in', Text: 'India' },
	{ Value: 'au', Text: 'Australia' },
	{ Value: 'za', Text: 'South Africa' },
	{ Value: 'eg', Text: 'Egypt' },
	{ Value: 'ng', Text: 'Nigeria' },
	{ Value: 'ar', Text: 'Argentina' },
	{ Value: 'cl', Text: 'Chile' },
	{ Value: 'se', Text: 'Sweden' },
];

class PickerDemoApplication extends libPictApplication
{
	onAfterInitializeAsync(fCallback)
	{
		this.pict.addProvider('Pict-Section-Picker', libPictSectionPicker.default_configuration, libPictSectionPicker);

		this.pict.AppData.Demo = { Country: 'jp' };

		const tmpPicker = this.pict.providers['Pict-Section-Picker'];
		tmpPicker.createPicker('CountryPicker',
			{
				DestinationAddress: '#CountryPicker',
				ValueAddress: 'AppData.Demo.Country',
				Placeholder: 'Select a country…',
				Options: _Countries,
				OnChange: (pValue) =>
				{
					this.pict.ContentAssignment.assignContent('#CountryValue', `Selected value: <code>${pValue}</code>`);
				},
			});

		this.pict.views['CountryPicker'].render();
		this.pict.ContentAssignment.assignContent('#CountryValue', `Selected value: <code>${this.pict.AppData.Demo.Country}</code>`);

		// --- Async picker (Phase 2): a mock server-paginated source (120 items, pageSize 20, ~200ms latency). ---
		const tmpItems = [];
		for (let i = 1; i <= 120; i++) { tmpItems.push({ Value: i, Text: `Item ${('00' + i).slice(-3)}` }); }
		const tmpMockProvider = (pSearch, pPage) => new Promise((resolve) =>
		{
			setTimeout(() =>
			{
				const tmpFiltered = pSearch ? tmpItems.filter((pItem) => pItem.Text.toLowerCase().indexOf(pSearch.toLowerCase()) >= 0) : tmpItems;
				const tmpStart = pPage * 20;
				resolve({ results: tmpFiltered.slice(tmpStart, tmpStart + 20), hasMore: (tmpStart + 20) < tmpFiltered.length });
			}, 200);
		});

		tmpPicker.createPicker('ItemPicker',
			{
				DestinationAddress: '#ItemPicker',
				ValueAddress: 'AppData.Demo.Item',
				Placeholder: 'Search items…',
				DataProvider: tmpMockProvider,
				PageSize: 20,
				OnChange: (pValue) =>
				{
					this.pict.ContentAssignment.assignContent('#ItemValue', `Selected value: <code>${pValue}</code>`);
				},
			});
		this.pict.views['ItemPicker'].render();

		// --- Entity-backed picker (Phase 2 adapter): the real Meadow path. Talks to the live Bookstore
		//     harness (Author entity, 6129 records) through pict.EntityProvider at urlPrefix /1.0/.
		//     Pre-bind IDAuthor 2 so ResolveValue resolves "J.K. Rowling" into the control on load. ---
		this.pict.AppData.Demo.Author = 2;
		tmpPicker.createEntityPicker('AuthorPicker',
			{
				Entity: 'Author',
				SearchFields: [ 'Name' ],
				ValueField: 'IDAuthor',
				TextField: 'Name',
				PageSize: 10,
				DestinationAddress: '#AuthorPicker',
				ValueAddress: 'AppData.Demo.Author',
				Placeholder: 'Search authors…',
				OnChange: (pValue, pRecord) =>
				{
					this.pict.ContentAssignment.assignContent('#AuthorValue', `Selected value: <code>${pValue}</code> — ${pRecord ? pRecord.Text : ''}`);
				},
			});
		this.pict.views['AuthorPicker'].render();

		// --- Multi-select, static options (Phase 3): chips + toggle + placeholder. ---
		this.pict.AppData.Demo.Countries = [ 'jp', 'br' ];
		tmpPicker.createPicker('CountriesPicker',
			{
				Mode: 'multi',
				DestinationAddress: '#CountriesPicker',
				ValueAddress: 'AppData.Demo.Countries',
				Placeholder: 'Add countries…',
				Options: _Countries,
				OnChange: (pValues) =>
				{
					this.pict.ContentAssignment.assignContent('#CountriesValue', `Selected: <code>${JSON.stringify(pValues)}</code>`);
				},
			});
		this.pict.views['CountriesPicker'].render();
		this.pict.ContentAssignment.assignContent('#CountriesValue', `Selected: <code>${JSON.stringify(this.pict.AppData.Demo.Countries)}</code>`);

		// --- Multi-select, entity-backed (Phase 3 + Phase 2 adapter): chips from the live harness.
		//     Pre-bind two IDs so multi ResolveValue resolves both names into chips on load. ---
		this.pict.AppData.Demo.Authors = [ 2, 10 ];
		tmpPicker.createEntityPicker('AuthorsPicker',
			{
				Mode: 'multi',
				Entity: 'Author',
				SearchFields: [ 'Name' ],
				ValueField: 'IDAuthor',
				TextField: 'Name',
				PageSize: 10,
				DestinationAddress: '#AuthorsPicker',
				ValueAddress: 'AppData.Demo.Authors',
				StringArrayValueAddress: 'AppData.Demo.AuthorsCSV',
				SelectedValuesAddress: 'AppData.Demo.AuthorsRecords',
				Placeholder: 'Add authors…',
				OnChange: (pValues) =>
				{
					this.pict.ContentAssignment.assignContent('#AuthorsValue', `Selected IDs: <code>${JSON.stringify(pValues)}</code>`);
				},
			});
		this.pict.views['AuthorsPicker'].render();

		// --- Categorized single-select (Phase 4): options carry a Group → headered sections. ---
		const _Regions =
		[
			{ Value: 'us', Text: 'United States', Group: 'Americas' },
			{ Value: 'ca', Text: 'Canada', Group: 'Americas' },
			{ Value: 'br', Text: 'Brazil', Group: 'Americas' },
			{ Value: 'gb', Text: 'United Kingdom', Group: 'Europe' },
			{ Value: 'fr', Text: 'France', Group: 'Europe' },
			{ Value: 'de', Text: 'Germany', Group: 'Europe' },
			{ Value: 'jp', Text: 'Japan', Group: 'Asia' },
			{ Value: 'cn', Text: 'China', Group: 'Asia' },
			{ Value: 'in', Text: 'India', Group: 'Asia' },
		];
		this.pict.AppData.Demo.Region = 'fr';
		tmpPicker.createPicker('RegionPicker',
			{
				DestinationAddress: '#RegionPicker',
				ValueAddress: 'AppData.Demo.Region',
				Placeholder: 'Pick a country…',
				Options: _Regions,
				OnChange: (pValue) =>
				{
					this.pict.ContentAssignment.assignContent('#RegionValue', `Selected value: <code>${pValue}</code>`);
				},
			});
		this.pict.views['RegionPicker'].render();
		this.pict.ContentAssignment.assignContent('#RegionValue', `Selected value: <code>${this.pict.AppData.Demo.Region}</code>`);

		// --- Creatable multi-select (Phase 4): "tags" you can both pick and invent via OnCreate. ---
		this.pict.AppData.Demo.Tags = [ 'urgent' ];
		let tmpCreatedTagSeq = 0;
		tmpPicker.createPicker('TagsPicker',
			{
				Mode: 'multi',
				DestinationAddress: '#TagsPicker',
				ValueAddress: 'AppData.Demo.Tags',
				Placeholder: 'Add or create tags…',
				Options:
				[
					{ Value: 'urgent', Text: 'urgent' },
					{ Value: 'review', Text: 'review' },
					{ Value: 'blocked', Text: 'blocked' },
				],
				OnCreate: (pTerm) =>
				{
					tmpCreatedTagSeq++;
					// Mint a new tag record; a real app would POST it and return the saved row (may be async).
					return { Value: `tag-${tmpCreatedTagSeq}-${pTerm.toLowerCase().replace(/\s+/g, '-')}`, Text: pTerm };
				},
				OnChange: (pValues) =>
				{
					this.pict.ContentAssignment.assignContent('#TagsValue', `Tags: <code>${JSON.stringify(pValues)}</code>`);
				},
			});
		this.pict.views['TagsPicker'].render();
		this.pict.ContentAssignment.assignContent('#TagsValue', `Tags: <code>${JSON.stringify(this.pict.AppData.Demo.Tags)}</code>`);

		return super.onAfterInitializeAsync(fCallback);
	}
}

PickerDemoApplication.default_configuration =
{
	Name: 'Picker Demo',
	Hash: 'PickerDemo',
};

module.exports = PickerDemoApplication;

module.exports.default_configuration = PickerDemoApplication.default_configuration;
