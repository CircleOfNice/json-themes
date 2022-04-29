import React, { FC, PropsWithChildren, useEffect, useState } from "react";
import { ComponentsConfig, IThemeManager, ThemeManager } from "./themeManager";
import { ThemingConfig } from "./types";

export const ThemingContext = React.createContext<null | ComponentsConfig[]>(null);

export const ThemingRoot = (props: PropsWithChildren<{
    componentsList: string[],
    themingConfig: ThemingConfig,
    suppressTransitionsTimeout?: number
}>) => {
    const [manager, setManager] = useState<IThemeManager>();
    const [components, setComponents] = useState<string[]>([]);
    const [theme, setTheme] = useState<{
        components: ComponentsConfig[];
        globalStyles: Function;
    } | null>(null);
    const [suppressTransitions, setSuppressTransitions] = useState(false);

    useEffect(() => {
        const mgr = new ThemeManager();

        mgr.init(React.createElement);

        setManager(mgr)
    }, []);

    useEffect(() => {
        if (manager && props.themingConfig && props.componentsList?.length > 0) {
            const result = manager.loadTheme(props.componentsList, props.themingConfig);

            setSuppressTransitions(true);

            setTheme(result);
        }
    }, [components, manager, props.themingConfig]);

    useEffect(() => {
        if (props.componentsList)
            setComponents(props.componentsList)
    }, [props.componentsList]);

    useEffect(() => {
        if (suppressTransitions) {
            const stls = document.createElement("style");
            stls.innerHTML = "html,body * { transition-duration: 0s !important; }";
            stls.id = "__suppressTransitionsDecl";

            document.head.appendChild(stls);

            const timer = setTimeout(() => setSuppressTransitions(false), props.suppressTransitionsTimeout || 333);

            return () => clearTimeout(timer);
        }
        else {
            document.getElementById("__suppressTransitionsDecl")?.remove();
        }
    }, [suppressTransitions]);

    return <>
        <ThemingContext.Provider value={theme?.components || null}>
            {props.children}
        </ThemingContext.Provider>
    </>
}