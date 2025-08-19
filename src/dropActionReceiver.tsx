import { Card } from "./deck";
import DropActionArea from "./dropActionArea";

export default interface DropActionReceiver {
    canDrop(cards: Card[]): boolean;
    drop(cards: Card[]): void;
}