# Material Sync

TypeScript-based scripts for synchronizing teaching materials and documentation versions.

## Scripts

- `sync` - Sync materials according to `material.config.yaml`
- `add` - Add new material to `material.config.yaml`
- `remove` - Remove material from `material.config.yaml`
- `cleanup` - Cleanup all versioned docs - enhances dev performance.

## Scripts for `package.json`

You can add some convenience scripts to your `package.json` for easier usage:

```json
{
    "scripts": {
        "sync": "yarn workspace @tdev/material-sync sync",
        "remove": "yarn workspace @tdev/material-sync run remove",
        "postremove": "yarn workspace @tdev/material-sync sync",
        "precleanup": "yarn workspace @tdev/material-sync restore",
        "cleanup": "yarn workspace @tdev/material-sync cleanup",
        "addClass": "yarn workspace @tdev/material-sync run addClass",
        "add": "yarn workspace @tdev/material-sync run add",
        "postadd": "yarn workspace @tdev/material-sync sync"
    }
}
```

Make sure to sync the documents before a build - this can happen either in your CI/CD pipeline or in a prebuild script. For example, you can add the following to your `package.json`:

```json
{
    "scripts": {
        "prebuild": "yarn workspace @tdev/material-sync sync"        
    }
}
```

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
