/*
	Unit tests for the pict-section-picker entity adapter's EntityTag (badge) support.

	EntityTag names a record field whose value rides on each option as `Tag` — the picker view renders
	it as a styled badge next to the label (the select2 EntitySelector "tag" parity, e.g. a PayItem's
	ItemCode). The badge itself is a view concern; these tests pin the DATA path: that the entity adapter
	stamps `Tag` on DataProvider rows + ResolveValue results, and that it composes with JoinEntity (the
	join folds into Text, the tag rides alongside). Hand-rolled fake EntityProvider, no live backend.
*/

const libBrowserEnv = require('browser-env');
const libPict = require('pict');
const libPictSectionPicker = require('../source/Pict-Section-Picker.js');

const Chai = require('chai');
const Expect = Chai.expect;

const buildFakeEntityProvider = () =>
{
	const tmpCalls = [];
	return {
		Calls: tmpCalls,
		getEntitySetPage: (pEntity, pFilter, pCursor, pCount, fCallback) =>
		{
			tmpCalls.push({ Method: 'getEntitySetPage', Entity: pEntity, Filter: pFilter });
			if (pEntity === 'PayItem')
			{
				return fCallback(null,
				[
					{ IDPayItem: 1, Name: 'Excavation', ItemCode: '201-1', IDFundingCategory: 7 },
					{ IDPayItem: 2, Name: 'Paving', ItemCode: '402-3', IDFundingCategory: 8 },
				]);
			}
			if (pEntity === 'FundingCategory')
			{
				return fCallback(null,
				[
					{ IDFundingCategory: 7, Name: 'Federal' },
					{ IDFundingCategory: 8, Name: 'State' },
				]);
			}
			return fCallback(null, []);
		},
		getEntity: (pEntity, pID, fCallback) =>
		{
			tmpCalls.push({ Method: 'getEntity', Entity: pEntity, ID: pID });
			if (pEntity === 'PayItem' && pID == 1) { return fCallback(null, { IDPayItem: 1, Name: 'Excavation', ItemCode: '201-1', IDFundingCategory: 7 }); }
			if (pEntity === 'FundingCategory' && pID == 7) { return fCallback(null, { IDFundingCategory: 7, Name: 'Federal' }); }
			return fCallback(null, null);
		},
	};
};

suite
(
	'Pict-Section-Picker EntityTag (badge)',
	() =>
	{
		let _Pict;
		let _PickerProvider;

		setup(() =>
		{
			libBrowserEnv({ url: 'http://localhost/' });
			_Pict = new libPict();
			_Pict.LogNoisiness = 0;
			_Pict.addProvider('Pict-Section-Picker', libPictSectionPicker.default_configuration, libPictSectionPicker);
			_PickerProvider = _Pict.providers['Pict-Section-Picker'];
		});

		test
		(
			'DataProvider stamps Tag from the EntityTag field on each option',
			async () =>
			{
				_Pict.EntityProvider = buildFakeEntityProvider();
				const fDataProvider = _PickerProvider.createEntityDataProvider(
					{ Entity: 'PayItem', SearchFields: [ 'Name' ], ValueField: 'IDPayItem', TextField: 'Name', EntityTag: 'ItemCode' });
				const tmpResult = await fDataProvider('e', 0);

				Expect(tmpResult.results[0].Text).to.equal('Excavation');
				Expect(tmpResult.results[0].Tag).to.equal('201-1');
				Expect(tmpResult.results[1].Tag).to.equal('402-3');
			}
		);

		test
		(
			'ResolveValue stamps Tag for a pre-bound value',
			async () =>
			{
				_Pict.EntityProvider = buildFakeEntityProvider();
				const fResolveValue = _PickerProvider.createEntityResolveValue(
					{ Entity: 'PayItem', ValueField: 'IDPayItem', TextField: 'Name', EntityTag: 'ItemCode' });
				const tmpResolved = await fResolveValue(1);

				Expect(tmpResolved.Value).to.equal(1);
				Expect(tmpResolved.Text).to.equal('Excavation');
				Expect(tmpResolved.Tag).to.equal('201-1');
			}
		);

		test
		(
			'without EntityTag no Tag is stamped',
			async () =>
			{
				_Pict.EntityProvider = buildFakeEntityProvider();
				const fDataProvider = _PickerProvider.createEntityDataProvider(
					{ Entity: 'PayItem', SearchFields: [ 'Name' ], ValueField: 'IDPayItem', TextField: 'Name' });
				const tmpResult = await fDataProvider('e', 0);

				Expect(tmpResult.results[0]).to.not.have.property('Tag');
			}
		);

		test
		(
			'EntityTag composes WITH JoinEntity: Text is the join compound, Tag rides alongside',
			async () =>
			{
				_Pict.EntityProvider = buildFakeEntityProvider();
				const fDataProvider = _PickerProvider.createEntityDataProvider(
					{
						Entity: 'PayItem', SearchFields: [ 'Name' ], ValueField: 'IDPayItem', TextField: 'Name',
						EntityTag: 'ItemCode',
						JoinEntity: 'FundingCategory', JoinField: 'IDFundingCategory', JoinEntityDisplayField: 'Name',
					});
				const tmpResult = await fDataProvider('e', 0);

				// Join folds into Text (join-first default); the tag stays separate on Tag.
				Expect(tmpResult.results[0].Text).to.equal('Federal - Excavation');
				Expect(tmpResult.results[0].Tag).to.equal('201-1');
			}
		);

		// View-render smoke: a static-Options picker renders the badge span into the DOM (catches a
		// template typo the data-path tests can't). Uses the jsdom from browser-env.
		test
		(
			'the view renders a pps-tag badge for option rows + the selected value',
			() =>
			{
				document.body.innerHTML = '<div id="TagHost"></div>';
				_Pict.AppData.TagForm = { Pick: 2 };
				const tmpPicker = _PickerProvider.createPicker('TagBadgePicker',
					{
						DestinationAddress: '#TagHost',
						Mode: 'single',
						ValueAddress: 'AppData.TagForm.Pick',
						Options: [ { Value: 1, Text: 'Excavation', Tag: '201-1' }, { Value: 2, Text: 'Paving', Tag: '402-3' } ],
					});
				tmpPicker.render();
				const tmpHTML = document.getElementById('TagHost').innerHTML;

				Expect(tmpHTML).to.contain('pps-tag', 'the badge class renders');
				Expect(tmpHTML).to.contain('201-1', 'an option row badge value renders');
				// The bound value (2 → Paving / 402-3) shows its badge in the control value area.
				Expect(tmpHTML).to.contain('402-3', 'the selected value badge renders');
			}
		);
	}
);
