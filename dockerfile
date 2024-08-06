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
EXPOSE 3600

# Modify environment variables
RUN sed -i "s|MONGO_URI=.*|MONGO_URI=mongodb://root:root@51.178.169.193:27017/myKrew?authSource=admin|g" .env


# Rebuild bcrypt
RUN npm rebuild bcrypt --build-from-source


# Start the Express.js app when the container launches
CMD ["node", "server.js"]