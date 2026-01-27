#!/bin/bash

# Script to stop local DynamoDB

echo "Stopping DynamoDB Local..."

# Find and kill the DynamoDB Local process
if pgrep -f "DynamoDBLocal.jar" >/dev/null; then
    pkill -f "DynamoDBLocal.jar"
    echo "DynamoDB Local stopped."
else
    echo "DynamoDB Local is not running."
fi