#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

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

function getAllFiles(dirPath: string, baseDir: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dirPath);

  for (const item of items) {
    const fullPath = join(dirPath, item);
    const relativePath = relative(baseDir, fullPath);

    // Skip ignored directories and files
    if (
      relativePath.includes("node_modules") ||
      relativePath.includes(".git") ||
      relativePath.includes("dist") ||
      relativePath.startsWith(".env")
    ) {
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

async function main() {
  console.log("\n🚀 Starting GitHub deployment via API...\n");

  const octokit = await getGitHubClient();
  const owner = "unixfun99";
  const repo = "financial-budget-app";
  const baseDir = process.cwd();

  console.log("📦 Collecting files...");
  const files = getAllFiles(baseDir, baseDir);
  console.log(`✅ Found ${files.length} files to upload`);

  console.log("\n📤 Uploading files to GitHub...");

  for (const filePath of files) {
    const relativePath = relative(baseDir, filePath);
    const content = readFileSync(filePath);
    const base64Content = content.toString("base64");

    try {
      // Check if file exists
      let sha: string | undefined;
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: relativePath,
        });
        if ("sha" in data) {
          sha = data.sha;
        }
      } catch (e) {
        // File doesn't exist yet
      }

      // Create or update file
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: relativePath,
        message: sha ? `Update ${relativePath}` : `Add ${relativePath}`,
        content: base64Content,
        sha,
      });

      console.log(`  ✓ ${relativePath}`);
    } catch (error: any) {
      console.error(`  ✗ ${relativePath}: ${error.message}`);
    }
  }

  console.log("\n✅ Deployment complete!");
  console.log(`\n📍 View your repository: https://github.com/${owner}/${repo}`);
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error.message);
  process.exit(1);
});
