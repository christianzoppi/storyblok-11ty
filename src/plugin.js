// Node Modules
const utils = require('./utils');

/**
 * StoryblokTo11ty is the main class that fetches the data
 * from Storyblok
 */
class StoryblokTo11tyPlugin {
    /**
     * Constructor
     * @param {object} params The params for initialising the class.
     * @param {string} params.token The API token of the Storyblok space.
     * @param {string} [params.version=draft] The version of the api to fetch (draft or public).
     * @param {string} [params.layouts_path=''] The path to the layouts folder in 11ty.
     * @param {string} [params.stories_path=./storyblok/] The path where to store the entries.
     * @param {string} [params.stories_path=./_data/] The path where to store the datasources.
     * @param {string} [params.components_layouts_map] An object with parameter -> value to match specific component to specific layouts.
     */
    constructor(params = {}) {
        this.blocks_folder  = params.blocks_folder ? `${params.blocks_folder.replace(/^\//g, '')}` : 'blocks/';
    }

    /**
     * Install the plugin into 11ty config
     */
    configFunction(config) {
        // LIQUID TAG FOR BLOCKS LOOPING
        config.addLiquidTag("sb_blocks", (liquidEngine) => {
            return {
                parse: (tagToken, remainingTokens) => {
                    this.blocks = tagToken.args; // myVar or "alice"
                },
                render: async (scope, hash) => {
                    // Getting the blocks array
                    let blocks = liquidEngine.evalValue(this.blocks, scope);
                    // Converting single object to array
                    if(blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
                        blocks = [blocks];
                    }
                    // Checking if blocks object is not set or is not an array
                    if(!blocks || !Array.isArray(blocks)) {
                        return '';
                    }
                    // Parsing each single block
                    var html_output = '';
                    await Promise.all(blocks.map(async (block) => {
                        block.component = utils.slugify(block.component);
                        let code = `{% include ${this.blocks_folder + block.component} %}`;
                        let tpl = liquidEngine.parse(code);
                        let html = await liquidEngine.render(tpl, {block: block});
                        html_output += html;
                    }));
                    return Promise.resolve(html_output);
                }
            };
        });
    }
}

module.exports = StoryblokTo11tyPlugin;