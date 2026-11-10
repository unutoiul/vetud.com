# Self-hosting fallback for the storefront (any VPS or container host).
# Vercel deployments do not use this file.
#
#   docker build \
#     --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.example.com \
#     --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... \
#     --build-arg NEXT_PUBLIC_BASE_URL=https://www.example.com \
#     -t vetud-storefront .
#   docker run -p 8000:8000 vetud-storefront

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_COUNTRY=us
ARG NEXT_PUBLIC_PAYMENT_BANK_DETAILS=
ENV NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_COUNTRY=$NEXT_PUBLIC_DEFAULT_COUNTRY \
    NEXT_PUBLIC_PAYMENT_BANK_DETAILS=$NEXT_PUBLIC_PAYMENT_BANK_DETAILS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 8000
CMD ["node", "server.js"]
