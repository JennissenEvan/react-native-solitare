import React, { createContext, useContext } from "react";
import { Dimensions, Image, Platform, Pressable, StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import Animated, { AnimatedRef, measure, MeasuredDimensions, runOnJS, runOnUI, useAnimatedRef } from 'react-native-reanimated';
import UsesAnimatedRef from "./usesAnimatedRef";
import Talon from "./talon";
import { TransactionContext, TransactionController } from "./transaction";

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
    const CARD_SIZE_FACTOR = .10;
    const LENGTH_FACTOR = 726/500;

    const windowDimensions = Dimensions.get("screen");
    let cardSize: number;
    const adjustedHeight = windowDimensions.height * 16;
    const adjustedWidth = windowDimensions.width * 9;
    if (adjustedHeight > adjustedWidth) {
        cardSize = adjustedWidth * CARD_SIZE_FACTOR;
    } else {
        cardSize = adjustedHeight * CARD_SIZE_FACTOR;
    }
    cardSize /= 10;

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
    movedCallback?: (transaction: TransactionController) => void
) => void;

export const CardDragContext = createContext<CardDragCallback | undefined>(undefined);

export class Card {
    suit: Suit;
    rank: Rank;

    label: String;

    collection: CardCollection | undefined;
    temporaryCollection: CardCollection | undefined;

    currentCollection() {
        return this.temporaryCollection ?? this.collection;
    }

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

        //@ts-ignore
        const cardAsset = {
            "spades": {
                "a": require("../assets/images/cards/a_of_spades.png"),
                "2": require("../assets/images/cards/2_of_spades.png"),
                "3": require("../assets/images/cards/3_of_spades.png"),
                "4": require("../assets/images/cards/4_of_spades.png"),
                "5": require("../assets/images/cards/5_of_spades.png"),
                "6": require("../assets/images/cards/6_of_spades.png"),
                "7": require("../assets/images/cards/7_of_spades.png"),
                "8": require("../assets/images/cards/8_of_spades.png"),
                "9": require("../assets/images/cards/9_of_spades.png"),
                "10": require("../assets/images/cards/10_of_spades.png"),
                "j": require("../assets/images/cards/j_of_spades.png"),
                "q": require("../assets/images/cards/q_of_spades.png"),
                "k": require("../assets/images/cards/k_of_spades.png")
            },
            "clubs": {
                "a": require("../assets/images/cards/a_of_clubs.png"),
                "2": require("../assets/images/cards/2_of_clubs.png"),
                "3": require("../assets/images/cards/3_of_clubs.png"),
                "4": require("../assets/images/cards/4_of_clubs.png"),
                "5": require("../assets/images/cards/5_of_clubs.png"),
                "6": require("../assets/images/cards/6_of_clubs.png"),
                "7": require("../assets/images/cards/7_of_clubs.png"),
                "8": require("../assets/images/cards/8_of_clubs.png"),
                "9": require("../assets/images/cards/9_of_clubs.png"),
                "10": require("../assets/images/cards/10_of_clubs.png"),
                "j": require("../assets/images/cards/j_of_clubs.png"),
                "q": require("../assets/images/cards/q_of_clubs.png"),
                "k": require("../assets/images/cards/k_of_clubs.png")
            },
            "hearts": {
                "a": require("../assets/images/cards/a_of_hearts.png"),
                "2": require("../assets/images/cards/2_of_hearts.png"),
                "3": require("../assets/images/cards/3_of_hearts.png"),
                "4": require("../assets/images/cards/4_of_hearts.png"),
                "5": require("../assets/images/cards/5_of_hearts.png"),
                "6": require("../assets/images/cards/6_of_hearts.png"),
                "7": require("../assets/images/cards/7_of_hearts.png"),
                "8": require("../assets/images/cards/8_of_hearts.png"),
                "9": require("../assets/images/cards/9_of_hearts.png"),
                "10": require("../assets/images/cards/10_of_hearts.png"),
                "j": require("../assets/images/cards/j_of_hearts.png"),
                "q": require("../assets/images/cards/q_of_hearts.png"),
                "k": require("../assets/images/cards/k_of_hearts.png")
            },
            "diamonds": {
                "a": require("../assets/images/cards/a_of_diamonds.png"),
                "2": require("../assets/images/cards/2_of_diamonds.png"),
                "3": require("../assets/images/cards/3_of_diamonds.png"),
                "4": require("../assets/images/cards/4_of_diamonds.png"),
                "5": require("../assets/images/cards/5_of_diamonds.png"),
                "6": require("../assets/images/cards/6_of_diamonds.png"),
                "7": require("../assets/images/cards/7_of_diamonds.png"),
                "8": require("../assets/images/cards/8_of_diamonds.png"),
                "9": require("../assets/images/cards/9_of_diamonds.png"),
                "10": require("../assets/images/cards/10_of_diamonds.png"),
                "j": require("../assets/images/cards/j_of_diamonds.png"),
                "q": require("../assets/images/cards/q_of_diamonds.png"),
                "k": require("../assets/images/cards/k_of_diamonds.png")
            }
        }[thisCard.suit.name.toLowerCase()][thisCard.rank.name.toLowerCase()];

        return (
            <Animated.View style={[styleSheet.card, generateCardStyle(props), getCardDimensions()]} ref={baseAnimatedRef}>
                <Animated.View ref={props.ref} style={{ flex: 1 }}>
                    <Pressable onPressIn={cardPickup} style={{ width: "100%", height: "100%"}}>
                        <Image source={cardAsset} style={{ width: "100%", height: "100%", zIndex: -1, borderRadius: 8 }}/>
                    </Pressable>
                </Animated.View>
            </Animated.View>
        );
    }
}

export const DownturnedCard = (props: CardProps) => {
    return (
        <View style={[styleSheet.downturnedCard, generateCardStyle(props), getCardDimensions()]}>
            <Image source={require("../assets/images/card_back.png")} style={{ width: "100%", height: "100%" }}/>
        </View>
    );
}

interface BlankSpaceProps {
    ref?: AnimatedRef<View>;
}

export const BlankSpace = (props: BlankSpaceProps) => {
    return (
        <Animated.View style={[getCardDimensions(), { borderColor: "#262626", borderWidth: 2, borderRadius: 8 }]} ref={props.ref}/>
    );
}

export class CardCollection {
    pile: Card[] = [];

    isSecondary: boolean;

    constructor(isSecondary: boolean = false) {
        this.isSecondary = isSecondary;
    }

    put(card: Card) {
        const cardCurrentCollection = card.currentCollection();
        if (cardCurrentCollection !== undefined) {
            const pile = cardCurrentCollection.pile;
            pile.splice(pile.indexOf(card), 1);
        }

        this.pile.push(card);
        if (this.isSecondary) {
            card.temporaryCollection = this;
        } else {
            card.collection = this;
            card.temporaryCollection = undefined;
        }
    }

    draw() {
        const drawnCard = this.pile.pop();
        if (drawnCard !== undefined) {
            drawnCard.collection = undefined;
        }
        return drawnCard;
    }
}

interface DeckProps {
    cards: Card[];
    talon: Talon;
}

export class Deck {
    cards = new CardCollection();

    constructor() {
        for (const suit of allSuits) for (const rank of ranks) {
            this.cards.put(new Card(suit, rank));
        }

        this.shuffle();
    }

    Element = (props: DeckProps) => {
        const createTransaction = useContext(TransactionContext);

        const colorStyle = { backgroundColor: props.cards.length > 0 ? "red" : "gray" }

        const drawCallback = () => {
            if (this.cards.pile.length > 0) {
                const transaction = createTransaction(0, 50);
                transaction.add(this.cards.pile.slice(-1), props.talon.cardStack);
                transaction.commit();
            } else {
                const cardsToReturn = [...props.talon.cardStack.pile].toReversed();

                if (cardsToReturn.length > 1) {
                    const transaction = createTransaction(-250, 50);
                    transaction.add(cardsToReturn, this.cards);
                    transaction.add(cardsToReturn.slice(-1), props.talon.cardStack);
                    transaction.commit();
                }
            }
        };

        return (
            <Pressable onPress={drawCallback}>
                { this.cards.pile.length > 0 ? <DownturnedCard/> : <BlankSpace/> }
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
        borderWidth: 2,
        borderRadius: 8,
        backgroundColor: "white"
    },
    card: {
        borderWidth: 2,
        borderRadius: 8,
        justifyContent: "center",
        alignContent: "center",
        backgroundColor: "white"
    },
    deck: {
        borderWidth: 3,
        borderRadius: 10
    }
});
