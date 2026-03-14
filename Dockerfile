# Stage 1: Build the Vite application
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the monorepo configuration and lockfile
COPY package*.json ./

# Copy package.json for workspaces to properly install dependencies
COPY apps/client-tma/package*.json ./apps/client-tma/
COPY apps/staff-tma/package*.json ./apps/staff-tma/
COPY packages/shared/package*.json ./packages/shared/

# Install exact dependencies from package-lock.json
RUN npm ci

# Copy the rest of the monorepo source code
COPY . .

# Accept the target application name as a build argument
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Build the specified workspace application
RUN npm run build --workspace=${APP_NAME}

# Stage 2: Serve the built application using Nginx
FROM nginx:alpine

# Re-declare the ARG in this stage to use it in paths
ARG APP_NAME

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output from the builder stage to Nginx directory
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html

# Expose port 80 for the Nginx server
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]