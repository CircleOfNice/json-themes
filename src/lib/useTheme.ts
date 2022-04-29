import { useContext, useEffect, useState } from "react"
import { ThemingContext } from "./themeContext"

type ThemingVariant = {
    className: string,
    defaultProps: object,
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

export const useThemeVariant = (component: string, variant: string | null = "default") => {
    const themeContext = useContext(ThemingContext);
    const [res, setRes] = useState<ThemingVariant | null>();

    useEffect(() => {
        if(variant === null) return setRes(null)

        setRes(themeContext?.find(x => x.component === component)?.variants.find(vrnt => vrnt.variant === variant) || null);
    }, [themeContext, component, variant])

    return res;
}