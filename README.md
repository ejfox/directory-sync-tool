# Directory Sync Tool

A command-line interface tool for comparing and synchronizing directories.

## Purpose

This tool is designed to help you maintain consistency between two directories, particularly useful when you have a source of truth (like a content management system) and a target directory (like a published website) that needs to stay in sync.

## Use Cases

1. **Blog Management**: Sync your local markdown files with your published blog posts.
2. **Website Deployment**: Ensure your production site matches your development environment.
3. **Content Synchronization**: Keep multiple content directories in sync across different platforms or devices.
4. **Backup Verification**: Compare a backup directory with its source to ensure all files are accounted for.

## When to Use

- Before deploying website updates
- After bulk content creation or deletion
- During content migration between systems
- As part of a regular maintenance routine for your digital content

## Installation

```bash
npm install -g directory-sync-tool
```

## Usage

Run the tool:

```bash
dstool
```

The tool will prompt you to select a source and target directory. It then identifies files present in the target but not in the source, allowing you to delete or ignore these discrepancies.

## Key Features

- Interactive directory selection
- File comparison between source and target
- Options to delete or ignore files
- Customizable default paths via environment variables

## Controls

- Arrow keys: Navigate
- Enter: Select
- 'd': Delete file from target
- 'i': Ignore file
- 'q': Quit
- 'e': Easter egg (because even serious tools can have a bit of fun)

## Configuration

Set default paths in your environment or .env file:

```
SOURCE_PATH=/path/to/your/source
TARGET_PATH=/path/to/your/target
```

## Why It's Useful

- Saves time by automating file comparisons
- Reduces human error in manual file management
- Provides a clear interface for decision-making about file discrepancies
- Helps maintain data integrity across multiple locations

## Best Practices

- Always verify your source and target directories before making changes
- Use the tool as part of a broader backup and synchronization strategy
- Regularly check for updates to ensure you have the latest features and security patches

## Contributing

Found a bug or have a feature request? Open an issue or submit a pull request on our GitHub repository.