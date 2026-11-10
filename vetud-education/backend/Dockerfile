FROM node:22.23.3-bookworm-slim@sha256:3ed98443660ff48413b5af19ecefce3b9d50845a901a43420d47cc63a9fddbe9

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

COPY . .

# Railway supplies these public build settings as Docker build arguments.
ARG MEDUSA_BACKEND_URL
ARG DISABLE_MEDUSA_ADMIN=false
# Where the Admin pages link to threads and articles.
ARG STOREFRONT_URL

RUN npm run build

EXPOSE 9000
CMD ["npm", "run", "start:railway"]
