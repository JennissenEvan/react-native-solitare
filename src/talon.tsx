import { CardCollection } from "./deck";

export default class Talon {
    cardStack = new CardCollection();

    Element = () => {
        const cardCount = this.cardStack.pile.length;
        if (cardCount > 0) {
            const topCard = this.cardStack.pile[cardCount - 1];
            return <topCard.Element/>;
        } else {
            return <></>;
        }
    };
}