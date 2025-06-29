# Use official lightweight Node image
FROM node:18-alpine

# Set working directory in the container
WORKDIR /app

# Copy dependency files first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Build the app
RUN npm run build

# Install serve to serve build
RUN npm install -g serve

# Start app
CMD ["serve", "-s", "dist", "-l", "3000"]
