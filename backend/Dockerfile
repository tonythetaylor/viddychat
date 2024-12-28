# Use the official Node.js image as the base image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Build the application (if necessary)
RUN npm run build

# Expose the port the app will run on
EXPOSE 5005

# Command to run the backend server
CMD ["npm", "start"]