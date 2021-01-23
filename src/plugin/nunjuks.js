// Node Modules
const utils = require('./../utils')
const StoryblokClient = require('storyblok-js-client')
const Storyblok = new StoryblokClient({})

/**
 * NunjucksPlugin is the class to add custom tags for nunjucks templates
 */
class NunjuksPlugin {
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
   * Output the content of an array of blocks
   * @param {array} blocks the array of blocks
   * @param {object} engine the nunjuks engine passed by Eleventy
   * @returns {string} the output
   */
  outputBlocks(blocks, engine) {
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
    blocks.forEach(block => {
      block.component = utils.slugify(block.component)
      let html = engine.render(`${this.blocks_folder + block.component}.njk`, { block: block })
      html_output += html
    })
    return html_output
  }

  /**
   * Install the tags
   */
  addTags() {
    let self = this

    /**
     * NUNJUKS TAG FOR BLOCKS LOOPING
     */
    this.config.addNunjucksTag("sb_blocks", (nunjucksEngine, nunjucksEnv) => {
      let self = this

      return new function () {
        this.tags = ["sb_blocks"]

        this.parse = function (parser, nodes, lexer) {
          let tok = parser.nextToken()

          let args = parser.parseSignature(null, true)
          parser.advanceAfterBlockEnd(tok.value)

          return new nodes.CallExtensionAsync(this, "run", args)
        }

        this.run = function (context, blocks, callback) {
          let html_output = self.outputBlocks(blocks, nunjucksEnv)
          return callback(null, html_output)
        }
      }()
    })

    /**
     * NUNJUCKS TAG FOR RICH TEXT FIELD
     */
    this.config.addNunjucksTag("sb_richtext", (nunjuksEngine, nunjucksEnv) => {
      let self = this
      // Defining custom rendering for blocks inside the editor
      Storyblok.setComponentResolver((component, block) => {
        let output = this.outputBlocks([block], nunjucksEnv)
        return output
      })

      return new function () {
        this.tags = ["sb_richtext"]

        this.parse = function (parser, nodes, lexer) {
          let tok = parser.nextToken()

          let args = parser.parseSignature(null, true)
          parser.advanceAfterBlockEnd(tok.value)

          return new nodes.CallExtensionAsync(this, "run", args)
        }

        this.run = async function (context, data, callback) {

          // If it's already a string
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

          return callback(null, output)
        }
      }()

    })
  }
}

module.exports = NunjuksPlugin
