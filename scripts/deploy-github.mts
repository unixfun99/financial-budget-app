#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, sep } from "path";

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
  const parts = path.split(sep);
  
  // Ignore patterns
  const ignorePatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.DS_Store',
    '.replit',
    'replit.nix',
    '.config',
    '.cache',
    '.upm',
  ];

  // Check if any part of the path matches ignore patterns
  for (const part of parts) {
    if (ignorePatterns.includes(part)) {
      return true;
    }
  }

  // Ignore .env files
  if (path.startsWith('.env') || path.includes('/.env')) {
    return true;
  }

  return false;
}

function getAllFiles(dirPath: string, baseDir: string, files: string[] = []): string[] {
  try {
    const items = readdirSync(dirPath);

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const relativePath = relative(baseDir, fullPath);

      if (shouldIgnore(relativePath)) {
        continue;
      }

      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          getAllFiles(fullPath, baseDir, files);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      } catch (e) {
        // Skip files we can't stat
        continue;
      }
    }
  } catch (e) {
    // Skip directories we can't read
  }

  return files;
}

async function initializeRepo(octokit: Octokit, owner: string, repo: string) {
  console.log("📝 Initializing repository with README...");
  
  const readme = `# Financial Budgeting Application

Full-featured envelope budgeting application with bank syncing and Stripe integration.

## Quick Start

See [DEPLOYMENT_ROCKY_LINUX.md](DEPLOYMENT_ROCKY_LINUX.md) or [DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md) for deployment instructions.
`;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "README.md",
    message: "Initialize repository",
    content: Buffer.from(readme).toString("base64"),
  });

  console.log("✅ Repository initialized");
}

async function main() {
  console.log("\n🚀 Deploying to GitHub...\n");

  const octokit = await getGitHubClient();
  const owner = "unixfun99";
  const repo = "financial-budget-app";
  const baseDir = process.cwd();
  const branch = "main";

  // Get current user
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}`);

  // Check if repo is empty
  let isEmpty = false;
  try {
    await octokit.repos.getContent({
      owner,
      repo,
      path: "README.md",
    });
  } catch (e: any) {
    if (e.status === 404) {
      isEmpty = true;
    }
  }

  if (isEmpty) {
    await initializeRepo(octokit, owner, repo);
  }

  // Collect files
  console.log("\n📦 Collecting files...");
  const files = getAllFiles(baseDir, baseDir);
  console.log(`✅ Found ${files.length} files to deploy`);

  // Create blobs and tree in batches
  console.log("\n🔨 Creating git objects (this may take a few minutes)...");
  const batchSize = 25;
  const allTreeEntries = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const progress = Math.min(i + batchSize, files.length);
    console.log(`  Progress: ${progress}/${files.length} files (${Math.round((progress / files.length) * 100)}%)`);

    const batchEntries = await Promise.all(
      batch.map(async (filePath) => {
        const relativePath = relative(baseDir, filePath);
        const content = readFileSync(filePath);

        try {
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
        } catch (e: any) {
          console.error(`    ⚠️  Skipped ${relativePath}: ${e.message}`);
          return null;
        }
      })
    );

    allTreeEntries.push(...batchEntries.filter((e) => e !== null));
  }

  // Create tree
  console.log("\n🌳 Creating git tree...");
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: allTreeEntries as any,
  });

  // Get current commit SHA
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const parentSha = ref.object.sha;

  // Create commit
  console.log("💾 Creating commit...");
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: "Deploy financial budgeting application\n\nComplete application with:\n- Envelope-style budgeting\n- SimpleFIN bank syncing\n- Stripe payment integration\n- YNAB/Actual Budget import\n- Production deployment guides",
    tree: tree.sha,
    parents: [parentSha],
  });

  // Update reference
  console.log("📌 Updating branch...");
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.sha,
    force: true,
  });

  console.log("\n✅ Deployment successful!\n");
  console.log(`📍 Repository: https://github.com/${owner}/${repo}`);
  console.log(`🔗 Commit: ${commit.sha.substring(0, 7)}`);
  console.log(`\nYour code is now live on GitHub!`);
  console.log(`\nNext steps:`);
  console.log(`1. Visit https://github.com/${owner}/${repo}`);
  console.log(`2. Review the deployment documentation`);
  console.log(`3. Follow DEPLOYMENT_ROCKY_LINUX.md or DEPLOYMENT_DOCKER.md to go live`);
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error.message);
  console.error(error);
  process.exit(1);
});
