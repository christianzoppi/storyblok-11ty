# Import data from Storyblok to 11ty

Import Stories and Datasources from [Storyblok](https://www.storyblok.com/) and use them with [11ty](https://www.11ty.dev/) for your static website.

You can download the data and store it ast front matter templates or as global data objects.

## Usage

### Class `StoryblokTo11ty`

**Parameters**

- `config` Object
  - `token` String, The preview token you can find in your space dashboard at https://app.storyblok.com
  - `version` String, optional, defaults to `draft`. It's the Storyblok content version. It can be `published` or `draft`
  - `layout_path` String, optional, defaults to empty string. It's the main path of your layouts in 11ty
  - `stories_path` String, optional, defaults to `storyblok`. It's the folder where the front matter files are stored
  - `datasources_path` String, optional, defaults to `_data`. It's the folder where the global data files are stored
  - `components_layout` Object, optional, defaults to empty object. An object with parameter -> value to match specific component to specific layouts. For example `{root: 'layouts/root.ejs', news: 'layouts/news_entry.ejs'}`. The script will use the name of the component as default layout for each entry. An entry made with the `root` component will have by default `layouts/root`.

**Example of usage with minimal configuration**

```javascript
// 1. Require the StoryblokTo11Ty library
const StoryblokTo11ty = require('storyblok-11ty')

// 2. Create a new instance with the token of your space
const sb = new StoryblokTo11ty({token: 'your-storyblok-access-token'})

// 3. Store Stories and Datasources
sb.storeDatasources()
sb.storeStories()
```