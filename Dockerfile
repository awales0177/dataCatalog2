# Development mode
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY catalog/package*.json ./catalog/

# Install dependencies
WORKDIR /app/catalog
RUN npm install --force

# Copy source code
WORKDIR /app
COPY . .

# Expose port 3000 (React dev server default)
EXPOSE 3000

# Set environment variable to allow external connections
ENV HOST=0.0.0.0

# Start development server
WORKDIR /app/catalog
CMD ["npm", "start"] 