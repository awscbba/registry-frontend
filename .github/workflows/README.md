# GitHub Actions Workflows - Frontend

## Workflows

### 1. deploy-frontend.yml
Deploys the frontend to AWS Amplify on push to main branch.

**Stages**:
- Build: Runs `just ci-validate` and creates build artifacts
- Quality Gate: Runs `just ci-quality` for code quality checks
- Deploy: Deploys to AWS Amplify using `just ci-deploy`
- Validate: Post-deployment health checks

**Requirements**:
- AWS OIDC role with Amplify deployment permissions
- GitHub secret: `AWS_ROLE_ARN`

### 2. pr-validation.yml
Validates pull requests with linting, type checking, tests, and build.

**Checks**:
- ESLint linting
- TypeScript type checking
- Jest tests
- Production build

## Setup

### AWS OIDC Configuration

The OIDC provider should already exist. Create a role for frontend deployment:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::142728997126:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:awscbba/registry-frontend:*"
        }
      }
    }
  ]
}
```

### Required Permissions

Attach policy with:
- `amplify:*` for Amplify deployment
- `s3:*` for build artifacts (if needed)

### GitHub Secret

Add repository secret:
- Name: `AWS_ROLE_ARN`
- Value: `arn:aws:iam::142728997126:role/GitHubActionsFrontendRole`

## Manual Deployment

Trigger manual deployment:
```bash
gh workflow run deploy-frontend.yml
```

## Environment Variables

- `AMPLIFY_APP_ID`: d2df6u91uqaaay
- `AWS_REGION`: us-east-1
- `NODE_VERSION`: 20
