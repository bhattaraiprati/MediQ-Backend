import axios from "axios";
import { Document } from "../models/Document";
import { documentStatus } from "../types/Enum";
import { PDFParse } from 'pdf-parse';
import { embedAndStoreDocument } from './embeddingService';

/**
 * Main pipeline function: finds a pending document by ID,
 * downloads it from Cloudinary, extracts text, and triggers embedding.
 */
export async function processDocument(documentId: string): Promise<void> {
    // 1. Find the document in the database
    const doc = await Document.findOne({
        where: {
            id: documentId,
            processing_status: documentStatus.PENDING
        }
    });

    if (!doc) {
        console.log("Document not found or not in pending state");
        return;
    }

    try {
        // 2. Download the PDF from Cloudinary as a raw binary buffer
        const response = await axios.get(doc.cloudinary_url, {
            responseType: 'arraybuffer'
        });

        const dataBuffer = Buffer.from(response.data);

        // 3. Parse the PDF and extract plain text
        const parser = new PDFParse({ data: dataBuffer });
        const textResult = await parser.getText();
        const extractedText = textResult.text;

        console.log(`Extracted ${extractedText.length} characters from PDF`);

        // 4. Chunk, embed via Ollama, and store in Pinecone + DB
        await embedAndStoreDocument(extractedText, documentId);

    } catch (error) {
        console.error("Error processing document:", error);
        // Mark document as failed so it can be retried or investigated
        await Document.update(
            { processing_status: documentStatus.FAILED },
            { where: { id: documentId } }
        );
        throw error;
    }
}
