FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fataplus -u 1001

# Change ownership of the app directory
RUN chown -R fataplus:nodejs /app
USER fataplus

# Expose port (if needed for health checks)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('MCP Server is running')"

# Start the MCP server
CMD ["npm", "start"]
