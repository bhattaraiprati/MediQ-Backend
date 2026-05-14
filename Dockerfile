FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better Docker cache layer)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build TypeScript
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
