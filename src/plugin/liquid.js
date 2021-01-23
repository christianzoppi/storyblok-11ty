// Node Modules
const utils = require('./../utils')
const StoryblokClient = require('storyblok-js-client')
const Storyblok = new StoryblokClient({})

/**
 * LiquidPlugin is the class to add custom tags for liquid templates
 */
class LiquidPlugin {
  /**
   * Constructor
   * @param {object} params The params for initialising the class.
   * @param {string} params.blocks_folder The folder containing the templates of the blocks
   */
  constructor(config, params = {}) {
    this.params = params
    this.blocks_folder = params.blocks_folder ? `${params.blocks_folder.replace(/^\//g, '')}` : 'blocks/'
    this.config = config
  }

  /**
   * Install the tags
   */
  addTags() {
    /**
     * LIQUID TAG FOR BLOCK LOOPING
     */
    this.config.addLiquidTag("sb_blocks", (liquidEngine) => {
      return {
        parse: (tagToken) => {
          this.blocks = tagToken.args
        },
        render: async (scope) => {
          // Getting the blocks array
          let blocks = liquidEngine.evalValue(this.blocks, scope)
          // Converting single object to array
          if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
            blocks = [blocks]
          }
          // Checking if blocks object is not set or is not an array
          if (!blocks || !Array.isArray(blocks)) {
            return ''
          }
          // Parsing each single block
          let html_output = ''
          for (let index = 0; index < blocks.length; index++) {
            let block = blocks[index]
            block.component = utils.slugify(block.component)
            let code = `{% include ${this.blocks_folder + block.component} %}`
            let tpl = liquidEngine.parse(code)
            let html = await liquidEngine.render(tpl, { block: block })
            html_output += html
          }
          return Promise.resolve(html_output)
        }
      }
    })

    this.config.addLiquidTag("sb_richtext", (liquidEngine) => {
      return {
        parse: (tagToken) => {
          this.data = tagToken.args
        },
        render: async (scope) => {
          // Getting the blocks array
          let data = liquidEngine.evalValue(this.data, scope)

          // If it's already a string (in case previously this field was a textarea)
          if (typeof data === 'string') {
            return data
          }

          if (typeof data === 'undefined' || data === null) {
            return ''
          }

          let output = ''
          if (data.content && Array.isArray(data.content)) {
            try {
              output = Storyblok.richTextResolver.render(data)
            } catch (e) {
              output = ''
            }
          }
          return Promise.resolve(output)
        }
      }
    })
  }
}

module.exports = LiquidPlugin
