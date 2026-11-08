FROM node:22-slim

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install production and build dependencies
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite frontend bundle
RUN npm run build

# Expose server port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start Express fullstack server
CMD ["npm", "run", "start"]
