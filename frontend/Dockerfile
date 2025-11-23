# ---------- Stage 1: Build the React app ----------
FROM node:18-alpine AS build

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app
COPY . .

# Build the app (creates a production build in /app/dist)
RUN npm run build

# ---------- Stage 2: Serve the built files ----------
FROM nginx:alpine

# Copy build output from Stage 1 to NGINX html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 5173 (your vite app runs on this during dev,
# but nginx serves it on port 80 inside container)
EXPOSE 80

# Start nginx automatically when container runs
CMD ["nginx", "-g", "daemon off;"]
