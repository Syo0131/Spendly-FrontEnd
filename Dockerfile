# Stage 1: Build the Angular application
# Node 22.22.3+ required by @angular/cli@22
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies (using npm ci for consistent installs)
# --legacy-peer-deps: lucide-angular@1.0.0's declared peer range (Angular 13-21)
# lags behind our Angular 22 upgrade; it works fine at runtime regardless.
RUN npm ci --legacy-peer-deps

# Copy the rest of the application source code
COPY . .

# Build the Angular app for production
ARG API_URL
ENV API_URL=$API_URL
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the previous stage
# Note: The build output path depends on angular.json, usually dist/<project-name>/browser
# We assume standard output structure here, but adjust 'spendly-pwa' if needed.
COPY --from=build /app/dist/spendly-pwa/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 4200
EXPOSE 4200

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
