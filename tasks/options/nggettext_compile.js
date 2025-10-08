module.exports = {
    options: {
        format: 'json',
    },
    all: {
        files: [
            {
                expand: true,
                dot: true,
                cwd: '<%= coreDir %>/po',
                src: ['*.po'],
                dest: '<%= distDir %>/languages',
                ext: '.json',
            },
        ],
    },
};
