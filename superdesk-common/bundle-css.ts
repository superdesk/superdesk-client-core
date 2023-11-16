import {globSync} from 'glob';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import {debounce} from 'lodash';

function readFilePromisified(_path: string): Promise<string> {
    return new Promise((resolve) => {
        fs.readFile(_path, {encoding: 'utf-8'}, (_err, res) => resolve(res));
    });
}

function toAbsolutePath(relativePath: string): string {
    return path.join(__dirname, relativePath);
}

const cssFilesGlobPattern = './src/ui/**/*.css';

// contains relative paths
const files: Array<string> = globSync(cssFilesGlobPattern);

function bundle(): Promise<void> {
    console.info('CSS bundling started');
    return Promise.all(
        files.map((_path) => readFilePromisified(toAbsolutePath(_path)).then((contents) => ({file: _path, contents}))),
    ).then((result) => {
        const bundledStr: string = result.map(({file, contents}) => `/** ${file} */\n${contents}`).join('\n\n\n');

        fs.writeFileSync('./dist/index.css', bundledStr, 'utf-8');

        console.info('CSS bundling finished\n');
    });
}

const bundleDebounced = debounce(bundle, 500);

const watch = process.argv.slice(2).includes('--watch');

if (watch) {
    console.info('watching CSS files...');
    chokidar.watch(cssFilesGlobPattern).on('all', () => {
        bundleDebounced();
    });
} else {
    bundle();
}
