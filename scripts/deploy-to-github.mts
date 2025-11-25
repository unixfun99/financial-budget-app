#!/usr/bin/env node

/**
 * GitHub Deployment Script (ES Module)
 * Pushes code to GitHub using Replit's GitHub integration
 */

import { execSync } from "child_process";

async function getGitHubClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("GitHub not connected - please set up GitHub integration");
  }

  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=github`,
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  );

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings) {
    throw new Error("GitHub connection not found");
  }

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error("GitHub access token not found");
  }

  return { accessToken, hostname };
}

async function getGitHubUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get GitHub user: ${response.statusText}`);
  }

  return response.json();
}

async function createRepository(
  accessToken: string,
  repoName: string,
  description: string
) {
  const response = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
      description,
      private: false,
      auto_init: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.errors?.[0]?.message?.includes("already exists")) {
      console.log(
        `ℹ️  Repository ${repoName} already exists - using existing repository`
      );
      return await getRepository(accessToken, repoName);
    }
    throw new Error(`Failed to create repository: ${error.message}`);
  }

  return response.json();
}

async function getRepository(accessToken: string, repoName: string) {
  const response = await fetch(`https://api.github.com/repos`, {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get repository");
  }

  const repos = await response.json();
  return repos.find((r: any) => r.name === repoName);
}

function runCommand(command: string, description?: string) {
  try {
    if (description) console.log(`\n🔄 ${description}`);
    const output = execSync(command, { encoding: "utf-8", stdio: "pipe" });
    return output.trim();
  } catch (err: any) {
    console.error(`\n❌ Command failed: ${command}`);
    console.error(err.message);
    process.exit(1);
  }
}

async function main() {
  try {
    console.log("\n🚀 Starting GitHub deployment...\n");

    // Get GitHub client
    console.log("🔗 Connecting to GitHub via Replit integration...");
    const { accessToken } = await getGitHubClient();

    // Get user info
    console.log("👤 Fetching GitHub user information...");
    const user = await getGitHubUser(accessToken);
    console.log(`✅ Connected as: ${user.login}`);

    // Repository details
    const REPO_NAME = "financial-budget-app";
    const DESCRIPTION =
      "Full-featured envelope budgeting application with bank syncing and Stripe integration";
    const BRANCH = "main";

    // Create or get repository
    console.log(`\n📦 Setting up repository: ${REPO_NAME}`);
    const repo = await createRepository(accessToken, REPO_NAME, DESCRIPTION);
    console.log(`✅ Repository ready: ${repo.html_url}`);

    // Configure git
    const REMOTE_URL = repo.clone_url;
    console.log(`\n⚙️  Configuring git remote: ${REMOTE_URL}`);

    runCommand(
      'git config user.email "replit-deployment@replit.com"',
      "Setting git email"
    );
    runCommand(
      'git config user.name "Replit Deployment"',
      "Setting git name"
    );

    // Remove existing origin if present
    try {
      runCommand("git remote remove origin", "Removing existing remote");
    } catch (e) {
      // Ignore if remote doesn't exist
    }

    // Add new remote
    runCommand(`git remote add origin "${REMOTE_URL}"`, "Adding git remote");

    // Ensure main branch
    const currentBranch = runCommand("git rev-parse --abbrev-ref HEAD", "");
    if (currentBranch !== BRANCH) {
      runCommand(`git branch -M ${BRANCH}`, `Creating ${BRANCH} branch`);
    }

    // Push to GitHub
    console.log(`\n📤 Pushing code to GitHub (this may take a moment)...`);
    runCommand(
      `git push -u origin ${BRANCH} --force`,
      `Pushing to origin/${BRANCH}`
    );

    console.log("\n✅ Deployment successful!\n");
    console.log(`📍 Repository: ${repo.html_url}`);
    console.log(`📖 View on GitHub: ${repo.html_url}`);
    console.log("\nNext steps:");
    console.log(
      `1. Visit ${repo.html_url} to verify your code is published`
    );
    console.log(
      "2. Read DEPLOYMENT_ROCKY_LINUX.md for production deployment"
    );
    console.log("3. Or use DEPLOYMENT_DOCKER.md for Docker deployment\n");
  } catch (error: any) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    process.exit(1);
  }
}

main();
