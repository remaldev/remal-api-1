#!/bin/bash

# List of packages and their versions in "package_name version" format
packages_and_versions=(
    "example 1.2.3"
)

for pkg in "${packages_and_versions[@]}"; do
    # Extract package name and version
    package_name=$(echo $pkg | awk '{print $1}')
    latest_version=$(echo $pkg | awk '{print $2}')

    echo "Updating $package_name to $latest_version..."
    npm install "$package_name@$latest_version"

    # Check if npm install failed (non-zero exit status)
    if [ $? -ne 0 ]; then
        echo "Error occurred while updating $package_name. Aborting."
        exit 1
    fi

    git add package.json package-lock.json
    git commit -m "[UPGRADE](deps) Update \`$package_name\` to \`v$latest_version\`"

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

    echo "$package_name updated and committed successfully."
done

echo "All packages updated and committed successfully!"
