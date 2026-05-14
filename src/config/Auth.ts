
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET;

function generateToken(user: { id: string; email: string; role: string }) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, secretKey, { expiresIn: "1h" });
}

function verifyToken(token: string) {
    try {
        return jwt.verify(token, secretKey);
    } catch (err) {
        return null;
    }
}

export { generateToken, verifyToken };