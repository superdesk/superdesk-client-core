
export default [
    ['EMBED_PROVIDERS', function(EMBED_PROVIDERS) {
        return {
            pattern: /twitter\.com\/widgets\.js/g,
            name: EMBED_PROVIDERS.twitter,
        };
    }],
    ['EMBED_PROVIDERS', function(EMBED_PROVIDERS) {
        return {
            pattern: /www\.youtube\.com/g,
            name: EMBED_PROVIDERS.youtube,
        };
    }],
    ['EMBED_PROVIDERS', 'api', 'config', function(EMBED_PROVIDERS, api, config) {
        return {
            pattern: /src=".*vidible\.tv.*pid=(.+)\/(.+).js/g,
            name: EMBED_PROVIDERS.vidible,
            condition: () => config.editor && config.editor.vidible,
            callback: (match) => api.get(`vidible/bcid/${match[2]}/pid/${match[1]}`)
                .then((data) => ({association: data})),
        };
    }],
];
