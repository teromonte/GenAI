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
