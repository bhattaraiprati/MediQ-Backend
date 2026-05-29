import sequelize from "../config/db";
import { Document } from "../models/Document";


export class DocumentRepository {
  async getEachDoucumentCount(file_type: string): Promise<number> {
    const count = await Document.count({
      where: {
        file_type
      }
    });

    return count;
  }
}

export const documentrepository = new DocumentRepository();