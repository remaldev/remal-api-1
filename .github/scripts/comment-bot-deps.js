const fs = require('fs');
const { execSync } = require('child_process');

// Run npm outdated to get real-time data of outdated packages
let outdatedPackages;
try {
  const outdatedJson = execSync('npm outdated --json', { encoding: 'utf8' });
  outdatedPackages = JSON.parse(outdatedJson);
} catch (error) {
  // npm outdated returns exit code 1 when there are outdated packages
  // We need to extract the JSON output from the error
  if (error.stdout) {
    try {
      outdatedPackages = JSON.parse(error.stdout);
    } catch (e) {
      console.error('Failed to parse npm outdated output:', e);
      process.exit(1);
    }
  } else {
    console.error('Failed to run npm outdated:', error);
    process.exit(1);
  }
}

// Regular expression to detect pre-release versions (e.g., -alpha, -beta, -rc, etc.)
const preReleaseRegex = /-(alpha|beta|rc|dev|canary|insider|experimental)/i;

// Filter out packages with pre-release versions
const nonPreReleasePackages = Object.entries(outdatedPackages)
  .filter(([packageName, packageInfo]) => !preReleaseRegex.test(packageInfo.latest))
  .map(([packageName, packageInfo]) => ({
    name: packageName,
    current: packageInfo.current,
    latest: packageInfo.latest
  }));

if (nonPreReleasePackages.length === 0) {
  console.log('No outdated packages found (excluding pre-release versions).');
  process.exit(0);
}

// Generate markdown table
let markdownTable = '| Package Name | Current Version | Latest Version |\n';
markdownTable += '|--------------|-----------------|----------------|\n';
nonPreReleasePackages.forEach(pkg => {
  markdownTable += `| **\`${pkg.name}\`** | \`${pkg.current}\` | **\`${pkg.latest}\`** |\n`;
});

// Create the message with the markdown table
const message = `## ⚠️ Dependency Update Warning 
The following dependencies need updates:

${markdownTable}

#### 🚀 Quick Update Guide

Simply run the update script to automatically update all packages:
\`\`\`bash
bash update-packages.sh
\`\`\`

This will create a series of commits, each containing updates for individual packages, and run tests after each update.

> Note: The script will handle everything automatically without needing to copy/paste any package information.
`;

// Write the result to a markdown file (or you can use this message for your GitHub comment)
fs.writeFileSync('outdated-packages-report.md', message);

console.log('Markdown report has been generated in outdated-packages-report.md');
