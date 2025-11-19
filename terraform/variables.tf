variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1" # N. Virginia (Cheapest/Standard)
}

variable "instance_type" {
  description = "EC2 Instance Type"
  default     = "t3.medium" 
}

variable "key_name" {
  description = "Name of the SSH Key Pair created in AWS Console"
  default     = "genai-key"
}