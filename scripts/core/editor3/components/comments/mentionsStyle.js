export default ({
    input: {
        control: {
            backgroundColor: '#fff',
            fontWeight: 'normal',
        },

        input: {
            margin: 0,
        },

        '&multiLine': {
            control: {
                border: '1px solid silver',
            },

            highlighter: {
                padding: 9,
                overflowY: 'hidden',
            },

            input: {
                padding: 9,
                minHeight: 63,
                maxHeight: 200,
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
