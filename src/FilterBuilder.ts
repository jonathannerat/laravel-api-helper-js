export type FilterType = "where" | "null" | "notNull" | "whereRel";
export type FilterJoin = "and" | "or";
export type FilterArg = string | number;
export type Filter = {
    type: FilterType,
    args: FilterArg[],
}
export type FilterList = (Filter|FilterJoin|FilterList)[];

export class FilterBuilder {
    filters: FilterList;

    constructor(filters: FilterList = []) {
        this.filters = filters;
    }

    where(...args: FilterArg[]) {
        return this.#addFilter(args);
    }

    whereNull(...args: FilterArg[]) {
        return this.#addFilter(args, 'null');
    }

    whereNotNull(...args: FilterArg[]) {
        return this.#addFilter(args, 'notNull');
    }

    whereRelation(...args: FilterArg[]) {
        return this.#addFilter(args, 'whereRel');
    }

    orWhere(...args: FilterArg[]) {
        return this.#addFilter(args, 'where', 'or');
    }

    orWhereNull(...args: FilterArg[]) {
        return this.#addFilter(args, 'null', 'or');
    }

    orWhereNotNull(...args: FilterArg[]) {
        return this.#addFilter(args, 'notNull', 'or');
    }

    orWhereRelation(...args: FilterArg[]) {
        return this.#addFilter(args, 'whereRel', 'or');
    }

    /**
     * @param filters - where filters should be added
     * @param args - Filter arguments
     * @param type - Type of filter ('where', 'whereNull', etc.)
     * @param op - Operation to join condition to last filter
     */
    #addFilter(args: (FilterArg[] | ([(query: FilterBuilder) => any])), type: FilterType = 'where', op: FilterJoin = 'and') {
        if (this.filters.length > 0) this.filters.push(op);

        let callback = args[0];

        if (typeof callback === 'function') {
            const subquery = new FilterBuilder();

            callback(subquery);

            this.filters.push(subquery.filters);
        } else {
            this.filters.push({ type, args } as Filter);
        }

        return this;
    }
}
