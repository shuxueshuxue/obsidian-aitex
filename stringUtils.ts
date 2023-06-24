export function hasChineseCharacters(input: string): boolean {
    const pattern = new RegExp("[\u4e00-\u9fa5]");
    return pattern.test(input);
}

export function addDisplayStyle(input: string): string {
    // Matches formulas wrapped by $$, ``, or $...$
    const ignoreRegex = /\$\$.*?\$\$|`.*?`|\$(?!\$).*?\$(?!\$)/g;

    return input.replace(ignoreRegex, (match) => {
        // If it's `...` or $$...$$ return the match directly
        if (match.startsWith('`') || match.startsWith('$$')) {
            return match;
        }
        // If it's $...$ then replace with $\displaystyle ...$
        else {
            return match.replace(/\$(.*?)\$/, "$\\displaystyle $1$");
        }
    });
}

