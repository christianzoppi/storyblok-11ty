# Import data from Storyblok to 11ty

Import Stories and Datasources from [Storyblok](https://www.storyblok.com/) and use them with [11ty](https://www.11ty.dev/) for your static website.

You can download the data and store it ast front matter templates or as global data objects.

## Usage

### Class `StoryblokTo11ty`

**Parameters**

- `config` Object
  - `token` String, The preview token you can find in your space dashboard at https://app.storyblok.com
  - `[version]` String, optional, defaults to `draft`. It's the Storyblok content version. It can be `published` or `draft`
  - `[layout_path]` String, optional, defaults to empty string. It's the main path of your layouts in 11ty
  - `[stories_path]` String, optional, defaults to `storyblok`. It's the folder where the front matter files are stored
  - `[datasources_path]` String, optional, defaults to `_data`. It's the folder where the global data files are stored
  - `[components_layout]` Object, optional, defaults to empty object. An object with parameter -> value to match specific component to specific layouts. For example `{root: 'layouts/root.ejs', news: 'layouts/news_entry.ejs'}`. The script will use the name of the component as default layout for each entry. An entry made with the `root` component will have by default `layouts/root`.

```javascript
// Example of Global Data File in the _data directory
const StoryblokTo11ty = require('storyblok-11ty');
const sb = new StoryblokTo11ty({token: 'your-space-token'});
```

### Method `StoryblokTo11ty#getStories`

With this method you can get all the stories from your space as an array of objects. Stories are [transformed](#stories-data-transformation) in order to let you use layouts and permalinks.

**Parameters**
- `[options]` Object, optional.
 - [options.component] String, optional. Set this parameter with the name of a component to get just the entries made with it

**Return**
Promise. The response of the promise is an array of transformed entries. 

**Examples**

```javascript
// Example of Global Data File in the _data directory
module.exports = async () => {
    const StoryblokTo11ty = require('storyblok-11ty');
    const sb = new StoryblokTo11ty({token: 'your-space-token'});
    
    return await sb.getStories();
}
```

```javascript
// Alternative example to return just the pages made with the component called news
module.exports = async () => {
    const StoryblokTo11ty = require('storyblok-11ty');
    const sb = new StoryblokTo11ty({token: 'your-space-token'});
    
    return await sb.getStories('news');
}
```

### Method `StoryblokTo11ty#storeStories`

With this method you can store all the stories from your space as front matter .md files. Stories are [transformed](#stories-data-transformation) in order to let you use layouts and permalinks.

**Parameters**
- `[options]` Object, optional.
 - [options.component] String, optional. Set this parameter with the name of a component to get just the entries made with it

**Return**
Promise. Return `false` if something went wrong in the process, otherwise `true`.

**Examples**

```javascript
// Example of Global Data File in the _data directory
const StoryblokTo11ty = require('storyblok-11ty');
const sb = new StoryblokTo11ty({token: 'your-space-token'});

sb.storeStories();
```

```javascript
// Alternative example to return just the pages made with the component called news
const StoryblokTo11ty = require('storyblok-11ty');
const sb = new StoryblokTo11ty({token: 'your-space-token'});
    
sb.storeStories('news');
```

### Method `StoryblokTo11ty#getDatasources`

With this method you can get all the datasources or one in particular as an array of objects. For each datasource the script will retrieve all the dimensions.

**Parameters**
- `[datasource_slug]` String, optional. The slug of the datasource you want to retrieve.

**Return**
Promise. The response of the promise is an object with all the datasources or an array of entries in case you are requesting a single datasource. 

**Examples**

```javascript
// Example of Global Data File in the _data directory
module.exports = async () => {
    const StoryblokTo11ty = require('storyblok-11ty');
    const sb = new StoryblokTo11ty({token: 'your-space-token'});
    
    return await sb.getDatasources();
}
```

```javascript
// Alternative example to return just the pages made with the component called news
module.exports = async () => {
    const StoryblokTo11ty = require('storyblok-11ty');
    const sb = new StoryblokTo11ty({token: 'your-space-token'});
    
    return await sb.getDatasources('categories');
}
```

### Method `StoryblokTo11ty#storeDatasources`

With this method you can get all the datasources or one in particular. The datasources will be stored as `json` files in the `_data` folder or in the one specified through the `datasources_path` parameter of the `Storyblok11Ty` instance. Each datasource will be stored in a file with its name and in case you are requesting all of the datasources the name of the file will be `datasources.json`.

**Parameters**
- `[datasource_slug]` String, optional. The slug of the datasource you want to retrieve.

**Return**
Promise. Return `false` if something went wrong in the process, otherwise `true`.

**Examples**

```javascript
// Example of Global Data File in the _data directory
const StoryblokTo11ty = require('storyblok-11ty');
const sb = new StoryblokTo11ty({token: 'your-space-token'});

return await sb.storeDatasources();
```

```javascript
// Alternative example to return just the pages made with the component called news
const StoryblokTo11ty = require('storyblok-11ty');
const sb = new StoryblokTo11ty({token: 'your-space-token'});

sb.storeDatasources('categories');
```

## Stories Data Transformation
Stories are fetched from Storyblok api and the story object will have 2 new properties used by 11ty:
- `layout` String. The name of the folder inside `_include` where you have stored your layouts;
- `permalink` String. The permalink of the entry. This value uses the `real path` if set, otherwise it falls back to the `full slug`.