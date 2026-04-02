import argparse
from pathlib import Path

import torch
import torch.nn as nn
import yaml
from torch.utils.data import DataLoader, TensorDataset
from torch.utils.tensorboard import SummaryWriter

from alveslib import get_logger
from ml.models.arch import Model

logger = get_logger("ml-train")


class Trainer:
    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        learning_rate: float,
        log_dir: str,
        log_every_n_steps: int,
    ) -> None:
        self.model = model
        self.train_loader = train_loader
        self.optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
        self.criterion = nn.CrossEntropyLoss()
        self.writer = SummaryWriter(log_dir)
        self.step = 0
        self.log_every_n_steps = log_every_n_steps

    def train_epoch(self) -> float:
        self.model.train()
        total_loss = 0.0
        for batch_idx, (features, target) in enumerate(self.train_loader):
            self.optimizer.zero_grad()
            output = self.model(features)
            loss = self.criterion(output, target)
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()
            if batch_idx % self.log_every_n_steps == 0:
                self.writer.add_scalar("Loss/TrainStep", loss.item(), self.step)
            self.step += 1

        return total_loss / max(len(self.train_loader), 1)

    def train(self, epochs: int) -> None:
        for epoch in range(epochs):
            avg_loss = self.train_epoch()
            self.writer.add_scalar("Loss/TrainEpoch", avg_loss, epoch)
            logger.info(f"epoch={epoch + 1}/{epochs} avg_loss={avg_loss:.5f}")
        self.writer.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a baseline model")
    parser.add_argument("--config", default="ml/configs/train/default.yaml")
    parser.add_argument("--dataset", default="ml/data/processed/dataset.pt")
    parser.add_argument("--weights", default=None)
    args = parser.parse_args()

    with open(args.config, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    torch.manual_seed(int(cfg["seed"]))

    dataset_blob = torch.load(args.dataset, map_location="cpu")
    dataset = TensorDataset(dataset_blob["features"], dataset_blob["labels"])
    train_loader = DataLoader(dataset, batch_size=int(cfg["batch_size"]), shuffle=True)

    model = Model(
        input_dim=int(cfg["input_dim"]),
        hidden_dim=int(cfg["hidden_dim"]),
        num_classes=int(cfg["num_classes"]),
    )
    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        learning_rate=float(cfg["learning_rate"]),
        log_dir=str(cfg["tensorboard_dir"]),
        log_every_n_steps=int(cfg["log_every_n_steps"]),
    )
    trainer.train(epochs=int(cfg["epochs"]))

    weights_target = args.weights or cfg.get(
        "weights_output", "ml/models/weights/model.pt"
    )
    weights_path = Path(weights_target)
    weights_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), weights_path)
    logger.info(f"saved_weights={weights_path}")


if __name__ == "__main__":
    main()
