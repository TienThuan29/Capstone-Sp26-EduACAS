ARG CONFIG=default
FROM nginx:alpine

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy configuration based on build arg
# Default: production config with SSL
# Local: local config without SSL
COPY conf.d/${CONFIG}.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
