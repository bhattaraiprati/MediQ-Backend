import axios from "axios";
import { Document } from "../models/Document";
import fs from 'node:fs/promises';
import { documentStatus } from "../types/Enum";
import { embedAndStoreDocument } from "./embeddingService";


export const textProcessDocument = async (documentId: string) => {

    const doc = await Document.findOne({ where: { id: documentId } });

    if (!doc) {
        console.log("Document not found");
        return;
    }
    try {

        const response = await axios.get(doc.cloudinary_url, {
            responseType: 'arraybuffer',
        });

        const dataBuffer = Buffer.from(response.data);

        const textContent = await fs.readFile(dataBuffer, 'utf-8');

        if (!textContent || textContent.trim().length === 0) {
            throw new Error('PDF text extraction returned empty content. The file may be scanned/image-based.');
        }
        console.log(`Extracted ${textContent.length} characters from document: ${doc.original_name}`);

        await embedAndStoreDocument(textContent, documentId);

        await Document.update(
            { processing_status: documentStatus.COMPLETED },
            { where: { id: documentId } }
        );

        console.log(`Document ${doc.original_name} fully processed and stored`);


    }
    catch (error: any) {
        console.error("Error processing document:", error);
        await Document.update(
            { processing_status: documentStatus.FAILED },
            { where: { id: documentId } }
        );
        throw error;

    }
}