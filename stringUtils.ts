export function hasChineseCharacters(input: string): boolean {
    const pattern = new RegExp("[\u4e00-\u9fa5]");
    return pattern.test(input);
}

export function addDisplayStyle(input: string): string {
    // Matches formulas wrapped by $$, ``, or $...$
    const ignoreRegex = /\$\$.*?\$\$|`.*?`|\$(?!\$).*?\$(?!\$)/g;

    let replaced =  input.replace(ignoreRegex, (match) => {
        // If it's `...` or $$...$$ return the match directly
        if (match.startsWith('`') || match.startsWith('$$')) {
            return match;
        }
        // If it's $...$ then replace with $\displaystyle ...$
        else {
            return match.replace(/\$(.*?)\$/, "$\\displaystyle $1$");
        }
    });

    // remove repeating \displaytyle
    replaced = replaced.replace(/\\displaystyle \\displaystyle /g, "\\displaystyle ");
    return replaced
}

export function powerToEmoji(power: number): string{
    if (power==2) return "✨";
    if (power==3) return "🔥";
    if (power==4) return "🌠";
    return ""
}
