# Material Sync

TypeScript-based scripts for synchronizing teaching materials and documentation versions.

## Scripts

- `sync` - Sync materials according to `material.config.yaml`
- `add` - Add new material to `material.config.yaml`
- `remove` - Remove material from `material.config.yaml`
- `cleanup` - Cleanup all versioned docs - enhances dev performance.

## Configuration

Configuration is defined in `material.config.yaml`. Each class version has a list of source folders to sync with their destination paths and ignore patterns.

## Usage

```bash
# Run from project root
yarn workspace @tdev/material-sync sync

# Or run directly from materialSync folder
cd materialSync
yarn sync
```
