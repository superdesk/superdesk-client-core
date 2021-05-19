#!/usr/bin/env node

const path = require('path');
const currentDir = process.cwd();

const poToJson = require('./po-to-json/index');

const {Command} = require('commander');
const program = new Command();

program.command('po-to-json <source-dir-po> <output-dir-json>')
    .description('convert .po files in the directory to .json format that is used by Superdesk')
    .action((sourcePo, outputJson) => {
        const poDir = path.join(currentDir, sourcePo);
        const jsonDir = path.join(currentDir, outputJson);

        poToJson(poDir, jsonDir);
    });

program.version(require('../package.json').version);
program.parse(process.argv);