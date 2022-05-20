import { ThemingBorderDefinition, ThemingBorderMap, ThemingBorderSet, ThemingBoxDefinition, ThemingColorMap, ThemingColorSet, ThemingComponent, ThemingConfig, ThemingFontDefinition, ThemingFontSet, ThemingGradientDefinition, Transitionable } from "./types";
import { css, setup } from "goober";
import { deepmerge } from "deepmerge-ts";
import { prefix } from 'goober/prefixer';
import { createGlobalStyles, glob } from 'goober/global';

const sortCssNestings = (a: [string, unknown], b: any) => {
    // custom sorting for some properties (e.g. to enable active rule > hover rule)
    if (a[0] === "&:hover") return -1;
    if (a[0]?.includes("&:focus,&focus-within")) return 0;
    if (a[0] === "&:focus-visible") return 0;
    if (a[0] === "&:focus-within") return 0;
    if (a[0] === "&:active") return 1;
    if (a[0] === "&:disabled") return 2;

    return a[0].toString() > b[0].toString() ? 1 : -1;
}

const getVarName = (str: string) => str.slice(2);

const getDeepAttribute = (root: Record<string, any>, path: string[], value: any = null): any => {
    const val = value || root;

    if (!path || path.length === 0) {
        if (typeof val === "string" && val.startsWith("$$")) {
            return getDeepAttribute(root, getVarName(val).split("."));
        }

        return val
    };
    if (!val[path[0]]) return null;

    return getDeepAttribute(root, path.slice(1), val[path[0]]);
}

const resolveGlobalsVar = (str: unknown, theme: ThemingConfig, customResolver?: (res: unknown) => string) => {
    const resolver = (varStr: string) => {
        const deep = getDeepAttribute(theme.globals, getVarName(varStr).split("."));

        if (deep === null) {
            console.warn(`No Var found for ${str}. Skipped.`);
            return "";
        };

        if (customResolver) {
            return customResolver(deep);
        }

        return deep?.toString() || "";
    }

    return (`${str}`.replace(/\$\$[\w.]*/gm, resolver));
}

const resolvePropsVars = (props: any, theme: ThemingConfig) => {
    if (!props || !theme) return null;

    const keys = Object.keys(props);

    const resolvedValues: Array<any> = keys?.map(key => {
        const value = props[key];

        if (typeof value === "string" && value.startsWith("$$")) {
            return resolveGlobalsVar(value, theme);
        }

        if (typeof value === "object") {
            return resolvePropsVars(value, theme);
        }

        return value;
    });

    return Object.fromEntries(keys.map((key, i) => ([key, resolvedValues[i]])))
}

const resolveColorsDefinition = (str: unknown, theme: ThemingConfig, allowGradient = false) => {
    return resolveGlobalsVar(str, theme, res => {
        if (allowGradient && !(typeof res === "string")) {
            return resolveGlobalsVar((res as ThemingGradientDefinition).definition, theme);
        }
        if (!allowGradient && !(typeof res === "string")) {
            return resolveGlobalsVar((res as ThemingGradientDefinition).fallbackColor, theme) || "";
        }
        return `${res}`;
    })
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
        set.__focus && { "&:focus,&focus-within": resolveMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveMap(set.__focusVisible) },
        set.__disabled && { "&:disabled": resolveMap(set.__disabled) },
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(
            borderSetToCss(set.__extends, theme), resolvedSet))
            .sort(sortCssNestings)
            .map(([k, v]) => ({ [k]: v })))
        : resolvedSet;
}

const colorSetToCss = (colorSet: ThemingColorSet | string, theme: ThemingConfig): object => {
    const set: ThemingColorSet = typeof colorSet === "string" ? theme.sets.colorSets[getVarName(colorSet)] : colorSet;

    if (!set) return {};

    const resolveColorMap = (cmp: Transitionable<ThemingColorMap>) => {
        return Object.assign({},
            // TODO cmp.__extends && 
            cmp.transitionSpeed && { transitionDuration: resolveGlobalsVar(cmp.transitionSpeed, theme) },
            cmp.background && { background: resolveColorsDefinition(cmp.background, theme, true) },
            cmp.border && { borderColor: resolveColorsDefinition(cmp.border, theme) },
            cmp.filter && { filter: resolveGlobalsVar(cmp.filter, theme) },
            cmp.foreground && { color: resolveColorsDefinition(cmp.foreground, theme) },
            cmp.icon && { "& svg": { color: resolveGlobalsVar(cmp.icon, theme) } },
            cmp.shadow && { boxShadow: resolveGlobalsVar(cmp.shadow, theme) }
        )
    }

    const resolvedSet = Object.assign({},
        resolveColorMap(set),
        set.__hover && { "&:hover": resolveColorMap(set.__hover) },
        set.__active && { "&:active": resolveColorMap(set.__active) },
        set.__focus && { "&:focus,&:focus-within": resolveColorMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveColorMap(set.__focusVisible) },
        set.__disabled && { "&:disabled": resolveColorMap(set.__disabled) },
        set.__selection && {
            "::selection": {
                color: resolveGlobalsVar(set.__selection.foreground, theme),
                background: resolveColorsDefinition(set.__selection.background, theme)
            }
        }
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(
            colorSetToCss(set.__extends, theme), resolvedSet))
            .sort(sortCssNestings)
            .map(([k, v]) => ({ [k]: v })))
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
        set.__focus && { "&:focus,&focus-within": resolveFontMap(set.__focus) },
        set.__focusVisible && { "&:focus-visible": resolveFontMap(set.__focusVisible) },
        set.__disabled && { "&:disabled": resolveFontMap(set.__disabled) },
    );

    return set.__extends ? Object.assign({},
        ...Object.entries(deepmerge(
            fontSetToCss(set.__extends, theme), resolvedSet))
            .sort(sortCssNestings)
            .map(([k, v]) => ({ [k]: v })))
        : resolvedSet;
}

const boxDefToCssProps = (boxDef: ThemingBoxDefinition | null, theme: ThemingConfig, context?: string): Array<object> => {
    const res = [];

    if (!boxDef) return [];

    if (boxDef.__extends) {
        res.push(...boxDefToCssProps(resolveBoxDefinition(boxDef.__extends, theme, context), theme));
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

const resolveBoxDefinition = (def: string | ThemingBoxDefinition | undefined, theme: ThemingConfig, context?: string): ThemingBoxDefinition | null => {
    if (!def) return null;

    if (typeof def === "string" && def.startsWith("$$")) {
        const guess = theme.sets.boxSets[getVarName(def)] || null;

        if (guess) return guess;

        if (context) {
            console.log(def, context);

            const otherSource = getDeepAttribute(theme.components, context.split("."), null);

            if (otherSource[getVarName(def)]) return otherSource[getVarName(def)];

            return null;
        }

        return null;
    };

    if (typeof def === "object") return def;

    return null;
}

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

const resolveComponent = (component: string, theme: ThemingConfig): ComponentsConfig => {
    const componentConfig = theme.components[component];

    if (!componentConfig) {
        return {
            component: component,
            variants: []
        };
    }

    const extendedStuff = componentConfig.__extends ? resolveComponent(getVarName(componentConfig.__extends), theme) : {};

    const variants = [
        componentConfig.default && {
            variant: "default",
            parts: componentConfig.default.parts ? Object.keys(componentConfig.default.parts as object).map((key) => ([key,
                componentConfig.default &&
                resolveBoxDefinition((componentConfig.default.parts as any)[key], theme)
            ])) : [],
            boxDef: resolveBoxDefinition(componentConfig.default?.theming, theme),
            props: componentConfig.default?.defaultProps
        },
        ...(componentConfig.variants ? Object.keys(componentConfig.variants).filter(x => x !== "default").map((vrnt, i) => componentConfig.variants && ({
            variant: vrnt,
            parts: componentConfig.variants[vrnt].parts ? Object.keys(componentConfig.variants[vrnt].parts as object).map((key) => ([key,
                componentConfig.variants &&
                resolveBoxDefinition((componentConfig.variants[vrnt].parts as any)[key], theme)
            ])) : [],
            boxDef: resolveBoxDefinition(componentConfig.variants[vrnt].theming, theme),
            props: componentConfig.variants[vrnt].defaultProps
        })) : [])
    ].filter(x => x && x !== undefined && x.boxDef !== null);

    console.log({ variants });

    return deepmerge(extendedStuff, {
        component: component,
        variants: variants.map((vrnt, i) => vrnt && ({
            variant: vrnt.variant,
            parts: Object.fromEntries(vrnt.parts.map((part: any) => ([part[0], css(boxDefToCssProps(part[1], theme,
                `${component}.${vrnt.variant === "default" ? "default.parts" : `variants.${vrnt.variant}.parts`}`) as never) || ""]))),
            className: vrnt.boxDef ? css(boxDefToCssProps(vrnt.boxDef, theme) as never) : "",
            defaultProps: resolvePropsVars(vrnt.props, theme) || {}
        })) as ComponentsConfig["variants"]
    });
}

export type IThemeManager = {
    readonly __loadedThemes: Array<ThemingConfig>
    readonly __lastActiveTheme: string | null
    init: (componentCreationFunction: Function) => void
    loadTheme: (components: string[], themeConfig: ThemingConfig) => {
        components: ComponentsConfig[],
        globalStyles: Function
    } | null
}

export class ThemeManager implements IThemeManager {
    __loadedThemes = [];
    __lastActiveTheme: null | string = null;

    init(componentCreationFunction: Function) {
        setup(componentCreationFunction, prefix);
    };

    loadTheme(components: string[], _themeConfig: ThemingConfig) {
        if (!Array.isArray(components)) throw Error("List of components must be a string array.");
        if (!_themeConfig) throw Error("No Theming Config found!");

        const themeConfig = { ..._themeConfig };

        !this.__loadedThemes.find((x: ThemingConfig) => x.name === themeConfig.name) && this.__loadedThemes.push({ ...themeConfig } as never);

        const resolveConfig = () => {
            const configKeys = Object.keys(themeConfig);
            const neededKeys = ["name", "components", "version", "globals", "sets"];

            if (!neededKeys.every(key => configKeys.includes(key))) return null;

            if (themeConfig.basedOn) {
                const cachedTheme = this.__loadedThemes.find((x: ThemingConfig) => x.name === themeConfig.basedOn);

                if (cachedTheme) {
                    return deepmerge(cachedTheme, themeConfig);
                }
            }

            return themeConfig;
        }

        const resolvedConfig = resolveConfig();

        if (resolvedConfig === null) return null;

        if (this.__lastActiveTheme !== resolvedConfig.name) {
            this.__lastActiveTheme = resolvedConfig.name;

            const styleRoot = (document || window.document).getElementById("_goober");
            if (styleRoot) {
                styleRoot.remove();
            }

            const GlobalStyles = createGlobalStyles`html,body {}`;

            return {
                components: components.map(comp => resolveComponent(comp, resolvedConfig)),
                globalStyles: GlobalStyles
            };
        }

        return null;
    }
}