# Frontend + Backend Deployment Cheatsheet

## Quick Deploy (Recommended)

### Full-Stack Deployment

# Update versions in scripts/deploy-fullstack.ps1

# Then run

.\scripts\deploy-fullstack.ps1

### Frontend Only

# Update VERSION in scripts/deploy-frontend.ps1

.\scripts\deploy-frontend.ps1

---

## Manual Deployment Steps

### Option 1: Build & Deploy Frontend Only

#### Step 1: Build Locally

cd frontend
$VERSION = "v1"
docker build --platform linux/amd64 -t teromonte/newsbot-frontend:$VERSION .
docker push teromonte/newsbot-frontend:$VERSION
cd ..

#### Step 2: Deploy to K8s

$SERVER_IP = "98.92.132.139"
$KEY = "genai-key.pem"

# Copy manifests

scp -i $KEY k8s/frontend-deployment.yaml ubuntu@${SERVER_IP}:~/
scp -i $KEY k8s/frontend-service.yaml ubuntu@${SERVER_IP}:~/
scp -i $KEY k8s/ingress.yaml ubuntu@${SERVER_IP}:~/

# Apply

ssh -i $KEY ubuntu@$SERVER_IP "
  sudo kubectl apply -f frontend-deployment.yaml
  sudo kubectl apply -f frontend-service.yaml
  sudo kubectl apply -f ingress.yaml
"

---

## Verification Commands

these 2 are for being able to talk to kubernetes
$env:KUBECONFIG="C:\Users\thiag\Desktop\DEVOPS\GenAI\k3s.yaml"
setx KUBECONFIG "C:\Users\thiag\Desktop\DEVOPS\GenAI\k3s.yaml"

### Check Pod Status

# Backend

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl get pods -l app=newscenter"

# Frontend  

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl get pods -l app=newsbot-frontend"

### View Logs

# Backend logs

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl logs -l app=newscenter --tail=50"

# Frontend logs

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl logs -l app=newsbot-frontend --tail=50"

# Follow logs in real-time

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl logs -l app=newsbot-frontend -f"

### Test Services

# Test backend API

ssh -i genai-key.pem ubuntu@98.92.132.139 "
  POD=\$(sudo kubectl get pods -l app=newscenter -o jsonpath='{.items[0].metadata.name}')
  sudo kubectl exec -it \$POD -- curl <http://localhost:8000/docs>
"

# Test frontend

ssh -i genai-key.pem ubuntu@98.92.132.139 "
  POD=\$(sudo kubectl get pods -l app=newsbot-frontend -o jsonpath='{.items[0].metadata.name}')
  sudo kubectl exec -it \$POD -- curl <http://localhost:3000>
"

### Check Ingress Routing

# View ingress config

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl describe ingress newscenter-ingress"

# Test from local machine (add 98.92.132.139 newsbot.local to hosts first)

curl -H "Host: newsbot.local" <http://98.92.132.139/>
curl -H "Host: newsbot.local" <http://98.92.132.139/api/docs>

---

## Troubleshooting

### Frontend Pod Not Starting

# Check pod events

ssh -i genai-key.pem ubuntu@98.92.132.139 "
  POD=\$(sudo kubectl get pods -l app=newsbot-frontend -o jsonpath='{.items[0].metadata.name}')
  sudo kubectl describe pod \$POD
"

# Check if image pulled successfully

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo crictl images | grep newsbot-frontend"

### Disk Space Issues

# Check disk

ssh -i genai-key.pem ubuntu@98.92.132.139 "df -h /"

# Prune old images

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo crictl rmi --prune"

### API Connection Issues

# Check if backend service is accessible from frontend pod

ssh -i genai-key.pem ubuntu@98.92.132.139 "
  POD=\$(sudo kubectl get pods -l app=newsbot-frontend -o jsonpath='{.items[0].metadata.name}')
  sudo kubectl exec -it \$POD -- wget -O- <http://newscenter-service:8000/docs>
"

### Ingress Not Routing

# Check nginx ingress controller

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl get pods -n ingress-nginx"

# Restart ingress controller if needed

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl rollout restart deployment ingress-nginx-controller -n ingress-nginx"

---

## Rollback

### Emergency Rollback to Previous Versions

$BACKEND_VERSION = "v16"   # Last good version
$FRONTEND_VERSION = "v1"    # Last good version

ssh -i genai-key.pem ubuntu@98.92.132.139 "
  sudo kubectl set image deployment/newscenter-deployment newscenter-api=teromonte/newscenter-api:$BACKEND_VERSION
  sudo kubectl set image deployment/newsbot-frontend-deployment newsbot-frontend=teromonte/newsbot-frontend:$FRONTEND_VERSION
  sudo kubectl rollout restart deployment newscenter-deployment
  sudo kubectl rollout restart deployment newsbot-frontend-deployment
"

---

## Local Development vs Production

### Development (Current Setup)

- Frontend: `npm run dev` on localhost:3000
- Backend: Local FastAPI on localhost:8000
- Next.js proxy: `/api/*` → `http://localhost:8000/api/*`

### Production (After Deployment)

- Frontend: K8s pod running Next.js on port 3000
- Backend: K8s pod running FastAPI on port 8000
- Ingress routes:
  - `/api/*` → Backend service (newscenter-service:8000)
  - `/*` → Frontendservice (newsbot-frontend-service:3000)

---

## Hosts File Configuration

### Windows

Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator):

98.92.132.139 newsbot.local

### Linux/Mac

Edit `/etc/hosts` (with sudo):

98.92.132.139 newsbot.local

Then access the app at: **<http://newsbot.local>**

---

## Useful One-Liners

### Get Running Image Versions

# Backend version

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl get pods -l app=newscenter -o jsonpath='{.items[0].spec.containers[0].image}'"

# Frontend version

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl get pods -l app=newsbot-frontend -o jsonpath='{.items[0].spec.containers[0].image}'"

### Scale Deployments

# Scale up

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl scale deployment newsbot-frontend-deployment --replicas=2"

# Scale down (maintenance mode)

ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl scale deployment newsbot-frontend-deployment --replicas=0"

### Complete Reset

# Delete everything and start fresh

ssh -i genai-key.pem ubuntu@98.92.132.139 "
  sudo kubectl delete deployment newscenter-deployment newsbot-frontend-deployment
  sudo kubectl delete service newscenter-service newsbot-frontend-service
  sudo kubectl delete ingress newscenter-ingress
  sudo crictl rmi --prune
"
