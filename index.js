// Node Modules
const StoryblokTo11tyPlugin = require('./src/plugin');
const StoryblokTo11tyData = require('./src/data');

/**
 * StoryblokTo11ty is the main class that fetches the data
 * from Storyblok
 */
module.exports = {
    importer: StoryblokTo11tyData,
    plugin: StoryblokTo11tyPlugin
}