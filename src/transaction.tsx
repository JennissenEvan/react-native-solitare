import { createContext } from "react";
import { Card, CardCollection } from "./deck";

class TransactionSegment {
    cards: Card[];
    source: CardCollection;
    destination: CardCollection;

    constructor(cards: Card[], source: CardCollection, destination: CardCollection) {
        this.cards = cards;
        this.source = source;
        this.destination = destination;
    }

    moveCardsTo(destination: CardCollection) {
        this.cards.forEach((it) => {
            destination.put(it);
        });
    }

    perform() {
        this.moveCardsTo(this.destination);
    }

    rollback() {
        this.moveCardsTo(this.source);
    }
}

export default class Transaction {
    segments: TransactionSegment[] = [];
    bonus: number;
    undoCost: number;

    constructor(bonus: number, undoCost: number) {
        this.bonus = bonus;
        this.undoCost = undoCost;
    }

    add(cards: Card[], destination: CardCollection) {
        if (cards.length == 0) return;

        const source = cards[0].collection;

        if (source === undefined) return;

        this.segments.push(new TransactionSegment(cards, source, destination));
    }

    perform() {
        this.segments.forEach((it) => {
            it.perform();
        });
    }

    rollback() {
        this.segments.toReversed().forEach((it) => {
            it.rollback();
        });
    }
}

export interface TransactionController {
    add: (cards: Card[], destination: CardCollection) => void;
    commit: () => void;
    addScoreBonus: (bonus: number) => void;
    addUndoPenalty: (penalty: number) => void;
}
export type CreateTransactionController = (bonus: number, undoCost?: number) => TransactionController;

export const TransactionContext = createContext((bonus: number, undoCost: number = 0) => {
    return {
        add() {
            console.warn("Transaction context not defined.")
        },
        commit() {
            console.warn("Transaction context not defined.")
        },
        addScoreBonus() {
            console.warn("Transaction context not defined.")
        },
        addUndoPenalty() {
            console.warn("Transaction context not defined.")
        }
    } as TransactionController;
});
