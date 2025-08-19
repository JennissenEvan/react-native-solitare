import { Card, CardCollection } from "./deck";

interface TalonProps {
    cards: Card[];
}

export default class Talon {
    cardStack = new CardCollection();

    Element = (props: TalonProps) => {
        const cardCount = props.cards.length;
        if (cardCount > 0) {
            const topCard = props.cards[cardCount - 1];
            return <topCard.Element/>;
        } else {
            return <></>;
        }
    };
}