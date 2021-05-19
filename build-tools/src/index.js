#!/usr/bin/env node

const path = require('path');
const currentDir = process.cwd();

const poToJson = require('./po-to-json/index');
const installExtensions = require('./extensions/install-extensions');
const {namespaceCSS, watchCSS} = require('./extensions/css');

const {Command} = require('commander');
const program = new Command();

program.command('po-to-json <source-dir-po> <output-dir-json>')
    .description('convert .po files in the directory to .json format that is used by Superdesk')
    .action((sourcePo, outputJson) => {
        const poDir = path.join(currentDir, sourcePo);
        const jsonDir = path.join(currentDir, outputJson);

        poToJson(poDir, jsonDir);
    });


const extensions = new Command('extensions');

extensions
    .command('build <main-client-dir>')
    .description('prepares extensions for usage')
    .action((clientDir) => {
        const clientDirAbs = path.join(currentDir, clientDir);

        installExtensions(clientDirAbs);
        namespaceCSS(clientDirAbs);
    });

extensions
    .command('css <main-client-dir>')
    .description('includes CSS files from extensions into the main application stylsheet')
    .option('-w, --watch', 'rebuild the main application stylsheet when any of extension CSS files change')
    .action((clientDir, options) => {
        const clientDirAbs = path.join(currentDir, clientDir);

        if (options.watch) {
            console.info('watching CSS files from extensions');
            watchCSS(clientDirAbs);
        } else {
            namespaceCSS(clientDirAbs);
        }
    });

program.addCommand(extensions);

program.version(require('../package.json').version);
program.parse(process.argv);