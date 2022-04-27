import { Extendable, ThemingBorderDefinition, ThemingBorderMap, ThemingBorderSet, ThemingBoxDefinition, ThemingColorMap, ThemingColorSet, ThemingConfig, ThemingFontDefinition, ThemingFontSet, Transitionable } from "./types";
import { css, setup } from "goober";
import { deepmerge } from "deepmerge-ts";
import { prefix } from 'goober/prefixer';

const getVarName = (str: string) => str.slice(2);

const getDeepAttribute = (obj: any, path: string[]): string | number | null => {
    if (!path || path.length === 0) return obj;
    if (!obj[path[0]]) return null;

    return getDeepAttribute(obj[path[0]], path.slice(1));
}

const resolveGlobalsVar = (str: unknown, theme: ThemingConfig) => {
    const resolver = (varStr: string) => {
        return getDeepAttribute(theme.globals, getVarName(varStr).split("."))?.toString() || "";
    }

    return (`${str}`.replace(/\$\$[\w.]*/gm, resolver));
}

const borderSetToCss = (borderSet: ThemingBorderSet | string, theme: ThemingConfig): object => {
    const set: ThemingBorderSet = typeof borderSet === "string" ? theme.sets.borderSets[getVarName(borderSet)] : borderSet;

    if (!set) return {};

    const resolveDefinition = (tdef: ThemingBorderDefinition, context: string) => {
        return Object.assign({},
            tdef.image && { [`border${context}-image`]: resolveGlobalsVar(tdef.image, theme) },
            tdef.style && { [`border${context}-style`]: resolveGlobalsVar(tdef.style, theme) },
            tdef.width && { [`border${context}-width`]: resolveGlobalsVar(tdef.width, theme) }
        )
    }

    const resolveMap = (bmp: Transitionable<ThemingBorderMap>) => {
        return Object.assign({},
            resolveDefinition(bmp, ""),
            bmp.transitionSpeed && { transitionDuration: resolveGlobalsVar(bmp.transitionSpeed, theme) },
            bmp.bottom && resolveDefinition(bmp.bottom, "-bottom"),
            bmp.left && resolveDefinition(bmp.left, "-left"),
            bmp.right && resolveDefinition(bmp.right, "-right"),
            bmp.top && resolveDefinition(bmp.top, "-top"),
            bmp.radius && { "border-radius": resolveGlobalsVar(bmp.radius, theme) }
        )
    }

    const resolvedSet = Object.assign({},
        resolveMap(set),
        set.__hover && { "&:hover": resolveMap(set.__hover) },
        set.__active && { "&:active": resolveMap(set.__active) },
        set.__focus && { "&:focus": resolveMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveMap(set.__focusVisible) },
        set.__disabled && { "&:disabled": resolveMap(set.__disabled) },
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(borderSetToCss(set.__extends, theme), resolvedSet)).sort((a, b) => {
            // custom sorting for some properties (e.g. to enable active rule > hover rule)
            if (a[0] === "&:hover") return -1;

            return a[0].toString() > b[0].toString() ? 1 : -1;
        }).map(([k, v]) => ({ [k]: v })))
        : resolvedSet;
}

const colorSetToCss = (colorSet: ThemingColorSet | string, theme: ThemingConfig): object => {
    const set: ThemingColorSet = typeof colorSet === "string" ? theme.sets.colorSets[getVarName(colorSet)] : colorSet;

    if (!set) return {};

    const resolveColorMap = (cmp: Transitionable<ThemingColorMap>) => {
        return Object.assign({},
            cmp.transitionSpeed && { transitionDuration: resolveGlobalsVar(cmp.transitionSpeed, theme) },
            cmp.background && { background: resolveGlobalsVar(cmp.background, theme) },
            cmp.border && { borderColor: resolveGlobalsVar(cmp.border, theme) },
            cmp.filter && { filter: resolveGlobalsVar(cmp.filter, theme) },
            cmp.foreground && { color: resolveGlobalsVar(cmp.foreground, theme) },
            cmp.icon && { "& svg": { color: resolveGlobalsVar(cmp.icon, theme) } },
            cmp.shadow && { boxShadow: resolveGlobalsVar(cmp.shadow, theme) }
        )
    }

    const resolvedSet = Object.assign({},
        resolveColorMap(set),
        set.__hover && { "&:hover": resolveColorMap(set.__hover) },
        set.__active && { "&:active": resolveColorMap(set.__active) },
        set.__focus && { "&:focus": resolveColorMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveColorMap(set.__focusVisible) },
        set.__disabled && { "&:disabled": resolveColorMap(set.__disabled) },
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(colorSetToCss(set.__extends, theme), resolvedSet)).sort((a, b) => {
            // custom sorting for some properties (e.g. to enable active rule > hover rule)
            if (a[0] === "&:hover") return -1;

            return a[0].toString() > b[0].toString() ? 1 : -1;
        }).map(([k, v]) => ({ [k]: v })))
        : resolvedSet;
}

const fontSetToCss = (colorSet: ThemingFontSet | string, theme: ThemingConfig): object => {
    const set: ThemingFontSet = typeof colorSet === "string" ? theme.sets.fontSets[getVarName(colorSet)] : colorSet;

    if (!set) return {};

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
        )
    }

    const resolvedSet = Object.assign({},
        resolveFontMap(set),
        set.__hover && { "&:hover": resolveFontMap(set.__hover) },
        set.__active && { "&:active": resolveFontMap(set.__active) },
        set.__focus && { "&:focus": resolveFontMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveFontMap(set.__focusVisible) },
        set.__disabled && { "&:disabled": resolveFontMap(set.__disabled) },
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(fontSetToCss(set.__extends, theme), resolvedSet)).sort((a, b) => {
            // custom sorting for some properties (e.g. to enable active rule > hover rule)
            if (a[0] === "&:hover") return -1;

            return a[0].toString() > b[0].toString() ? 1 : -1;
        }).map(([k, v]) => ({ [k]: v })))
        : resolvedSet;
}

const boxDefToCssProps = (boxDef: Extendable<ThemingBoxDefinition> | null, theme: ThemingConfig): Array<object> => {
    const res = [];

    if (!boxDef) return [];

    if (boxDef.__extends) {
        res.push(...boxDefToCssProps(resolveBoxDefinition(boxDef.__extends, theme), theme));
    }

    if (boxDef.animation) {
        res.push({
            animation: resolveGlobalsVar(boxDef.animation, theme)
        });
    }

    if (boxDef.borderSet) {
        res.push(borderSetToCss(boxDef.borderSet, theme));
    };

    if (boxDef.colorSet) {
        res.push(colorSetToCss(boxDef.colorSet, theme));
    };

    if (boxDef.padding) {
        res.push({
            padding: resolveGlobalsVar(boxDef.padding, theme)
        });
    };

    if (boxDef.fontSet) {
        res.push(fontSetToCss(boxDef.fontSet, theme));
    };

    if (boxDef.height) {
        res.push({
            height: resolveGlobalsVar(boxDef.height, theme)
        });
    };

    if (boxDef.width) {
        res.push({
            width: resolveGlobalsVar(boxDef.width, theme)
        });
    };

    return res;
}

const resolveBoxDefinition = (def: string | ThemingBoxDefinition | undefined, theme: ThemingConfig): ThemingBoxDefinition | null => {
    if (typeof def === "string" && def.startsWith("$$")) return theme.sets.boxSets[getVarName(def)] || null;

    if (typeof def === "object") return def;

    return null;
}

export type ComponentsConfig = {
    component: string
    variants: {
        variant: string;
        className: string;
        defaultProps: object
    }[]
}

const resolveComponent = (component: string, theme: ThemingConfig): ComponentsConfig => {
    const componentConfig = theme.components[component];

    console.log("Resolve Component: ", {component, componentConfig, theme});

    if (!componentConfig)
        return {
            component: component,
            variants: []
        };

    const variants = [
        { variant: "default", boxDef: resolveBoxDefinition(componentConfig.default.theming, theme), props: componentConfig.default.defaultProps },
        ...(componentConfig.variants ? Object.keys(componentConfig.variants).filter(x => x !== "default").map((vrnt, i) => componentConfig.variants && ({
            variant: vrnt,
            boxDef: resolveBoxDefinition(componentConfig.variants[vrnt].theming, theme),
            props: componentConfig.variants[vrnt].defaultProps
        })) : [])
    ];

    return {
        component: component,
        variants: variants.filter(x => x && x.boxDef !== null).map((vrnt, i) => vrnt && ({
            variant: vrnt.variant,
            className: vrnt.boxDef ? css(boxDefToCssProps(vrnt.boxDef, theme) as never) : "",
            defaultProps: vrnt.props || {}
        })) as ComponentsConfig["variants"]
    };
}

export type IThemeManager = {
    readonly __loadedThemes: Array<ThemingConfig>
    readonly __lastActiveTheme: string | null
    init: () => void
    loadTheme: (components: string[], themeConfig: ThemingConfig) => null | ComponentsConfig[]
}

export class ThemeManager implements IThemeManager {
    __loadedThemes = [];
    __lastActiveTheme: null | string = null;

    init() {
        setup(null, prefix);
    };

    loadTheme(components: string[], _themeConfig: ThemingConfig) {
        if (!Array.isArray(components)) throw Error("List of components must be a string array.");
        if (!_themeConfig) throw Error("No Theming Config found!");

        const themeConfig = {..._themeConfig};

        !this.__loadedThemes.find((x: ThemingConfig) => x.name === themeConfig.name) && this.__loadedThemes.push({...themeConfig} as never);

        const resolveConfig = () => {
            const configKeys = Object.keys(themeConfig);
            const neededKeys = ["name", "components", "version", "globals", "sets"];

            if(!neededKeys.every(key => configKeys.includes(key))) return null;

            if (themeConfig.basedOn) {
                const cachedTheme = this.__loadedThemes.find((x: ThemingConfig) => x.name === themeConfig.basedOn);

                console.log({cachedTheme})

                if (cachedTheme) {
                    return deepmerge(cachedTheme, themeConfig);
                }
            }

            return themeConfig;
        }

        const resolvedConfig = resolveConfig();

        if(resolvedConfig === null) return null;

        if (this.__lastActiveTheme !== resolvedConfig.name) {
            this.__lastActiveTheme = resolvedConfig.name;

            const styleRoot = (document || window.document).getElementById("_goober");
            if (styleRoot) {
                styleRoot.remove();
            }

            return components.map(comp => resolveComponent(comp, resolvedConfig));
        }

        return null;
    }
}