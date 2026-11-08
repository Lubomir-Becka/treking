FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/placeholder
RUN npm run build
ENV NODE_ENV=production
ENV PRODUCT_IMAGE_DIRECTORY=/var/lib/outdoor-eshop/product-images
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0"]
