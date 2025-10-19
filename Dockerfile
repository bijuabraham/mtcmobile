# Use official Node.js 20 image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Set environment variables for Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy all server code
COPY server ./server
COPY admin ./admin
COPY templates ./templates

# Expose the port that Cloud Run expects
EXPOSE 8080

# Start the unified server
CMD ["node", "server/unified-server.js"]
