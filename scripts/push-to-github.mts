#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

async function getGitHubClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("GitHub not connected");
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
  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error("GitHub access token not found");
  }

  return new Octokit({ auth: accessToken });
}

function shouldIgnore(path: string): boolean {
  const ignorePatterns = [
    /node_modules/,
    /\.git/,
    /^dist\//,
    /^build\//,
    /\.env$/,
    /\.env\./,
    /\.DS_Store/,
    /\.replit$/,
    /replit\.nix$/,
  ];

  return ignorePatterns.some((pattern) => pattern.test(path));
}

function getAllFiles(dirPath: string, baseDir: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dirPath);

  for (const item of items) {
    const fullPath = join(dirPath, item);
    const relativePath = relative(baseDir, fullPath);

    if (shouldIgnore(relativePath)) {
      continue;
    }

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function createGitTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  files: string[],
  baseDir: string
) {
  console.log("🌳 Creating git tree...");

  const tree = await Promise.all(
    files.map(async (filePath) => {
      const relativePath = relative(baseDir, filePath);
      const content = readFileSync(filePath);

      // Create blob
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: content.toString("base64"),
        encoding: "base64",
      });

      return {
        path: relativePath,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  const { data: treeData } = await octokit.git.createTree({
    owner,
    repo,
    tree,
  });

  return treeData.sha;
}

async function main() {
  console.log("\n🚀 Deploying to GitHub via Git Data API...\n");

  const octokit = await getGitHubClient();
  const owner = "unixfun99";
  const repo = "financial-budget-app";
  const baseDir = process.cwd();
  const branch = "main";

  // Get current user
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}`);

  // Collect files
  console.log("\n📦 Collecting files...");
  const files = getAllFiles(baseDir, baseDir);
  console.log(`✅ Found ${files.length} files to deploy`);

  // Create blobs and tree (in batches to avoid rate limits)
  console.log("\n🔨 Creating git objects...");
  const batchSize = 50;
  const allTreeEntries = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(`  Processing files ${i + 1}-${Math.min(i + batchSize, files.length)}...`);

    const batchEntries = await Promise.all(
      batch.map(async (filePath) => {
        const relativePath = relative(baseDir, filePath);
        const content = readFileSync(filePath);

        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: content.toString("base64"),
          encoding: "base64",
        });

        return {
          path: relativePath,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        };
      })
    );

    allTreeEntries.push(...batchEntries);
  }

  // Create tree
  console.log("\n🌳 Creating git tree...");
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: allTreeEntries,
  });

  // Get current commit SHA (if branch exists)
  let parentSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    parentSha = ref.object.sha;
    console.log(`✅ Found existing branch: ${branch}`);
  } catch (e) {
    console.log(`ℹ️  Creating new branch: ${branch}`);
  }

  // Create commit
  console.log("\n💾 Creating commit...");
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: "Deploy financial budgeting application",
    tree: tree.sha,
    parents: parentSha ? [parentSha] : [],
  });

  // Update reference
  console.log("📌 Updating branch reference...");
  if (parentSha) {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
      force: true,
    });
  } else {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: commit.sha,
    });
  }

  console.log("\n✅ Deployment successful!\n");
  console.log(`📍 Repository: https://github.com/${owner}/${repo}`);
  console.log(`🔗 Commit: ${commit.sha.substring(0, 7)}`);
  console.log(`\nNext steps:`);
  console.log(`1. Visit https://github.com/${owner}/${repo}`);
  console.log(`2. Follow DEPLOYMENT_ROCKY_LINUX.md for production deployment`);
  console.log(`3. Or use DEPLOYMENT_DOCKER.md for Docker deployment`);
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error.message);
  process.exit(1);
});
