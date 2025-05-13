FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy everything into the container
COPY . .

# Install dependencies
RUN npm install

# Default command (override with `docker run`)
CMD ["npm", "run", "start"]
