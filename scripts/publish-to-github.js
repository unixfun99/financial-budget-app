#!/usr/bin/env node

/**
 * GitHub Publishing Script
 * Initializes git repository and pushes code to GitHub
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO_NAME = "financial-budget-app";
const BRANCH = "main";

function log(message) {
  console.log(`\n📦 ${message}`);
}

function error(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function runCommand(command, description) {
  try {
    log(description || command);
    const output = execSync(command, { encoding: "utf-8", stdio: "pipe" });
    return output.trim();
  } catch (err) {
    error(`Failed to run: ${command}\n${err.message}`);
  }
}

function main() {
  const cwd = process.cwd();
  log("Starting GitHub publication process...");

  // Check if git is initialized
  if (!fs.existsSync(path.join(cwd, ".git"))) {
    log("Initializing git repository...");
    runCommand("git init", "Git repository initialized");
  }

  // Check git status
  log("Checking git status...");
  try {
    runCommand("git status", "Git status check");
  } catch (err) {
    error("Git repository not properly initialized");
  }

  // Configure git
  log("Configuring git...");
  try {
    runCommand('git config user.email "replit-agent@replit.com"', "");
    runCommand('git config user.name "Replit Agent"', "");
  } catch (err) {
    // Ignore config errors
  }

  // Check for existing remote
  try {
    const remotes = runCommand("git remote", "Checking existing remotes");
    if (remotes.includes("origin")) {
      log("Git remote 'origin' already exists");
      const remoteUrl = runCommand(
        "git remote get-url origin",
        "Getting origin URL"
      );
      console.log(`  Remote URL: ${remoteUrl}`);
    }
  } catch (err) {
    // No remotes yet
  }

  // Add all files
  log("Adding all files to git...");
  runCommand("git add .", "Files staged");

  // Check if there are changes to commit
  try {
    const status = runCommand("git status --porcelain", "");
    if (!status) {
      log("No changes to commit");
      return;
    }
  } catch (err) {
    // Continue anyway
  }

  // Create initial commit if needed
  try {
    runCommand("git commit -m 'Initial commit: Financial budgeting application'", "");
  } catch (err) {
    // Commit might fail if nothing changed
    log("No new changes to commit");
  }

  // Create or verify main branch
  try {
    const currentBranch = runCommand("git rev-parse --abbrev-ref HEAD", "");
    if (currentBranch !== BRANCH) {
      runCommand(`git branch -M ${BRANCH}`, `Renamed branch to ${BRANCH}`);
    }
  } catch (err) {
    runCommand(`git checkout -b ${BRANCH}`, `Created ${BRANCH} branch`);
  }

  // Instructions for setting remote
  log("✅ Git repository is ready!");
  console.log(`
Next steps:

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Repository name: ${REPO_NAME}
   - Description: Full-featured envelope budgeting application
   - Choose visibility (Public/Private)
   - Click "Create repository"

2. Add the GitHub remote:
   git remote add origin https://github.com/YOUR_USERNAME/${REPO_NAME}.git

3. Push to GitHub:
   git branch -M main
   git push -u origin main

For detailed setup instructions, see: GITHUB_DEPLOYMENT.md
  `);
}

main();
