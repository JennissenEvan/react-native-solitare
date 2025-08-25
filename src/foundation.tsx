import { Card, CardCollection, getCardDimensions, Suit } from "./deck";
import { View, StyleSheet, Image } from "react-native";
import DropActionReceiver from "./dropActionReceiver";
import Animated, { AnimatedRef } from "react-native-reanimated";
import { TransactionController } from "./transaction";
import React from "react";

interface FoundationProps {
    ref: AnimatedRef<View>;
}

interface BaseFoundationProps extends FoundationProps {
    topCard: Card | null;
}

export class Foundation implements DropActionReceiver {
    suit: Suit;

    cardStack = new CardCollection();

    constructor(suit: Suit) {
        this.suit = suit;
    }

    EmptyPile = (props: FoundationProps) => {
        //@ts-ignore
        const emptyFoundationImage = {
            "hearts": require("../assets/images/hearts_foundation.png"),
            "clubs": require("../assets/images/clubs_foundation.png"),
            "spades": require("../assets/images/spades_foundation.png"),
            "diamonds": require("../assets/images/diamonds_foundation.png")
        }[this.suit.name.toLowerCase()];

        return (
            <Animated.View style={[styleSheet.emptyPile, getCardDimensions()]} ref={props.ref}>
                <Image source={emptyFoundationImage} style={{ width: "100%", height: "100%" }}/>
            </Animated.View>
        )
    }

    Element = (props: BaseFoundationProps) => {
        const topCard = props.topCard;

        return (
            <View>
                {topCard !== null ? <topCard.Element ref={props.ref}/> : <this.EmptyPile ref={props.ref}/>}
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
