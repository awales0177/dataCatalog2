FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy everything into the container
COPY . .

# Install dependencies
RUN npm install --force

# Expose port 3000
EXPOSE 3000

# Default command (override with `docker run`)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
