module.exports = {
    all: {
        options: {
            format: 'json',
        },
        files: [
            {
                expand: true,
                dot: true,
                cwd: '<%= coreDir %>/po',
                dest: '<%= distDir %>/languages',
                src: ['**/*.po'],
                ext: ['.json'],
            },
        ],
    },
};
