import { useContext, useEffect, useMemo, useState } from "react"
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
    const calcThemingVariant = () => themeContext?.find(x => x.component === component)?.variants.find(vrnt => vrnt.variant === variant) as unknown as ThemingVariant<T> || null;

    const [themingVariant, setThemingVariant] = useState<ThemingVariant<T> | null>(calcThemingVariant());
    const resolvedProps = useMemo<T>( () => {
            if (themingVariant) {
                const defprps: any = {...themingVariant.defaultProps};

                if(defprps["children"] && !(typeof defprps["children"] === "string")) {
                    delete defprps.children;
                };

                return Object.assign(defprps, props);
            }
            return props;
        },
        [themingVariant, props]
    );

    useEffect(() => {
        if (!themeContext) return;
        if (variant === null) return setThemingVariant(null)

        return setThemingVariant(calcThemingVariant);
    }, [themeContext, component, variant]);

    return [themingVariant || null, resolvedProps];
}