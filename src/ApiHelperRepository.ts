import axios from 'axios';
import QueryBuilder from './QueryBuilder';

type ErrorObject = {
    [field: string]: string[]
}

type ErrorDeepList = (string[] | ErrorDeepObject)[];
type ErrorDeepObject = {
    [field: string]: string[] | ErrorDeepObject | ErrorDeepList,
}

export default class ApiHelperRepository {
    /** Name of the resource as declared in `routes/api.php` */
    #resource;

    /**
     * @param resource - Name of a resource that follows Laravel conventions
     * (index, show, etc)
     */
    constructor(resource: string) {
        this.#resource = resource;
    }

    /**
     * @param query - Query used to call the index method in the controller
     */
    async index(query: QueryBuilder|((q: QueryBuilder) => QueryBuilder)) {
        query = query instanceof QueryBuilder ? query : query(new QueryBuilder());
        let params = query.build();

        return await axios.get(route(`api:${this.#resource}.index`), {
            params,
        });
    }

    /**
     * @param id - ID of the resource to fetch
     * @param query - Columns and relationships to fetch
     */
    async show(id: number, query: QueryBuilder | ((q: QueryBuilder) => QueryBuilder)) {
        query = query instanceof QueryBuilder ? query : query(new QueryBuilder());
        let params = query.build();

        return await axios.get(route(`api:${this.#resource}.show`, id), {
            params,
        });
    }

    async store(data: any) {
        try {
            return axios.post(route(`api:${this.#resource}.store`), data).catch();
        } catch (error: any) {
            if (error.response) {
                const errorData = error.response.data;

                if (errorData?.errors) {
                    errorData.errors = this.#convertKeysToDeepObject(
                        errorData.errors
                    );
                }
            }

            throw error;
        }
    }

    async update(id: number, data: any) {
        try {
            return await axios.put(
                route(`api:${this.#resource}.update`, id),
                data
            );
        } catch (error: any) {
            if (error.response) {
                const errorData = error.response.data;

                if (errorData?.errors) {
                    errorData.errors = this.#convertKeysToDeepObject(
                        errorData.errors
                    );
                }
            }

            throw error;
        }
    }

    /** Converts keys with dots ('a.b.error') to deep objects ({a:{b:error}})
     * @param {{[field: string]: string[]}} errors Validation errors returned by controller
     * @returns {ErrorObject}
     */
    #convertKeysToDeepObject(errors: ErrorObject): ErrorDeepObject | ErrorDeepList {
        const isArray = Object.keys(errors).some((k) => !isNaN(parseInt(k)));
        let converted: any = isArray ? [] : {};
        let isDeeper = false;

        for (const field in errors) {
            if (!field.includes('.')) {
                converted[isArray ? parseInt(field) : field] = errors[field];
                continue;
            }

            isDeeper = true;
            const separatorIndex = field.indexOf('.');
            const firstComponent = field.slice(0, separatorIndex);
            const first = isArray ? parseInt(firstComponent) : firstComponent;
            const rest = field.slice(separatorIndex + 1);

            if (!converted[first]) {
                converted[first] = {};
            }

            converted[first][rest] = errors[field];
        }

        if (isDeeper) {
            for (const field in converted) {
                converted[field] = this.#convertKeysToDeepObject(
                    converted[field]
                );
            }
        }

        return converted;
    }
}
