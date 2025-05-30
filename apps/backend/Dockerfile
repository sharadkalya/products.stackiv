# Use official Node LTS image
FROM node:18

# Create app directory inside container
WORKDIR /usr/src/app/backend

# Copy package.json and yarn.lock first (for caching)
COPY package.json yarn.lock ./

# Install dependencies (including dev dependencies)
RUN yarn install --frozen-lockfile

# Copy the rest of the app source code
COPY . .

# Expose port 5001
EXPOSE 5001

# Run the backend server with yarn dev
CMD ["yarn", "dev"]
