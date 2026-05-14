import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/Auth";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authorization token missing or malformed" });
        return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
    }

    req.user = decoded as { id: string; email: string; role: string };
    next();
}