export function hasChineseCharacters(input: string): boolean {
    const pattern = new RegExp("[\u4e00-\u9fa5]");
    return pattern.test(input);
}
