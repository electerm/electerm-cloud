#!/bin/bash

# Script to initialize and run local DynamoDB
# Checks for required dependencies and downloads/runs DynamoDB Local

set -e

DYNAMODB_DIR="$(dirname "$0")"
DYNAMODB_TAR="$DYNAMODB_DIR/dynamodb_local_latest.tar.gz"
DYNAMODB_JAR="$DYNAMODB_DIR/DynamoDBLocal.jar"
DYNAMODB_LIB="$DYNAMODB_DIR/DynamoDBLocal_lib"

# Check for Java
if ! java -version >/dev/null 2>&1; then
    echo "Error: Java is not properly installed or not in PATH."
    echo "Please install Java 8 or later from https://adoptium.net/ or using Homebrew: 'brew install openjdk'"
    exit 1
fi

# Check Java version (optional, but informative)
JAVA_VERSION=$(java -version 2>&1 | head -n 1)
echo "Java found: $JAVA_VERSION"

# Check if DynamoDB Local is already downloaded
if [ ! -f "$DYNAMODB_JAR" ]; then
    echo "DynamoDB Local not found. Downloading..."
    
    # Download the latest DynamoDB Local
    if ! curl -L -o "$DYNAMODB_TAR" "https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz"; then
        echo "Error: Failed to download DynamoDB Local."
        exit 1
    fi
    
    # Extract the archive
    if ! tar -xzf "$DYNAMODB_TAR" -C "$DYNAMODB_DIR"; then
        echo "Error: Failed to extract DynamoDB Local archive."
        exit 1
    fi
    
    # Clean up the tar file
    rm "$DYNAMODB_TAR"
    
    echo "DynamoDB Local downloaded and extracted successfully."
else
    echo "DynamoDB Local is already downloaded."
fi

# Check if DynamoDB Local is already running (on default port 8000)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "DynamoDB Local is already running on port 8000."
else
    echo "Starting DynamoDB Local..."
    
    # Start DynamoDB Local in the background
    java -Djava.library.path="$DYNAMODB_LIB" -jar "$DYNAMODB_JAR" -sharedDb &
    
    # Wait for it to start (DynamoDB Local may take a few seconds)
    echo "Waiting for DynamoDB Local to start..."
    sleep 5
    
    # Verify it's running
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "DynamoDB Local started successfully on port 8000."
    else
        echo "Warning: DynamoDB Local may not have started properly. Check for errors above."
    fi
fi

echo "Local DynamoDB initialization complete."