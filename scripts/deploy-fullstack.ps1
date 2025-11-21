# Full-Stack Deployment Script
# Deploys both backend and frontend in coordinated fashion

# Configuration
$BACKEND_VERSION = "v17"  # Update to your current backend version
$FRONTEND_VERSION = "v1"
$SERVER_IP = "98.92.132.139"
$KEY = "genai-key.pem"

Write-Host "Starting Full-Stack Deployment" -ForegroundColor Cyan
Write-Host "Backend: $BACKEND_VERSION | Frontend: $FRONTEND_VERSION" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Phase 0: Docker Authentication
# ============================================================================
Write-Host "Phase 0: Authenticating Docker" -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) { Write-Host "Docker Login failed! Please login manually." -ForegroundColor Red; exit 1 }

# ============================================================================
# Phase 1: Build Both Images Locally
# ============================================================================
Write-Host "Phase 1: Building Images" -ForegroundColor Yellow

# Build Backend
Write-Host "Building backend image..."
docker build --platform linux/amd64 -t teromonte/newscenter-api:${BACKEND_VERSION} .
if ($LASTEXITCODE -ne 0) { Write-Host "Backend build failed!" -ForegroundColor Red; exit 1 }

docker push teromonte/newscenter-api:${BACKEND_VERSION}
if ($LASTEXITCODE -ne 0) { Write-Host "Backend push failed!" -ForegroundColor Red; exit 1 }

# Build Frontend
Write-Host "Building frontend image..."
Set-Location -Path "frontend"
docker build --platform linux/amd64 -t teromonte/newsbot-frontend:${FRONTEND_VERSION} .
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build failed!" -ForegroundColor Red; Set-Location -Path ".."; exit 1 }

docker push teromonte/newsbot-frontend:${FRONTEND_VERSION}
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend push failed!" -ForegroundColor Red; Set-Location -Path ".."; exit 1 }

Set-Location -Path ".."
Write-Host "Both images built and pushed" -ForegroundColor Green

# ============================================================================
# Phase 2: Scale Down & Cleanup
# ============================================================================
Write-Host ""
Write-Host "Phase 2: Scaling Down and Cleanup" -ForegroundColor Yellow

# Scale down both deployments
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newscenter-deployment --replicas=0"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newsbot-frontend-deployment --replicas=0 2>/dev/null; true"

# Wait for pods to terminate
Write-Host "Waiting for pods to terminate..."
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl wait --for=delete pod -l app=newscenter --timeout=60s 2>/dev/null; true"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl wait --for=delete pod -l app=newsbot-frontend --timeout=60s 2>/dev/null; true"

# Prune images
Write-Host "Pruning old images..."
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl rmi --prune"

# Check disk space
Write-Host "Disk space:"
ssh -i $KEY ubuntu@$SERVER_IP "df -h /"

# Pull both images
Write-Host "Pulling images..."
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl pull teromonte/newscenter-api:${BACKEND_VERSION}"
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl pull teromonte/newsbot-frontend:${FRONTEND_VERSION}"

Write-Host "Cleanup complete" -ForegroundColor Green

# ============================================================================
# Phase 3: Deploy Backend First
# ============================================================================
Write-Host ""
Write-Host "Phase 3: Deploying Backend" -ForegroundColor Yellow

# Copy backend manifests
scp -i $KEY k8s/deployment.yaml ubuntu@${SERVER_IP}:~/backend-deployment.yaml
scp -i $KEY k8s/service.yaml ubuntu@${SERVER_IP}:~/backend-service.yaml

# Update image version
ssh -i $KEY ubuntu@$SERVER_IP "sed -i 's|image: teromonte/newscenter-api:.*|image: teromonte/newscenter-api:${BACKEND_VERSION}|g' backend-deployment.yaml"

# Apply and scale
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl apply -f backend-deployment.yaml"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl apply -f backend-service.yaml"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newscenter-deployment --replicas=1"

Write-Host "Waiting for backend to be ready..."
Start-Sleep -Seconds 15

$backendStatus = ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -l app=newscenter -o jsonpath='{.items[0].status.phase}'"
if ($backendStatus -eq "Running") {
    Write-Host "Backend is running" -ForegroundColor Green
}
else {
    Write-Host "Backend status: $backendStatus" -ForegroundColor Yellow
}

# ============================================================================
# Phase 4: Deploy Frontend
# ============================================================================
Write-Host ""
Write-Host "Phase 4: Deploying Frontend" -ForegroundColor Yellow

# Copy frontend manifests
scp -i $KEY k8s/frontend-deployment.yaml ubuntu@${SERVER_IP}:~/
scp -i $KEY k8s/frontend-service.yaml ubuntu@${SERVER_IP}:~/
scp -i $KEY k8s/ingress.yaml ubuntu@${SERVER_IP}:~/

# Update image version
ssh -i $KEY ubuntu@$SERVER_IP "sed -i 's|image: teromonte/newsbot-frontend:.*|image: teromonte/newsbot-frontend:${FRONTEND_VERSION}|g' frontend-deployment.yaml"

# Apply and scale
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl apply -f frontend-deployment.yaml"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl apply -f frontend-service.yaml"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl apply -f ingress.yaml"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newsbot-frontend-deployment --replicas=1"

Write-Host "Waiting for frontend to be ready..."
Start-Sleep -Seconds 15

$frontendStatus = ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -l app=newsbot-frontend -o jsonpath='{.items[0].status.phase}' 2>/dev/null"
if ($frontendStatus -eq "Running") {
    Write-Host "Frontend is running" -ForegroundColor Green
}
else {
    Write-Host "Frontend status: $frontendStatus" -ForegroundColor Yellow
}

# ============================================================================
# Phase 5: Database Migrations
# ============================================================================
Write-Host ""
Write-Host "Phase 5: Database Migrations" -ForegroundColor Yellow

$backendPod = ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -l app=newscenter -o jsonpath='{.items[0].metadata.name}'"
Write-Host "Running migrations on pod: $backendPod"

ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl exec -it $backendPod -- alembic upgrade head"

# ============================================================================
# Phase 6: Verification
# ============================================================================
Write-Host ""
Write-Host "Phase 6: Verification" -ForegroundColor Yellow

Write-Host ""
Write-Host "All Pods:"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods"

Write-Host ""
Write-Host "Services:"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get svc"

Write-Host ""
Write-Host "Ingress:"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get ingress"

# ============================================================================
# Summary
# ============================================================================
Write-Host ""
Write-Host "Full-Stack Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Instructions:" -ForegroundColor Cyan
Write-Host "1. Add to hosts file: $SERVER_IP newsbot.local"
Write-Host "2. Open browser: http://newsbot.local"
Write-Host ""