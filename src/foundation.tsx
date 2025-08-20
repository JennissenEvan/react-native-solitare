import { FC } from "react";
import { Card, CardCollection, getCardDimensions, Suit } from "./deck";
import { View, StyleSheet, Text } from "react-native";
import DropActionReceiver from "./dropActionReceiver";
import Animated, { AnimatedRef } from "react-native-reanimated";
import { TransactionController } from "./transaction";

interface FoundationProps {
    ref: AnimatedRef<View>;
}

export class Foundation implements DropActionReceiver {
    suit: Suit;

    cardStack = new CardCollection();

    constructor(suit: Suit) {
        this.suit = suit;
    }

    EmptyPile = (props: FoundationProps) => {
        return (
            <Animated.View style={[styleSheet.emptyPile, getCardDimensions()]} ref={props.ref}>
                <Text>{this.suit.name}</Text>
            </Animated.View>
        )
    }

    Element = (props: FoundationProps) => {
        const topCard = this.getTopCard();

        return (
            <View>
                {topCard !== undefined ? <topCard.Element ref={props.ref}/> : <this.EmptyPile ref={props.ref}/>}
            </View>
        );
    }

    getTopCard() {
        const pile = this.cardStack.pile;
        return pile.length > 0 ? pile[pile.length - 1] : undefined;
    }

    canDrop(cards: Card[]) {
        if (cards.length != 1) return false;

        const card = cards[0];

        const topCard = this.getTopCard();
        return card.suit === this.suit && card.rank.value == (topCard?.rank.value ?? 0) + 1;
    }

    drop(cards: Card[], transaction: TransactionController) {
        if (cards.length != 1) return;

        transaction.add(cards, this.cardStack);
    }
}

const styleSheet = StyleSheet.create({
    emptyPile: {
        backgroundColor: "gray",
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center"
    }
});
