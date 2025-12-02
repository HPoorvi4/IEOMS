import kagglehub
import os

print("=" * 50)
print("📥 Downloading Kaggle Dataset")
print("=" * 50)

# Download latest version
path = kagglehub.dataset_download("mexwell/smart-home-energy-consumption")

print(f"\n✅ Dataset downloaded successfully!")
print(f"Path to dataset files: {path}")

# List files in the downloaded directory
print("\n📁 Files in dataset:")
for file in os.listdir(path):
    print(f"  - {file}")
