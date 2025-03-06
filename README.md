# Docio

Docio.dev is a streamlined hosting service specifically designed for
Rspress-built documentation sites. It's perfect for open-source projects that
need a simple and reliable way to host their documentation.

## 🌟 Features

- Automatic building and deployment of Rspress documentation sites
- Domain for each organization (`https://[organization-name].docio.dev`)
- GitHub integration for seamless deployment
- Zero-configuration setup

## Current Development Status

- [x] Basic deployment pipeline
- [x] GitHub App integration
- [x] Automatic builds on push
- [ ] Documentation site preview for PRs
- [ ] Custom domains support
- [ ] Support not only repo with the `docio` name
- [ ] Plugins support

## 🏗 Project Structure

The project is organized as a monorepo with the following structure:

### 📱 Applications (`/apps`)

- `worker/` - Main Cloudflare Worker service for handling deployments
- `octomock/` - Mock service for testing GitHub integrations

### 📦 Packages (`/packages`)

- `db/` - Database operations (Prisma + D1)
- `utils/` - Common utilities
- `cloudflare/` - Cloudflare API integration
- `env/` - Environment types and configuration
- `octo/` - GitHub API integration

### 🛠 Tools (`/tools`)

- CLI utilities for building, deploying, and managing the project

## 📘 Using Docio.dev (WIP)

## 🚀 Development Setup

### Prerequisites

- [Deno](https://deno.com/)
- [Node.js](https://nodejs.org/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [act](https://github.com/nektos/act) - For running GitHub Actions locally

### Installation

1. Clone the repository
2. Create `.env` file based on the example and fill in the required environment
   variables
3. Install dependencies:

```bash
deno install --allow-scripts
deno task db client generate
```

### Development

Run in development mode:

```bash
deno task dev
```

This will start:

- Worker on port 8786
- Octomock on port 8001

### Local GitHub Actions

The project uses [act](https://github.com/nektos/act) to run GitHub Actions
locally for testing the CI/CD pipeline for building and deploying the sites.

### Database

Managing migrations:

```bash
# Create a new migration
deno task db migrations create <name>

# Apply migrations
deno task db migrations up
```

## 🔑 Environment Variables

See `.env.example` for the required environment variables.

## 📚 Tech Stack

- [Rspress](https://rspress.dev/) - Documentation framework
- [Deno](https://deno.com/) - Runtime environment
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - Database
- [Prisma](https://www.prisma.io/) - ORM
- [Hono](https://hono.dev/) - Web framework
- [GitHub Apps API](https://docs.github.com/en/apps) - GitHub integration
- [act](https://github.com/nektos/act) - Local GitHub Actions runner

## 🤝 Support

If you encounter any issues or need assistance:

- Check the [Rspress documentation](https://rspress.dev/)
- Open an issue in the [docio.dev repository](https://github.com/dociodev/docio)
- Contact support through GitHub discussions

## 📄 License

[MIT](LICENSE)
