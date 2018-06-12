export default ({
    input: {
        margin: 0,

        control: {
            backgroundColor: '#fff',
            fontWeight: 'normal',
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
                border: '1px solid silver',
            },

            highlighter: {
                padding: '3px',
                paddingTop: '4px',
                overflowY: 'hidden',
            },

            input: {
                padding: '3px',
                paddingTop: '4px',
                overflowY: 'scroll',
                outline: 0,
                border: 0,
            },
        },

        suggestions: {
            list: {
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.15)',
            },

            item: {
                padding: '5px 15px',
                borderBottom: '1px solid rgba(0,0,0,0.15)',

                '&focused': {
                    backgroundColor: '#5ea9c8',
                },
            },
        },
    },

    mention: {
        backgroundColor: '#cee4e5',
    },
});
