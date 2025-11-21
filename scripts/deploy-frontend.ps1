# Frontend Deployment Script - "Nuclear Option" for Resource-Constrained Servers
# This follows the proven pattern from backend deployments

# Configuration
$VERSION = "v1"
$SERVER_IP = "98.92.132.139"
$KEY = "genai-key.pem"
$IMAGE_NAME = "teromonte/newsbot-frontend"

Write-Host "🚀 Starting Frontend Deployment - Version $VERSION" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Phase 1: Local Build & Push
# ============================================================================
Write-Host "📦 Phase 1: Building and Pushing Image" -ForegroundColor Yellow

# Navigate to frontend directory
Set-Location -Path "frontend"

# Build for Linux Cloud Servers
Write-Host "Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:${VERSION} .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

# Push to Registry
Write-Host "Pushing to Docker Hub..."
docker push ${IMAGE_NAME}:${VERSION}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

Write-Host "✅ Image built and pushed successfully" -ForegroundColor Green
Set-Location -Path ".."

# ============================================================================
# Phase 2: The "Surgical Strike" (Remote Cleanup)
# ============================================================================
Write-Host ""
Write-Host "🔧 Phase 2: Remote Cleanup" -ForegroundColor Yellow

# Check if deployment exists
Write-Host "Checking if frontend deployment exists..."
$deploymentExists = ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get deployment newsbot-frontend-deployment 2>/dev/null"

if ($deploymentExists) {
    Write-Host "Scaling down existing deployment to 0..."
    ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newsbot-frontend-deployment --replicas=0"
    
    Write-Host "Waiting for pods to terminate..."
    ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl wait --for=delete pod -l app=newsbot-frontend --timeout=60s 2>/dev/null || true"
}

# Prune old images
Write-Host "Pruning old images..."
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl rmi --prune"

# Verify disk space
Write-Host "Checking disk space..."
ssh -i $KEY ubuntu@$SERVER_IP "df -h /"

# Manually pull new image
Write-Host "Pulling new image: ${IMAGE_NAME}:${VERSION}..."
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl pull ${IMAGE_NAME}:${VERSION}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Image pull failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cleanup and image pull successful" -ForegroundColor Green

# ============================================================================
# Phase 3: Deploy to Kubernetes
# ============================================================================
Write-Host ""
Write-Host "☸️  Phase 3: Deploying to Kubernetes" -ForegroundColor Yellow

# Copy K8s manifests to server
Write-Host "Copying Kubernetes manifests..."
scp -i $KEY k8s/frontend-deployment.yaml ubuntu@${SERVER_IP}:~/
scp -i $KEY k8s/frontend-service.yaml ubuntu@${SERVER_IP}:~/
scp -i $KEY k8s/ingress.yaml ubuntu@${SERVER_IP}:~/

# Update deployment image version
Write-Host "Updating deployment image to ${VERSION}..."
ssh -i $KEY ubuntu@$SERVER_IP "sed -i 's|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${VERSION}|g' frontend-deployment.yaml"

# Apply manifests
Write-Host "Applying Kubernetes manifests..."
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl apply -f frontend-deployment.yaml"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl apply -f frontend-service.yaml"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl apply -f ingress.yaml"

# Scale to 1 replica
Write-Host "Scaling deployment to 1 replica..."
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newsbot-frontend-deployment --replicas=1"

Write-Host "✅ Kubernetes deployment complete" -ForegroundColor Green

# ============================================================================
# Phase 4: Verification
# ============================================================================
Write-Host ""
Write-Host "🔍 Phase 4: Verification" -ForegroundColor Yellow

# Wait for pod to be ready
Write-Host "Waiting for pod to be ready..."
Start-Sleep -Seconds 10

# Get pod status
Write-Host "Pod status:"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -l app=newsbot-frontend"

# Get pod logs
Write-Host ""
Write-Host "Recent logs:"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl logs -l app=newsbot-frontend --tail=20 2>/dev/null || echo 'No logs yet'"

# Verify image ID
Write-Host ""
Write-Host "Verifying running image..."
$runningImage = ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -l app=newsbot-frontend -o jsonpath='{.items[0].status.containerStatuses[0].image}' 2>/dev/null"
Write-Host "Running image: $runningImage"

# ============================================================================
# Phase 5: Final Instructions
# ============================================================================
Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add to your hosts file: $SERVER_IP newsbot.local"
Write-Host "2. Open browser to: http://newsbot.local"
Write-Host "3. Test the application end-to-end"
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "Watch pods: ssh -i $KEY ubuntu@$SERVER_IP 'sudo kubectl get pods -w'"
Write-Host "View logs: ssh -i $KEY ubuntu@$SERVER_IP 'sudo kubectl logs -l app=newsbot-frontend --tail=50'"
Write-Host "Check ingress: ssh -i $KEY ubuntu@$SERVER_IP 'sudo kubectl get ingress newsbot-frontend-ingress'"
Write-Host ""

