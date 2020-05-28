// Node Modules
const StoryblokClient = require('storyblok-js-client');
const fs = require("fs");

/**
 * StoryblokTo11ty is the main class that fetches the data
 * from Storyblok
 */
class StoryblokTo11tyData {
    /**
     * Constructor
     * @param {object} params The params for initialising the class.
     * @param {string} params.token The API token of the Storyblok space.
     * @param {string} [params.version=draft] The version of the api to fetch (draft or public).
     * @param {string} [params.layouts_path=''] The path to the layouts folder in 11ty.
     * @param {string} [params.stories_path=./storyblok/] The path where to store the entries.
     * @param {string} [params.stories_path=./_data/] The path where to store the datasources.
     * @param {string} [params.components_layouts_map] An object with parameter -> value to match specific component to specific layouts.
     * @param {object} [params.storyblok_client_config] The config for the Storyblok JS client.
     */
    constructor(params = {}) {
        this.api_version                = params.version || 'draft';
        this.storyblok_api_token        = params.token;
        this.stories_path               = this.cleanPath(params.stories_path || 'storyblok');
        this.datasources_path           = this.cleanPath(params.datasources_path || '_data');
        this.layouts_path               = params.layouts_path || '';
        this.components_layouts_map     = params.components_layouts_map || {};
        this.per_page                   = 100;
        this.stories                    = [];
        this.storyblok_client_config    = params.storyblok_client_config || {};

        // Init the Storyblok client
        if(this.storyblok_api_token || (this.storyblok_client_config && this.storyblok_client_config.accessToken)) {
            if(!this.storyblok_client_config.accessToken) {
                this.storyblok_client_config.accessToken = this.storyblok_api_token;
            }
            // Setting up cache settings if not specified
            if(!this.storyblok_client_config.hasOwnProperty('cache')) {
                this.storyblok_client_config.cache = {
                    clear: 'auto',
                    type: 'memory'
                }
            }
            this.client = new StoryblokClient(this.storyblok_client_config);
        }
    }

    /**
     * Takes care of cleaning a path set by the user removing
     * leading and trailing slashes and add the process cwd
     * @param {string} path The path string.
     * @return {string} the cleaned path
     */
    cleanPath(path) {
        path = path ? `/${path.replace(/^\/|\/$/g, '')}` : '';
        return `${process.cwd()}${path}/`;
    }

    /**
     * Get data of a single datasource retrieving a specific dimension or all of them
     * @param {string} slug Name of the datasource.
     * @param {string} [diension_name] The name of the dimension.
     * @return {promise} An array with the datasource entries.
     */
    async getDatasource(slug, dimension_name) {
        let request_options = {query: {datasource: slug}};
        if(typeof dimension_name === 'undefined') {
            // Get all the dimensions names of a datasource, then we'll request each
            // individual dimension data.
            let data = [];
            let dimensions = [''];
            let datasource_info = null;
            // Getting data of this datasource
            datasource_info = await this.getData(`datasources/${slug}`, 'datasource');
            if(!datasource_info.error && !datasource_info.data) {
                console.error(`Datasource with slug "${slug}" not found`);
            }
            if(datasource_info.error || !datasource_info.data) {
                return {};
            }
            // Getting the list of dimensions
            if(datasource_info.data[0] && datasource_info.data[0].dimensions) {
                dimensions = dimensions.concat(datasource_info.data[0].dimensions.map(dimension => dimension.entry_value));
            }
            // Requesting the data of each individual datasource
            await Promise.all(dimensions.map(async (dimension) => {
                let dimension_entries = await this.getDatasource(slug, dimension);
                if(dimension_entries) {
                    data = data.concat(dimension_entries);
                }
            }));   
            // Returning the data
            return data;
        } else {
            // If the dimension is not undefined, set the dimensino parameter in the query
            // The dimension can be empty in case it's the default dimension that you are 
            // trying to retrieve.
            request_options.query.dimension = dimension_name;
        }

        // Getting the entries of a datasource
        let datasource = await this.getData('datasource_entries', 'datasource_entries', request_options);
        if(datasource.error) {
            return false;
        } else {
            return datasource.data;
        }
    }

    /**
     * Get data of datasources. It can be single or multiple
     * @param {string} [slug] Name of the datasource.
     * @return {promise} An object with the data of the datasource/s requested.
     */
    async getDatasources(slug) {
        let datasources = {};
        // If the slug is set, request a single datasource 
        // otherwise get the index of datasources first
        if(slug) {
            return this.getDatasource(slug);
        } else {
            let request_options = {
                query: {
                    per_page: this.per_page
                }
            };
            // Get the index of the datasources of the space
            let datasources_index = await this.getData('datasources', 'datasources', request_options);
            if(!datasources_index.data || datasources_index.error) {
                return [];
            }
            // Get the entries of each individual datasource
            await Promise.all(datasources_index.data.map(async (datasource) => {
                datasources[datasource.slug] = await this.getDatasource(datasource.slug);
            }));
            return datasources;
        }
    }

    /**
     * Store a datasource to a json file
     * @param {string} [slug] Name of the datasource.
     * @return {bool} True or false depending if the script was able to store the data
     */
    async storeDatasources(slug) {
        var data = await this.getDatasources(slug);
        // If the data is empty, it won't save the file
        if((Array.isArray(data) && !data.length) || (!Array.isArray(data) && !Object.keys(data).length)) {
            return false;
        }
        // Creating the cache path if it doesn't exist
        if(!fs.existsSync(this.datasources_path)) {
            fs.mkdirSync(this.datasources_path, {recursive: true});
        }
        // If it's not a specific datasource, the filename will be "datasources"
        let filename = slug || 'datasources';
        // Storing entries as json front matter
        try {
            fs.writeFileSync(`${this.datasources_path}${filename}.json`, JSON.stringify(data, null, 4));
            console.log(`Datasources saved in ${this.datasources_path}`);
            return true;
        } catch(err) {
            return false;
        }
    }

    /**
     * Transforms a story based on the params provided
     * @param {object} story The story that has to be transformed.
     * @return {object} The transformed story.
     */
    transformStories(story) {
        // Setting the path
        story.layout = `${this.layouts_path.replace(/^\/|\/$/g, '')}/`;
        // Setting the collection
        story.tags = story.content.component;
        story.data = Object.assign({}, story.content);
        delete story.content;
        // Adding template name
        story.layout += this.components_layouts_map[story.data.component] || story.data.component;
        // Creating the permalink using the story path override field (real path in Storyblok) 
        // or the full slug
        story.permalink = `${(story.path || story.full_slug).replace(/\/$/, '')}/`;
        return story;
    }

    /**
     * Get all the stories from Storyblok
     * @param {object} [params] Filters for the stories request.
     * @param {string} [params.component] Name of the component.
     */
    async getStories(params) {
        let request_options = {
            query: {
                version: this.api_version,
                per_page: this.per_page
            }
        };
        // Filtering by component
        if(params && params.component) {
            request_options.query['filter_query[component][in]'] = params.component;
        }
        // Getting the data
        let pages = await this.getData('stories', 'stories', request_options);
        if(!pages.data || pages.error) {
            return [];
        }
        // Returning the transformed stories
        return pages.data.map(story => this.transformStories(story));
    }

    /**
     * Cache stories in a folder as json files
     * @param {object} [params] Filters for the stories request.
     * @param {string} [params.component] Name of the component.
     * @return {bool} True or false depending if the script was able to store the data
     */
    async storeStories(params) {
        let stories = await this.getStories(params);
        // Creating the cache path if it doesn't exist
        if(!fs.existsSync(this.stories_path)) {
            fs.mkdirSync(this.stories_path, {recursive: true});
        }
        // Storing entries as json front matter
        try {
            stories.forEach(story => {
                fs.writeFileSync(`${this.stories_path}${story.uuid}.md`, `---json\n${JSON.stringify(story, null, 4)}\n---`);
            });
            console.log(`${stories.length} stories saved in ${this.stories_path}`);
            return true;
        } catch(err) {
            console.error(err);
            return false;
        }
    }

    /**
     * Get a page of data from Storyblok API.
     * @param {string} endpoint The endpoint to query.
     * @param {string} entity_name The name of the entity to be retrieved from the api response.
     * @param {object} [params] Parameters to add to the API request.
     * @return {promise} The data fetched from the API.
     */
    getData(endpoint, entity_name, params) {
        return new Promise(async resolve => {
            let data = [];
            let data_requests = [];
            // Paginated request vs single request
            if(params && params.query && params.query.per_page) {
                // Paginated request
                params.query.page = 1;
                // Get the first page to retrieve the total number of entries
                try {
                    var first_page = await this.apiRequest(endpoint, params);
                } catch(err) {
                    resolve({error: true, message: err});
                    return;
                }
                if(!first_page.data) {
                    resolve({data: []});
                    return;
                }
                data = data.concat(first_page.data[entity_name]);
                // Getting the stories
                let total_entries = first_page.headers.total;
                let total_pages = Math.ceil(total_entries / this.per_page);
                // The script will request all the pages of entries at the same time
                for(var page_index = 2; page_index <= total_pages; page_index++) {
                    params.query.page = page_index;
                    data_requests.push(this.apiRequest(endpoint, params));
                }
            } else {
                // Single request
                data_requests.push(this.apiRequest(endpoint, params));
            }
            // When all the pages of entries are retrieved
            Promise.all(data_requests)
            .then(values => {
                // Concatenating the data of each page 
                values.forEach(response => {
                    if(response.data) {
                        data = data.concat(response.data[entity_name]);
                    }
                });
                resolve({data: data});
            })
            .catch(err => {
                // Returning an object with an error property to let
                // any method calling this one know that something went
                // wrong with the api request
                resolve({error: true, message: err});
            });
        });
    }

    /**
     * Get a page of stories from Storyblok
     * @param {int} page_index The index of the current page you want to retrieve.
     * @param {string} endpoint The endpoint to query.
     * @param {object} [params] Parameters to add to the API request.
     * @param {object} [params.query] Object with optional parameters for the API request.
     * @return {promise} The data fetched from the API.
     */
    apiRequest(endpoint, params) {
        // Storyblok query options
        var request_options = {};
        // Adding the optional query filters
        if(params && params.query) {
            Object.assign(request_options, params.query);
        }
        // API request
        return new Promise((resolve, reject) => {
            this.client.get(`cdn/${endpoint}`, request_options)
            .then(response => {
                // Returning the response from the endpoint
                resolve(response);
            })
            .catch(err => {
                // Error handling
                // Returning custom errors for 401 and 404 because they might
                // be the most common
                switch(err.response.status) {
                    case 401:
                        console.error('\x1b[31mStoryblokTo11ty - Error 401: Unauthorized. Probably the API token is wrong.\x1b[0m');
                        break;
                    case 404:
                        console.error('\x1b[31mStoryblokTo11ty - Error 404: The item you are trying to get doesn\'t exit.\x1b[0m');
                        break;
                    default:
                        console.error(`\x1b[31mStoryblokTo11ty - Error ${err.response.status}: ${err.response.statusText}`);
                        break;
                }
                reject(err);
            });
        });
    }
}

module.exports = StoryblokTo11tyData;