import axios from "axios";
import { Document } from "../models/Document";
import { documentStatus } from "../types/Enum";
import { PDFParse } from 'pdf-parse';         // ── FIX: default import, not named import
import { embedAndStoreDocument } from './embeddingService';

export async function processDocument(documentId: string): Promise<void> {
    // 1. Find the document in the database
    const doc = await Document.findOne({ where: { id: documentId } });

    if (!doc) {
        console.log("Document not found or not");
        return;
    }

    try {
        // 2. Download the file from Cloudinary as raw binary
        const response = await axios.get(doc.cloudinary_url, {
            responseType: 'arraybuffer',
        });

        const dataBuffer = Buffer.from(response.data);

        // 3. Extract plain text from the PDF
        // ── FIX: pdfParse is a function, not a class — call it directly
        const parser = new PDFParse({ data: dataBuffer });
        const textResult = await parser.getText();
        const extractedText = textResult.text;

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('PDF text extraction returned empty content. The file may be scanned/image-based.');
        }

        console.log(`Extracted ${extractedText.length} characters from document: ${doc.original_name}`);

        // 4. Chunk → embed via Ollama → store in Pinecone + DB
        await embedAndStoreDocument(extractedText, documentId);

         // Mark complete only after everything succeeds
        await Document.update(
            { processing_status: documentStatus.COMPLETED },
            { where: { id: documentId } }
        );

        console.log(`💾 Document ${doc.original_name} fully processed and stored`);


    } catch (error) {
        console.error("Error processing document:", error);
        await Document.update(
            { processing_status: documentStatus.FAILED },
            { where: { id: documentId } }
        );
        throw error;
    }
}