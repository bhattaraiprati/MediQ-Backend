export interface SignUpData {
    name: string;
    email: string;
    password: string;
}

export interface ChatRoomRequest {
    chatId?:number,
    query: string
}

export interface ChatResponse {
    answer: string;
    chat_id: string;
    sources: Array<{
        chunk_index: number;
        score: number;
        text_snippet: string;
    }>;
}