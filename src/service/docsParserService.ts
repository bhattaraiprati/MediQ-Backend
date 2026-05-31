import axios from "axios";
import { Document } from "../models/Document";
import { documentStatus } from "../types/Enum";
import mammoth from "mammoth";
import { embedAndStoreDocument } from "./embeddingService";


export const docsProcessDocument = async (documentId: string) => { 
  const doc = await Document.findOne({ where: { id: documentId } }); 
  
  if (!doc) { 
    console.log("Document not found"); 
    return; 
  } 

  try{
    const response = await axios.get(doc.cloudinary_url, {
            responseType: 'arraybuffer',
        });

        const dataBuffer = Buffer.from(response.data);
    
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        const text = result.value; 

        if (!text || text.trim().length === 0) {
            throw new Error('PDF text extraction returned empty content. The file may be scanned/image-based.');
        }
        console.log(`Extracted ${text.length} characters from document: ${doc.original_name}`);

        await embedAndStoreDocument(text, documentId);

        await Document.update(
            { processing_status: documentStatus.COMPLETED },
            { where: { id: documentId } }
        );
        
        console.log(`Document ${doc.original_name} fully processed and stored`);


  }
  catch(error:any){
    console.error("Error processing document:", error);
            await Document.update(
                { processing_status: documentStatus.FAILED },
                { where: { id: documentId } }
            );
    throw error;

  }
};