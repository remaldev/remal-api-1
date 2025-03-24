#!/bin/bash

# Copyright 2025 Abdellah Allali <hi@allali.me>

outdated=$(npm outdated --json)

if [ -z "$outdated" ]; then
    echo "No outdated packages found."
    exit 0
fi

LOCK_FILE="package-lock.json" # "package-lock.json" or "yarn.lock" or "pnpm-lock.yaml"
NPM="npm" # "npm" or "yarn" or "pnpm"

for package in $(echo "$outdated" | jq -r 'keys[]'); do
    version=$(echo "$outdated" | jq -r ".\"$package\".latest")

    # Skip prerelease versions (containing a hyphen) (e.g. "2.1.0-alpha", "2.1.0-beta", "2.1.0-rc.1")
    if [[ "$version" == *"-"* ]]; then
        echo "Skipping $package@$version as it appears to be a prerelease version"
        continue
    fi

    echo "Updating $package to version $version..."
    $NPM install "$package@$version"

    git add package.json $LOCK_FILE
    git commit -m "[UPGRADE](deps) Update \`$package\` to \`$version\`"

    if [ $? -ne 0 ]; then
        echo "Error occurred while commiting $package_name. Aborting."
        exit 1
    fi

    npm run test
    if [ $? -ne 0 ]; then
        echo "Tests failed after updating $package_name. Aborting."
        git reset --hard HEAD~1 # Rollback the last commit
        exit 1
    fi
done

echo "All outdated packages have been updated and committed."
