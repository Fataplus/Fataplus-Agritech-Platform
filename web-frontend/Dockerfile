# Web Frontend Dockerfile - Development Version
FROM node:18-alpine

# Install libc6-compat for Next.js
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies for build
RUN npm install --include=dev

# Explicitly install autoprefixer to ensure it's available
RUN npm install autoprefixer

# Copy source code
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
