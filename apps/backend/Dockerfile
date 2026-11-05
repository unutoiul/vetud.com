FROM node:22.23.3-bookworm-slim@sha256:3ed98443660ff48413b5af19ecefce3b9d50845a901a43420d47cc63a9fddbe9

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY patches ./patches
RUN npm ci --include=dev --no-audit --no-fund

COPY . .

# Railway supplies these public build settings as Docker build arguments.
ARG MEDUSA_BACKEND_URL
ARG DISABLE_MEDUSA_ADMIN=false

# Include MakePay's Admin extension without passing production encryption keys
# into the image build. This placeholder exists only for this build command;
# the running services use their existing Railway encryption key.
RUN MAKEPAY_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= npm run build

EXPOSE 9000
CMD ["npm", "run", "start:railway"]
