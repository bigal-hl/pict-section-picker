/*
	Unit tests for the pict-section-picker preview-card affordance — the small ⓘ rendered next to a
	selected value / chip that opens the entity's RecordSetCardManager preview card.

	It is OPT-IN and a SOFT dependency: the ⓘ slot is stamped only when (a) the host registered a
	`RecordSetCardManager` provider that (b) `hasCard()` for the picker's `Entity`, and (c) the picker
	did not opt out with `RecordCard: false`. With no card manager, no card, or an opt-out, the picker
	renders exactly as before (no CardSlot). These pin that gate at the _buildState() level; the card
	manager itself is faked (no PSRS dependency, no backend).
*/

const libBrowserEnv = require('browser-env');
libBrowserEnv();

const Chai = require('chai');
const Expect = Chai.expect;

const libPict = require('pict');

const libPictSectionPicker = require('../source/Pict-Section-Picker.js');

const COUNTRY_OPTIONS =
[
	{ Value: 'us', Text: 'United States' },
	{ Value: 'ca', Text: 'Canada' },
];

const configureTestPict = () =>
{
	const tmpPict = new libPict({ LogStreams: [ { loggertype: 'console', streamtype: 'console', level: 'error' } ] });
	tmpPict.ContentAssignment.customAssignFunction = () => '';
	tmpPict.ContentAssignment.customReadFunction = () => '';
	tmpPict.ContentAssignment.customGetElementFunction = () => '';
	tmpPict.ContentAssignment.customAppendElementFunction = () => '';
	return tmpPict;
};

/** A picker provider whose Pict carries a fake RecordSetCardManager that has a card for pCardEntity. */
const newProviderWithCardFor = (pCardEntity) =>
{
	const tmpPict = configureTestPict();
	tmpPict.providers.RecordSetCardManager = { hasCard: (pEntity) => (pEntity === pCardEntity) };
	return tmpPict.addProvider('Pict-Section-Picker', libPictSectionPicker.default_configuration, libPictSectionPicker);
};

suite
(
	'Pict-Section-Picker RecordCard affordance',
	() =>
	{
		test('a selected value stamps a CardSlot when a card exists for the picker Entity', () =>
		{
			const tmpProvider = newProviderWithCardFor('Country');
			const tmpView = tmpProvider.createPicker('RC-Has', { Entity: 'Country', ValueAddress: 'AppData.Form.Country', Options: COUNTRY_OPTIONS });
			tmpView.setValue('ca');
			const tmpState = tmpView._buildState();
			Expect(tmpState.SingleSlot).to.have.length(1);
			Expect(tmpState.SingleSlot[0].CardSlot).to.have.length(1);
			Expect(tmpState.SingleSlot[0].CardSlot[0].Entity).to.equal('Country');
			Expect(String(tmpState.SingleSlot[0].CardSlot[0].Value)).to.equal('ca');
		});

		test('no CardSlot when the card manager has no card for the Entity', () =>
		{
			const tmpProvider = newProviderWithCardFor('SomethingElse');
			const tmpView = tmpProvider.createPicker('RC-None', { Entity: 'Country', ValueAddress: 'AppData.Form.Country', Options: COUNTRY_OPTIONS });
			tmpView.setValue('ca');
			Expect(tmpView._buildState().SingleSlot[0].CardSlot).to.have.length(0);
		});

		test('RecordCard:false opts out even when a card exists', () =>
		{
			const tmpProvider = newProviderWithCardFor('Country');
			const tmpView = tmpProvider.createPicker('RC-OptOut', { Entity: 'Country', RecordCard: false, ValueAddress: 'AppData.Form.Country', Options: COUNTRY_OPTIONS });
			tmpView.setValue('ca');
			Expect(tmpView._buildState().SingleSlot[0].CardSlot).to.have.length(0);
		});

		test('no CardSlot for an empty selection (nothing to preview)', () =>
		{
			const tmpProvider = newProviderWithCardFor('Country');
			const tmpView = tmpProvider.createPicker('RC-Empty', { Entity: 'Country', ValueAddress: 'AppData.Form.Country', Options: COUNTRY_OPTIONS });
			Expect(tmpView._buildState().SingleSlot[0].CardSlot).to.have.length(0);
		});

		test('multi-mode chips each carry a CardSlot when a card exists', () =>
		{
			const tmpProvider = newProviderWithCardFor('Country');
			const tmpView = tmpProvider.createPicker('RC-Multi', { Entity: 'Country', Mode: 'multi', ValueAddress: 'AppData.Form.Countries', Options: COUNTRY_OPTIONS });
			tmpView.setValue([ 'us', 'ca' ]);
			const tmpChips = tmpView._buildState().MultiSlot[0].Chips;
			Expect(tmpChips).to.have.length(2);
			Expect(tmpChips[0].CardSlot).to.have.length(1);
			Expect(tmpChips[0].CardSlot[0].Entity).to.equal('Country');
			Expect(String(tmpChips[0].CardSlot[0].Value)).to.equal('us');
		});

		test('no card manager registered at all → no CardSlot (soft dependency)', () =>
		{
			const tmpPict = configureTestPict();
			const tmpProvider = tmpPict.addProvider('Pict-Section-Picker', libPictSectionPicker.default_configuration, libPictSectionPicker);
			const tmpView = tmpProvider.createPicker('RC-NoMgr', { Entity: 'Country', ValueAddress: 'AppData.Form.Country', Options: COUNTRY_OPTIONS });
			tmpView.setValue('ca');
			Expect(tmpView._buildState().SingleSlot[0].CardSlot).to.have.length(0);
		});
	}
);
