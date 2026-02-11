import { marked } from "marked";
import TurndownService from "turndown";
import hljs from "highlight.js";
import 'highlight.js/styles/github-dark.css';

marked.use({
    gfm: true,
    breaks: true,
    renderer: {
        code({ text, lang }: { text: string; lang?: string }) {
            const validLang = !!(lang && hljs.getLanguage(lang));
            const highlighted = validLang
                ? hljs.highlight(text, { language: lang }).value
                : hljs.highlightAuto(text).value;
            return `<pre><code class="hljs ${validLang ? 'language-' + lang : ''}">${highlighted}</code></pre>`;
        }
    }
});

const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
});

turndownService.addRule("fencedCodeBlock", {
    filter: function (node) {
        return !!(
            node.nodeName === "PRE" &&
            node.firstChild &&
            node.firstChild.nodeName === "CODE"
        );
    },
    replacement: function (content, node) {
        const codeElement = node.firstChild as HTMLElement;
        const className = codeElement.getAttribute("class") || "";
        const language = className.replace("language-", "") || "java";
        return "\n```" + language + "\n" + content + "\n```\n";
    },
});



export function markdownToHtml(markdown: string): string {
    return marked(markdown) as string;
}


export function htmlToMarkdown(html: string): string {
    return turndownService.turndown(html);
}
