# Mobile App Dockerfile for CI/CD
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    openjdk17-jre \
    android-tools \
    && rm -rf /var/lib/apt/lists/*

# Set Android SDK environment variables
ENV ANDROID_HOME /opt/android-sdk
ENV PATH $PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Install Android SDK
RUN mkdir -p $ANDROID_HOME/cmdline-tools \
  && cd $ANDROID_HOME/cmdline-tools \
  && curl -o sdk.zip https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip \
  && unzip sdk.zip \
  && mv cmdline-tools latest \
  && rm sdk.zip

# Accept Android SDK licenses
RUN yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

# Install Android SDK components
RUN $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0" \
  "system-images;android-34;google_apis;x86_64"

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy source code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser:appuser /app
USER appuser

# Default command for CI
CMD ["npm", "run", "test:unit"]
