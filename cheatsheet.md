🚀 DevOps Cheat Sheet: GenAI Deployment

Stack: Python (FastAPI) • Docker • Kubernetes (K3s) • Terraform (AWS)

🛠️ Core Command Reference
🐳 Docker (The Builder)

Responsible for packaging your application into a portable "image".

Command	Description
docker build -t `<tag>` .	Builds your code into an image.`<br>`Ex: docker build --platform linux/amd64 -t user/app:v1 .
docker push `<tag>`	Uploads your image to Docker Hub.`<br>`Ex: docker push user/app:v1
docker images	Lists all images stored locally on your machine.
docker system prune -a	Cleans unused images and stopped containers to free up disk space.
☸️ Kubernetes / kubectl (The Orchestrator)

Responsible for managing and running your containers on the cloud.

Command	Description
kubectl get pods -w	Watch the status of pods in real-time.
kubectl logs <pod_name>	Read the internal logs of the application (for debugging crashes).
kubectl describe pod `<name>`	Inspect a pod in detail. Critical for debugging ImagePullBackOff or Pending.
kubectl delete pod `<name>`	Kill a pod immediately. K8s will automatically start a fresh replacement.
kubectl rollout restart deployment `<name>`	Restart all pods gracefully (Standard update method).
kubectl exec -it `<pod>` -- `<cmd>`	Execute a command inside a live pod.`<br>`Ex: kubectl exec -it my-pod -- python scripts/ingest.py
🏗️ Terraform (The Architect)

Responsible for creating physical infrastructure (Servers, Firewalls, Disks).

Command	Description
terraform init	Initializes the directory and downloads AWS plugins.
terraform plan	Previews changes (Dry Run). Shows what will be created or destroyed.
terraform apply	Executes the changes (Buys/Changes the server).
terraform destroy	Deletes everything. Run this to stop billing.
🔧 Server Internals (The Mechanic)

Commands run directly on the Linux server via SSH.

Command	Description
df -h	Disk Free. Checks available hard drive space.
sudo crictl images	List Images. (K3s uses crictl, not docker).
sudo crictl rmi --prune	Delete Images. Removes unused images to free space.
sudo k3s kubectl get nodes	Check Cluster. Verifies K3s is running locally on the server.
🧠 Critical Engineering Concepts

Image Caching: Kubernetes tries to be efficient by caching images. If you push a new image with the same tag (:latest), K8s often won't download the new one. Best Practice: Always use unique version tags (:v1, :v2).

Disk Pressure: GenAI images (PyTorch) are huge (4GB+). If your server disk fills up (>85%), Kubernetes initiates Eviction, killing pods to save the node. Always check df -h if pods are Pending.

Architecture Mismatch: AWS servers are usually amd64. If you build on an Apple Silicon Mac (arm64), the code will crash on AWS. Always build with --platform linux/amd64.


---

### 1️⃣ Get the running pod name

```powershell
kubectl get pods -l app=newscenter
```

Example output:

```
NAME                                     READY   STATUS    RESTARTS   AGE
newscenter-deployment-575ccf49b4-cms8m   1/1     Running   0          10s
```

Copy the pod name (`newscenter-deployment-575ccf49b4-cms8m`).

---

### 2️⃣ Check the environment variable inside the pod

```powershell
kubectl exec -it <pod-name> -- printenv LANGSMITH_TRACING
```

Example:

```powershell
kubectl exec -it newscenter-deployment-575ccf49b4-cms8m -- printenv LANGSMITH_TRACING
```

Expected output:

```
true
```

If you see `true`, the pod is running with the variable correctly set.

---

### 3️⃣ Optional: check all env vars

```powershell
kubectl exec -it <pod-name> -- env
```

This prints every environment variable inside the container. You can double-check your new variable and others.

---

### ✅ Notes

* `kubectl apply -f k8s/deployment.yaml`  **updates the deployment spec** , but existing pods may need a **restart** to pick up new env vars. Kubernetes usually handles this if the `set image` or `apply` changes the pod spec, but if your only change is an env var  **without changing the image** , sometimes the old pods don’t restart automatically.
* If the `printenv` command shows nothing for `LANGSMITH_TRACING`, you can  **force a rollout** :

```powershell
kubectl rollout restart deployment newscenter-deployment
```

Then check the pod again.

---

If you want, I can give you a **one-liner to check the var directly for the latest pod version `v16`** without having to copy the pod name manually. Do you want me to do that?
