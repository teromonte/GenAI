provider "aws" {
  region = var.aws_region
  # We will provide credentials via environment variables or CLI
}

# 1. Find the latest Ubuntu 22.04 Image
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical (Official Ubuntu)
}

# 2. Create Security Group (Firewall)
resource "aws_security_group" "genai_sg" {
  name        = "genai-security-group"
  description = "Allow SSH, HTTP, and K8s traffic"

  # SSH Access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # API Access
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API Access (for your local kubectl)
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Traffic (Allow everything)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. Create the EC2 Instance
resource "aws_instance" "genai_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_name
  
  security_groups = [aws_security_group.genai_sg.name]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  # 4. The Startup Script (User Data)
  # This runs ONCE when the server turns on.
  user_data = <<-EOF
              #!/bin/bash
              
              # A. Add 2GB Swap Memory (Crucial for t2.micro)
              fallocate -l 2G /swapfile
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

              # B. Install Docker
              curl -fsSL https://get.docker.com -o get-docker.sh
              sh get-docker.sh
              usermod -aG docker ubuntu

              # C. Install K3s (Lightweight Kubernetes)
              # --tls-san adds the public IP to the cert so you can connect remotely
              PUBLIC_IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
              curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --tls-san $PUBLIC_IP" sh -
              
              # D. Wait for K3s to be ready and set permissions
              sleep 20
              chmod 644 /etc/rancher/k3s/k3s.yaml
              EOF

  tags = {
    Name = "GenAI-NewsBot-Server"
  }
}

# 5. Output the Public IP
output "public_ip" {
  value = aws_instance.genai_server.public_ip
}