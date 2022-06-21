/* eslint-disable @typescript-eslint/no-explicit-any */

import { ThemingBorderDefinition, ThemingBorderMap, ThemingBorderSet, ThemingBoxDefinition, ThemingColorMap, ThemingColorSet, ThemingConfig, ThemingFontDefinition, ThemingFontSet, ThemingGradientDefinition, Transitionable } from "./types";
import { css, setup } from "goober";
import { deepmerge } from "deepmerge-ts";
import { prefix } from "goober/prefixer";
import { createGlobalStyles } from "goober/global";

/**
 * A Function to properly sort CSS Selectors
 * @param a First Sort Parameter(key/value pair)
 * @param b Second Sort Parameter
 * @returns sorted Array
 * @example an :active selector should always be higher in specificity than an :hover
 */
const sortCssNestings = (a: [string, unknown], b: any) => {
    if(a[0] === "&:hover") return -1;
    if(a[0]?.includes("&:focus,&focus-within")) return 0;
    if(a[0] === "&:focus-visible") return 0;
    if(a[0] === "&:focus-within") return 0;
    if(a[0] === "&:active") return 1;
    if(a[0] === "&:disabled") return 2;

    return a[0].toString() > b[0].toString() ? 1 : -1;
};

const getVarName = (str: string) => str.slice(2);

/**
 * Get a value recursive from an JSON-like object to go to a variable from some def like &&myvars.some.asdf
 * @param root Root JSON-like Object
 * @param path Path to navigate to (string array)
 * @param {*} value optional value to search on
 * @returns resolved variable from path
 */
const getDeepAttribute = (root: Record<string, any>, path: string[], value: any = null): any => {
    const val = value || root;

    if(!path || path.length === 0) {
        if(typeof val === "string" && val.startsWith("$$"))
            return getDeepAttribute(root, getVarName(val).split("."));


        return val;
    }

    if(!val[path[0]]) return null;

    return getDeepAttribute(root, path.slice(1), val[path[0]]);
};

/**
 * Resolve a global variable definition of theming config
 * @param value the value that can be a value or a variable
 * @param theme theming config
 * @param customResolver optional custom resolver, for example to resolve gradient definitions which are not pure CSS
 * @returns {string} either the value or the resolved value from a variable
 */
const resolveGlobalsVar = (value: unknown, theme: ThemingConfig, customResolver?: (res: unknown) => string) => {
    const resolver = (varStr: string) => {
        const deep = getDeepAttribute(theme.globals, getVarName(varStr).split("."));

        if(deep === null) {
            console.warn(`No Var found for ${value}. Skipped.`);
            return "";
        }

        if(customResolver)
            return customResolver(deep);


        return deep?.toString() || "";
    };

    return (`${value}`.replace(/\$\$[\w.]*/gm, resolver));
};

/**
 * Function to resolve $$ globals Variables inside defaultProps definitions
 * @param props the props
 * @param theme theming config
 * @returns resolved props
 */
const resolvePropsVars = (props: any, theme: ThemingConfig) => {
    if(!props || !theme) return null;

    const keys = Object.keys(props);

    const resolvedValues: Array<any> = keys?.map(key => {
        const value = props[key];

        if(typeof value === "string" && value.startsWith("$$"))
            return resolveGlobalsVar(value, theme);


        if(typeof value === "object")
            return resolvePropsVars(value, theme);


        return value;
    });

    return Object.fromEntries(keys.map((key, i) => ([key, resolvedValues[i]])));
};

/**
 * Function to either resolve a color or a gradient defintion
 * @returns a valid CSS color/gradient def
 */
const resolveColorsDefinition = (str: unknown, theme: ThemingConfig, allowGradient = false) => {
    return resolveGlobalsVar(str, theme, res => {
        if(allowGradient && !(typeof res === "string"))
            return resolveGlobalsVar((res as ThemingGradientDefinition).definition, theme);

        if(!allowGradient && !(typeof res === "string"))
            return resolveGlobalsVar((res as ThemingGradientDefinition).fallbackColor, theme) || "";

        return `${res}`;
    });
};

/**
 * theming border set defintion to CSS
 */
const borderSetToCss = (borderSet: ThemingBorderSet | string, theme: ThemingConfig): object => {
    const set: ThemingBorderSet = typeof borderSet === "string" ? theme.sets.borderSets[getVarName(borderSet)] : borderSet;

    if(!set) return {};

    const resolveDefinition = (tdef: ThemingBorderDefinition, context: string) => {
        return Object.assign({},
            tdef.image && { [`border${context}-image`]: resolveGlobalsVar(tdef.image, theme) },
            tdef.style && { [`border${context}-style`]: resolveGlobalsVar(tdef.style, theme) },
            tdef.width && { [`border${context}-width`]: resolveGlobalsVar(tdef.width, theme) }
        );
    };

    const resolveMap = (bmp: Transitionable<ThemingBorderMap>) => {
        return Object.assign({},
            resolveDefinition(bmp, ""),
            bmp.transitionSpeed && { transitionDuration: resolveGlobalsVar(bmp.transitionSpeed, theme) },
            bmp.bottom && resolveDefinition(bmp.bottom, "-bottom"),
            bmp.left && resolveDefinition(bmp.left, "-left"),
            bmp.right && resolveDefinition(bmp.right, "-right"),
            bmp.top && resolveDefinition(bmp.top, "-top"),
            bmp.radius && { "border-radius": resolveGlobalsVar(bmp.radius, theme) }
        );
    };

    const resolvedSet = Object.assign({},
        resolveMap(set),
        set.__hover && { "&:hover": resolveMap(set.__hover) },
        set.__active && { "&:active": resolveMap(set.__active) },
        set.__focus && { "&:focus,&focus-within": resolveMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveMap(set.__focusVisible) },
        set.__disabled && {
            "&:disabled,&[aria-disabled=true]": {
                ...resolveMap(set.__disabled),
                "pointer-events": "none"
            }
        }
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(
            borderSetToCss(set.__extends, theme), resolvedSet))
			.sort(sortCssNestings)
			.map(([key, value]) => ({ [key]: value }))) :
        resolvedSet;
};

/**
 * theming color set defintion to CSS
 */
const colorSetToCss = (colorSet: ThemingColorSet | string, theme: ThemingConfig): object => {
    const set: ThemingColorSet = typeof colorSet === "string" ? theme.sets.colorSets[getVarName(colorSet)] : colorSet;

    if(!set) return {};

    const resolveColorMap = (cmp: Transitionable<ThemingColorMap>) => {
        return Object.assign({},
            // TODO cmp.__extends &&
            cmp.transitionSpeed && { transitionDuration: resolveGlobalsVar(cmp.transitionSpeed, theme) },
            cmp.background && { background: resolveColorsDefinition(cmp.background, theme, true) },
            cmp.border && { borderColor: resolveColorsDefinition(cmp.border, theme) },
            cmp.filter && { filter: resolveGlobalsVar(cmp.filter, theme) },
            cmp.backdropFilter && { backdropFilter: resolveGlobalsVar(cmp.backdropFilter, theme) },
            cmp.foreground && { color: resolveColorsDefinition(cmp.foreground, theme) },
            cmp.icon && { "& svg": { color: resolveGlobalsVar(cmp.icon, theme) } },
            cmp.shadow && { boxShadow: resolveGlobalsVar(cmp.shadow, theme) }
        );
    };

    const resolvedSet = Object.assign({},
        resolveColorMap(set),
        set.__hover && { "&:hover": resolveColorMap(set.__hover) },
        set.__active && { "&:active": resolveColorMap(set.__active) },
        set.__focus && { "&:focus,&:focus-within": resolveColorMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveColorMap(set.__focusVisible) },
        set.__disabled && {
            "&:disabled,&[aria-disabled=true]": {
                ...resolveColorMap(set.__disabled),
                "pointer-events": "none"
            }
        },
        set.__selection && {
            "::selection": {
                color:      resolveGlobalsVar(set.__selection.foreground, theme),
                background: resolveColorsDefinition(set.__selection.background, theme)
            }
        }
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(
            colorSetToCss(set.__extends, theme), resolvedSet))
			.sort(sortCssNestings)
			.map(([key, value]) => ({ [key]: value }))) :
        resolvedSet;
};

/**
 * theming font set defintion to CSS
 */
const fontSetToCss = (colorSet: ThemingFontSet | string, theme: ThemingConfig): object => {
    const set: ThemingFontSet = typeof colorSet === "string" ? theme.sets.fontSets[getVarName(colorSet)] : colorSet;

    if(!set) return {};

    const resolveFontMap = (fmp: Transitionable<ThemingFontDefinition>) => {
        return Object.assign({},
            fmp.transitionSpeed && { transitionDuration: resolveGlobalsVar(fmp.transitionSpeed, theme) },
            fmp.family && { "font-family": resolveGlobalsVar(fmp.family, theme) },
            fmp.letterSpacing && { "letter-spacing": resolveGlobalsVar(fmp.letterSpacing, theme) },
            fmp.lineHeight && { lineHeight: resolveGlobalsVar(fmp.lineHeight, theme) },
            fmp.size && { fontSize: resolveGlobalsVar(fmp.size, theme) },
            fmp.style && { fontStyle: resolveGlobalsVar(fmp.style, theme) },
            fmp.weight && { fontWeight: resolveGlobalsVar(fmp.weight, theme) },
            fmp.transform && { textTransform: resolveGlobalsVar(fmp.transform, theme) }
        );
    };

    const resolvedSet = Object.assign({},
        resolveFontMap(set),
        set.__hover && { "&:hover": resolveFontMap(set.__hover) },
        set.__active && { "&:active": resolveFontMap(set.__active) },
        set.__focus && { "&:focus,&focus-within": resolveFontMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveFontMap(set.__focusVisible) },
        set.__disabled && {
            "&:disabled,&[aria-disabled=true]": {
                ...resolveFontMap(set.__disabled),
                "pointer-events": "none"
            }
        }
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(
            fontSetToCss(set.__extends, theme), resolvedSet))
			.sort(sortCssNestings)
			.map(([key, value]) => ({ [key]: value }))) :
        resolvedSet;
};

/**
 * resolve box defintions from either global boxSets or from neighbour variant definitions
 */
const resolveBoxDefinition = (def: string | ThemingBoxDefinition | undefined, theme: ThemingConfig, context?: string): ThemingBoxDefinition | null => {
    if(!def) return null;

    if(typeof def === "string" && def.startsWith("$$")) {
        const guess = theme.sets.boxSets[getVarName(def)] || null;

        if(guess) return guess;

        if(context) {
            const otherSource = getDeepAttribute(theme.components, context.split("."), null);

            if(otherSource[getVarName(def)]) return otherSource[getVarName(def)];

            return null;
        }

        return null;
    }

    if(typeof def === "object") return def;

    return null;
};

/**
 * Resolve complete box definitions including the sets to CSS
 * @returns Box Definition CSS
 */
const boxDefToCssProps = (boxDef: ThemingBoxDefinition | null, theme: ThemingConfig, context?: string): Array<object> => {
    const res = [];

    if(!boxDef) return [];

    if(boxDef.__extends)
        res.push(...boxDefToCssProps(
            resolveBoxDefinition(boxDef.__extends, theme, context), theme)
        );


    if(boxDef.animation)
        res.push({
            animation: resolveGlobalsVar(boxDef.animation, theme)
        });


    if(boxDef.borderSet)
        res.push(borderSetToCss(boxDef.borderSet, theme));


    if(boxDef.colorSet)
        res.push(colorSetToCss(boxDef.colorSet, theme));


    if(boxDef.padding)
        res.push({
            padding: resolveGlobalsVar(boxDef.padding, theme)
        });


    if(boxDef.fontSet)
        res.push(fontSetToCss(boxDef.fontSet, theme));


    if(boxDef.height)
        res.push({
            height: resolveGlobalsVar(boxDef.height, theme)
        });


    if(boxDef.width)
        res.push({
            width: resolveGlobalsVar(boxDef.width, theme)
        });


    return res;
};

export type ComponentsConfig = {
    component: string
    variants: {
        variant: string;
        className: string;
        defaultProps: object;
        parts: {
            [key: string]: string
        }
    }[]
}

/**
 * Resolve a Component in themeConfig.components. Includes resolving default def, variants and defaultProps
 * Config will include the CSS ClassNames for the component and the parts for all variants.
 * @param component The component
 * @param theme The theming config
 * @returns ComponentConfig
 */
const resolveComponent = (component: string, theme: ThemingConfig): ComponentsConfig => {
    const componentConfig = theme.components[component];

    if(!componentConfig)
        return {
            component: component,
            variants:  []
        };


    const extendedStuff = componentConfig.__extends ? resolveComponent(getVarName(componentConfig.__extends), theme) : {};

    const variants = [
        componentConfig.default && {
            variant: "default",
            parts:   componentConfig.default.parts ? Object.keys(componentConfig.default.parts as object).map(key => ([key,
                componentConfig.default &&
                resolveBoxDefinition((componentConfig.default.parts as any)[key], theme)
            ])) : [],
            boxDef: resolveBoxDefinition(componentConfig.default?.theming, theme),
            props:  componentConfig.default?.defaultProps
        },
        ...(componentConfig.variants ? Object.keys(componentConfig.variants).filter(x => x !== "default").map(vrnt => componentConfig.variants && ({
            variant: vrnt,
            parts:   componentConfig.variants[vrnt].parts ? Object.keys(componentConfig.variants[vrnt].parts as object).map(key => ([key,
                componentConfig.variants &&
                resolveBoxDefinition((componentConfig.variants[vrnt].parts as any)[key], theme)
            ])) : [],
            boxDef: resolveBoxDefinition(componentConfig.variants[vrnt].theming, theme),
            props:  componentConfig.variants[vrnt].defaultProps
        })) : [])
    ].filter(x => x && x !== undefined && x.boxDef !== null); // eslint-disable-line no-undefined

    return deepmerge(extendedStuff, {
        component: component,
        variants:  variants.map(vrnt => vrnt && ({
            variant: vrnt.variant,
            parts:   Object.fromEntries(vrnt.parts.map((part: any) => ([part[0], css(boxDefToCssProps(part[1], theme,
                `${component}.${vrnt.variant === "default" ? "default.parts" : `variants.${vrnt.variant}.parts`}`) as never) || ""]))),
            className:    vrnt.boxDef ? css(boxDefToCssProps(vrnt.boxDef, theme) as never) : "",
            defaultProps: resolvePropsVars(vrnt.props, theme) || {}
        })) as ComponentsConfig["variants"]
    });
};

export type IThemeManager = {
    readonly __loadedThemes: Array<ThemingConfig>
    readonly __lastActiveTheme: {
        name: string,
        components: ComponentsConfig[],
        globalStyles: Function // eslint-disable-line @typescript-eslint/ban-types
    } | null
    init: (componentCreationFunction: Function) => void // eslint-disable-line @typescript-eslint/ban-types
    loadTheme: (themeConfig: ThemingConfig, pool?: ThemingConfig[]) => {
        components: ComponentsConfig[],
        globalStyles: Function // eslint-disable-line @typescript-eslint/ban-types
    } | null
}

/**
 * resolve a configuration object with inheritance
 * @param themeConfig the config
 * @param themesCache already loaded and resolved configs
 * @param themesPool other not yet loaded configs
 * @returns a resolved config (merged with inheritants)
 */
const resolveConfig = (themeConfig: ThemingConfig, themesCache: [], themesPool: ThemingConfig[]) => {
    const configKeys = Object.keys(themeConfig);
    const neededKeys = ["name", "components", "version", "globals", "sets"];

    if(!neededKeys.every(key => configKeys.includes(key))) throw Error(`Falsy Configuration: Please check your Config schema for ${themeConfig.name || "config"}`);

    if(themeConfig.basedOn) {
        const resolveBasedOn = (conf: ThemingConfig): ThemingConfig => {
            if(!conf.basedOn || conf.basedOn === "") return conf;

            const cachedTheme = themesCache.find((x: ThemingConfig) => x.name === conf.basedOn);

            if(cachedTheme)
                return deepmerge(resolveBasedOn(cachedTheme), conf);


            if(themesPool) {
                const res = themesPool.find((x: ThemingConfig) => x.name === conf.basedOn);

                if(res) return deepmerge(resolveBasedOn(res), conf);
            }

            return conf;
        };

        return resolveBasedOn(themeConfig);
    }

    return themeConfig;
};

export class ThemeManager implements IThemeManager {
    __loadedThemes = [];
    __lastActiveTheme: null | {
        name: string,
        components: ComponentsConfig[],
        globalStyles: Function // eslint-disable-line @typescript-eslint/ban-types
    } = null;

    init(componentCreationFunction: Function) { // eslint-disable-line @typescript-eslint/ban-types
        setup(componentCreationFunction, prefix);
    }

    loadTheme(_themeConfig: ThemingConfig, pool?: ThemingConfig[]) {
        if(!_themeConfig) throw Error("No Theming Config found!");

        const themeConfig = { ..._themeConfig };

        if(!this.__loadedThemes.find((x: ThemingConfig) => x.name === themeConfig.name))
            this.__loadedThemes.push({ ...themeConfig } as never);

        const resolvedConfig = resolveConfig(themeConfig, this.__loadedThemes as [], pool || []);

        if(resolvedConfig === null) return null;

        const components = Object.keys(resolvedConfig.components);

        if(this.__lastActiveTheme?.name !== resolvedConfig.name) {
            const styleRoot = (document || window.document).getElementById("_goober");

            if(styleRoot)
                styleRoot.remove();


            const GlobalStyles = createGlobalStyles`html,body {}`;

            const res = {
                components:   components.map(comp => resolveComponent(comp, resolvedConfig)),
                globalStyles: GlobalStyles
            };

            this.__lastActiveTheme = {
                name: resolvedConfig.name,
                ...res
            };

            return res;
        }

        if(this.__lastActiveTheme.name === resolvedConfig.name)
            return this.__lastActiveTheme;


        return null;
    }
}
