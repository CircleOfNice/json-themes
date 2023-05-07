import test from "ava";
import { ThemingConfigFile } from "../types";
import { resolveComponent } from "../themeManager";
import { extractCss } from "goober";

const ExampleConfig: ThemingConfigFile = {
    name:    "Example",
    meta:    [],
    version: "1.0.0",
    globals: {
        colors: {
            bg:  "black",
            fg:  "white",
            mix: "#cc6655"
        },
        mapping: {
            mapped: "$$colors.mix|aa"
        },
        gradient: {
            definition:    "linear-gradient(#e66465, #9198e5)",
            fallbackColor: "#e66465"
        }
    },
    sets: {
        colorSets: {
            base: {
                background: "$$colors.bg",
                foreground: "$$colors.fg"
            }
        },
        fontSets: {
            base: {
                family: "\"Open Sans\", sans-serif"
            }
        },
        borderSets: {
            base: {
                radius: "1rem",
                width:  "0.25rem"
            }
        },
        boxSets: {
            base: {
                borderSet: "$$base",
                colorSet:  "$$base",
                fontSet:   "$$base",
                padding:   "1rem"
            }
        }
    },
    components: {
        Test: {
            default: {
                theming: {
                    colorSet: {
                        __extends:      "$$base",
                        border:         "red",
                        foreground:     "$$gradient",
                        background:     "$$gradient",
                        backdropFilter: {
                            definition:         "blur(5px)",
                            fallbackBackground: "$$gradient"
                        },
                        __hover: {
                            foreground: "red"
                        },
                        __active: {
                            foreground: "blue"
                        },
                        __checked: {
                            foreground: "violet"
                        },
                        __current: {
                            foreground: "green"
                        },
                        __disabled: {
                            foreground: "grey"
                        },
                        __focus: {
                            foreground: "yellow"
                        },
                        __focusVisible: {
                            foreground: "orange"
                        },
                        __invalid: {
                            foreground: "cyan"
                        },
                        __pressed: {
                            foreground: "brown"
                        },
                        __selection: {
                            foreground: "aqua",
                            background: "white"
                        }
                    },
                    fontSet: {
                        family: "sans-serif"
                    },
                    before: {
                        content:  "hi",
                        position: "absolute"
                    },
                    after: {
                        content:  "bye",
                        position: "absolute"
                    },
                    __active: {
                        before: {
                            content:  "hi1",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye1",
                            position: "absolute"
                        }
                    },
                    __checked: {
                        before: {
                            content:  "hi2",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye2",
                            position: "absolute"
                        }
                    },
                    __current: {
                        before: {
                            content:  "hi3",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye3",
                            position: "absolute"
                        }
                    },
                    __disabled: {
                        before: {
                            content:  "hi4",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye4",
                            position: "absolute"
                        }
                    },
                    __focus: {
                        before: {
                            content:  "hi5",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye5",
                            position: "absolute"
                        }
                    },
                    __focusVisible: {
                        before: {
                            content:  "hi6",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye6",
                            position: "absolute"
                        }
                    },
                    __hover: {
                        before: {
                            content:  "hi7",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye7",
                            position: "absolute"
                        }
                    },
                    __invalid: {
                        before: {
                            content:  "hi8",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye8",
                            position: "absolute"
                        }
                    },
                    __pressed: {
                        before: {
                            content:  "hi9",
                            position: "absolute"
                        },
                        after: {
                            content:  "bye9",
                            position: "absolute"
                        }
                    }
                }
            }
        },
        CompA: {
            default: {
                theming: "$$base"
            }
        },
        CompB: {
            default: {
                theming: {
                    borderSet: "$$base",
                    colorSet:  "$$base",
                    fontSet:   "$$base",
                    padding:   "1rem"
                }
            }
        },
        MixedVar: {
            default: {
                theming: {
                    colorSet: {
                        foreground: "$$colors.mix|aa",
                        shadow:     "0 0 1rem $$colors.mix|aa",
                        background: "$$mapping.mapped"
                    }
                }
            }
        }
    }
};

test("if example theming definition works", t => {
    const testc = resolveComponent("Test", ExampleConfig);

    const css = extractCss();

    const expectedRes = ".go3920494756{background:linear-gradient(#e66465, #9198e5);color:#e66465;border-color:red;backdrop-filter:blur(5px);font-family:sans-serif;}@supports not (backdrop-filter: blur(1px)){.go3920494756{background:linear-gradient(#e66465, #9198e5);}}.go3920494756::selection{color:aqua;background:white;}.go3920494756::before{content:\"hi\";position:absolute;}.go3920494756::after{content:\"bye\";position:absolute;}.go3920494756:checked,.go3920494756[aria-checked]:not([aria-checked=false]){color:violet;}.go3920494756:checked::before,.go3920494756[aria-checked]:not([aria-checked=false])::before{content:\"hi2\";position:absolute;}.go3920494756:checked::after,.go3920494756[aria-checked]:not([aria-checked=false])::after{content:\"bye2\";position:absolute;}.go3920494756:invalid,.go3920494756[aria-invalid]:not([aria-invalid=false]){color:cyan;}.go3920494756:invalid::before,.go3920494756[aria-invalid]:not([aria-invalid=false])::before{content:\"hi8\";position:absolute;}.go3920494756:invalid::after,.go3920494756[aria-invalid]:not([aria-invalid=false])::after{content:\"bye8\";position:absolute;}.go3920494756[aria-pressed]:not([aria-pressed=false]){color:brown;}.go3920494756[aria-pressed]:not([aria-pressed=false])::before{content:\"hi9\";position:absolute;}.go3920494756[aria-pressed]:not([aria-pressed=false])::after{content:\"bye9\";position:absolute;}.go3920494756[aria-current]:not([aria-current=false]){color:green;}.go3920494756[aria-current]:not([aria-current=false])::before{content:\"hi3\";position:absolute;}.go3920494756[aria-current]:not([aria-current=false])::after{content:\"bye3\";position:absolute;}.go3920494756:focus-visible{color:orange;}.go3920494756:focus-visible::before{content:\"hi6\";position:absolute;}.go3920494756:focus-visible::after{content:\"bye6\";position:absolute;}.go3920494756:focus,.go3920494756focus-within{color:yellow;}.go3920494756:focus::before,.go3920494756focus-within::before{content:\"hi5\";position:absolute;}.go3920494756:focus::after,.go3920494756focus-within::after{content:\"bye5\";position:absolute;}.go3920494756:hover{color:red;}.go3920494756:hover::before{content:\"hi7\";position:absolute;}.go3920494756:hover::after{content:\"bye7\";position:absolute;}.go3920494756:active{color:blue;}.go3920494756:active::before{content:\"hi1\";position:absolute;}.go3920494756:active::after{content:\"bye1\";position:absolute;}.go3920494756:disabled,.go3920494756[aria-disabled=true]{color:grey;pointer-events:none;}.go3920494756:disabled::before,.go3920494756[aria-disabled=true]::before{content:\"hi4\";position:absolute;}.go3920494756:disabled::after,.go3920494756[aria-disabled=true]::after{content:\"bye4\";position:absolute;}";

    // console.log(css);

    t.is(typeof css, "string");
    t.is(css, expectedRes);
    t.is(css.includes(testc.variants.find(x => x.variant === "default")?.className as string), true);
});

test("if mixed/concated variables work", t => {
    const testc = resolveComponent("MixedVar", ExampleConfig);

    const css = extractCss();

    t.is(typeof css, "string");
    t.is(css.includes(testc.variants.find(x => x.variant === "default")?.className as string), true);
    t.is(css.includes("color:#cc6655aa"), true);
    t.is(css.includes("background:#cc6655aa"), true);
    t.is(css.includes("0 0 1rem #cc6655aa"), true);
});

test("if equal styles from different spec get merged", t => {
    const compa = resolveComponent("CompA", ExampleConfig);
    const compb = resolveComponent("CompB", ExampleConfig);

    const caName = compa.variants.find(x => x.variant === "default")?.className;
    const cbName = compb.variants.find(x => x.variant === "default")?.className;

    const css = extractCss();

    t.is(caName, cbName);
    t.is(typeof caName === "string" && css.includes(caName), true);
});
