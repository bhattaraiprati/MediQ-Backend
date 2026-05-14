import { Request, Response } from "express";
import { User } from "../models/User";

import bcrypt from "bcryptjs";
import { SignUpData } from "../types/interface";
import { generateToken } from "../config/Auth";

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

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully' });
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

export { handleUserSignup, handleUserLogin };

