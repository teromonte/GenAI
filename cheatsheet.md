# DevOps Cheat Sheet: Kubernetes, Docker, & Terraform
A quick reference guide for the commands used to build, deploy, and debug the NewsCenter RAG application.
## 🐳 Docker (The Builder)
*Responsible for packaging your application into a portable "image".*
| Command | Description |
| :--- | :--- |
| `docker build -t <tag> .` | **Builds** your code into an image. <br> *Example:* `docker build -t teromonte/newscenter-api:v3 .` |
| `docker push <tag>` | **Uploads** your image to Docker Hub so your server can download it. <br> *Example:* `docker push teromonte/newscenter-api:v3` |
| `docker run --rm <tag> <cmd>` | **Runs** a container locally to test it quickly without deploying. <br> *Example:* `docker run --rm teromonte/newscenter-api:v3 cat /app/app/main.py` |
| `docker images` | **Lists** all images stored locally on your machine. |
| `docker rmi <image_id>` | **Removes** an image from your local machine to free up space. |
## ☸️ Kubernetes / kubectl (The Captain)
*Responsible for managing and running your containers on the server.*
| Command | Description |
| :--- | :--- |
| `kubectl apply -f <file>` | **Deploys** or updates resources defined in a YAML file. <br> *Example:* `kubectl apply -f k8s/deployment.yaml` |
| `kubectl get pods` | **Lists** running pods (containers). Use `-w` to watch them update in real-time. |
| `kubectl describe pod <name>` | **Inspects** a pod in detail. Crucial for debugging errors like `ImagePullBackOff` or `Pending`. |
| `kubectl logs <name>` | **Reads** the output/logs of your application running inside the pod. |
| `kubectl delete pod <name>` | **Deletes** a pod. Kubernetes will automatically create a fresh new one (useful to force a restart). |
| `kubectl rollout restart deployment <name>` | **Restarts** all pods in a deployment gracefully (zero downtime). |
| `kubectl exec -it <pod> -- <cmd>` | **Executes** a command inside a running pod. <br> *Example:* `kubectl exec -it my-pod -- python -c "print('hello')"` |
## 🏗️ Terraform (The Architect)
*Responsible for creating the physical infrastructure (servers, networks, disks).*
| Command | Description |
| :--- | :--- |
| `terraform init` | **Initializes** the project and downloads necessary plugins. Run this once at the start. |
| `terraform plan` | **Previews** changes. Shows you exactly what will be created, modified, or destroyed. |
| `terraform apply` | **Executes** the changes. We used this to increase your server's disk size from 20GB to 40GB. |
## 🔧 Server & Debugging (The Mechanic)
*Commands run directly on the Linux server (via SSH) to fix deep issues.*
| Command | Description |
| :--- | :--- |
| `ssh -i key.pem user@ip` | **Connects** you securely to your remote server's terminal. |
| `df -h` | **Checks disk space**. We used this to find out the server was 90% full. |
| `sudo crictl images` | **Lists images** on the Kubernetes node (K3s uses `crictl` instead of `docker`). |
| `sudo crictl rmi <id>` | **Deletes images** from the node. We used this to remove the stuck "Zombie" image and free space. |
| `sudo systemctl restart k3s` | **Restarts the Kubernetes service** on the server. Useful if the cluster itself is acting weird. |
## 🧠 Key Learnings
1. **Image Caching**: Kubernetes might use a cached image even if you push a new one. To force an update, you may need to delete the old image from the node manually (`crictl rmi`) or use `imagePullPolicy: Always` (though caching can still persist).
2. **Disk Pressure**: If a node runs out of disk space, it will stop scheduling new pods and may evict existing ones. Always check `df -h` if pods are stuck in `Pending` or `Evicted`.
3. **Ingress Caching**: Sometimes the browser or load balancer caches API responses. Testing with `curl` inside the pod confirms if the app itself is working correctly.
---
## 🚨 The "Nuclear Option" (Fail-Safe Deployment)
This is a very common issue with K3s and Containerd (the engine under K3s). When disk space is low, the garbage collector gets confused, and Kubernetes often pretends to have updated while actually just rebooting the old container because it failed to extract the new big layer.
Since standard commands aren't working, we are going to use the "Nuclear Option". We will manually log into the node, kill the pods, physically delete the image files from the hard drive, and manually download the new one before letting Kubernetes touch it.
Here is your Fail-Safe Sequence. Run these blocks one by one in PowerShell.
### Phase 1: Local Build & Push (The easy part)
Define your new version (e.g., v10) and send it to the cloud.

# 1. Configuration
$VERSION = "v12"
$SERVER_IP = "98.92.132.139"
$KEY = "genai-key.pem"
# 2. Build & Push
docker build --platform linux/amd64 -t teromonte/newscenter-api:$VERSION .
docker push teromonte/newscenter-api:$VERSION
Phase 2: The "Surgical Strike" (Remote)
We will now SSH into the server and force the cleanup. We use crictl (Container Runtime Interface Control), which is the tool that controls K3s images.

Copy and paste these commands one by one:

# 1. Scale to 0. This stops the containers so the image files unlock.
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newscenter-deployment --replicas=0"
# 2. WAIT for the pod to actually disappear (Crucial!)
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl wait --for=delete pod -l app=newscenter --timeout=60s"
# 3. Prune Images. This deletes ALL images not currently used by a running container.
# This frees up the 4GB space needed for the new download.
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl rmi --prune"
# 4. Verify space. Ensure you have at least 5GB free on root (/)
ssh -i $KEY ubuntu@$SERVER_IP "df -h /"
# 5. Manually Pull the new image. 
# This downloads it to the hard drive BEFORE Kubernetes asks for it.
# If this fails, you know it's a disk/network issue, not a K8s issue.
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl pull teromonte/newscenter-api:$VERSION"
Phase 3: Clean Deployment
Now the server is clean, and the new image is already sitting there waiting. We just tell Kubernetes to use it.

# 1. Update the deployment to use the new version tag
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl set image deployment/newscenter-deployment newscenter-api=teromonte/newscenter-api:$VERSION"
# 2. Scale back up to 1
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newscenter-deployment --replicas=1"
# 3. Watch it start (It should be instant since image is pre-pulled)
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -w"
# (Press Ctrl+C when it says Running)
Phase 4: The Ultimate Verification
Do not trust the tag name. Tags can be lied to. Trust the SHA Hash.

Run this command to ask the live container exactly what ID it is running:

# Get the Image ID from the running pod
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -l app=newscenter -o jsonpath='{.items[0].status.containerStatuses[0].imageID}'"
How to read the result: You will see something like: sha256:a1b2c3d4... Compare this with the Digest printed in your local terminal when you ran docker push. If they match, it is mathematically impossible for it to be running the old code.

Phase 5: Update the Database (Since it's a new version)
Don't forget, since you deployed a new pod, you need to run the migration again just in case your code change involved the DB.

# Get pod name variable
$POD = (ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -l app=newscenter -o jsonpath='{.items[0].metadata.name}'")
# Run Migration
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl exec -it $POD -- alembic upgrade head"