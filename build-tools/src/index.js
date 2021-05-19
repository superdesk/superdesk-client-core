#!/usr/bin/env node

const path = require('path');
const currentDir = process.cwd();

const poToJson = require('./po-to-json/index');

const args = process.argv.slice(2);

const command = args[0];

if (command == 'po-to-json') {
    const poDir = path.join(currentDir, args[1]);
    const jsonDir = path.join(currentDir, args[2]);

    poToJson(poDir, jsonDir);
}