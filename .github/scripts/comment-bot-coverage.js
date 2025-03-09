const fs = require('fs');

// Load coverage data from the coverage-final.json file
const coverageData = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8')).total;

// Define the threshold for the coverage percentage
const COVERAGE_THRESHOLD = 85;

// Function to format coverage and apply color rules
function formatCoverage(value) {
  if (value < COVERAGE_THRESHOLD) {
    return `🔴 **${value}%**`;
  } else {
    return `🟢 ${value}%`;
  }
}

// Function to generate the markdown comment
function generateCoverageComment(coverageData) {
  // Extract the percentage values for each coverage type
  const linesCoverage = coverageData.lines.pct;
  const statementsCoverage = coverageData.statements.pct;
  const functionsCoverage = coverageData.functions.pct;
  const branchesCoverage = coverageData.branches.pct;

  // Calculate average coverage
  const averageCoverage = Math.round(
    (linesCoverage + statementsCoverage + functionsCoverage + branchesCoverage) / 4
  );

  // Check if any of the coverage values are below the threshold
  const coverageBelowThreshold =
    linesCoverage < COVERAGE_THRESHOLD ||
    statementsCoverage < COVERAGE_THRESHOLD ||
    functionsCoverage < COVERAGE_THRESHOLD ||
    branchesCoverage < COVERAGE_THRESHOLD;
  let message = ``
  if (coverageBelowThreshold) {
    message += `### 🚨 Test Coverage Below 85% 🚨\n\n`
    message += `The current test coverage does not meet the required 85% threshold. Please improve the following coverage metrics:\n\n`;
  } else {
    message += `### ✅ Test Coverage Meets Requirements ✅\n\n`
    message += `All test coverage metrics are above the 85% threshold.\n`;
  }

  message += `| Coverage Type | Current Coverage |\n`;
  message += `| -------------- | ---------------- |\n`;
  message += `| Lines      | ${formatCoverage(linesCoverage)} |\n`;
  message += `| Statements | ${formatCoverage(statementsCoverage)} |\n`;
  message += `| Functions  | ${formatCoverage(functionsCoverage)} |\n`;
  message += `| Branches   | ${formatCoverage(branchesCoverage)} |\n`;
  message += '||\n';
  message += `|**Average**| **${formatCoverage(averageCoverage)}** |`


  return message;
}

// Generate the comment
const commentMessage = generateCoverageComment(coverageData);

// Output the message (this can be posted to GitHub via a bot or saved to a file)
fs.writeFileSync('coverage-comment.md', commentMessage);
console.log('Coverage report has been generated in coverage-comment.md');
