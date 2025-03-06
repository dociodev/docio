---
sidebar: false
---

# Deploying to `docio.dev`

Docio.dev is a streamlined hosting service specifically designed for Rspress-built documentation sites. It's perfect for open-source projects that need a simple and reliable way to host their documentation.

## Quick Start

1. Create a new Rspress documentation site:
   ```bash
   # Using npm
   npm create rspress@latest
   
   # Using yarn
   yarn create rspress
   
   # Using pnpm
   pnpm create rspress
   ```

2. Create a new GitHub repository:
   - Go to your GitHub organization
   - Create a new repository named exactly `docio`
   - Push your documentation code to this repository

3. Install the GitHub App:
   - Visit [docio.dev GitHub App](https://github.com/apps/docio-dev)
   - Click "Install"
   - Select your organization
   - Grant access to the `docio` repository

## How it Works

Once set up, docio.dev will:
- Monitor the default branch of your repository
- Automatically build and deploy your site when changes are detected
- Host your documentation at `https://[organization-name].docio.dev`

## Configuration

### Repository Requirements
- Must be named exactly `docio`
- Must be in the root of your organization
- Must contain a valid Rspress project

### URL Formation
Your documentation will be available at a URL based on your organization name:
- Organization names are converted to lowercase
- Special characters and spaces are replaced with hyphens
- The final URL format is: `https://[slugified-org-name].docio.dev`

:::info Examples
- Organization: `MyCompany` → `https://my-company.docio.dev`
- Organization: `Hello_World` → `https://hello-world.docio.dev`
- Organization: `Open Source Project` → `https://open-source-project.docio.dev`

:::

## Troubleshooting

If your site isn't deploying:
1. Ensure your repository is named exactly `docio`
2. Check that the GitHub App has proper access to the repository
3. Verify your Rspress configuration is correct
4. Look for build errors in your GitHub repository's Actions tab

:::tip
Remember to commit and push your changes to the default branch (usually `main` or `master`) to trigger a deployment
:::

## Support

If you encounter any issues or need assistance:
- Check the [Rspress documentation](https://rspress.dev/)
- Open an issue in the [docio.dev repository](https://github.com/docio-dev/docio)
- Contact support through GitHub discussions
