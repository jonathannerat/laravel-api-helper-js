import QueryBuilder from '../src/QueryBuilder';
import config from '../src/config';

/** @type {QueryBuilder} */
let query;

const {
    columns: columnsKey,
    filters: filtersKey,
    relationships: relKey,
} = config.paramNames;

beforeEach(() => (query = new QueryBuilder()));

describe('columns', () => {
    test('empty builder returns empty object', () => {
        expect(query.build()).toStrictEqual({});
    });

    test('selected columns are added to query', () => {
        const columns = ['a', 'b', 'c'];

        query.select(...columns);

        expect(query.build()).toStrictEqual({
            [columnsKey]: columns,
        });
    });
});

describe('filters', () => {
    test('single condition', () => {
        query.where('column', 1);

        expect(query.build()).toStrictEqual({
            [filtersKey]: [{ type: 'where', args: ['column', 1] }],
        });
    });

    test('conditions are joined with "and" by default', () => {
        query.where('column_a', 1).where('column_b', 2);

        expect(query.build()).toStrictEqual({
            [filtersKey]: [
                { type: 'where', args: ['column_a', 1] },
                'and',
                { type: 'where', args: ['column_b', 2] },
            ],
        });
    });

    test('conditions joined by "or"', () => {
        query.where('column_a', 1).orWhere('column_b', 2);

        expect(query.build()).toStrictEqual({
            [filtersKey]: [
                { type: 'where', args: ['column_a', 1] },
                'or',
                { type: 'where', args: ['column_b', 2] },
            ],
        });
    });

    test('conditions joined by "and" then "or"', () => {
        query
            .where('column_a', 1)
            .whereNull('column_b')
            .orWhere('column_c', 2);

        expect(query.build()).toStrictEqual({
            [filtersKey]: [
                { type: 'where', args: ['column_a', 1] },
                'and',
                { type: 'null', args: ['column_b'] },
                'or',
                { type: 'where', args: ['column_c', 2] },
            ],
        });
    });

    test('filter with subfilters', () => {
        query
            .where('column_a', 1)
            .orWhere((q) => q.where('column_b', 2).where('column_c', 3));

        expect(query.build()).toStrictEqual({
            [filtersKey]: [
                { type: 'where', args: ['column_a', 1] },
                'or',
                [
                    { type: 'where', args: ['column_b', 2] },
                    'and',
                    { type: 'where', args: ['column_c', 3] },
                ],
            ],
        });
    });

    test('complex filter', () => {
        query
            .where('column_a', '>', 2)
            .orWhereRelation('relationship_a', 'rel_a_col_a', 3)
            .where((q) => {
                q.whereNull('column_c')
                    .whereNotNull('column_d')
                    .orWhereRelation('relationship_b', 'rel_b_col_a', '<', 4)
                    .orWhere((q) => {
                        q.where('column_e', 5).orWhere('column_f', 6);
                    });
            });

        expect(query.build()).toStrictEqual({
            [filtersKey]: [
                { type: 'where', args: ['column_a', '>', 2] },
                'or',
                {
                    type: 'whereRel',
                    args: ['relationship_a', 'rel_a_col_a', 3],
                },
                'and',
                [
                    { type: 'null', args: ['column_c'] },
                    'and',
                    { type: 'notNull', args: ['column_d'] },
                    'or',
                    {
                        type: 'whereRel',
                        args: ['relationship_b', 'rel_b_col_a', '<', 4],
                    },
                    'or',
                    [
                        { type: 'where', args: ['column_e', 5] },
                        'or',
                        { type: 'where', args: ['column_f', 6] },
                    ],
                ],
            ],
        });
    });
});

describe('relationships', () => {
    test('simple relationship', () => {
        const relationship = 'relationship';
        query.with(relationship);

        expect(query.build()).toStrictEqual({
            [relKey]: [relationship],
        });
    });

    test('simple relationship with columns', () => {
        const relationship = 'relationship:column_a,column_b,column_c';
        query.with(relationship);

        expect(query.build()).toStrictEqual({
            [relKey]: [relationship],
        });
    });

    test('relationship with columns in subquery', () => {
        const columns = ['column_a', 'column_b', 'column_c'];
        query.with('relationship', (q) => q.select(...columns));

        expect(query.build()).toStrictEqual({
            [relKey]: ['relationship:column_a,column_b,column_c'],
        });
    });

    test('relationship with filters in subquery', () => {
        query.with('relationship', (q) =>
            q.where('column_a', 1).orWhere('column_b', 2)
        );

        expect(query.build()).toStrictEqual({
            [relKey]: [
                {
                    name: 'relationship',
                    filters: [
                        { type: 'where', args: ['column_a', 1] },
                        'or',
                        { type: 'where', args: ['column_b', 2] },
                    ],
                },
            ],
        });
    });

    test('relationship with sub relationships in subquery', () => {
        query.with('relationship', (q) => q.with('another_rel'));

        expect(query.build()).toStrictEqual({
            [relKey]: [
                {
                    name: 'relationship',
                    relationships: [
                        'another_rel',
                    ],
                },
            ],
        });
    });
});
