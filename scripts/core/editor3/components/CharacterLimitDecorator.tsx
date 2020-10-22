export function getCharacterLimitDecorator() {
    // return null for limit (just don't allow to type)
    return {
        strategy: (contentBlock: ContentBlock, callback) => {

        },
    };
}
