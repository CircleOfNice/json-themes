import React, { FC, PropsWithChildren, useEffect, useState } from "react";
import { ComponentsConfig, IThemeManager, ThemeManager } from "./themeManager";
import { ThemingConfig } from "./types";

export const ThemingContext = React.createContext<null | ComponentsConfig[]>(null);

export const ThemingRoot = (props: PropsWithChildren<{
    componentsList: string[],
    themingConfig: ThemingConfig
}>) => {
    const [manager, setManager] = useState<IThemeManager>();
    const [components, setComponents] = useState<string[]>([]);
    const [theme, setTheme] = useState<null | ComponentsConfig[]>(null);

    useEffect(() => {
        const mgr = new ThemeManager();

        mgr.init();

        setManager(mgr)
    }, []);

    useEffect(() => {
        if (manager && props.themingConfig && props.componentsList?.length > 0) {
            const result = manager.loadTheme(props.componentsList, props.themingConfig);

            setTheme(result);
        }
    }, [components, manager, props.themingConfig]);

    useEffect(() => {
        if (props.componentsList)
            setComponents(props.componentsList)
    }, [props.componentsList]);

    return <>
        <ThemingContext.Provider value={theme}>
            {props.children}
        </ThemingContext.Provider>
    </>
}