const fs = require('fs');

// Load the outdated packages JSON file
const outdatedPackages = JSON.parse(fs.readFileSync('outdated-packages.json', 'utf8'));

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

// Generate markdown table
let markdownTable = '| Package Name | Current Version | Latest Version |\n';
markdownTable += '|--------------|-----------------|----------------|\n';
nonPreReleasePackages.forEach(pkg => {
  markdownTable += `| **\`${pkg.name}\`** | \`${pkg.current}\` | **\`${pkg.latest}\`** |\n`;
});

// Create the message with the markdown table
const message = `## ⚠️ Dependency Update Warning 
Some dependencies needs update:

${markdownTable}

#### 🚀 Quick Update Guide
<details>
<summary>view</summary>
  We've prepared an automated update script for you:

  1. First, stash any existing changes to your package.json:
  \`\`\`bash
  git stash push package.json
  \`\`\`

  2. Copy these package definitions to your update-packages.sh:
  \`\`\`bash
  packages_and_versions=(
    ${nonPreReleasePackages.map(pkg => `"${pkg.name} ${pkg.latest}"`).join('\n    ')}
  )
  \`\`\`
  3. Run the update script:
  \`\`\`bash
  bash update-packages.sh
  \`\`\`
  as a result, a list of commits will be created containing updates for each package

</details>
`;

// Write the result to a markdown file (or you can use this message for your GitHub comment)
fs.writeFileSync('outdated-packages-report.md', message);

console.log('Markdown report has been generated in outdated-packages-report.md');
