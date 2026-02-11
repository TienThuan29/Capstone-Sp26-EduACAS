import prettier from "prettier/standalone";
import * as parserBabel from "prettier/plugins/babel";
import * as parserEstree from "prettier/plugins/estree";

/**
 * Format code blocks within markdown using Prettier
 * Beautifies Java, C#, JavaScript, TypeScript, C++, PHP code
 * @param markdown - Markdown string containing code blocks
 * @returns Formatted markdown with beautified code blocks
 */
export async function formatMarkdownCode(markdown: string): Promise<string> {
    const regex = /```(\w+)?\s+([\s\S]*?)```/g;
    console.log("Starting markdown code formatting...");

    let match;
    const replacements: { start: number; end: number; content: string }[] = [];

    while ((match = regex.exec(markdown)) !== null) {
        const fullMatch = match[0];
        const lang = match[1] || "";
        const code = match[2];
        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        console.log(`Found code block: lang='${lang}', length=${code.length}`);

        if (!lang || /java|csharp|cs|js|ts|cpp|c\+\+|php/i.test(lang)) {
            try {
                const formatted = await prettier.format(code, {
                    parser: "babel-ts",
                    plugins: [parserBabel, parserEstree],
                    tabWidth: 4,
                    printWidth: 80,
                    semi: true,
                    singleQuote: false,
                });

                replacements.push({
                    start: startIndex,
                    end: endIndex,
                    content: `\`\`\`${lang}\n${formatted.trim()}\n\`\`\``
                });
                console.log(`✓ Formatted '${lang}' code block successfully`);
            } catch (e) {
                console.warn(`⚠ Prettier formatting failed for '${lang}' block:`, e);
            }
        }
    }

    let result = markdown;
    for (let i = replacements.length - 1; i >= 0; i--) {
        const rep = replacements[i];
        result = result.substring(0, rep.start) + rep.content + result.substring(rep.end);
    }

    return result;
}
