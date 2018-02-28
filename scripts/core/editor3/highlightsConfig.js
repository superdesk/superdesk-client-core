export const highlightsConfig = {
    COMMENT: {
        type: 'COMMENT',
        draftStyleMap: {
            backgroundColor: 'rgba(255, 235, 59, 0.2)'
        }
    },
    ANNOTATION: {
        type: 'ANNOTATION',
        draftStyleMap: {
            borderBottom: '4px solid rgba(100, 205, 0, 0.6)'
        }
    },
    ADD_SUGGESTION: {
        type: 'ADD_SUGGESTION',
        draftStyleMap: {
            color: 'rgba(0, 180, 0, 1.0)'
        }
    },
    DELETE_SUGGESTION: {
        type: 'DELETE_SUGGESTION',
        draftStyleMap: {
            color: 'rgba(255, 0, 0, 1.0)',
            textDecoration: 'line-through'
        }
    },
};
