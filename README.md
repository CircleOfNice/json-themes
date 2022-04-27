```
      _  _____  ____  _   _   _______ _    _ ______ __  __ ______  _____ 
     | |/ ____|/ __ \| \ | | |__   __| |  | |  ____|  \/  |  ____|/ ____|
     | | (___ | |  | |  \| |    | |  | |__| | |__  | \  / | |__  | (___  
 _   | |\___ \| |  | | . ` |    | |  |  __  |  __| | |\/| |  __|  \___ \ 
| |__| |____) | |__| | |\  |    | |  | |  | | |____| |  | | |____ ____) |
 \____/|_____/ \____/|_| \_|    |_|  |_|  |_|______|_|  |_|______|_____/ 
                                                                         
```

# JSON-THEMES
 
## Motivation

Today there are many awesome ways how to style your Web Frontends. But when it comes to theming, the amount of solution already shrinks down a lot. But why?

If you want to have multiple Themes in your application, there have been two big ways of how to achieve that.

1. Use a CSS-in-JS solution. While that's a valid and working approach, you'll soon notice two things that may distract you:
   - You can't no longer write CSS (or better: SCSS/LESS/...) and seperate component's code from styling nicely
   - It's hard to not end up with messy, unstructured code
1. Use CSS Variables or do everything with preprocessor toolings
   - CSS file sizes will explode
   - It's good enough to handle something like dark/light theme, but not something like multiple Customer's CI themes.

This is now where `json-themes` jumps in. With this library we want to achieve some core goals:

- Think of a theme as a configuration
- Seperate styling and styling variants from component's code (as much as possible)
- Keep the possibility to use CSS in JS or CSS Preprocessors for styling things not coming from a theme (Transforms, user-select, ...)
- Runtime-exchangeable and editable themes (not possible with preprocessor-only solutions!)
- Stay close to CSS's syntax, so no one has to learn anything new
- Full-Scale multiple Themes (not only dark/light) for a component library

Btw., when talking about "theming" we mean:

- Colors (including gradients, patterns, assets for backgrounds)
- Fonts
- Borders
- Containers (padding, width, height, ...)
- Assets (Font Files, Logos, Icons, ...)

We explicitly do exclude **Layout**. Not because it shouldn't be configurable, but because that's another topic with impact on an app's structure and other parts.

## Concept

A **Theme** is a **JSON-based Configuration** file, which is loaded during runtime or SSR. 

```JSON
{
    "name": "MyTheme",
    "basedOn": "CRCL",
    "version": "1.0.0",
    "meta": [],
    "globals": {},
    "sets": {},
    "components": {}
}
```

The basic structure divides the config into several parts. Most important:

- `globals`: Here you can place variables (just like CSS Variables) which will be available in the rest of the config via shortcut `"$$myVar"`. 
    - Variables are scopeable, example: `{ colors: { primary: "#3399DD" }}` will be accessible via `"$$colors.primary"`.
    - Variables can contain everything you also would write as a CSS Value, for example: `{ basicShadow: "1px 2px 5px rgba(0,0,0,0.5)"}`
- `sets`: Here you can define:
  - `colorSets`,
  - `borderSets`,
  - `fontSets`,
  - `boxSets`
  
  A Set is somehow like a mixin (you may know it from SCSS/LESS/...). The `boxSet` is special, since it consists of the three others.

- `components`: Here you will map BoxSets to your components. One component definition looks like this: 
```json
{
    "default": {
        "theming": "$$basicBox",
        "defaultProps": {}
    },
    "variants": {
        "callToAction": {
            "theming": "...",
            "defaultProps": {...}
        }
    }
}
```
  
The `components` part is where the real magic will happen. You can freely choose in all of your declared stylings or parts of it to compose the appearance of a component. Just not only once, but with variants! You now have the possibility to have multiple versions of the same component, just by theming! No need to declare all possible variants in your code (as long as they only differ in design). 

Additionally you can declare "defaultProps" which can be mapped to a component's defaultProps. Think of a textfield which has an inline button to delete its value. One customer want's a trashcan symbol, the other one an "X". That's now controllable only via this theming configuration, as long as your Component makes that controllable via its props.

Of course this leads to two consequences:

- A component library which should get themeable needs to include some tooling for each component to support theming with variants and defaultProps.
  - But: we have some hooks & examples here to help
- Your app, which consumes the themeable library, may rely on some variants of a component. If you exchange a theme by another that misses some component variant definitions, the UI may break. So not all theme configurations are exchangeable by default!

But that's not all. Nearly every block inside the config is extendable via for example `__extends: "$$basicBox`, and also a theme itself (`basedOn: "..."`). This means, as long as some themes only differ in color (black/white, ...) your second configuration can become really small. Inheritance is the key!

