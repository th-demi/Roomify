#!/bin/bash

# Define the backend folder and output file
BACKEND_FOLDER="."
OUTPUT_FILE="backend.txt"

# Clear the output file before starting (this will prevent any repeated content from previous runs)
> "$OUTPUT_FILE"

# Function to print the directory structure (excluding unwanted folders)
print_tree() {
    # Exclude the following directories and files
    tree "$1" --dirsfirst -I '__pycache__|migrations|.git|.gitignore|.env|venv' --noreport --charset ascii >> "$OUTPUT_FILE"
}

# Function to append contents of files (excluding unwanted files and directories)
append_files() {
    # Use find to locate all files excluding specific files and directories
    find "$1" -type f \
    ! -name "backend_code.sh" \
    ! -name "backend.txt" \
    ! -name ".DS_Store" \
    ! -name ".env" \
    ! -name ".gitignore" \
    ! -path "$1/__pycache__/*" \
    ! -path "$1/migrations/*" \
    ! -path "$1/venv/*" \
    ! -path "$1/.git/*" \
    ! -path "$1/.gitignore" \
    ! -name "*.pyc" | while read file; do
        # Only append files that aren't in excluded directories
        echo -e "\n\n### Contents of: $file ###" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
    done
}

# 1. Print the directory structure to the output file
echo "Directory Structure of Backend:" >> "$OUTPUT_FILE"
print_tree "$BACKEND_FOLDER"

# 2. Append the contents of all files to the output file
echo -e "\n\n### Code Contents ###" >> "$OUTPUT_FILE"
append_files "$BACKEND_FOLDER"

# Confirmation message
echo "backend.txt has been created successfully."
