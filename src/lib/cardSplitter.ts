export interface Card {
    id: string;
    markdown: string;
    html: string;
    index: number;
}

export function splitMarkdownToCards(markdown: string): Card[] {
    const lines = markdown.split(/\r?\n/);
    const cards: Card[] = [];
    let currentCardLines: string[] = [];
    let cardIndex = 0;
    let inFrontmatter = false;

    for (let i = 0; i < lines.length; i++) {
        const originalLine = lines[i];
        const line = originalLine.trim();

        // Detect first YAML front matter block and avoid splitting by its closing '---'.
        if (i === 0 && line === '---') {
            inFrontmatter = true;
            currentCardLines.push(originalLine);
            continue;
        }

        if (inFrontmatter && line === '---') {
            inFrontmatter = false;
            currentCardLines.push(originalLine);
            continue;
        }

        if (!inFrontmatter && line === '---') {
            const cardMarkdown = currentCardLines.join('\n').trim();
            if (cardMarkdown) {
                cards.push({
                    id: `card-${cardIndex}`,
                    markdown: cardMarkdown,
                    html: '',
                    index: cardIndex
                });
                cardIndex += 1;
            }
            currentCardLines = [];
            continue;
        }

        currentCardLines.push(originalLine);
    }

    const cardMarkdown = currentCardLines.join('\n').trim();
    if (cardMarkdown) {
        cards.push({
            id: `card-${cardIndex}`,
            markdown: cardMarkdown,
            html: '',
            index: cardIndex
        });
    }

    return cards;
}
