
export default ({
    input: {
        margin: 0,

        control: {
            backgroundColor: '#fff',
            fontWeight: 'normal',
            width: '100%',
            margin: 0,
            border: '1px solid silver',
            minHeight: 63,
        },

        highlighter: {
            padding: '3px',
            paddingBlockStart: '4px',
            overflowY: 'hidden',
        },

        input: {
            padding: '3px',
            paddingBlockStart: '4px',
            overflow: 'hidden',
            outline: 0,
            border: 0,
        },

        suggestions: {
            top: 'auto',
            bottom: '2em',
            minWidth: '100px',

            list: {
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.15)',
            },

            item: {
                padding: '5px 15px',
                borderBottom: '1px solid rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',

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
