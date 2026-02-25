/** Fast non-cryptographic djb2-style hash. Collisions are acceptable. */
export function hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);

        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return hash;
}
