import { useContext, useEffect, useState } from "react"
import { ThemingContext } from "./themeContext"

type ThemingVariant<T = object> = {
    className: string,
    defaultProps: T,
    parts: {
        [key: string]: string
    }
    variant: string
}

export const useThemeVariants = (component: string) => {
    const themeContext = useContext(ThemingContext);
    const [res, setRes] = useState<ThemingVariant[] | null>();

    useEffect(() => {
        setRes(themeContext?.find(x => x.component === component)?.variants || null);
    }, [themeContext, component])

    return res;
}

export const useThemeVariant = <T>(component: string, variant: string | null = "default", props: T): [ThemingVariant<T> | null, T] => {
    const themeContext = useContext(ThemingContext);
    const [themingVariant, setThemingVariant] = useState<ThemingVariant<T> | null>();
    const [resolvedProps, setResolvedProps] = useState(props);

    useEffect(() => {
        if(variant === null) return setThemingVariant(null)

        return setThemingVariant(themeContext?.find(x => x.component === component)?.variants.find(vrnt => vrnt.variant === variant) as unknown as ThemingVariant<T> || null);
    }, [themeContext, component, variant]);

    useEffect(() => {
        if(themingVariant) {
            setResolvedProps({
                ...themingVariant.defaultProps,
                ...props
            });
        }
    }, [themingVariant]);

    return [themingVariant || null, resolvedProps];
}