import nlp from 'compromise';

export function chunkText(text: string): string[] {
    const doc = nlp(text);
    return doc.sentences().out('array');
}
