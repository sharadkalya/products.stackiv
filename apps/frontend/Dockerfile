# Use official Node LTS image
FROM node:18

# Create app directory inside container
WORKDIR /usr/src/app/frontend

# Copy package.json and yarn.lock first
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy rest of the app source code
COPY . .

# Expose port (match docker-compose)
EXPOSE 3001

# Run the Next.js dev server (or build/start in prod)
CMD ["yarn", "dev", "-p", "3001"]
