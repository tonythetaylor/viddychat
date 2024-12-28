# Use the official Node.js 16 image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 5000
EXPOSE 5005

# Set environment variables
ENV PORT=5005

# Generate Prisma client and start the server
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start"]