import { Request, Response } from "express";
import { User } from "../models/User";
import crypto from "crypto";
import { roleEnum } from "../types/Enum";

import bcrypt from "bcryptjs";
import { SignUpData } from "../types/interface";
import { generateToken } from "../config/Auth";
import { sendVerificationEmail } from "../service/mailService";

async function handleUserSignup(req: Request, res: Response): Promise<void> {
    try {
        const { name, email, password } = req.body as SignUpData;

        if (!name || !email || !password) {
            res.status(400).json({ message: 'Name, email, and password are required' });
            return;
        }

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            res.status(409).json({ message: 'User already exists' });
            return;
        }
        const userCount = await User.count();
        const role = userCount === 0 ? roleEnum.ADMIN : roleEnum.USER;

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const emailHash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
        const profilePicture = `https://www.gravatar.com/avatar/${emailHash}?d=identicon`;

        await User.create({
            name, 
            email, 
            password: hashedPassword,
            role,
            profilePicture,
            isVerified: false,
            verificationToken
        });
        
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Error during user signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function handleUserLogin(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (!(user as any).isVerified) {
            res.status(403).json({ message: 'Please verify your email before logging in.' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        // res.setHeader('Authorization', `Bearer ${token}`);

        res.status(200).json({token: token, message: 'Login successful' });
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function verifyEmail(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ message: 'Invalid or missing verification token' });
            return;
        }

        const user = await User.findOne({ where: { verificationToken: token } });

        if (!user) {
            res.status(400).json({ message: 'Invalid verification token' });
            return;
        }

        await user.update({
            isVerified: true,
            verificationToken: null
        });

        res.redirect('http://localhost:5173/');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const profile = async (req:Request, res:Response)=>{
    const token = req.body.token;
    
}

export { handleUserSignup, handleUserLogin, verifyEmail, profile
 };

