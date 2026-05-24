

export async function getJinaEmbeddings(texts: string[]): Promise<number[][]> {
    const url = process.env.JINA_EMBEDDING_URL || 'https://api.jina.ai/v1/embeddings';
    const apiKey = process.env.JINA_API_KEY;

    if (!apiKey) {
        throw new Error('JINA_API_KEY is not defined in environment variables');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "jina-embeddings-v3",
            task: "text-matching",
            truncate: true,
            input: texts
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Jina API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
}

export async function getJinaEmbedding(text: string): Promise<number[]> {
    const embeddings = await getJinaEmbeddings([text]);
    return embeddings[0];
}
