import argparse
import json
from pathlib import Path

import torch
import yaml


def build_dataset(
    train_samples: int, input_dim: int, num_classes: int, seed: int
) -> dict[str, torch.Tensor]:
    generator = torch.Generator().manual_seed(seed)
    features = torch.randn(train_samples, input_dim, generator=generator)
    labels = torch.randint(0, num_classes, (train_samples,), generator=generator)
    return {"features": features, "labels": labels}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a synthetic training dataset")
    parser.add_argument("--config", default="ml/configs/data/default.yaml")
    parser.add_argument("--output", default="ml/data/processed")
    args = parser.parse_args()

    with open(args.config, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    dataset = build_dataset(
        train_samples=int(cfg["train_samples"]),
        input_dim=int(cfg["input_dim"]),
        num_classes=int(cfg["num_classes"]),
        seed=int(cfg["seed"]),
    )
    dataset_path = output_dir / "dataset.pt"
    torch.save(dataset, dataset_path)

    metadata = {
        "dataset_name": cfg["dataset_name"],
        "train_samples": int(cfg["train_samples"]),
        "input_dim": int(cfg["input_dim"]),
        "num_classes": int(cfg["num_classes"]),
        "seed": int(cfg["seed"]),
        "dataset_path": str(dataset_path),
    }
    with open(output_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


if __name__ == "__main__":
    main()
