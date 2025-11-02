# CI/CD Setup for Docker Auto-Deploy

This guide explains how to set up automatic Docker image building and deployment on every push to your repository.

## Overview

The CI/CD pipeline has two workflows:

1. **Build and Push Docker Image** - Builds the Docker image and pushes it to GitHub Container Registry on every push
2. **Deploy to Mac Studio** - Automatically deploys the new image to your Mac Studio (optional)

## Prerequisites

- GitHub repository for your code
- Docker Desktop installed on your Mac Studio
- GitHub Actions enabled in your repository

## Setup Instructions

### 1. Configure Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### For Docker Build:
- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID

#### For Auto-Deploy (Optional):
- `MAC_STUDIO_HOST` - IP address or hostname of your Mac Studio (e.g., `192.168.1.100`)
- `MAC_STUDIO_USER` - SSH username for your Mac Studio (e.g., `your-username`)
- `MAC_STUDIO_SSH_KEY` - Private SSH key with access to your Mac Studio

### 2. Set up SSH Key on Mac Studio

If you want auto-deployment, you need to set up SSH access:

1. **Generate SSH key pair** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   ```

2. **Add public key to authorized_keys on Mac Studio:**
   ```bash
   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Add private key to GitHub Secrets:**
   ```bash
   cat ~/.ssh/id_ed25519
   ```
   Copy the output and add it as `MAC_STUDIO_SSH_KEY` secret

4. **Enable SSH on Mac Studio:**
   - Go to System Settings → General → Sharing
   - Enable "Remote Login"
   - Allow SSH connections

5. **Update deploy.yml:**
   Edit `.github/workflows/deploy.yml` and update the path:
   ```yaml
   cd /path/to/expense-tracker  # Change to your actual path
   ```

### 3. Update docker-compose.yml for GitHub Registry

Edit `docker-compose.yml` to pull from GitHub Container Registry:

```yaml
version: '3.8'

services:
  expense-tracker:
    image: ghcr.io/your-username/expense-tracker:latest
    # Remove the build section and use image instead
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    #   args:
    #     ...
    ports:
      - "3000:80"
    restart: unless-stopped
    container_name: expense-tracker
    environment:
      # Keep any runtime env vars here if needed
```

### 4. Configure GitHub Package Permissions

1. Go to your repository → Settings → Actions → General
2. Scroll down to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Scroll to "Packages" and ensure it's enabled

### 5. Authenticate Docker with GitHub Registry

On your Mac Studio, log in to GitHub Container Registry:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

Or create a personal access token with `read:packages` permission and use it.

Then update your Mac Studio to pull from registry:

```bash
cd /path/to/expense-tracker
docker-compose pull
docker-compose up -d
```

## Workflow Details

### Build and Push Workflow

**Triggers:**
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch

**Actions:**
1. Checks out code
2. Sets up Docker Buildx
3. Logs in to GitHub Container Registry
4. Builds Docker image with Firebase credentials
5. Pushes image with multiple tags:
   - `latest` (for default branch)
   - `main` or `master` (branch name)
   - `main-{sha}` (branch + commit SHA)
   - Pull request number (for PRs)

**Cache:**
- Uses GitHub Actions cache for faster builds
- Caches Docker layers between builds

### Deploy Workflow (Optional)

**Triggers:**
- Only after successful build workflow
- Only on `main` or `master` branch

**Actions:**
1. Connects to Mac Studio via SSH
2. Pulls latest image from registry
3. Restarts container with new image
4. Cleans up old images

## Manual Deployment

If you don't want auto-deploy, you can manually pull and restart:

```bash
# On your Mac Studio
cd /path/to/expense-tracker
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Build Fails
- **"Secrets not found"**: Make sure all Firebase secrets are added to repository settings
- **"Permission denied"**: Enable package permissions in repository settings
- **"Build args issue"**: Check that all secrets are correctly named

### Deploy Fails
- **"SSH connection refused"**: 
  - Check Mac Studio SSH is enabled
  - Verify firewall allows SSH connections
  - Check `MAC_STUDIO_HOST` secret is correct
- **"Path not found"**: Update the path in `deploy.yml` to match your Mac Studio directory
- **"Permission denied"**: 
  - Ensure SSH key is added to `authorized_keys`
  - Check file permissions on Mac Studio

### Image Not Updating
- **Pull not working**: Run `docker-compose pull` manually to test
- **Cache issue**: Add `--no-cache` to docker-compose pull
- **Tag mismatch**: Check image name in docker-compose.yml matches registry

## Security Best Practices

1. **Never commit secrets**: All secrets are stored in GitHub Secrets
2. **Use SSH keys**: Never use passwords for SSH access
3. **Limit access**: Only give necessary permissions to GitHub Actions
4. **Monitor deployments**: Review workflow logs regularly
5. **Use branch protection**: Protect your main branch to prevent accidental deployments

## Alternative: Using Docker Hub

If you prefer Docker Hub over GitHub Container Registry:

1. Update `.github/workflows/docker-build.yml`:
   ```yaml
   env:
     REGISTRY: docker.io
     IMAGE_NAME: your-dockerhub-username/expense-tracker
   ```

2. Add Docker Hub credentials to secrets:
   - `DOCKER_USERNAME` - Your Docker Hub username
   - `DOCKER_PASSWORD` - Your Docker Hub password or access token

3. Update deploy.yml to log in:
   ```yaml
   - name: Log in to Docker Hub
     uses: docker/login-action@v3
     with:
       username: ${{ secrets.DOCKER_USERNAME }}
       password: ${{ secrets.DOCKER_PASSWORD }}
   ```

4. Update `docker-compose.yml` to use Docker Hub image

