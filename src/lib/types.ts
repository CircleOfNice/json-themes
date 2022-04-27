
type ThemingReference = `$$${string}`
type ThemingDefinition = string | ThemingReference | null;
type ThemingNumberDefinition = ThemingDefinition | number;
type ThemingImageDefintion = ThemingDefinition;

export type ThemingDefinitionDefaultsEnum = "inherit" | "initial" | "unset";

export type ThemingColorDefinitionDefaultsEnum = "currentColor" | "transparent";

export type Extendable<T> = T & {
    __extends?: T | ThemingReference
}

export type Transitionable<T> = T & {
    transitionSpeed?: ThemingNumberDefinition
}

type ThemingSet<T> = {
    __active?: Transitionable<T>,
    __disabled?: Transitionable<T>,
    __focus?: Transitionable<T>,
    __focusVisible?: Transitionable<T>,
    __hover?: Transitionable<T>
} & Transitionable<T>

export type ThemingDefinitionDefaults = ThemingDefinitionDefaultsEnum;
export type ThemingColorDefinitionDefaults = ThemingDefinitionDefaultsEnum | ThemingColorDefinitionDefaultsEnum;
export type ThemingGradientDefinition = {
    definition: string,
    fallbackColor: ThemingDefinition
};

export type ThemingColorDefinition = ThemingDefinition | ThemingGradientDefinition | ThemingColorDefinitionDefaults;

// Colors
export type ThemingColorMap = {
    background?: ThemingColorDefinition,
    border?: ThemingColorDefinition,
    filter?: ThemingDefinition,
    foreground?: ThemingColorDefinition,
    icon?: ThemingColorDefinition,
    shadow?: ThemingColorDefinition
};

export type ThemingColorSet = ThemingSet<Extendable<ThemingColorMap>>;

export type ThemingColorSets = {
    [key: string]: ThemingColorSet
};

// Fonts
export type ThemingFontDefinition = {
    family?: ThemingDefinition,
    letterSpacing?: ThemingNumberDefinition,
    lineHeight?: ThemingNumberDefinition,
    size?: ThemingNumberDefinition,
    style?: "italic" | "oblique" | "normal" | null | ThemingDefinitionDefaults,
    transform?: ThemingDefinition
    weight?: ThemingNumberDefinition
};

export type ThemingFontSet = ThemingSet<Extendable<ThemingFontDefinition>>;

export type ThemingFontSets = {
    [key: string]: ThemingFontSet
};

// Borders
export type ThemingBorderDefinition = {
    image?: ThemingImageDefintion,
    style?: "dotted" | "dashed" | "solid" | "double" | "groove" | "ridge" | "inset" | "outset" | "none" | "hidden",
    width?: ThemingNumberDefinition
};

export type ThemingBorderMap = {
    radius?: ThemingNumberDefinition,
    bottom?: ThemingBorderDefinition,
    left?: ThemingBorderDefinition,
    right?: ThemingBorderDefinition,
    top?: ThemingBorderDefinition
} & ThemingBorderDefinition;

export type ThemingBorderSet = ThemingSet<Extendable<ThemingBorderMap>>;

export type ThemingBorderSets = {
    [key: string]: ThemingBorderSet
};


// Boxes
export type ThemingBoxDefinition = {
    animation?: "fadeIn" | "popIn" | ThemingReference,
    borderSet?: string,
    colorSet?: string,
    fontSet?: string,
    height?: ThemingDefinition,
    // margin?: ThemingDefinition,
    padding?: ThemingDefinition,
    width?: ThemingDefinition
};

export type ThemingBoxSets = {
    [key: string]: Extendable<ThemingBoxDefinition>
}

// General

export type ThemingGlobalsType = {
    [key: string]: string | number | ThemingGlobalsType
};

export type ThemingConfigSets = {
    borderSets: ThemingBorderSets,
    boxSets: ThemingBoxSets
    colorSets: ThemingColorSets,
    fontSets: ThemingFontSets
};

export type ThemingVariant = {
    theming?: ThemingReference | Extendable<ThemingBoxDefinition>,
    defaultProps?: object
};

export type ThemingComponents = {
    [key: string]: {
        default: ThemingVariant
        variants?: {
            [key: string]: ThemingVariant
        }
    }
}

export type ThemingAnimations = {
    [key: string]: string
}

export type ThemingConfigFile = {
    animations?: ThemingAnimations
    assets?: {
        baseUrl?: string
    },
    basedOn?: string,
    components: ThemingComponents
    globals: ThemingGlobalsType,
    meta: Array<{ [key: string]: string }>,
    name: string,
    sets: ThemingConfigSets,
    version: string
};

export type ThemingConfig = ThemingConfigFile;

export type ThemeableComponentProps<T> = {
    variant?: string
} & T;