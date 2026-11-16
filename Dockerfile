# One container: the backend API plus the static frontend it serves.
# Built and deployed by `gcloud run deploy --source .` — see backend/README.md.
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force

COPY backend/src backend/src
COPY backend/fixtures backend/fixtures
COPY index.html app.js data.js styles.css kse-logo.svg ./

USER node
CMD ["node", "backend/src/server.js"]
