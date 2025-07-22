# CodeCatalyst CI/CD Workflows

This directory contains CodeCatalyst workflow definitions for automated deployment of the People Register Frontend.

## Workflows

### 1. Frontend Production Deployment (`production-deployment.yml`)

**Purpose**: Automated deployment to production when feature branches are merged to main.

**Trigger**:

- Push to `main` branch (typically after PR merge)

**Workflow Steps**:

#### 🔍 **ValidateMergeCommit**

- Validates the commit is from a merge (recommended practice)
- Logs deployment context (commit, author, message)
- Warns if direct push to main is detected

#### 🏗️ **BuildAndTest** 

- Installs Node.js dependencies (`npm ci`)
- Runs TypeScript type checking
- Executes linting checks
- Runs test suite
- Verifies environment configuration
- Builds production bundle
- Analyzes bundle size
- Creates build artifacts

#### 🔒 **SecurityChecks**

- Runs `npm audit` for security vulnerabilities
- Checks for outdated packages
- Analyzes dependency tree
- Runs in parallel with BuildAndTest for efficiency

#### 🚀 **DeployToProduction**

- Requires AWS connection with `CodeCatalystWorkflowDevelopmentRole-AWSCocha`
- Verifies build artifacts integrity
- Syncs files to S3 bucket: `people-register-frontend-142728997126-us-east-1`
- Creates CloudFront invalidation: `EE5UBCBLMKK9R`
- Waits for cache invalidation completion

#### 🧪 **PostDeploymentTests**

- Tests frontend accessibility (HTTP 200)
- Verifies API connectivity
- Validates frontend-API integration
- Confirms correct API URL configuration

#### 📢 **NotifyDeployment**

- Provides deployment summary
- Lists live URLs
- Confirms operational status

## Configuration

### Environment Variables

The workflow uses these production configurations:

```yaml
AWS_REGION: us-east-1
S3_BUCKET: people-register-frontend-142728997126-us-east-1
CLOUDFRONT_DISTRIBUTION: EE5UBCBLMKK9R
FRONTEND_URL: https://d28z2il3z2vmpc.cloudfront.net
API_URL: https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod
```

### Required AWS Permissions

The `CodeCatalystWorkflowDevelopmentRole-AWSCocha` role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::people-register-frontend-142728997126-us-east-1",
        "arn:aws:s3:::people-register-frontend-142728997126-us-east-1/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/EE5UBCBLMKK9R"
    }
  ]
}
```

## Development Workflow

### Recommended Git Flow

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop and Test Locally**

   ```bash
   npm install
   npm run dev
   npm test
   npm run build
   ```

3. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Open PR from `feature/your-feature-name` to `main`
   - Request code review
   - Ensure all checks pass

5. **Merge to Main**
   - After approval, merge PR
   - **Automatic deployment triggers**
   - Monitor workflow execution

### Local Environment Setup

Create `.env` file with production API URL:

```bash
PUBLIC_API_URL=https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod
```

### Testing Before Deployment

```bash
# Install dependencies
npm ci

# Type checking
npx tsc --noEmit --strict

# Linting
npm run lint

# Tests
npm test

# Build verification
npm run build
ls -la dist/

# Security audit
npm audit
```

## Monitoring and Troubleshooting

### Workflow Monitoring

- Monitor workflow execution in CodeCatalyst console
- Check individual action logs for detailed information
- Review deployment notifications

### Common Issues

#### 1. **Build Failures**

- Check Node.js version compatibility
- Verify all dependencies are properly installed
- Review TypeScript errors
- Check linting issues

#### 2. **Deployment Failures**

- Verify AWS permissions
- Check S3 bucket accessibility
- Confirm CloudFront distribution ID
- Review network connectivity

#### 3. **Post-Deployment Issues**

- Check frontend accessibility
- Verify API connectivity
- Confirm environment variable configuration
- Review browser console for errors

### Rollback Procedure

If deployment issues occur:

1. **Immediate Rollback**

   ```bash
   # Deploy previous working version
   git checkout <previous-working-commit>
   npm run build
   aws s3 sync dist/ s3://people-register-frontend-142728997126-us-east-1
   aws cloudfront create-invalidation --distribution-id EE5UBCBLMKK9R --paths "/*"
   ```

2. **Fix and Redeploy**
   - Create hotfix branch
   - Fix the issue
   - Test thoroughly
   - Create PR and merge

## Security Considerations

- **Environment Variables**: Never commit sensitive data
- **Dependencies**: Regular security audits with `npm audit`
- **Access Control**: Proper IAM roles and permissions
- **HTTPS**: All communications over secure connections
- **Cache Control**: Proper CloudFront cache invalidation

## Performance Optimization

- **Bundle Analysis**: Monitor bundle size in build logs
- **CDN Caching**: Leverage CloudFront for global distribution
- **Compression**: Assets are automatically compressed
- **Lazy Loading**: Components loaded on demand

## Support

For issues with the CI/CD pipeline:

1. Check workflow logs in CodeCatalyst
2. Review this documentation
3. Verify AWS permissions and configuration
4. Test locally before pushing changes
5. Contact the development team for assistance

---

**Last Updated**: June 2025
**Maintained By**: AWS User Group Cochabamba
**Repository**: registry-frontend
