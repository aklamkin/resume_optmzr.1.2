FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

# Build argument for backend URL
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

# Build the application
RUN yarn build

# Expose port
EXPOSE 3000

# Install serve to run the production build
RUN yarn global add serve

# Serve the production build
CMD ["serve", "-s", "build", "-l", "3000"]
