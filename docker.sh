#!/bin/bash

# Check if port and service name are provided as arguments
# Check if port and service name are provided as arguments
if [ $# -ne 3 ]; then
    echo "Usage: $0 <PORT> <SERVICE_NAME> <MONGO_URI>"
    exit 1
fi

port=$1
service_name=$2
mongo_uri=$3

cat << EOF > docker-compose.yml
version: "3.2"
services:
  $service_name:
    build: .
    ports:
      - "$port:$port"
EOF

echo "docker-compose.yml file has been generated successfully!"

# Generate Dockerfile
cat << EOF > dockerfile
# Use the official Node.js 14 image as a base
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port on which your Express.js app will run (this is just informative)
EXPOSE $port

# Modify environment variables
RUN sed -i "s|PORT=.*|PORT=$port|g" .env
RUN sed -i "s|MONGO_URI=.*|MONGO_URI=$mongo_uri|g" .env

# Start the Express.js app when the container launches
CMD ["node", "app.js"]
EOF

echo "Dockerfile has been generated successfully!"
docker-compose build
docker-compose start