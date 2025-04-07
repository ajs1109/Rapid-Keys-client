# Install dependencies
FROM node:22.12.0

# Create app directory
WORKDIR /src

# Copy files
COPY package*.json ./
RUN npm install
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 8080

# Start server
CMD ["npm", "run", "plswork"]
