// Node Modules
const LiquidPlugin = require('./liquid')
const NunjuksPlugin = require('./nunjuks')


/**
 * StoryblokTo11ty is the main class that fetches the data
 * from Storyblok
 */
class StoryblokTo11tyPlugin {
  /**
   * Constructor
   * @param {object} params The params for initialising the class.
   * @param {string} params.blocks_folder The folder containing the templates of the blocks
   */
  constructor(params = {}) {
    this.params = params
  }

  /**
   * Install the plugin into 11ty config
   */
  configFunction(config) {
    let nunjuks = new NunjuksPlugin(config, this.params)
    nunjuks.addTags()

    let liquid = new LiquidPlugin(config, this.params)
    liquid.addTags()
  }
}

module.exports = StoryblokTo11tyPlugin
