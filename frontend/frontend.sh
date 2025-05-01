#!/bin/bash

# Define the frontend folder and output file
FRONTEND_FOLDER="."
OUTPUT_FILE="frontend.txt"

# Clear the output file before starting
> "$OUTPUT_FILE"

# Function to print the directory structure (excluding unwanted folders)
print_tree() {
    # Exclude the following directories and files
    tree "$1" --dirsfirst -I '.next|node_modules|public|.git|.gitignore|.env.local|.DS_Store|pnpm-lock.yaml|README.md' --noreport --charset ascii >> "$OUTPUT_FILE"
}

# Function to append contents of files (excluding unwanted files and directories)
append_files() {
    # Use find to locate all files excluding specific files and directories
    find "$1" -type f \
    ! -name "frontend.sh" \
    ! -name "frontend.txt" \
    ! -name ".DS_Store" \
    ! -name ".env.local" \
    ! -name ".gitignore" \
    ! -name "pnpm-lock.yaml" \
    ! -name "README.md" \
    ! -path "$1/.next/*" \
    ! -path "$1/node_modules/*" \
    ! -path "$1/public/*" \
    ! -path "$1/.git/*" \
    ! -path "$1/.gitignore" \
    ! -path "$1/src/app/favicon.ico" | while read file; do
        # Only append files that aren't in excluded directories
        echo -e "\n\n### Contents of: $file ###" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
    done
}

# 1. Print the directory structure to the output file
echo "Directory Structure of Frontend:" >> "$OUTPUT_FILE"
print_tree "$FRONTEND_FOLDER"

# 2. Append the contents of all files to the output file
echo -e "\n\n### Code Contents ###" >> "$OUTPUT_FILE"
append_files "$FRONTEND_FOLDER"

# Confirmation message
echo "frontend.txt has been created successfully." 