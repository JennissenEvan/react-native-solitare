import { Card } from "./deck";
import { TransactionController } from "./transaction";

export default interface DropActionReceiver {
    canDrop(cards: Card[]): boolean;
    drop(cards: Card[], createTransaction: TransactionController): void;
}