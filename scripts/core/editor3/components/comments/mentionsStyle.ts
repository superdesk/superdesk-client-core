export default ({
    input: {
        margin: 0,

        control: {
            backgroundColor: 'var(--sd-colour-bg__searchbar)',
            fontWeight: 'normal',
            borderRadius: 'var(--b-radius--small)',
            width: '100%',
            margin: 0,
        },

        input: {
            margin: 0,
        },

        '&singleLine': {
            input: {
                height: '100%',
            },
            control: {
                padding: '4px 0',
            },
        },

        '&multiLine': {
            control: {
                border: '1px solid var(--sd-colour-line--light)',
            },

            highlighter: {
                padding: '6px',
                overflowY: 'hidden',
                minHeight: '3.2rem',
            },

            input: {
                padding: '6px',
                overflowY: 'scroll',
                outline: 0,
                border: 0,
                minHeight: '3.2rem',
            },
        },

        suggestions: {
            list: {
                backgroundColor: 'var(--color-dropdown-menu-Bg)',
                border: 'var(--sd-shadow__dropdown)',
                borderRadius: 'var(--b-radius--small)',
            },

            item: {
                padding: '5px 15px',
                borderBottom: '1px solid var(--sd-colour-line--x-light)',

                '&focused': {
                    backgroundColor: 'var(--sd-colour-interactive--alpha-20)',
                },
            },
        },
    },

    mention: {
        backgroundColor: 'var(--sd-colour-interactive--alpha-30)',
    },
});
