/*
	Unit tests for the pict-section-picker entity adapter's JoinEntity (compound display) support.

	JoinEntity lets an entity picker show each searched row joined to a parent entity's field — e.g. a
	Review shown as "Neuromancer - Loved it" by joining Review.IDBook -> Book.Title. Because Meadow can't
	join in a single read, the adapter does FETCH-THEN-MERGE: search the primary entity, collect the FK
	ids the rows carry, issue ONE `FBL~ID{JoinEntity}~INN~<ids>` request, then stitch the joined display
	onto each row. These tests pin that behavior with a hand-rolled fake EntityProvider (no live backend),
	so the two-request sequencing + compose ordering can't silently regress.
*/

const libBrowserEnv = require('browser-env');
const libPict = require('pict');
const libPictSectionPicker = require('../source/Pict-Section-Picker.js');

const Chai = require('chai');
const Expect = Chai.expect;

// Build a fake pict.EntityProvider that returns canned Review / Book data and records every call it
// receives, so a test can assert which requests (and filters) the adapter issued.
const buildFakeEntityProvider = () =>
{
	const tmpCalls = [];
	const tmpProvider =
	{
		Calls: tmpCalls,
		getEntitySetPage: (pEntity, pFilter, pCursor, pCount, fCallback) =>
		{
			tmpCalls.push({ Method: 'getEntitySetPage', Entity: pEntity, Filter: pFilter, Cursor: pCursor, Count: pCount });
			if (pEntity === 'Review')
			{
				// Note: IDBook 10 appears twice — the join fetch must de-dup to ids "10,11".
				return fCallback(null,
				[
					{ IDReview: 1, Summary: 'Loved it', IDBook: 10 },
					{ IDReview: 2, Summary: 'Meh', IDBook: 11 },
					{ IDReview: 3, Summary: 'Also loved it', IDBook: 10 },
				]);
			}
			if (pEntity === 'Book')
			{
				return fCallback(null,
				[
					{ IDBook: 10, Title: 'Neuromancer' },
					{ IDBook: 11, Title: 'Snow Crash' },
				]);
			}
			return fCallback(null, []);
		},
		getEntity: (pEntity, pID, fCallback) =>
		{
			tmpCalls.push({ Method: 'getEntity', Entity: pEntity, ID: pID });
			if (pEntity === 'Review' && pID == 1) { return fCallback(null, { IDReview: 1, Summary: 'Loved it', IDBook: 10 }); }
			if (pEntity === 'Book' && pID == 10) { return fCallback(null, { IDBook: 10, Title: 'Neuromancer' }); }
			return fCallback(null, null);
		},
	};
	return tmpProvider;
};

suite
(
	'Pict-Section-Picker JoinEntity (compound display)',
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

		suite
		(
			'createEntityDataProvider',
			() =>
			{
				test
				(
					'joins each searched row to its parent and composes JoinName - baseText (join-first default)',
					async () =>
					{
						_Pict.EntityProvider = buildFakeEntityProvider();
						const fDataProvider = _PickerProvider.createEntityDataProvider(
							{
								Entity: 'Review', SearchFields: [ 'Summary' ], ValueField: 'IDReview', TextField: 'Summary',
								JoinEntity: 'Book', JoinField: 'IDBook', JoinEntityDisplayField: 'Title',
							});
						const tmpResult = await fDataProvider('lov', 0);

						Expect(tmpResult.results.length).to.equal(3, 'all three searched rows return');
						Expect(tmpResult.results[0].Text).to.equal('Neuromancer - Loved it');
						Expect(tmpResult.results[1].Text).to.equal('Snow Crash - Meh');
						Expect(tmpResult.results[2].Text).to.equal('Neuromancer - Also loved it');
						// Value is still the searched entity's id (the join is display-only).
						Expect(tmpResult.results[0].Value).to.equal(1);
						// The joined record + display are stitched onto the record for templates / MapRecord.
						Expect(tmpResult.results[0].Record.JoinName).to.equal('Neuromancer');
						Expect(tmpResult.results[0].Record.JoinRecord.IDBook).to.equal(10);
					}
				);

				test
				(
					'issues exactly ONE join fetch with a de-duplicated INN filter over the FK ids',
					async () =>
					{
						const tmpFake = buildFakeEntityProvider();
						_Pict.EntityProvider = tmpFake;
						const fDataProvider = _PickerProvider.createEntityDataProvider(
							{
								Entity: 'Review', SearchFields: [ 'Summary' ], ValueField: 'IDReview', TextField: 'Summary',
								JoinEntity: 'Book', JoinField: 'IDBook', JoinEntityDisplayField: 'Title',
							});
						await fDataProvider('lov', 0);

						const tmpBookFetches = tmpFake.Calls.filter((pCall) => pCall.Method === 'getEntitySetPage' && pCall.Entity === 'Book');
						Expect(tmpBookFetches.length).to.equal(1, 'exactly one join fetch (fetch-then-merge, not per-row)');
						Expect(tmpBookFetches[0].Filter).to.equal('FBL~IDBook~INN~10,11', 'INN over unique FK ids, de-duplicated');
					}
				);

				test
				(
					'JoinEntityFirst:false composes baseText - JoinName',
					async () =>
					{
						_Pict.EntityProvider = buildFakeEntityProvider();
						const fDataProvider = _PickerProvider.createEntityDataProvider(
							{
								Entity: 'Review', SearchFields: [ 'Summary' ], ValueField: 'IDReview', TextField: 'Summary',
								JoinEntity: 'Book', JoinField: 'IDBook', JoinEntityDisplayField: 'Title', JoinEntityFirst: false,
							});
						const tmpResult = await fDataProvider('lov', 0);

						Expect(tmpResult.results[0].Text).to.equal('Loved it - Neuromancer');
					}
				);

				test
				(
					'a custom JoinSeparator is honored',
					async () =>
					{
						_Pict.EntityProvider = buildFakeEntityProvider();
						const fDataProvider = _PickerProvider.createEntityDataProvider(
							{
								Entity: 'Review', SearchFields: [ 'Summary' ], ValueField: 'IDReview', TextField: 'Summary',
								JoinEntity: 'Book', JoinField: 'IDBook', JoinEntityDisplayField: 'Title', JoinSeparator: ' / ',
							});
						const tmpResult = await fDataProvider('lov', 0);

						Expect(tmpResult.results[0].Text).to.equal('Neuromancer / Loved it');
					}
				);

				test
				(
					'without JoinEntity the Text is the plain field and no second fetch happens',
					async () =>
					{
						const tmpFake = buildFakeEntityProvider();
						_Pict.EntityProvider = tmpFake;
						const fDataProvider = _PickerProvider.createEntityDataProvider(
							{
								Entity: 'Review', SearchFields: [ 'Summary' ], ValueField: 'IDReview', TextField: 'Summary',
							});
						const tmpResult = await fDataProvider('lov', 0);

						Expect(tmpResult.results[0].Text).to.equal('Loved it');
						const tmpBookFetches = tmpFake.Calls.filter((pCall) => pCall.Entity === 'Book');
						Expect(tmpBookFetches.length).to.equal(0, 'no join fetch when JoinEntity is unset');
					}
				);
			}
		);

		suite
		(
			'createEntityResolveValue',
			() =>
			{
				test
				(
					'resolves a pre-bound value to its compound label (primary + join lookup)',
					async () =>
					{
						const tmpFake = buildFakeEntityProvider();
						_Pict.EntityProvider = tmpFake;
						const fResolveValue = _PickerProvider.createEntityResolveValue(
							{
								Entity: 'Review', ValueField: 'IDReview', TextField: 'Summary',
								JoinEntity: 'Book', JoinField: 'IDBook', JoinEntityDisplayField: 'Title',
							});
						const tmpResolved = await fResolveValue(1);

						Expect(tmpResolved).to.be.an('object');
						Expect(tmpResolved.Value).to.equal(1);
						Expect(tmpResolved.Text).to.equal('Neuromancer - Loved it');
						// Resolves the primary record then the single joined record (both via cached getEntity).
						Expect(tmpFake.Calls.some((pCall) => pCall.Method === 'getEntity' && pCall.Entity === 'Review' && pCall.ID == 1)).to.equal(true);
						Expect(tmpFake.Calls.some((pCall) => pCall.Method === 'getEntity' && pCall.Entity === 'Book' && pCall.ID == 10)).to.equal(true);
					}
				);

				test
				(
					'resolving null / undefined yields null without touching the provider',
					async () =>
					{
						const tmpFake = buildFakeEntityProvider();
						_Pict.EntityProvider = tmpFake;
						const fResolveValue = _PickerProvider.createEntityResolveValue(
							{
								Entity: 'Review', ValueField: 'IDReview', TextField: 'Summary',
								JoinEntity: 'Book', JoinField: 'IDBook', JoinEntityDisplayField: 'Title',
							});
						const tmpResolved = await fResolveValue(null);

						Expect(tmpResolved).to.equal(null);
						Expect(tmpFake.Calls.length).to.equal(0);
					}
				);
			}
		);
	}
);
