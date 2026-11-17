# Public info site for the OAuth consent screen: home, privacy, terms.
# Deployed separately from the tracker, WITHOUT sign-in:
#   gcloud run deploy kse-docs-info --source legal --region europe-central2 --allow-unauthenticated
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html privacy.html terms.html style.css /usr/share/nginx/html/
