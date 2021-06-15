const fs = require('fs');
const path = require('path');
var css = require('css');
var debounce = require('lodash').debounce;
var selectorTokenizer = require('css-selector-tokenizer');
var getExtensionDirectoriesSync = require('./get-extension-directories-sync');

function handleToken(token, prefixFn) {
    if (token.type === 'selectors') {
        token.nodes.forEach((node) => {
            handleToken(node, prefixFn);
        });
    } else {
        token.nodes.forEach((node) => {
            if (node.type === 'id' | node.type === 'class') {
                node.name = prefixFn(node.name);
            }
        });
    }
}

function addPrefixes(cssString, prefixFn) {
    var ast = css.parse(cssString);

    ast.stylesheet.rules = ast.stylesheet.rules.map((rule) => Object.assign({}, rule, {
        selectors: Array.isArray(rule.selectors) // isn't present for CSS comments
            ? rule.selectors.map((selector) => {
                const tokens = selectorTokenizer.parse(selector);

                handleToken(tokens, prefixFn);

                return selectorTokenizer.stringify(tokens);
            })
            : rule.selectors,
    }));

    return css.stringify(ast);
}

function namespace(clientDir) {
    var getCssNameForExtension = require(
        path.join(clientDir, 'node_modules/superdesk-core/scripts/core/get-css-name-for-extension')
    ).getCssNameForExtension;

    const directories = getExtensionDirectoriesSync(clientDir);

    let finalCss = '';

    directories.forEach((dir) => {
        var cssFilePath = dir.extensionCssFilePath;

        if (fs.existsSync(cssFilePath)) {
            const cssString = fs.readFileSync(cssFilePath).toString();

            finalCss +=
`/* EXTENSION STYLES START FOR '${dir.extensionName}' */


${addPrefixes(cssString, (originalName) => getCssNameForExtension(originalName, dir.extensionName))}


/* EXTENSION STYLES END FOR '${dir.extensionName}' */



`;
        }
    });

    fs.writeFileSync(
        path.join(
            require.resolve(path.join(clientDir, 'node_modules/superdesk-core/package.json')),
            '../styles/extension-styles.generated.css'
        ),
        finalCss
    );
}

module.exports = {
    namespaceCSS: namespace,
    watchCSS: (clientDir) => {
        const processDebouced = debounce(() => {
            namespace(clientDir);
            console.info(`CSS recompiled at ${new Date().toISOString().slice(11, 19)}`);
        }, 100);
        const directories = getExtensionDirectoriesSync(clientDir);

        directories.forEach((dir) => {
            var cssFilePath = dir.extensionCssFilePath;

            if (fs.existsSync(cssFilePath)) {
                fs.watch(cssFilePath, () => {
                    processDebouced();
                });
            }
        });
    },
};