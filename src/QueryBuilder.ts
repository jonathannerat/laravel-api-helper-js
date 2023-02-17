import config from './config';
import {FilterBuilder, FilterList, FilterArg} from './FilterBuilder';

const {
    columns: columnsKey,
    filters: filtersKey,
    relationships: relKey,
} = config.paramNames;

export type Relationship = string | {
    name: string,
    columns?: string[],
    filters?: FilterList,
    relationships?: Relationship[],
};

type BooleanLike = boolean | (() => boolean);

type Query = {
    [field: string]: string[]|FilterList|Relationship[],
}

export default class QueryBuilder {
    #columns: string[] = [];
    #filters: FilterList = [];
    #relationships:Relationship[] = [];
    #filterBuilder = new FilterBuilder(this.#filters);

    select(...columns: string[]): this {
        this.#columns = columns;

        return this;
    }

    /**
     * @param name - Name of the relationship, with optional columns
     * @param [callback] Either a column list or a function that modifies a
     *     subquery builder for the relationship
     */
    with(name: string, callback: string[]|((builder: QueryBuilder) => any)) {
        let relationship: Relationship = name;

        if (Array.isArray(callback)) {
            relationship += ':' + callback.join(',');
        } else if (callback) {
            const relQueryBuilder = new QueryBuilder();
            callback(relQueryBuilder);
            const {
                [columnsKey]: columns,
                [filtersKey]: filters,
                [relKey]: relationships,
            } = relQueryBuilder.build();

            if (columns && !filters && !relationships) {
                relationship += ':' + columns.join(',');
            } else {
                relationship = { name };

                if (columns) relationship.columns = columns as string[];
                if (filters) relationship.filters = filters as FilterList;
                if (relationships) relationship.relationships = relationships as Relationship[];
            }
        }

        this.#relationships.push(relationship);

        return this;
    }

    /**
     * @param condition - Whether to apply the callback or not.
     * @param callback - Callback to apply to the current builder
     */
    when(condition: BooleanLike, callback: (builder: QueryBuilder) => any) {
        if (typeof condition === 'boolean' ? condition : condition())
            callback(this);

        return this;
    }

    where(...args: FilterArg[]) {
        this.#filterBuilder.where(...args);

        return this;
    }

    whereNull(...args: FilterArg[]) {
        this.#filterBuilder.whereNull(...args);

        return this;
    }

    whereNotNull(...args: FilterArg[]) {
        this.#filterBuilder.whereNotNull(...args);

        return this;
    }

    whereRelation(...args: FilterArg[]) {
        this.#filterBuilder.whereRelation(...args);

        return this;
    }

    orWhere(...args: FilterArg[]) {
        this.#filterBuilder.orWhere(...args);

        return this;
    }

    orWhereNull(...args: FilterArg[]) {
        this.#filterBuilder.orWhereNull(...args);

        return this;
    }

    orWhereNotNull(...args: FilterArg[]) {
        this.#filterBuilder.orWhereNotNull(...args);

        return this;
    }

    orWhereRelation(...args: FilterArg[]) {
        this.#filterBuilder.orWhereRelation(...args);

        return this;
    }

    build() {
        const query: Query = {};
        const params = config.paramNames;

        if (this.#columns?.length > 0) query[params.columns] = this.#columns;

        if (this.#filters?.length > 0) query[params.filters] = this.#filters;

        if (this.#relationships?.length > 0)
            query[params.relationships] = this.#relationships;

        return query;
    }
}
