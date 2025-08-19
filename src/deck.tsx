import React, { createContext, useContext } from "react";
import { Dimensions, Platform, Pressable, StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import Animated, { measure, MeasuredDimensions, runOnJS, runOnUI, useAnimatedRef } from 'react-native-reanimated';
import UsesAnimatedRef from "./usesAnimatedRef";

const suitColor = {
    RED: Symbol("Red"),
    BLACK: Symbol("Black"),
};

export class Suit {
    name: String;
    color: Symbol;

    constructor(name: String, color: Symbol) {
        this.name = name;
        this.color = color;
    }
}

export const suits = {
    HEARTS: new Suit("Hearts", suitColor.RED),
    DIAMONDS: new Suit("Diamonds", suitColor.RED),
    SPADES: new Suit("Spades", suitColor.BLACK),
    CLUBS: new Suit("Clubs", suitColor.BLACK),
};
export const allSuits = [suits.HEARTS, suits.DIAMONDS, suits.SPADES, suits.CLUBS];

export class Rank {
    name: String;
    value: number;

    constructor(name: String, value: number) {
        this.name = name;
        this.value = value;
    }
}

const rankNamesInOrder = [
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
    "A",
];
const ranks = rankNamesInOrder.toReversed().map((value, i) => new Rank(value, i + 1));

export function getRawCardDimensions() {
    const CARD_SIZE_FACTOR = Platform.OS !== "web" ? .20 : .08;
    const LENGTH_FACTOR = 1 + (1/3);

    const windowDimensions = Dimensions.get("screen");
    let cardSize: number;
    if (windowDimensions.height * 16 > windowDimensions.width * 9) {
        cardSize = windowDimensions.width * CARD_SIZE_FACTOR;
    } else {
        cardSize = windowDimensions.height * CARD_SIZE_FACTOR;
    }

    return {
        width: cardSize,
        height: cardSize * LENGTH_FACTOR
    };
}

export function getCardDimensions() {
    return getRawCardDimensions() as StyleProp<ViewStyle>;
}

export function getCardSpacing() {
    const spacingFactor = Platform.OS !== "web" ? .25 : .2;
    return getRawCardDimensions().width * spacingFactor;
    
}

export class Position {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    translated(x: number, y: number) {
        return new Position(this.x + x, this.y + y)
    }
}

interface CardProps extends UsesAnimatedRef {
    x?: number;
    y?: number;
    useAbsolute?: boolean;
}

function generateCardStyle(props: CardProps) {
    const style: StyleProp<ViewStyle> = {};
    if (props.x !== undefined) style.left = props.x;
    if (props.y !== undefined) style.top = props.y;
    if (props.x !== undefined || props.y !== undefined) style.position = props.useAbsolute === true ? "absolute" : "relative";
    return style;
}

export type PostCardDragCallback = (cards: Card[]) => void;
export type CardDragCallback = (
    cards: Card[], 
    initialPosition: Position, 
    returnCallback?: PostCardDragCallback,
    movedCallback?: () => void
) => void;

export const CardDragContext = createContext<CardDragCallback | undefined>(undefined);

export class Card {
    suit: Suit;
    rank: Rank;

    label: String;

    collection: CardCollection | undefined;

    constructor(suit: Suit, rank: Rank) {
        this.suit = suit;
        this.rank = rank;

        this.label = `${rank.name} of ${suit.name}`;
    }

    Element = (props: CardProps) => {
        const thisCard = this;

        const baseAnimatedRef = useAnimatedRef<View>();

        const dragCallback = useContext(CardDragContext);

        const cardPickup = () => { 
            const mainCallback = (measurement: MeasuredDimensions | null) => {
                let position = new Position(0, 0);
                if (measurement !== null) {
                    position = new Position(measurement.pageX, measurement.pageY);
                }

                const returnPile = thisCard.collection;
                const returnCallback = (cards: Card[]) => {
                    cards.forEach((it) => {
                        returnPile?.put(it);
                    });
                };
                const movedCallback = () => {};

                dragCallback?.([thisCard], position, returnCallback, movedCallback);
            }

            runOnUI(() => {
                const measurement = measure(baseAnimatedRef);
                
                runOnJS(mainCallback)(measurement);
            })();
        };

        return (
            <Animated.View style={[styleSheet.card, generateCardStyle(props), getCardDimensions()]} ref={baseAnimatedRef}>
                <Animated.View ref={props.ref} style={{ flex: 1 }}>
                    <Pressable onPressIn={cardPickup} style={{width: "100%", height: "100%"}}>
                        <Text style={{ textAlign: "center" }} selectable={false}>{this.label}</Text>
                    </Pressable>
                </Animated.View>
            </Animated.View>
        );
    }
}

export const DownturnedCard = (props: CardProps) => {
    return (<View style={[styleSheet.downturnedCard, generateCardStyle(props), getCardDimensions()]}/>);
}

export class CardCollection {
    pile: Card[] = [];

    put(card: Card) {
        if (card.collection !== undefined) {
            const pile = card.collection.pile;
            pile.splice(pile.indexOf(card), 1);
        }

        this.pile.push(card);
        card.collection = this;
    }

    draw() {
        const drawnCard = this.pile.pop();
        if (drawnCard !== undefined) {
            drawnCard.collection = undefined;
        }
        return drawnCard;
    }
}

export class Deck {
    cards = new CardCollection();

    constructor() {
        for (const suit of allSuits) for (const rank of ranks) {
            this.cards.put(new Card(suit, rank));
        }

        this.shuffle();
    }

    Element = () => {
        const colorStyle = { backgroundColor: this.cards.pile.length > 0 ? "red" : "gray" }

        return (
            <Pressable style={[styleSheet.deck, getCardDimensions(), colorStyle]}>
                <Text>Deck</Text>
            </Pressable>
        );
    }

    shuffle() {
        const pile = this.cards.pile;
        for (let i = pile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [pile[i], pile[j]] = [pile[j], pile[i]];
        }
    }

    draw() {
        return this.cards.draw();
    }
}

const styleSheet = StyleSheet.create({
    downturnedCard: {
        borderWidth: 3,
        borderRadius: 10,
        backgroundColor: "blue"
    },
    card: {
        borderWidth: 3,
        borderRadius: 10,
        justifyContent: "center",
        alignContent: "center",
        backgroundColor: "white"
    },
    deck: {
        borderWidth: 3,
        borderRadius: 10
    }
});
