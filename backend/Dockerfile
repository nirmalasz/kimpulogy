# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install build tools if needed
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server

# Final stage
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/server .

ENV PORT=8080
ENV DB_PATH=/data/larisin.db

# Persistent storage volume for SQLite
VOLUME ["/data"]

EXPOSE 8080

CMD ["./server"]
