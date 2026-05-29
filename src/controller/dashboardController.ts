
import { Request, Response } from "express";
import { Document } from "../models/Document";
import { User } from "../models/User";
import { documentStatus, roleEnum } from "../types/Enum";
import { DashboardStats, knowledgeBase } from "../types/interface";
import { documentrepository } from "../repository/documentRepository";


export const getDashboardStats = async (req:Request, res:Response) =>  {

    try {
        const totalDocuments = await Document.count({
            where: { processing_status: documentStatus.COMPLETED }
        });
        const totalUsers = await User.count({
            where: { role: roleEnum.USER, isVerified: true }
        });
        const blockUsers = await User.count({
            where: { role: roleEnum.USER, isVerified: false }
        });

        const stats: DashboardStats = {
            TotalDocument: totalDocuments,
            TotalUsers: totalUsers,
            BlockUser: blockUsers
        };

        return res.status(200).json({
            success: true,
            stats
        });

    }
    catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }

}

export const getknowledgeBase = async (req:Request, res:Response) =>{
    try{
        
        const [pdfCount, wordDocCount, csvDocCount, plainDocCount] = await Promise.all([
            documentrepository.getEachDoucumentCount( "application/pdf"),
            documentrepository.getEachDoucumentCount( "application/msword"),
            documentrepository.getEachDoucumentCount("text/csv"),
            documentrepository.getEachDoucumentCount("text/plain"),
        ]);

        const docsCount : knowledgeBase = {
            pdf: pdfCount,
            word: wordDocCount,
            csv: csvDocCount,
            plain: plainDocCount
            
        }
        return res.status(200).json({
            success: true,
            docsCount
        });

    }
    catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
}