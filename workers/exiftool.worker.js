// https://github.com/6over3/exiftool/tree/main

const {parseMetadata} = await import(
    'https://cdn.jsdelivr.net/npm/@uswriting/exiftool@1.0.4/+esm'
);

const ctx = self;

ctx.onmessage = async(e) => {
    try {
        const metadata = await parseMetadata(e.data, {
            args: ['-j', '-iptc:all', '-xmp:all'],
            transform: (data) => JSON.parse(data),
        });

        ctx.postMessage(metadata.data[0]);
    } catch (err) {
        ctx.postMessage({error: err.message});
    }
};
