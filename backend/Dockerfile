FROM golang:1-alpine3.24 AS build
WORKDIR /src

COPY go.mod ./
COPY . .
RUN go build -o /out/ps ./cmd/api

FROM alpine:3.24
WORKDIR /app
RUN adduser -D -g '' appuser
COPY --from=build /out/ps /app/ps
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app
USER appuser
EXPOSE 8080
ENTRYPOINT ["/app/ps"]
